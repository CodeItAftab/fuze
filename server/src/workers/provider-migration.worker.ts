import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import {
  db,
  providerIdentities,
  fileChunks,
  vfsNodes,
  uploadChunks,
} from "../db/index.js";
import { eq, and, ne, inArray } from "drizzle-orm";
import { getStorageAdapter } from "../adapters/factory.js";
import { TokenService } from "../services/token.service.js";
import { socketManager } from "../websocket/socket-manager.js";
import { PROVIDER_MAX_FILE_LIMITS } from "../services/chunk-decision.service.js";

export interface ProviderMigrationJobData {
  userId: string;
  providerIdentityId: string;
  action: "migrate" | "delete";
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export async function executeProviderMigration(
  data: ProviderMigrationJobData,
  jobId: string = `mig_${Date.now()}`,
) {
  const startedAt = Date.now();
  const { userId, providerIdentityId, action } = data;

  console.log(
    `[Worker: ProviderMigration] 🚀 Job #${jobId} started: Disconnect request for Provider Identity [${providerIdentityId}] (Action: ${action.toUpperCase()})`,
  );

  const [targetProvider] = await db
    .select()
    .from(providerIdentities)
    .where(
      and(
        eq(providerIdentities.id, providerIdentityId),
        eq(providerIdentities.userId, userId),
      ),
    );

  if (!targetProvider) {
    console.warn(
      `[Worker: ProviderMigration] ⚠️ Provider identity [${providerIdentityId}] not found in database. Exiting.`,
    );
    return;
  }

  const providerName = targetProvider.provider.toUpperCase();
  console.log(
    `[Worker: ProviderMigration] 📦 Target: ${providerName} (${targetProvider.accountEmail || "no email"})`,
  );

  const chunks = await db
    .select()
    .from(fileChunks)
    .where(eq(fileChunks.providerIdentityId, providerIdentityId));

  const totalChunks = chunks.length;
  console.log(
    `[Worker: ProviderMigration] Found ${totalChunks} chunk(s) stored on ${providerName}.`,
  );
  let processed = 0;

  // -------------------------------------------------------------
  // ACTION: MIGRATE CHUNKS
  // -------------------------------------------------------------
  if (action === "migrate") {
    const otherProviders = await db
      .select()
      .from(providerIdentities)
      .where(
        and(
          eq(providerIdentities.userId, userId),
          ne(providerIdentities.id, providerIdentityId),
        ),
      );

    console.log(
      `[Worker: ProviderMigration] Checking ${otherProviders.length} remaining cloud account(s) for available capacity...`,
    );

    const sourceAdapter = getStorageAdapter(targetProvider.provider);
    const sourceToken =
      await TokenService.getValidAccessToken(providerIdentityId);

    let failedChunksCount = 0;

    for (const chunk of chunks) {
      const chunkSize = chunk.byteEnd - chunk.byteStart;

      // Filter and prioritize destination clouds:
      // 1. Exclude providers where chunk size exceeds provider's single-file upload limit (e.g. Dropbox 140MB limit)
      // 2. Exclude providers without enough free space
      // 3. Sort by most remaining free space
      const eligibleProviders = otherProviders
        .filter((p) => {
          const maxLimit = PROVIDER_MAX_FILE_LIMITS[p.provider] ?? Infinity;
          return p.quotaTotal - p.quotaUsed >= chunkSize && chunkSize <= maxLimit;
        })
        .sort((a, b) => (b.quotaTotal - b.quotaUsed) - (a.quotaTotal - a.quotaUsed));

      const dest = eligibleProviders[0];

      if (dest) {
        const tempFilePath = path.join(
          os.tmpdir(),
          `fuze_mig_${chunk.id}_${Date.now()}.tmp`,
        );

        try {
          console.log(
            `   → Migrating chunk #${chunk.chunkIndex} (${formatBytes(chunkSize)}) from ${providerName} to ${dest.provider.toUpperCase()}...`,
          );

          const destAdapter = getStorageAdapter(dest.provider);
          const destToken = await TokenService.getValidAccessToken(dest.id);

          // 1. Download chunk directly to disk via stream (0 MB heap memory spike!)
          const downloadUrl = await sourceAdapter.getDownloadUrl({
            providerFileId: chunk.providerFileId,
            accessToken: sourceToken,
          });
          const fileStream = await fetch(downloadUrl);
          if (!fileStream.ok || !fileStream.body) {
            throw new Error(
              `Failed downloading chunk from ${providerName} (HTTP ${fileStream.status})`,
            );
          }

          await pipeline(
            Readable.fromWeb(fileStream.body as any),
            fs.createWriteStream(tempFilePath),
          );

          const stat = await fs.promises.stat(tempFilePath);
          const actualSize = stat.size;

          // 2. Upload to new cloud via streamable Blob
          const destSession = await destAdapter.createResumableUploadSession({
            fileName: `migrated-${chunk.id}`,
            mimeType: "application/octet-stream",
            size: actualSize,
            accessToken: destToken,
          });

          // Lazy Blob streamed directly from disk file without loading entire chunk into RAM
          const fileBlob = await fs.openAsBlob(tempFilePath);

          let uploadRes: Response;
          if (destSession.uploadType === "multipart") {
            const formData = new FormData();
            if (destSession.formDataFields) {
              for (const [k, v] of Object.entries(destSession.formDataFields)) {
                formData.append(k, v);
              }
            }
            formData.append("file", fileBlob, `migrated-${chunk.id}`);
            uploadRes = await fetch(destSession.sessionUrl, {
              method: destSession.httpMethod || "POST",
              headers: destSession.headers,
              body: formData,
            });
          } else {
            const uploadHeaders: Record<string, string> = {
              "Content-Type": "application/octet-stream",
              ...(destSession.headers || {}),
            };

            // Non-multipart resumable upload sessions (OneDrive, Google Drive) require Content-Range
            if (dest.provider !== "dropbox") {
              const rangeEnd = Math.max(0, actualSize - 1);
              uploadHeaders["Content-Range"] = `bytes 0-${rangeEnd}/${actualSize}`;
              uploadHeaders["Content-Length"] = String(actualSize);
            }

            uploadRes = await fetch(destSession.sessionUrl, {
              method: destSession.httpMethod || "PUT",
              headers: uploadHeaders,
              body: fileBlob,
            });
          }

          if (!uploadRes.ok) {
            const errBody = await uploadRes.text().catch(() => "");
            throw new Error(
              `Upload to ${dest.provider} failed (HTTP ${uploadRes.status}): ${errBody}`,
            );
          }

          // Extract the real providerFileId from destination response
          let uploadedFileId: string | null = null;
          try {
            const uploadJson = (await uploadRes.json()) as any;
            if (
              Array.isArray(uploadJson?.entries) &&
              uploadJson.entries[0]?.id
            ) {
              uploadedFileId = String(uploadJson.entries[0].id); // Box
            } else if (typeof uploadJson?.id === "string") {
              uploadedFileId = uploadJson.id; // Google Drive, OneDrive
            } else if (typeof uploadJson?.path_display === "string") {
              uploadedFileId = uploadJson.path_display; // Dropbox
            } else if (
              Array.isArray(uploadJson?.fileids) &&
              uploadJson.fileids[0]
            ) {
              uploadedFileId = String(uploadJson.fileids[0]); // pCloud
            }
          } catch {
            // Non-JSON or empty response
          }

          if (!uploadedFileId) {
            uploadedFileId = `migrated-${chunk.id}`;
          }

          // 3. Update chunk in database with the real providerFileId
          await db
            .update(fileChunks)
            .set({
              providerIdentityId: dest.id,
              providerFileId: uploadedFileId,
            })
            .where(eq(fileChunks.id, chunk.id));

          // 4. Update destination quota
          dest.quotaUsed += actualSize;
          await db
            .update(providerIdentities)
            .set({ quotaUsed: dest.quotaUsed })
            .where(eq(providerIdentities.id, dest.id));

          // 5. Delete from old cloud (best effort, chunk already safely relocated)
          try {
            await sourceAdapter.deleteFile({
              providerFileId: chunk.providerFileId,
              accessToken: sourceToken,
            });
          } catch (delErr) {
            console.warn(
              `     ⚠️ Could not delete old chunk on ${providerName} (already safely migrated):`,
              delErr,
            );
          }

          console.log(
            `     ✓ Chunk #${chunk.chunkIndex} successfully moved to ${dest.provider.toUpperCase()}`,
          );
        } catch (err: unknown) {
          failedChunksCount++;
          const message = err instanceof Error ? err.message : String(err);
          console.error(
            `     ✗ Failed migrating chunk ${chunk.id}: ${message}`,
          );
        } finally {
          // Always clean up the temporary file on disk
          await fs.promises.unlink(tempFilePath).catch(() => {});
        }
      } else {
        failedChunksCount++;
        console.warn(
          `     ⚠️ No remaining provider has enough space for chunk ${chunk.id} (${formatBytes(chunkSize)})`,
        );
      }

      processed++;
      const percent = Math.round((processed / totalChunks) * 100);
      console.log(
        `[Worker: ProviderMigration] Progress: ${processed}/${totalChunks} chunks (${percent}%)`,
      );

      // Broadcast real-time progress via WebSocket
      socketManager.broadcastToUser(userId, {
        type: "PROVIDER_CLEANUP_PROGRESS",
        payload: {
          providerId: providerIdentityId,
          action: "migrate",
          completed: processed,
          total: totalChunks,
          percent,
        },
      });
    }

    if (failedChunksCount > 0) {
      console.error(
        `[Worker: ProviderMigration] ❌ Migration failed for ${failedChunksCount}/${totalChunks} chunk(s). Aborting provider disconnection to protect user data.`,
      );
      socketManager.broadcastToUser(userId, {
        type: "PROVIDER_MIGRATION_FAILED",
        payload: {
          providerId: providerIdentityId,
          failedChunks: failedChunksCount,
          totalChunks,
          error: `Failed to migrate ${failedChunksCount} of ${totalChunks} chunks. Provider was kept connected to prevent data loss.`,
        },
      });
      throw new Error(
        `Migration incomplete: ${failedChunksCount}/${totalChunks} chunk(s) failed to transfer.`,
      );
    }
  }

  // -------------------------------------------------------------
  // ACTION: DELETE
  // -------------------------------------------------------------
  if (action === "delete") {
    console.log(
      `[Worker: ProviderMigration] Deleting all ${totalChunks} chunks from ${providerName}...`,
    );
    const adapter = getStorageAdapter(targetProvider.provider);

    try {
      const accessToken =
        await TokenService.getValidAccessToken(providerIdentityId);
      for (const chunk of chunks) {
        try {
          await adapter.deleteFile({
            providerFileId: chunk.providerFileId,
            accessToken,
          });
          console.log(`   ✓ Deleted cloud chunk: ${chunk.providerFileId}`);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(
            `   ✗ Error deleting chunk ${chunk.providerFileId}: ${message}`,
          );
        }
        processed++;
        const percent = Math.round((processed / totalChunks) * 100);
        socketManager.broadcastToUser(userId, {
          type: "PROVIDER_CLEANUP_PROGRESS",
          payload: {
            providerId: providerIdentityId,
            action: "delete",
            completed: processed,
            total: totalChunks,
            percent,
          },
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[Worker: ProviderMigration] Error resolving access token: ${message}`,
      );
    }

    // Clean up broken multi-cloud files
    const affectedNodeIds = Array.from(
      new Set(chunks.map((c) => c.vfsNodeId)),
    );
    if (affectedNodeIds.length > 0) {
      console.log(
        `[Worker: ProviderMigration] Purging ${affectedNodeIds.length} affected VFS node(s)...`,
      );
      await db.delete(vfsNodes).where(inArray(vfsNodes.id, affectedNodeIds));
    }

    // Explicitly purge all file_chunks linked to this provider
    await db
      .delete(fileChunks)
      .where(eq(fileChunks.providerIdentityId, providerIdentityId));
  }

  // -------------------------------------------------------------
  // FINALIZE: Remove provider row from database
  // -------------------------------------------------------------
  console.log(
    `[Worker: ProviderMigration] Purging database record for ${providerName}...`,
  );
  await db
    .delete(uploadChunks)
    .where(eq(uploadChunks.providerIdentityId, providerIdentityId));

  // Verify no orphaned chunks reference this provider identity before deletion
  const remainingChunks = await db
    .select({ id: fileChunks.id })
    .from(fileChunks)
    .where(eq(fileChunks.providerIdentityId, providerIdentityId));

  if (remainingChunks.length > 0) {
    throw new Error(
      `Cannot disconnect ${providerName}: ${remainingChunks.length} file chunk(s) are still linked to this provider identity.`,
    );
  }

  await db
    .delete(providerIdentities)
    .where(eq(providerIdentities.id, providerIdentityId));

  socketManager.broadcastToUser(userId, {
    type: "PROVIDER_DISCONNECTED",
    payload: { providerId: providerIdentityId },
  });

  const duration = Date.now() - startedAt;
  console.log(
    `[Worker: ProviderMigration] ✅ Successfully disconnected ${providerName} in ${duration}ms.`,
  );
}

/**
 * Queues migration to run asynchronously in-process without polling Redis.
 */
export function queueProviderMigration(data: ProviderMigrationJobData): {
  id: string;
} {
  const jobId = `mig_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  setImmediate(async () => {
    try {
      await executeProviderMigration(data, jobId);
    } catch (err: any) {
      console.error(
        `[Worker: ProviderMigration] Job #${jobId} failed:`,
        err?.message,
      );
    }
  });
  return { id: jobId };
}

// Backward compatibility stubs for BullMQ interfaces
export const providerMigrationQueue = {
  add: async (name: string, data: ProviderMigrationJobData) => {
    const res = queueProviderMigration(data);
    return { id: res.id };
  },
};

export const providerMigrationWorker = {
  close: async () => {},
};

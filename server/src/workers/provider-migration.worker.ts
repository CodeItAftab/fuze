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
import { CascadePurgeService } from "../services/cascade-purge.service.js";
import { RecoveryKitService } from "../services/recovery-kit.service.js";

export interface ProviderMigrationJobData {
  userId: string;
  providerIdentityId: string;
  action: "migrate" | "delete" | "smart_unlink";
}

/**
 * Transfers a single chunk from source provider to destination provider via streaming.
 */
async function transferChunk(
  sourceProvider: any,
  sourceToken: string,
  destProvider: any,
  destToken: string,
  chunk: any,
  chunkSize: number,
  targetFileName?: string,
  targetMimeType?: string,
): Promise<string> {
  const tempFilePath = path.join(
    os.tmpdir(),
    `fuze_transfer_${chunk.id}_${Date.now()}.tmp`,
  );

  try {
    const sourceAdapter = getStorageAdapter(sourceProvider.provider);
    const destAdapter = getStorageAdapter(destProvider.provider);

    // 1. Download stream directly to disk
    const downloadUrl = await sourceAdapter.getDownloadUrl({
      providerFileId: chunk.providerFileId,
      accessToken: sourceToken,
    });
    const fileStream = await fetch(downloadUrl);
    if (!fileStream.ok || !fileStream.body) {
      throw new Error(`Download failed with status HTTP ${fileStream.status}`);
    }

    await pipeline(
      Readable.fromWeb(fileStream.body as any),
      fs.createWriteStream(tempFilePath),
    );

    const stat = await fs.promises.stat(tempFilePath);
    const actualSize = stat.size;
    const fileName = targetFileName || `fuze_chunk_${chunk.id}`;
    const mimeType = targetMimeType || "application/octet-stream";

    // 2. Upload stream to destination
    const destSession = await destAdapter.createResumableUploadSession({
      fileName,
      mimeType,
      size: actualSize,
      accessToken: destToken,
    });

    const fileBlob = await fs.openAsBlob(tempFilePath);
    let uploadRes: Response;

    if (destSession.uploadType === "multipart") {
      const formData = new FormData();
      if (destSession.formDataFields) {
        for (const [k, v] of Object.entries(destSession.formDataFields)) {
          formData.append(k, v);
        }
      }
      formData.append("file", fileBlob, fileName);
      uploadRes = await fetch(destSession.sessionUrl, {
        method: destSession.httpMethod || "POST",
        headers: destSession.headers,
        body: formData,
      });
    } else {
      const uploadHeaders: Record<string, string> = {
        "Content-Type": mimeType,
        ...(destSession.headers || {}),
      };
      if (
        destProvider.provider === "google_drive" ||
        destProvider.provider === "one_drive"
      ) {
        uploadHeaders["Content-Range"] =
          `bytes 0-${actualSize - 1}/${actualSize}`;
        uploadHeaders["Content-Length"] = String(actualSize);
      }
      uploadRes = await fetch(destSession.sessionUrl, {
        method: destSession.httpMethod || "PUT",
        headers: uploadHeaders,
        body: fileBlob,
      });
    }

    if (!uploadRes.ok) {
      const errText = await uploadRes.text().catch(() => "");
      throw new Error(
        `Upload to destination failed (${uploadRes.status}): ${errText}`,
      );
    }

    // 3. Extract real destination providerFileId
    const resData: any = await uploadRes.json().catch(() => ({}));
    if (
      destProvider.provider === "pcloud" &&
      typeof resData.result === "number" &&
      resData.result !== 0
    ) {
      throw new Error(
        `pCloud upload failed: ${resData.error || `Error code ${resData.result}`}`,
      );
    }

    const newFileId: string | null =
      resData.entries?.[0]?.id || // Box returns { entries: [{ id: "12345" }] }
      resData.id ||               // Google Drive & OneDrive return { id: "..." }
      (resData.fileids?.[0] ? String(resData.fileids[0]) : null) || // pCloud
      resData.path_lower ||       // Dropbox
      null;

    if (!newFileId) {
      throw new Error(
        `Upload to ${destProvider.provider} succeeded but no valid providerFileId was returned.`,
      );
    }

    // 4. Delete old chunk from source provider only after confirmed upload
    await sourceAdapter
      .deleteFile({
        providerFileId: chunk.providerFileId,
        accessToken: sourceToken,
      })
      .catch(() => {});

    return newFileId;
  } finally {
    await fs.promises.unlink(tempFilePath).catch(() => {});
  }
}

export async function executeProviderMigration(
  data: ProviderMigrationJobData,
  jobId: string = `mig_${Date.now()}`,
) {
  const startedAt = Date.now();
  const { userId, providerIdentityId, action } = data;

  console.log(
    `[Worker: ProviderMigration] 🚀 Job #${jobId} started: Provider [${providerIdentityId}] (Action: ${action.toUpperCase()})`,
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
    console.warn(`[Worker: ProviderMigration] ⚠️ Provider not found.`);
    return;
  }

  const providerName = targetProvider.provider.toUpperCase();
  let targetToken = "";
  try {
    targetToken = await TokenService.getValidAccessToken(providerIdentityId);
  } catch (err) {
    console.warn(
      `[Worker: ProviderMigration] Note: Source token expired or invalid for ${providerName}. Proceeding with best effort.`,
    );
  }

  const localChunks = await db
    .select()
    .from(fileChunks)
    .where(eq(fileChunks.providerIdentityId, providerIdentityId));

  const totalChunks = localChunks.length;
  let processed = 0;

  // Pre-load all affected VFS nodes to preserve real filenames and extensions
  const affectedNodeIds = Array.from(
    new Set(localChunks.map((c) => c.vfsNodeId)),
  );
  const nodes =
    affectedNodeIds.length > 0
      ? await db
          .select()
          .from(vfsNodes)
          .where(inArray(vfsNodes.id, affectedNodeIds))
      : [];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // -------------------------------------------------------------
  // ACTION: SMART EVACUATE (Smart Preservation + Reverse Consolidation)
  // -------------------------------------------------------------
  if (action === "smart_unlink") {
    const otherProviders = await db
      .select()
      .from(providerIdentities)
      .where(
        and(
          eq(providerIdentities.userId, userId),
          ne(providerIdentities.id, providerIdentityId),
        ),
      );

    for (const nodeId of affectedNodeIds) {
      const allChunksForNode = await db
        .select()
        .from(fileChunks)
        .where(eq(fileChunks.vfsNodeId, nodeId))
        .orderBy(fileChunks.chunkIndex);

      const node = nodeMap.get(nodeId);

      // 1. Whole File (totalChunks === 1) -> 0 MB transfer! Left intact in cloud
      if (allChunksForNode.length === 1) {
        await db.delete(fileChunks).where(eq(fileChunks.vfsNodeId, nodeId));
        await db.delete(vfsNodes).where(eq(vfsNodes.id, nodeId));
        console.log(
          `[SmartEvacuate] ✓ Preserved whole file intact in ${providerName}: ${node?.name || nodeId}`,
        );
        continue;
      }

      // 2. Chunked File: Are all chunks already on this provider?
      const chunksOnOthers = allChunksForNode.filter(
        (c) => c.providerIdentityId !== providerIdentityId,
      );

      if (chunksOnOthers.length === 0) {
        // Prevent ghost files: delete chunks and parent VFS node
        await db.delete(fileChunks).where(eq(fileChunks.vfsNodeId, nodeId));
        await db.delete(vfsNodes).where(eq(vfsNodes.id, nodeId));
        console.log(
          `[SmartEvacuate] ✓ All ${allChunksForNode.length} parts already in ${providerName}: ${node?.name || nodeId}`,
        );
        continue;
      }

      // 3. Chunks are split: Try FORWARD evacuation first (move this cloud's chunk to remaining clouds)
      const chunkOnThisCloud = allChunksForNode.find(
        (c) => c.providerIdentityId === providerIdentityId,
      );

      let forwardSuccess = false;

      if (chunkOnThisCloud && otherProviders.length > 0) {
        const chunkSize = chunkOnThisCloud.byteEnd - chunkOnThisCloud.byteStart;
        const eligible = otherProviders
          .filter((p) => {
            const limit = PROVIDER_MAX_FILE_LIMITS[p.provider] ?? Infinity;
            return (
              p.quotaTotal - p.quotaUsed >= chunkSize && chunkSize <= limit
            );
          })
          .sort(
            (a, b) => b.quotaTotal - b.quotaUsed - (a.quotaTotal - a.quotaUsed),
          );

        const dest = eligible[0];
        if (dest) {
          try {
            const destToken = await TokenService.getValidAccessToken(dest.id);
            const targetFileName =
              allChunksForNode.length === 1
                ? node?.name || `file_${chunkOnThisCloud.id}`
                : `${node?.name || "chunk"}.part${chunkOnThisCloud.chunkIndex}`;
            const targetMime = node?.mimeType || "application/octet-stream";

            const newFileId = await transferChunk(
              targetProvider,
              targetToken,
              dest,
              destToken,
              chunkOnThisCloud,
              chunkSize,
              targetFileName,
              targetMime,
            );

            await db
              .update(fileChunks)
              .set({ providerIdentityId: dest.id, providerFileId: newFileId })
              .where(eq(fileChunks.id, chunkOnThisCloud.id));

            dest.quotaUsed += chunkSize;
            await db
              .update(providerIdentities)
              .set({ quotaUsed: dest.quotaUsed })
              .where(eq(providerIdentities.id, dest.id));

            forwardSuccess = true;
            console.log(
              `[SmartEvacuate] ✓ Forward evacuated chunk to ${dest.provider}`,
            );
          } catch {}
        }
      }

      if (forwardSuccess) continue;

      // 4. FORWARD failed (other clouds full): Try REVERSE CONSOLIDATION!
      // Pull missing chunks from other clouds into this disconnecting provider
      let reverseSuccess = true;
      const bytesNeeded = chunksOnOthers.reduce(
        (sum, c) => sum + (c.byteEnd - c.byteStart),
        0,
      );
      const targetFreeBytes =
        targetProvider.quotaTotal - targetProvider.quotaUsed;

      if (targetFreeBytes >= bytesNeeded) {
        console.log(
          `[SmartEvacuate] 🔄 Initiating Reverse Consolidation: Pulling ${chunksOnOthers.length} parts into ${providerName}...`,
        );

        for (const remoteChunk of chunksOnOthers) {
          const [remoteProvider] = await db
            .select()
            .from(providerIdentities)
            .where(eq(providerIdentities.id, remoteChunk.providerIdentityId));

          if (!remoteProvider) {
            reverseSuccess = false;
            break;
          }

          try {
            const remoteToken = await TokenService.getValidAccessToken(
              remoteProvider.id,
            );
            const chunkSize = remoteChunk.byteEnd - remoteChunk.byteStart;

            const node = nodeMap.get(remoteChunk.vfsNodeId);
            const targetFileName = `${node?.name || "chunk"}.part${remoteChunk.chunkIndex}`;
            const targetMime = node?.mimeType || "application/octet-stream";

            const newFileId = await transferChunk(
              remoteProvider,
              remoteToken,
              targetProvider,
              targetToken,
              remoteChunk,
              chunkSize,
              targetFileName,
              targetMime,
            );

            // Update chunk location to target provider
            await db
              .update(fileChunks)
              .set({
                providerIdentityId: providerIdentityId,
                providerFileId: newFileId,
              })
              .where(eq(fileChunks.id, remoteChunk.id));

            // Refund quota on remote cloud!
            await db
              .update(providerIdentities)
              .set({
                quotaUsed: remoteProvider.quotaUsed - chunkSize,
              })
              .where(eq(providerIdentities.id, remoteProvider.id));

            targetProvider.quotaUsed += chunkSize;
            console.log(
              `[SmartEvacuate] ✓ Reverse consolidated chunk to ${providerName}`,
            );
          } catch {
            reverseSuccess = false;
            break;
          }
        }
      } else {
        reverseSuccess = false;
      }

      // 5. If BOTH forward evacuation and reverse consolidation failed -> Cascade Purge
      if (!reverseSuccess) {
        await CascadePurgeService.purgeUnsalvageableFile(
          userId,
          nodeId,
          providerIdentityId,
        );
      }
    }

    // Deploy Recovery Kit with RESTORE_ALL_FILES.bat to provider before unlinking
    await RecoveryKitService.deployRecoveryKit(userId, providerIdentityId);
  }

  // -------------------------------------------------------------
  // ACTION: MOVE ALL FILES (Standard Full Evacuation)
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

    const failedChunks: typeof localChunks = [];

    for (const chunk of localChunks) {
      const chunkSize = chunk.byteEnd - chunk.byteStart;
      const eligible = otherProviders
        .filter((p) => {
          const limit = PROVIDER_MAX_FILE_LIMITS[p.provider] ?? Infinity;
          return p.quotaTotal - p.quotaUsed >= chunkSize && chunkSize <= limit;
        })
        .sort(
          (a, b) => b.quotaTotal - b.quotaUsed - (a.quotaTotal - a.quotaUsed),
        );

      const dest = eligible[0];

      if (dest) {
        try {
          const destToken = await TokenService.getValidAccessToken(dest.id);
          const node = nodeMap.get(chunk.vfsNodeId);
          const targetFileName = `${node?.name || "chunk"}.part${chunk.chunkIndex}`;
          const targetMime = node?.mimeType || "application/octet-stream";

          const newFileId = await transferChunk(
            targetProvider,
            targetToken,
            dest,
            destToken,
            chunk,
            chunkSize,
            targetFileName,
            targetMime,
          );

          await db
            .update(fileChunks)
            .set({ providerIdentityId: dest.id, providerFileId: newFileId })
            .where(eq(fileChunks.id, chunk.id));

          dest.quotaUsed += chunkSize;
          await db
            .update(providerIdentities)
            .set({ quotaUsed: dest.quotaUsed })
            .where(eq(providerIdentities.id, dest.id));
        } catch (err: any) {
          console.error(
            `[Worker: ProviderMigration] Transfer failed for chunk ${chunk.id}:`,
            err?.message || err,
          );
          failedChunks.push(chunk);
        }
      } else {
        console.warn(
          `[Worker: ProviderMigration] No eligible provider with capacity for chunk ${chunk.id} (${chunkSize} bytes)`,
        );
        failedChunks.push(chunk);
      }

      processed++;
      socketManager.broadcastToUser(userId, {
        type: "PROVIDER_CLEANUP_PROGRESS",
        payload: {
          providerId: providerIdentityId,
          action: "migrate",
          completed: processed,
          total: totalChunks,
          percent: Math.round((processed / totalChunks) * 100),
        },
      });
    }

    if (failedChunks.length > 0) {
      console.warn(
        `[Worker: ProviderMigration] ⚠️ ${failedChunks.length} chunk(s) could not be relocated. Preserving original records and halting disconnection.`,
      );
      socketManager.broadcastToUser(userId, {
        type: "PROVIDER_MIGRATION_FAILED",
        payload: {
          providerId: providerIdentityId,
          failedCount: failedChunks.length,
          total: totalChunks,
          message: `${failedChunks.length} file part(s) could not be moved because destination storage was full or unavailable. Files remain safe in ${providerName}.`,
        },
      });
      return;
    }
  }

  // -------------------------------------------------------------
  // ACTION: DELETE ALL FILES
  // -------------------------------------------------------------
  if (action === "delete") {
    const adapter = getStorageAdapter(targetProvider.provider);

    for (const chunk of localChunks) {
      await adapter
        .deleteFile({
          providerFileId: chunk.providerFileId,
          accessToken: targetToken,
        })
        .catch(() => {});
    }

    const affectedNodeIds = Array.from(
      new Set(localChunks.map((c) => c.vfsNodeId)),
    );
    for (const nodeId of affectedNodeIds) {
      await CascadePurgeService.purgeUnsalvageableFile(
        userId,
        nodeId,
        providerIdentityId,
      );
    }
  }

  // -------------------------------------------------------------
  // FINALIZE: Unlink provider row and broadcast
  // -------------------------------------------------------------
  await db
    .delete(fileChunks)
    .where(eq(fileChunks.providerIdentityId, providerIdentityId));
  await db
    .delete(uploadChunks)
    .where(eq(uploadChunks.providerIdentityId, providerIdentityId));
  await db
    .delete(providerIdentities)
    .where(eq(providerIdentities.id, providerIdentityId));

  socketManager.broadcastToUser(userId, {
    type: "PROVIDER_DISCONNECTED",
    payload: { providerId: providerIdentityId },
  });

  console.log(
    `[Worker: ProviderMigration] ✅ Disconnected ${providerName} in ${Date.now() - startedAt}ms.`,
  );
}

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

export const providerMigrationQueue = {
  add: async (name: string, data: ProviderMigrationJobData) => {
    const res = queueProviderMigration(data);
    return { id: res.id };
  },
};

export const providerMigrationWorker = {
  close: async () => {},
};

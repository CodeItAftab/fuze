import { Worker, Queue, Job } from "bullmq";
import IORedis from "ioredis";
import { db, providerIdentities, fileChunks, vfsNodes, uploadChunks } from "../db/index.js";
import { eq, and, ne, inArray } from "drizzle-orm";
import { getStorageAdapter } from "../adapters/factory.js";
import { TokenService } from "../services/token.service.js";
import { socketManager } from "../websocket/socket-manager.js";

const redis = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const providerMigrationQueue = new Queue("provider-migration", {
  connection: redis,
});

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

export const providerMigrationWorker = new Worker<ProviderMigrationJobData>(
  "provider-migration",
  async (job: Job<ProviderMigrationJobData>) => {
    const startedAt = Date.now();
    const { userId, providerIdentityId, action } = job.data;

    console.log(
      `[Worker: ProviderMigration] 🚀 Job #${job.id} started: Disconnect request for Provider Identity [${providerIdentityId}] (Action: ${action.toUpperCase()})`,
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
      console.warn(`[Worker: ProviderMigration] ⚠️ Provider identity [${providerIdentityId}] not found in database. Exiting.`);
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
    console.log(`[Worker: ProviderMigration] Found ${totalChunks} chunk(s) stored on ${providerName}.`);
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

      for (const chunk of chunks) {
        const chunkSize = chunk.byteEnd - chunk.byteStart;
        const dest = otherProviders.find(
          (p) => p.quotaTotal - p.quotaUsed >= chunkSize,
        );

        if (dest) {
          try {
            console.log(
              `   → Migrating chunk #${chunk.chunkIndex} (${formatBytes(chunkSize)}) from ${providerName} to ${dest.provider.toUpperCase()}...`,
            );

            const destAdapter = getStorageAdapter(dest.provider);
            const destToken = await TokenService.getValidAccessToken(dest.id);

            // 1. Download chunk from old cloud
            const downloadUrl = await sourceAdapter.getDownloadUrl({
              providerFileId: chunk.providerFileId,
              accessToken: sourceToken,
            });
            const fileStream = await fetch(downloadUrl);
            const fileBlob = await fileStream.arrayBuffer();

            // 2. Upload to new cloud
            const destSession = await destAdapter.createResumableUploadSession({
              fileName: `migrated-${chunk.id}`,
              mimeType: "application/octet-stream",
              size: chunkSize,
              accessToken: destToken,
            });

            await fetch(destSession.sessionUrl, {
              method: destSession.httpMethod || "PUT",
              headers: destSession.headers || {
                "Content-Type": "application/octet-stream",
              },
              body: fileBlob,
            });

            // 3. Update chunk in database
            await db
              .update(fileChunks)
              .set({
                providerIdentityId: dest.id,
                providerFileId: `migrated-${chunk.id}`,
              })
              .where(eq(fileChunks.id, chunk.id));

            // 4. Update destination quota
            dest.quotaUsed += chunkSize;
            await db
              .update(providerIdentities)
              .set({ quotaUsed: dest.quotaUsed })
              .where(eq(providerIdentities.id, dest.id));

            // 5. Delete from old cloud
            await sourceAdapter.deleteFile({
              providerFileId: chunk.providerFileId,
              accessToken: sourceToken,
            });

            console.log(`     ✓ Chunk #${chunk.chunkIndex} successfully moved to ${dest.provider.toUpperCase()}`);
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(`     ✗ Failed migrating chunk ${chunk.id}: ${message}`);
          }
        } else {
          console.warn(`     ⚠️ No remaining provider has enough space for chunk ${chunk.id} (${formatBytes(chunkSize)})`);
        }

        processed++;
        const percent = Math.round((processed / totalChunks) * 100);
        console.log(`[Worker: ProviderMigration] Progress: ${processed}/${totalChunks} chunks (${percent}%)`);

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
    }

    // -------------------------------------------------------------
    // ACTION: DELETE
    // -------------------------------------------------------------
    if (action === "delete") {
      console.log(`[Worker: ProviderMigration] Deleting all ${totalChunks} chunks from ${providerName}...`);
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
            console.error(`   ✗ Error deleting chunk ${chunk.providerFileId}: ${message}`);
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
        console.error(`[Worker: ProviderMigration] Error resolving access token: ${message}`);
      }

      // Clean up broken multi-cloud files
      const affectedNodeIds = Array.from(
        new Set(chunks.map((c) => c.vfsNodeId)),
      );
      if (affectedNodeIds.length > 0) {
        console.log(`[Worker: ProviderMigration] Purging ${affectedNodeIds.length} affected VFS node(s)...`);
        await db.delete(vfsNodes).where(inArray(vfsNodes.id, affectedNodeIds));
      }
    }

    // -------------------------------------------------------------
    // FINALIZE: Remove provider row from database
    // -------------------------------------------------------------
    console.log(`[Worker: ProviderMigration] Purging database record for ${providerName}...`);
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

    const duration = Date.now() - startedAt;
    console.log(`[Worker: ProviderMigration] ✅ Successfully disconnected ${providerName} in ${duration}ms.`);
  },
  { connection: redis },
);

providerMigrationWorker.on("completed", (job) => {
  console.log(`[Worker: ProviderMigration] Job #${job.id} finalized successfully.`);
});

providerMigrationWorker.on("failed", (job, err) => {
  console.error(`[Worker: ProviderMigration] ❌ Job #${job?.id} failed:`, err.message);
});

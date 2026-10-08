import { Worker, Queue } from "bullmq";
import IORedis from "ioredis";
import { db, providerIdentities, fileChunks, vfsNodes } from "../db/index.js";
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

export const providerMigrationWorker = new Worker<ProviderMigrationJobData>(
  "provider-migration",
  async (job) => {
    const { userId, providerIdentityId, action } = job.data;

    const [targetProvider] = await db
      .select()
      .from(providerIdentities)
      .where(
        and(
          eq(providerIdentities.id, providerIdentityId),
          eq(providerIdentities.userId, userId),
        ),
      );

    if (!targetProvider) return;

    const chunks = await db
      .select()
      .from(fileChunks)
      .where(eq(fileChunks.providerIdentityId, providerIdentityId));

    const totalChunks = chunks.length;
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
          } catch (err) {
            console.error(`Failed migrating chunk ${chunk.id}:`, err);
          }
        }

        processed++;
        // Broadcast real-time progress via WebSocket
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
    }

    // -------------------------------------------------------------
    // ACTION: DELETE
    // -------------------------------------------------------------
    if (action === "delete") {
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
          } catch (err) {}
          processed++;
          socketManager.broadcastToUser(userId, {
            type: "PROVIDER_CLEANUP_PROGRESS",
            payload: {
              providerId: providerIdentityId,
              action: "delete",
              completed: processed,
              total: totalChunks,
              percent: Math.round((processed / totalChunks) * 100),
            },
          });
        }
      } catch (err) {}

      // Clean up broken multi-cloud files
      const affectedNodeIds = Array.from(
        new Set(chunks.map((c) => c.vfsNodeId)),
      );
      if (affectedNodeIds.length > 0) {
        await db.delete(vfsNodes).where(inArray(vfsNodes.id, affectedNodeIds));
      }
    }

    // -------------------------------------------------------------
    // FINALIZE: Remove provider row from database
    // -------------------------------------------------------------
    await db
      .delete(providerIdentities)
      .where(eq(providerIdentities.id, providerIdentityId));

    socketManager.broadcastToUser(userId, {
      type: "PROVIDER_DISCONNECTED",
      payload: { providerId: providerIdentityId },
    });
  },
  { connection: redis },
);

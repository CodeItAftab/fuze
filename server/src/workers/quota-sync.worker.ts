import { Worker, Queue } from "bullmq";
import { db, providerIdentities } from "../db/index.js";
import { eq } from "drizzle-orm";
import { TokenService } from "../services/token.service.js";
import { getStorageAdapter } from "../adapters/factory.js";
import { socketManager } from "../websocket/socket-manager.js";
import IORedis from "ioredis";

const redis = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const quotaQueue = new Queue("quota-sync", { connection: redis });

export const quotaWorker = new Worker(
  "quota-sync",
  async () => {
    const identities = await db.select().from(providerIdentities);

    for (const identity of identities) {
      try {
        const accessToken = await TokenService.getValidAccessToken(identity.id);

        // Dynamically invoke the correct adapter for this provider
        const adapter = getStorageAdapter(identity.provider);
        const quota = await adapter.fetchQuota(accessToken);

        await db
          .update(providerIdentities)
          .set({
            quotaTotal: quota.totalBytes,
            quotaUsed: quota.usedBytes,
            lastSyncedAt: new Date(),
          })
          .where(eq(providerIdentities.id, identity.id));

        socketManager.broadcastToUser(identity.userId, {
          type: "QUOTA_UPDATED",
          payload: { providerId: identity.id, quota },
        });
      } catch (err) {
        console.error(
          `Quota sync failed for identity ${identity.id} (${identity.provider}):`,
          err,
        );
      }
    }
  },
  { connection: redis },
);

export async function scheduleQuotaSyncJobs() {
  await quotaQueue.upsertJobScheduler("hourly-quota-sync", {
    every: 60 * 60 * 1000, // Sync quotas every hour
  });
}

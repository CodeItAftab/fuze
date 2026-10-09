import { Worker, Queue, Job } from "bullmq";
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

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export const quotaWorker = new Worker(
  "quota-sync",
  async (job: Job) => {
    const startedAt = Date.now();
    console.log(
      `[Worker: QuotaSync] 📊 Job #${job.id} started: Scanning connected cloud providers...`,
    );

    const identities = await db.select().from(providerIdentities);

    if (identities.length === 0) {
      console.log(
        `[Worker: QuotaSync] ℹ️ No connected cloud providers found in database. (${Date.now() - startedAt}ms)`,
      );
      return { syncedCount: 0 };
    }

    console.log(
      `[Worker: QuotaSync] Syncing quotas across ${identities.length} connected account(s)...`,
    );
    let successful = 0;

    for (const identity of identities) {
      const providerTag = `${identity.provider.toUpperCase()} (${identity.accountEmail || identity.id})`;
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

        successful++;
        console.log(
          `   ✓ [${providerTag}] Quota synced: ${formatBytes(quota.usedBytes)} / ${formatBytes(quota.totalBytes)} (${Math.round((quota.usedBytes / (quota.totalBytes || 1)) * 100)}% used)`,
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`   ✗ [${providerTag}] Failed to sync quota: ${message}`);
      }
    }

    const duration = Date.now() - startedAt;
    console.log(
      `[Worker: QuotaSync] ✅ Quota sync finished: ${successful}/${identities.length} accounts updated in ${duration}ms.`,
    );
    return {
      syncedCount: successful,
      total: identities.length,
      durationMs: duration,
    };
  },
  { connection: redis },
);

quotaWorker.on("completed", (job) => {
  console.log(`[Worker: QuotaSync] Job #${job.id} completed.`);
});

quotaWorker.on("failed", (job, err) => {
  console.error(`[Worker: QuotaSync] ❌ Job #${job?.id} failed:`, err.message);
});

export async function scheduleQuotaSyncJobs() {
  await quotaQueue.upsertJobScheduler("hourly-quota-sync", {
    every: 60 * 60 * 1000, // Sync quotas every hour
  });
  console.log("   - Quota Sync Scheduler: Registered (runs every 60 mins)");
}

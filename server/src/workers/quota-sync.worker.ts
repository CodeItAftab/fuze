import { db, providerIdentities } from "../db/index.js";
import { QuotaService } from "../services/quota.service.js";

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

/**
 * Periodically syncs storage usage across all connected cloud provider accounts.
 * Runs on an in-memory Node timer — 0 Redis commands consumed.
 */
export async function runQuotaSyncTask(): Promise<{
  syncedCount: number;
  total: number;
  durationMs?: number;
}> {
  const startedAt = Date.now();
  console.log(`[Worker: QuotaSync] 📊 Scanning connected cloud providers...`);

  try {
    const identities = await db.select().from(providerIdentities);

    if (identities.length === 0) {
      console.log(
        `[Worker: QuotaSync] ℹ️ No connected cloud providers found in database. (${Date.now() - startedAt}ms)`,
      );
      return { syncedCount: 0, total: 0 };
    }

    console.log(
      `[Worker: QuotaSync] Syncing quotas across ${identities.length} connected account(s)...`,
    );
    let successful = 0;

    for (const identity of identities) {
      const providerTag = `${identity.provider.toUpperCase()} (${identity.accountEmail || identity.id})`;
      try {
        const quota = await QuotaService.syncProviderQuota(identity.id, { forceApi: true });

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
  } catch (err: any) {
    console.error(`[Worker: QuotaSync] ❌ Error running quota sync:`, err?.message);
    return { syncedCount: 0, total: 0 };
  }
}

let quotaIntervalTimer: NodeJS.Timeout | null = null;

export function startQuotaSyncScheduler() {
  console.log(
    "   - Quota Sync Scheduler: Registered (runs every 60 mins via in-memory timer, 0 Redis requests)",
  );

  // Run initial pass after 10 seconds to allow server to boot up
  setTimeout(() => {
    runQuotaSyncTask().catch((err) =>
      console.error("[Worker: QuotaSync] Initial sync failed:", err),
    );
  }, 10000);

  // Periodic hourly run
  quotaIntervalTimer = setInterval(() => {
    runQuotaSyncTask().catch((err) =>
      console.error("[Worker: QuotaSync] Scheduled sync failed:", err),
    );
  }, 60 * 60 * 1000);
}

export function stopQuotaSyncScheduler() {
  if (quotaIntervalTimer) {
    clearInterval(quotaIntervalTimer);
    quotaIntervalTimer = null;
    console.log("[Worker: QuotaSync] Scheduler stopped.");
  }
}

// Backward compatibility stubs for BullMQ interfaces
export const quotaWorker = {
  close: async () => stopQuotaSyncScheduler(),
};
export const scheduleQuotaSyncJobs = async () => startQuotaSyncScheduler();

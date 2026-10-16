import { db, uploadSessions } from "../db/index.js";
import { lt, or, and, eq } from "drizzle-orm";
import { UploadSessionService } from "../services/upload-session.service.js";

/**
 * Scans the database for expired or abandoned upload sessions and purges them.
 * Executed periodically via an in-memory Node timer — 0 Redis commands consumed.
 */
export async function runCleanupSessionTask(): Promise<{
  cleanedCount: number;
  durationMs?: number;
}> {
  const startedAt = Date.now();
  console.log(
    `[Worker: SessionCleanup] 🧹 Scanning for expired or abandoned upload sessions...`,
  );

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    // Find expired sessions OR abandoned sessions stuck in uploading for > 24 hours
    const staleSessions = await db
      .select({ id: uploadSessions.id, fileName: uploadSessions.fileName })
      .from(uploadSessions)
      .where(
        or(
          lt(uploadSessions.expiresAt, new Date()),
          and(
            eq(uploadSessions.status, "uploading"),
            lt(uploadSessions.createdAt, oneDayAgo),
          ),
        ),
      );

    if (staleSessions.length === 0) {
      console.log(
        `[Worker: SessionCleanup] ✨ No expired or abandoned upload sessions found. (${Date.now() - startedAt}ms)`,
      );
      return { cleanedCount: 0 };
    }

    console.log(
      `[Worker: SessionCleanup] 🗑️ Found ${staleSessions.length} stale session(s). Purging chunks from cloud and server...`,
    );

    for (const session of staleSessions) {
      try {
        await UploadSessionService.abortSession(session.id);
        console.log(
          `   - Purged session & cloud chunks: ${session.id} (${session.fileName})`,
        );
      } catch (err: any) {
        console.error(
          `   - Failed to purge session ${session.id}:`,
          err?.message,
        );
      }
    }

    const duration = Date.now() - startedAt;
    console.log(
      `[Worker: SessionCleanup] ✅ Successfully purged ${staleSessions.length} stale session(s) in ${duration}ms.`,
    );
    return { cleanedCount: staleSessions.length, durationMs: duration };
  } catch (err: any) {
    console.error(`[Worker: SessionCleanup] ❌ Error running cleanup:`, err?.message);
    return { cleanedCount: 0 };
  }
}

let cleanupIntervalTimer: NodeJS.Timeout | null = null;

export function startCleanupScheduler() {
  console.log(
    "   - Session Cleanup Scheduler: Registered (runs every 60 mins via in-memory timer, 0 Redis requests)",
  );

  // Run initial pass after 5 seconds to avoid slowing boot
  setTimeout(() => {
    runCleanupSessionTask().catch((err) =>
      console.error("[Worker: SessionCleanup] Initial run failed:", err),
    );
  }, 5000);

  // Periodic hourly run
  cleanupIntervalTimer = setInterval(() => {
    runCleanupSessionTask().catch((err) =>
      console.error("[Worker: SessionCleanup] Scheduled run failed:", err),
    );
  }, 60 * 60 * 1000);
}

export function stopCleanupScheduler() {
  if (cleanupIntervalTimer) {
    clearInterval(cleanupIntervalTimer);
    cleanupIntervalTimer = null;
    console.log("[Worker: SessionCleanup] Scheduler stopped.");
  }
}

// Backward compatibility stubs for BullMQ interfaces
export const cleanupWorker = {
  close: async () => stopCleanupScheduler(),
};
export const scheduleCleanupJobs = async () => startCleanupScheduler();

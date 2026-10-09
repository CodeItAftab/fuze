import { Worker, Queue, Job } from "bullmq";
import { db, uploadSessions } from "../db/index.js";
import { lt, or, and, eq } from "drizzle-orm";
import { UploadSessionService } from "../services/upload-session.service.js";
import IORedis from "ioredis";

const redis = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const cleanupQueue = new Queue("session-cleanup", { connection: redis });

export const cleanupWorker = new Worker(
  "session-cleanup",
  async (job: Job) => {
    const startedAt = Date.now();
    console.log(`[Worker: SessionCleanup] 🧹 Job #${job.id} started: Scanning for expired or abandoned upload sessions...`);

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

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
      console.log(`[Worker: SessionCleanup] ✨ No expired or abandoned upload sessions found. (${Date.now() - startedAt}ms)`);
      return { cleanedCount: 0 };
    }

    console.log(`[Worker: SessionCleanup] 🗑️ Found ${staleSessions.length} stale session(s). Purging chunks from cloud and server...`);

    for (const session of staleSessions) {
      await UploadSessionService.abortSession(session.id);
      console.log(`   - Purged session & cloud chunks: ${session.id} (${session.fileName})`);
    }

    const duration = Date.now() - startedAt;
    console.log(`[Worker: SessionCleanup] ✅ Successfully purged ${staleSessions.length} stale session(s) in ${duration}ms.`);
    return { cleanedCount: staleSessions.length, durationMs: duration };
  },
  { connection: redis },
);

cleanupWorker.on("completed", (job) => {
  console.log(`[Worker: SessionCleanup] Job #${job.id} completed successfully.`);
});

cleanupWorker.on("failed", (job, err) => {
  console.error(`[Worker: SessionCleanup] ❌ Job #${job?.id} failed:`, err.message);
});

export async function scheduleCleanupJobs() {
  await cleanupQueue.upsertJobScheduler("hourly-cleanup", {
    every: 60 * 60 * 1000,
  });
  console.log("   - Session Cleanup Scheduler: Registered (runs every 60 mins)");
}

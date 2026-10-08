import { Worker, Queue } from "bullmq";
import { db, uploadSessions, uploadChunks } from "../db/index.js";
import { lt, eq } from "drizzle-orm";
import IORedis from "ioredis";

const redis = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const cleanupQueue = new Queue("session-cleanup", { connection: redis });

export const cleanupWorker = new Worker(
  "session-cleanup",
  async () => {
    const expired = await db
      .select({ id: uploadSessions.id })
      .from(uploadSessions)
      .where(lt(uploadSessions.expiresAt, new Date()));

    for (const session of expired) {
      await db
        .delete(uploadChunks)
        .where(eq(uploadChunks.uploadSessionId, session.id));
      await db.delete(uploadSessions).where(eq(uploadSessions.id, session.id));
    }
  },
  { connection: redis },
);

export async function scheduleCleanupJobs() {
  await cleanupQueue.upsertJobScheduler("hourly-cleanup", {
    every: 60 * 60 * 1000,
  });
}

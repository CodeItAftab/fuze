import dotenv from "dotenv";
import {
  cleanupWorker,
  scheduleCleanupJobs,
} from "./workers/session-cleanup.worker.js";
import {
  quotaWorker,
  scheduleQuotaSyncJobs,
} from "./workers/quota-sync.worker.js";
import { providerMigrationWorker } from "./workers/provider-migration.worker.js";

dotenv.config();

console.log("⚡ Starting Fuze Background Task Runner (Zero-Redis-Polling)...");

async function startWorkers() {
  // 1. Initialize schedulers (in-memory timers; 0 Redis polling commands)
  await scheduleCleanupJobs();
  await scheduleQuotaSyncJobs();

  console.log("✅ Background Schedulers Active:");
  console.log("   - Session Cleanup Worker: Running (every 60 mins)");
  console.log("   - Quota Sync Worker: Running (every 60 mins)");
  console.log("   - Provider Migration Worker: Ready (on-demand async)");

  // Graceful shutdown
  const shutdown = async () => {
    console.log("🛑 Shutting down background tasks gracefully...");
    await cleanupWorker.close();
    await quotaWorker.close();
    await providerMigrationWorker.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startWorkers().catch((err) => {
  console.error("Fatal error starting worker process:", err);
  process.exit(1);
});

import dotenv from "dotenv";
import {
  cleanupWorker,
  scheduleCleanupJobs,
} from "./workers/session-cleanup.worker.js";
import {
  quotaWorker,
  scheduleQuotaSyncJobs,
} from "./workers/quota-sync.worker.js";
import {
  providerMigrationWorker,
  initProviderMigrationWorker,
} from "./workers/provider-migration.worker.js";

dotenv.config();

console.log("⚡ Starting Fuze Background Task Runner...");

async function startWorkers() {
  // 1. Initialize schedulers
  await scheduleCleanupJobs();
  await scheduleQuotaSyncJobs();

  // 2. Initialize BullMQ provider migration worker
  initProviderMigrationWorker();

  console.log("✅ Background Schedulers & Queue Workers Active:");
  console.log("   - Session Cleanup Worker: Running (every 60 mins)");
  console.log("   - Quota Sync Worker: Running (every 60 mins)");
  console.log("   - Provider Migration Queue: Listening via BullMQ & Redis");

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

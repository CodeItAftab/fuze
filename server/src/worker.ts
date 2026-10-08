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

console.log("⚡ Starting Fuze Background Worker Process...");

async function startWorkers() {
  // 1. Initialize cron schedulers
  await scheduleCleanupJobs();
  await scheduleQuotaSyncJobs();

  console.log("✅ BullMQ Workers Active:");
  console.log("   - Session Cleanup Worker: Running");
  console.log("   - Quota Sync Worker: Running");
  console.log("   - Provider Migration Worker: Running");

  // Graceful shutdown
  const shutdown = async () => {
    console.log("🛑 Shutting down workers gracefully...");
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

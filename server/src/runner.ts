import { fork, ChildProcess } from "child_process";
import path from "path";

console.log("=================================================");
console.log("⚡ Starting Fuze Multi-Process Production Runner");
console.log("=================================================");

let workerProcess: ChildProcess | null = null;
let isShuttingDown = false;

// 1. Spawn Worker as an independent Child Process
function spawnWorker() {
  const workerPath = path.join(__dirname, "worker.js");
  console.log(`[Master] 👷 Launching Background Worker process (${workerPath})...`);

  workerProcess = fork(workerPath, [], {
    stdio: "inherit",
    env: { ...process.env, FUZE_PROCESS_TYPE: "worker" },
  });

  workerProcess.on("error", (err) => {
    console.error("[Master] ❌ Worker process encountered an error:", err);
  });

  workerProcess.on("exit", (code, signal) => {
    console.warn(
      `[Master] ⚠️ Worker process exited with code ${code} (${signal || "no signal"}).`,
    );
    // Auto-restart worker if it terminated unexpectedly
    if (code !== 0 && !isShuttingDown) {
      console.log("[Master] 🔄 Restarting worker process in 5 seconds...");
      setTimeout(spawnWorker, 5000);
    }
  });
}

// 2. Start Worker
spawnWorker();

// 3. Start Fastify Web API in the Main Process
console.log("[Master] 🚀 Initializing Fastify Web API & WebSocket Server...");
import("./index.js").catch((err) => {
  console.error("[Master] ❌ Fatal error starting Fastify API Server:", err);
  process.exit(1);
});

// 4. Graceful Shutdown on termination signals
const shutdown = () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log("\n[Master] 🛑 Received termination signal. Shutting down gracefully...");

  if (workerProcess && workerProcess.connected) {
    workerProcess.kill("SIGTERM");
  }

  setTimeout(() => {
    process.exit(0);
  }, 1000);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

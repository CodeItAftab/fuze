import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import jwt from "@fastify/jwt";
import websocket from "@fastify/websocket";
import dotenv from "dotenv";
import { authRoutes, providerRoutes, uploadRoutes, fileRoutes } from "./routes";
import { websocketRoutes } from "./websocket/sync.js";
import { scheduleCleanupJobs } from "./workers/session-cleanup.worker.js";

dotenv.config();

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
  },
  trustProxy: true,
});

async function main() {
  // 1. CORS with credentials
  await app.register(cors, {
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  // 2. Cookie parser for signed HttpOnly session cookies
  await app.register(cookie, {
    secret:
      process.env.COOKIE_SECRET ||
      "fuze_cookie_signing_secret_min_32_chars_2026",
  });

  // 3. Brute-force rate limiter
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  // 4. JWT Authentication
  await app.register(jwt, {
    secret: process.env.JWT_SECRET || "fuze_super_secret_jwt_key_2026",
    cookie: {
      cookieName: "fuze_session",
      signed: true,
    },
  });

  // 5. WebSocket Engine
  await app.register(websocket);

  // 6. Routes
  await app.register(websocketRoutes);
  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(uploadRoutes, { prefix: "/uploads" });
  await app.register(fileRoutes, { prefix: "/files" });
  await app.register(providerRoutes, { prefix: "/providers" });

  // 7. Healthcheck
  app.get("/health", async () => ({
    status: "ok",
    service: "fuze-server",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }));

  // Background Schedulers
  scheduleCleanupJobs().catch((err) =>
    app.log.error(err, "Failed to schedule cleanup jobs"),
  );

  const port = Number(process.env.PORT) || 4000;
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`🚀 Fuze Production Server listening on http://0.0.0.0:${port}`);
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});

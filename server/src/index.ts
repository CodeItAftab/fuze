import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import jwt from "@fastify/jwt";
import websocket from "@fastify/websocket";
import dotenv from "dotenv";

// Routes
import { authRoutes } from "./routes/auth.routes.js";
import { uploadRoutes } from "./routes/uploads.routes.js";
import { fileRoutes } from "./routes/files.routes.js";
import { providerRoutes } from "./routes/providers.routes.js";
import { websocketRoutes } from "./websocket/sync.js";

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

  // 3. Rate limiter with high dev allowance to prevent 429 on multi-tab/parallel chunk uploads
  await app.register(rateLimit, {
    max: process.env.NODE_ENV === "production" ? 300 : 5000,
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

  // 6. Mount Routes
  await app.register(websocketRoutes);
  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(uploadRoutes, { prefix: "/uploads" });
  await app.register(fileRoutes, { prefix: "/files" });
  await app.register(providerRoutes, { prefix: "/providers" });

  // 7. Fast Healthcheck
  app.get("/health", async () => ({
    status: "ok",
    service: "fuze-api",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }));

  const port = Number(process.env.PORT) || 4000;
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`🚀 Fuze API Server running at http://0.0.0.0:${port}`);
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});

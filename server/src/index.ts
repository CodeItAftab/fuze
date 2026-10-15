import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import jwt from "@fastify/jwt";
import websocket from "@fastify/websocket";
import dotenv from "dotenv";

import { db, userSessions } from "./db/index.js";
import { eq, and, gt } from "drizzle-orm";

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
  // 1. CORS with credentials - Strictly configured from environment variables
  const envOrigins = [
    process.env.CLIENT_ORIGIN,
    process.env.CLIENT_URL,
    ...(process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim())
      : []),
    process.env.NODE_ENV !== "production" ? "http://localhost:3000" : null,
  ].filter(Boolean) as string[];

  const allowedOrigins = new Set(envOrigins);

  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin server-to-server)
      if (!origin) return cb(null, true);

      // Strict exact match against environment whitelist only
      if (allowedOrigins.has(origin)) {
        return cb(null, true);
      }

      // Strictly reject unauthorized external origins
      return cb(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "Cookie",
    ],
    exposedHeaders: ["Set-Cookie"],
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

  // 4b. Enforce database-backed session revocation across all protected routes
  app.addHook("preHandler", async (request, reply) => {
    const publicPaths = [
      "/health",
      "/auth/login",
      "/auth/register",
      "/auth/verify-email",
      "/auth/resend-verification",
      "/auth/forgot-password",
      "/auth/reset-password",
    ];

    if (
      publicPaths.some((p) => request.url.startsWith(p)) ||
      request.url.includes("/share/") ||
      request.url.includes("/callback")
    ) {
      return;
    }

    let token = request.headers.authorization?.replace("Bearer ", "");
    if (!token && request.cookies?.fuze_session) {
      const unsigned = request.unsignCookie(request.cookies.fuze_session);
      if (unsigned.valid && unsigned.value) token = unsigned.value;
    }

    if (token) {
      try {
        const decoded = app.jwt.verify<{
          userId: string;
          sessionToken?: string;
        }>(token);
        (request as any).user = decoded;

        if (decoded.sessionToken) {
          const [session] = await db
            .select({ id: userSessions.id })
            .from(userSessions)
            .where(
              and(
                eq(userSessions.token, decoded.sessionToken),
                gt(userSessions.expiresAt, new Date()),
              ),
            )
            .limit(1);

          if (!session) {
            reply.clearCookie("fuze_session", { path: "/" });
            return reply.status(401).send({ error: "Session revoked" });
          }
        }
      } catch {
        // Let route handlers trigger appropriate 401 if unauthenticated
      }
    }
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

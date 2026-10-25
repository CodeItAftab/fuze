import { FastifyInstance } from "fastify";
import { socketManager } from "./socket-manager.js";
import { db, migrationJobs } from "../db/index.js";
import { and, eq, or, desc } from "drizzle-orm";

const COOKIE_NAME = "fuze_session";

export async function websocketRoutes(fastify: FastifyInstance) {
  fastify.get("/ws", { websocket: true }, (socket, req) => {
    let jwtToken: string | undefined;

    // 1. Mobile app query param: /ws?token=...
    const query = req.query as { token?: string };
    if (query?.token) {
      jwtToken = query.token;
    }

    // 2. Web app signed HttpOnly cookie
    if (!jwtToken && req.cookies[COOKIE_NAME]) {
      const unsigned = req.unsignCookie(req.cookies[COOKIE_NAME]);
      if (unsigned.valid && unsigned.value) {
        jwtToken = unsigned.value;
      }
    }

    if (!jwtToken) {
      socket.send(JSON.stringify({ error: "Unauthorized" }));
      socket.close(1008, "Unauthorized");
      return;
    }

    try {
      const decoded = fastify.jwt.verify<{
        userId: string;
        sessionToken?: string;
      }>(jwtToken);
      socketManager.register(decoded.userId, socket, decoded.sessionToken);

      socket.send(
        JSON.stringify({
          type: "CONNECTED",
          userId: decoded.userId,
          timestamp: new Date().toISOString(),
        }),
      );

      // Immediately sync active migration state with newly connected client
      void (async () => {
        try {
          const [activeJob] = await db
            .select()
            .from(migrationJobs)
            .where(
              and(
                eq(migrationJobs.userId, decoded.userId),
                or(
                  eq(migrationJobs.status, "running"),
                  eq(migrationJobs.status, "pending"),
                ),
              ),
            )
            .orderBy(desc(migrationJobs.startedAt))
            .limit(1);

          if (activeJob) {
            let parsedLogs: any[] = [];
            try {
              parsedLogs = activeJob.logs ? JSON.parse(activeJob.logs) : [];
            } catch {}

            socket.send(
              JSON.stringify({
                type: "PROVIDER_CLEANUP_PROGRESS",
                payload: {
                  id: activeJob.id,
                  jobId: activeJob.id,
                  providerId: activeJob.providerIdentityId,
                  provider: activeJob.provider,
                  action: activeJob.action,
                  status: activeJob.status,
                  completed: activeJob.completedChunks,
                  total: activeJob.totalChunks,
                  percent: activeJob.percent,
                  transferredBytes: Number(activeJob.transferredBytes || 0),
                  totalBytes: Number(activeJob.totalBytes || 0),
                  currentFileName: activeJob.currentFileName,
                  statusText: activeJob.statusText,
                  logs: parsedLogs,
                  startedAt: activeJob.startedAt,
                },
              }),
            );
          } else {
            socket.send(
              JSON.stringify({
                type: "PROVIDER_CLEANUP_PROGRESS",
                payload: null,
              }),
            );
          }
        } catch {}
      })();
    } catch {
      socket.send(JSON.stringify({ error: "Invalid Token" }));
      socket.close(1008, "Invalid Token");
    }
  });
}

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { UploadSessionService } from "../services/upload-session.service.js";
import { MegaAdapter } from "../adapters/mega.adapter.js";
import { KoofrAdapter } from "../adapters/koofr.adapter.js";
import { db, users } from "../db/index.js";
import { eq } from "drizzle-orm";
import { z } from "zod";

const createSessionSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  totalSize: z.number().positive(),
  parentId: z.string().uuid().nullable().optional(),
});

export async function uploadRoutes(fastify: FastifyInstance) {
  // Support raw stream bodies for provider proxy uploads like MEGA and Koofr
  fastify.addContentTypeParser("*", function (request, payload, done) {
    const ct = request.headers["content-type"] || "";
    if (ct.includes("application/json")) {
      let data = "";
      payload.on("data", (chunk: any) => { data += chunk; });
      payload.on("end", () => {
        try {
          done(null, data ? JSON.parse(data) : {});
        } catch (err: any) {
          done(err, undefined);
        }
      });
      return;
    }
    done(null, payload);
  });

  // Pre-handler hook to authenticate user and verify email
  fastify.addHook(
    "preHandler",
    async (request: FastifyRequest, reply: FastifyReply) => {
      // If request is to /provider-stream/, bypass auth because upload token is verified in query param
      if (request.url.includes("/provider-stream/")) {
        return;
      }

      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const user = request.user as { userId: string };
      const [dbUser] = await db
        .select({ emailVerified: users.emailVerified })
        .from(users)
        .where(eq(users.id, user.userId));

      if (!dbUser || !dbUser.emailVerified) {
        return reply.status(403).send({
          error: "Please verify your email address to upload files.",
          unverified: true,
        });
      }
    },
  );

  // 1. Create Resumable Upload Session
  fastify.post("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { userId: string };
    const parse = createSessionSchema.safeParse(request.body);
    if (!parse.success)
      return reply.status(400).send({ error: parse.error.issues[0]?.message });

    try {
      const session = await UploadSessionService.createSession({
        userId: user.userId,
        ...parse.data,
      });
      return reply.status(201).send(session);
    } catch (err: any) {
      if (err.name === "ProviderAuthExpiredError") {
        return reply.status(401).send({ error: err.message, code: "PROVIDER_AUTH_EXPIRED" });
      }
      return reply.status(400).send({ error: err.message });
    }
  });

  // 2. Get direct provider upload URL for a specific chunk
  fastify.get(
    "/:sessionId/chunks/:index/url",
    async (
      request: FastifyRequest<{
        Params: { sessionId: string; index: string };
        Querystring: { retry?: string };
      }>,
      reply,
    ) => {
      try {
        const { sessionId, index } = request.params;
        const retry = Number(request.query?.retry) || 0;
        const clientOrigin =
          (request.headers.origin as string) ||
          process.env.CLIENT_ORIGIN ||
          "http://localhost:3000";
        const res = await UploadSessionService.getChunkUploadUrl(
          sessionId,
          Number(index),
          clientOrigin,
          retry,
        );
        return reply.send(res);
      } catch (err: any) {
        if (err.name === "ProviderAuthExpiredError") {
          return reply.status(401).send({ error: err.message, code: "PROVIDER_AUTH_EXPIRED" });
        }
        return reply.status(400).send({ error: err.message });
      }
    },
  );

  // 3. Mark chunk completed
  fastify.patch(
    "/:sessionId/chunks/:index",
    async (
      request: FastifyRequest<{
        Params: { sessionId: string; index: string };
        Body: { chunkHash: string; providerFileId: string };
      }>,
      reply,
    ) => {
      const { sessionId, index } = request.params;
      const { chunkHash, providerFileId } = request.body;

      await UploadSessionService.markChunkCompleted(
        sessionId,
        Number(index),
        chunkHash,
        providerFileId,
      );
      return reply.send({ success: true });
    },
  );

  // 4. Finalize upload session (computes Merkle root and creates VFS node)
  fastify.post(
    "/:sessionId/complete",
    async (
      request: FastifyRequest<{ Params: { sessionId: string } }>,
      reply,
    ) => {
      try {
        const { sessionId } = request.params;
        const vfsNode = await UploadSessionService.finalizeUpload(sessionId);
        return reply.send({ file: vfsNode });
      } catch (err: any) {
        return reply.status(400).send({ error: err.message });
      }
    },
  );

  // 5. Abort / Cancel upload session and clean up partial cloud chunks
  const handleAbort = async (
    request: FastifyRequest<{ Params: { sessionId: string } }>,
    reply: FastifyReply,
  ) => {
    let userId: string | undefined;
    try {
      await request.jwtVerify();
      userId = (request.user as { userId: string }).userId;
    } catch {
      // Fallback for sendBeacon where cookie is signed
      const cookieVal = request.cookies?.["fuze_session"];
      if (cookieVal) {
        const unsigned = request.unsignCookie(cookieVal);
        if (unsigned.valid && unsigned.value) {
          try {
            const decoded = fastify.jwt.verify<{ userId: string }>(unsigned.value);
            userId = decoded.userId;
          } catch {}
        }
      }
    }

    try {
      const { sessionId } = request.params;
      const res = await UploadSessionService.abortSession(sessionId, userId);
      return reply.send(res);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  };

  fastify.post("/:sessionId/abort", handleAbort);
  fastify.delete("/:sessionId", handleAbort);

  // 6. Direct Provider Streaming Proxies (MEGA & Koofr)
  fastify.post(
    "/provider-stream/mega",
    {
      bodyLimit: 1024 * 1024 * 1024,
    },
    async (
      request: FastifyRequest<{
        Querystring: { token: string };
      }>,
      reply: FastifyReply,
    ) => {
      const { token } = request.query || {};
      if (!token) {
        return reply.status(400).send({ error: "Missing stream token" });
      }
      try {
        const stream = (request.body as any) || request.raw;
        const result = await MegaAdapter.handleStreamUpload(token, stream);
        return reply.send({ success: true, ...result });
      } catch (err: any) {
        return reply.status(400).send({ error: err.message });
      }
    },
  );

  fastify.get(
    "/provider-stream/mega/download",
    async (
      request: FastifyRequest<{
        Querystring: { token: string };
      }>,
      reply: FastifyReply,
    ) => {
      const { token } = request.query || {};
      if (!token) {
        return reply.status(400).send({ error: "Missing download token" });
      }
      try {
        const { stream, name, size } = await MegaAdapter.handleStreamDownload(token);
        reply.header("Content-Disposition", `attachment; filename="${encodeURIComponent(name)}"`);
        if (size) reply.header("Content-Length", size);
        return reply.send(stream);
      } catch (err: any) {
        return reply.status(400).send({ error: err.message });
      }
    },
  );

  fastify.all(
    "/provider-stream/koofr",
    {
      bodyLimit: 1024 * 1024 * 1024,
    },
    async (
      request: FastifyRequest<{
        Querystring: { token: string };
      }>,
      reply: FastifyReply,
    ) => {
      const { token } = request.query || {};
      if (!token) {
        return reply.status(400).send({ error: "Missing stream token" });
      }
      try {
        const stream = (request.body as any) || request.raw;
        const result = await KoofrAdapter.handleStreamUpload(token, stream);
        return reply.send({ success: true, ...result });
      } catch (err: any) {
        return reply.status(400).send({ error: err.message });
      }
    },
  );
}

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { UploadSessionService } from "../services/upload-session.service.js";
import { z } from "zod";

const createSessionSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  totalSize: z.number().positive(),
  parentId: z.string().uuid().nullable().optional(),
});

export async function uploadRoutes(fastify: FastifyInstance) {
  // Pre-handler hook to authenticate user
  fastify.addHook(
    "preHandler",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: "Unauthorized" });
      }
    },
  );

  // 1. Create Resumable Upload Session
  fastify.post("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { userId: string };
    const parse = createSessionSchema.safeParse(request.body);
    if (!parse.success)
      return reply.status(400).send({ error: parse.error.errors[0]?.message });

    try {
      const session = await UploadSessionService.createSession({
        userId: user.userId,
        ...parse.data,
      });
      return reply.status(201).send(session);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // 2. Get direct provider upload URL for a specific chunk
  fastify.get(
    "/:sessionId/chunks/:index/url",
    async (
      request: FastifyRequest<{ Params: { sessionId: string; index: string } }>,
      reply,
    ) => {
      try {
        const { sessionId, index } = request.params;
        const res = await UploadSessionService.getChunkUploadUrl(
          sessionId,
          Number(index),
        );
        return reply.send(res);
      } catch (err: any) {
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
}

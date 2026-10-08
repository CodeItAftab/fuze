import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { VfsService } from "../services/vfs.service.js";
import { z } from "zod";

export async function fileRoutes(fastify: FastifyInstance) {
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

  // List folder contents
  fastify.get(
    "/",
    async (
      request: FastifyRequest<{ Querystring: { parentId?: string } }>,
      reply,
    ) => {
      const user = request.user as { userId: string };
      const items = await VfsService.listChildren(
        user.userId,
        request.query.parentId || null,
      );
      return reply.send({ items });
    },
  );

  // Create folder
  fastify.post(
    "/folder",
    async (
      request: FastifyRequest<{ Body: { name: string; parentId?: string } }>,
      reply,
    ) => {
      const user = request.user as { userId: string };
      const { name, parentId } = request.body;
      const folder = await VfsService.createFolder(
        user.userId,
        name,
        parentId || null,
      );
      return reply.status(201).send({ folder });
    },
  );

  // Move to trash
  fastify.delete(
    "/:id",
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const user = request.user as { userId: string };
      await VfsService.moveToTrash(user.userId, request.params.id);
      return reply.send({ success: true });
    },
  );

  // Restore from trash
  fastify.post(
    "/:id/restore",
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const user = request.user as { userId: string };
      await VfsService.restoreFromTrash(user.userId, request.params.id);
      return reply.send({ success: true });
    },
  );

  // Permanently delete
  fastify.delete(
    "/:id/permanent",
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const user = request.user as { userId: string };
      await VfsService.permanentlyDelete(user.userId, request.params.id);
      return reply.send({ success: true });
    },
  );
}

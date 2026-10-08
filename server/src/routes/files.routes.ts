import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { VfsService } from "../services/vfs.service.js";
import { db, vfsNodes, fileChunks, providerIdentities } from "../db/index.js";
import { eq, and } from "drizzle-orm";
import { getStorageAdapter } from "../adapters/factory.js";
import { TokenService } from "../services/token.service.js";

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

  // 1. List folder contents
  fastify.get(
    "/",
    async (
      request: FastifyRequest<{
        Querystring: { parentId?: string; starred?: string };
      }>,
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

  // 2. Create folder
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

  // 3. Move to trash (Soft delete)
  fastify.delete(
    "/:id",
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const user = request.user as { userId: string };
      await VfsService.moveToTrash(user.userId, request.params.id);
      return reply.send({ success: true });
    },
  );

  // 4. Restore from trash
  fastify.post(
    "/:id/restore",
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const user = request.user as { userId: string };
      await VfsService.restoreFromTrash(user.userId, request.params.id);
      return reply.send({ success: true });
    },
  );

  // 5. Permanently delete (Reclaims cloud bytes)
  fastify.delete(
    "/:id/permanent",
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const user = request.user as { userId: string };
      await VfsService.permanentlyDelete(user.userId, request.params.id);
      return reply.send({ success: true });
    },
  );

  // 6. Toggle Starred / Favorite
  fastify.patch(
    "/:id/star",
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: { starred: boolean };
      }>,
      reply,
    ) => {
      const user = request.user as { userId: string };
      const { starred } = request.body;
      const [node] = await db
        .update(vfsNodes)
        .set({ starred, updatedAt: new Date() })
        .where(
          and(
            eq(vfsNodes.id, request.params.id),
            eq(vfsNodes.userId, user.userId),
          ),
        )
        .returning();
      return reply.send({ file: node });
    },
  );

  // 7. FILE DOWNLOAD (Zero-Proxy URL Generation)
  fastify.get(
    "/:id/download",
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const user = request.user as { userId: string };
      const { id } = request.params;

      const [file] = await db
        .select()
        .from(vfsNodes)
        .where(and(eq(vfsNodes.id, id), eq(vfsNodes.userId, user.userId)));

      if (!file || file.type !== "file") {
        return reply.status(404).send({ error: "File not found" });
      }

      // Fetch chunks and their cloud locations
      const chunks = await db
        .select({
          chunkIndex: fileChunks.chunkIndex,
          byteStart: fileChunks.byteStart,
          byteEnd: fileChunks.byteEnd,
          providerFileId: fileChunks.providerFileId,
          providerIdentityId: fileChunks.providerIdentityId,
          provider: providerIdentities.provider,
        })
        .from(fileChunks)
        .innerJoin(
          providerIdentities,
          eq(fileChunks.providerIdentityId, providerIdentities.id),
        )
        .where(eq(fileChunks.vfsNodeId, id));

      if (chunks.length === 0) {
        return reply.status(404).send({ error: "File chunks missing" });
      }

      // If single chunk (whole file) -> Return direct download URL
      if (chunks.length === 1) {
        const single = chunks[0]!;
        const token = await TokenService.getValidAccessToken(
          single.providerIdentityId,
        );
        const adapter = getStorageAdapter(single.provider);
        const directUrl = await adapter.getDownloadUrl({
          providerFileId: single.providerFileId,
          accessToken: token,
        });

        return reply.send({
          strategy: "whole",
          fileName: file.name,
          mimeType: file.mimeType,
          size: file.size,
          downloadUrl: directUrl,
        });
      }

      // If multi-cloud chunked -> Generate pre-signed URLs for each chunk for client assembly
      const chunkDownloads = [];
      for (const c of chunks.sort((a, b) => a.chunkIndex - b.chunkIndex)) {
        const token = await TokenService.getValidAccessToken(
          c.providerIdentityId,
        );
        const adapter = getStorageAdapter(c.provider);
        const url = await adapter.getDownloadUrl({
          providerFileId: c.providerFileId,
          accessToken: token,
        });

        chunkDownloads.push({
          index: c.chunkIndex,
          byteStart: c.byteStart,
          byteEnd: c.byteEnd,
          downloadUrl: url,
        });
      }

      return reply.send({
        strategy: "chunked",
        fileName: file.name,
        mimeType: file.mimeType,
        size: file.size,
        merkleRoot: file.merkleRoot,
        chunks: chunkDownloads,
      });
    },
  );

  // 8. FILE DETAILS & CHUNK INSPECTOR
  fastify.get(
    "/:id/details",
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const user = request.user as { userId: string };
      const { id } = request.params;

      const [file] = await db
        .select()
        .from(vfsNodes)
        .where(and(eq(vfsNodes.id, id), eq(vfsNodes.userId, user.userId)));

      if (!file) return reply.status(404).send({ error: "File not found" });

      const chunks = await db
        .select({
          chunkIndex: fileChunks.chunkIndex,
          byteStart: fileChunks.byteStart,
          byteEnd: fileChunks.byteEnd,
          chunkHash: fileChunks.chunkHash,
          provider: providerIdentities.provider,
          accountEmail: providerIdentities.accountEmail,
        })
        .from(fileChunks)
        .innerJoin(
          providerIdentities,
          eq(fileChunks.providerIdentityId, providerIdentities.id),
        )
        .where(eq(fileChunks.vfsNodeId, id));

      return reply.send({
        file,
        chunks: chunks.sort((a, b) => a.chunkIndex - b.chunkIndex),
      });
    },
  );
}

import { randomBytes } from "node:crypto";
import { Readable, PassThrough } from "node:stream";
import bcrypt from "bcryptjs";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { VfsService } from "../services/vfs.service.js";
import {
  db,
  vfsNodes,
  fileChunks,
  providerIdentities,
  shares,
} from "../db/index.js";
import { eq, and } from "drizzle-orm";
import { getStorageAdapter } from "../adapters/factory.js";
import { TokenService } from "../services/token.service.js";

export async function fileRoutes(fastify: FastifyInstance) {
  fastify.addHook(
    "preHandler",
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Allow public access to /share/:token routes
      if (request.url.includes("/share/")) {
        return;
      }
      try {
        await request.jwtVerify();
      } catch {
        const queryToken = (request.query as any)?.token;
        if (queryToken) {
          try {
            const decoded = fastify.jwt.verify(queryToken) as any;
            (request as any).user = decoded;
            return;
          } catch {}
        }
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

  // 1b. List trashed items
  fastify.get("/trash", async (request, reply) => {
    const user = request.user as { userId: string };
    const items = await VfsService.listTrash(user.userId);
    return reply.send({ items });
  });

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

  // 7. FILE DOWNLOAD (High-speed direct CDN redirect or zero-memory stream)
  fastify.get(
    "/:id/download",
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Querystring: { info?: string };
      }>,
      reply,
    ) => {
      const user = request.user as { userId: string };
      const { id } = request.params;
      const { info } = request.query;

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

      // If single chunk (whole file)
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

        // If client specifically requested JSON plan
        if (info === "true") {
          return reply.send({
            strategy: "whole",
            fileName: file.name,
            mimeType: file.mimeType,
            size: file.size,
            downloadUrl: directUrl,
          });
        }

        // For Google Drive: stream bytes using Bearer token since direct link requires auth
        if (single.provider === "google_drive") {
          const driveRes = await fetch(directUrl, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!driveRes.ok || !driveRes.body) {
            return reply
              .status(502)
              .send({ error: "Failed to stream file from Google Drive" });
          }
          reply.header(
            "Content-Disposition",
            `attachment; filename="${encodeURIComponent(file.name)}"`,
          );
          reply.header(
            "Content-Type",
            file.mimeType || "application/octet-stream",
          );
          if (file.size) reply.header("Content-Length", file.size.toString());
          return reply.send(Readable.fromWeb(driveRes.body as any));
        }

        // For Dropbox, OneDrive, Box, pCloud: directUrl is a pre-authenticated high-speed CDN URL
        return reply.redirect(directUrl, 302);
      }

      // If multi-cloud chunked
      if (info === "true") {
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
      }

      // Multi-chunk sequential stream
      reply.header(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(file.name)}"`,
      );
      reply.header("Content-Type", file.mimeType || "application/octet-stream");
      if (file.size) reply.header("Content-Length", file.size.toString());

      const passThrough = new PassThrough();
      reply.send(passThrough);

      (async () => {
        try {
          for (const c of chunks.sort((a, b) => a.chunkIndex - b.chunkIndex)) {
            const token = await TokenService.getValidAccessToken(
              c.providerIdentityId,
            );
            const adapter = getStorageAdapter(c.provider);
            const url = await adapter.getDownloadUrl({
              providerFileId: c.providerFileId,
              accessToken: token,
            });

            const headers: Record<string, string> = {};
            if (c.provider === "google_drive") {
              headers["Authorization"] = `Bearer ${token}`;
            }

            const res = await fetch(url, { headers });
            if (!res.ok || !res.body) {
              throw new Error(
                `Failed to fetch chunk ${c.chunkIndex} from ${c.provider}`,
              );
            }

            const reader = res.body.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (value) passThrough.write(Buffer.from(value));
            }
          }
          passThrough.end();
        } catch (err: any) {
          passThrough.destroy(err);
        }
      })();
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

  // 9. FILE SHARE (Generate shareable link with optional password)
  fastify.post(
    "/:id/share",
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: { password?: string };
      }>,
      reply: FastifyReply,
    ) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: "Unauthorized" });
      }
      const { userId } = request.user as { userId: string };
      const { id } = request.params;
      const { password } = request.body || {};
      // 1. Verify file exists and belongs to user
      const [file] = await db
        .select()
        .from(vfsNodes)
        .where(and(eq(vfsNodes.id, id), eq(vfsNodes.userId, userId)));
      if (!file) {
        return reply.status(404).send({ error: "File not found." });
      }
      // 2. Check if a share token already exists for this file
      const [existingShare] = await db
        .select()
        .from(shares)
        .where(eq(shares.vfsNodeId, id));
      if (existingShare && !password) {
        return reply.send({
          token: existingShare.token,
          directUrl: `${request.protocol}://${request.hostname}/share/${existingShare.token}`,
        });
      }
      // 3. Generate a secure random token
      const token = randomBytes(16).toString("hex");
      let passwordHash: string | null = null;
      if (password && password.trim()) {
        passwordHash = await bcrypt.hash(password.trim(), 10);
      }
      // 4. Save share in database (expires in 30 days)
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const [newShare] = await db
        .insert(shares)
        .values({
          vfsNodeId: file.id,
          token,
          passwordHash,
          expiresAt,
        })
        .returning();
      return reply.send({
        token: newShare.token,
        directUrl: `${request.protocol}://${request.hostname}/share/${newShare.token}`,
      });
    },
  );

  // 10. FILE SHARE ACCESS (Validate token & password, return download URL)
  fastify.get(
    "/share/:token",
    async (
      request: FastifyRequest<{ Params: { token: string } }>,
      reply: FastifyReply,
    ) => {
      const { token } = request.params;
      const [share] = await db
        .select()
        .from(shares)
        .where(eq(shares.token, token));
      if (!share) {
        return reply
          .status(404)
          .send({ error: "Share link not found or expired." });
      }
      if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
        return reply
          .status(410)
          .send({ error: "This share link has expired." });
      }
      const [file] = await db
        .select()
        .from(vfsNodes)
        .where(eq(vfsNodes.id, share.vfsNodeId));
      if (!file) {
        return reply
          .status(404)
          .send({ error: "Shared file no longer exists." });
      }
      // Check if password protected
      if (share.passwordHash) {
        return reply.send({
          isPasswordProtected: true,
          fileName: file.name,
          size: file.size,
          mimeType: file.mimeType,
        });
      }

      // Fetch chunk to resolve direct cloud download URL
      const [chunk] = await db
        .select({
          providerFileId: fileChunks.providerFileId,
          providerIdentityId: fileChunks.providerIdentityId,
          provider: providerIdentities.provider,
        })
        .from(fileChunks)
        .innerJoin(
          providerIdentities,
          eq(fileChunks.providerIdentityId, providerIdentities.id),
        )
        .where(eq(fileChunks.vfsNodeId, file.id));

      if (!chunk) {
        return reply.status(404).send({ error: "File chunk data missing." });
      }

      const accessToken = await TokenService.getValidAccessToken(
        chunk.providerIdentityId,
      );
      const adapter = getStorageAdapter(chunk.provider);
      const downloadUrl = await adapter.getDownloadUrl({
        providerFileId: chunk.providerFileId,
        accessToken,
      });

      return reply.send({
        isPasswordProtected: false,
        fileName: file.name,
        size: file.size,
        mimeType: file.mimeType,
        downloadUrl,
      });
    },
  );
}

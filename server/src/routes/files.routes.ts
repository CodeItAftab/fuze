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
  users,
} from "../db/index.js";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { createReadStream } from "node:fs";
import { getStorageAdapter } from "../adapters/factory.js";
import { CacheService } from "../services/cache.service.js";
import { TokenService } from "../services/token.service.js";
import { ThumbnailCacheService } from "../services/thumbnail-cache.service.js";
import { socketManager } from "../websocket/socket-manager.js";

function getProviderAuthHeaders(provider: string, token: string): Record<string, string> {
  try {
    const adapter = getStorageAdapter(provider as any);
    if (adapter.getDownloadHeaders) {
      return adapter.getDownloadHeaders(token);
    }
  } catch {}
  if (provider === "google_drive") {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export async function fileRoutes(fastify: FastifyInstance) {
  fastify.addHook(
    "preHandler",
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Allow public access to /share/:token routes
      if (request.url.includes("/share/")) {
        return;
      }
      if ((request as any).user) {
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
      const parentId = request.query.parentId || null;

      const cached = await CacheService.getFolderListing(user.userId, parentId);
      if (cached) {
        return reply.send(cached);
      }

      const [items, breadcrumbs] = await Promise.all([
        VfsService.listChildren(user.userId, parentId),
        VfsService.getBreadcrumbs(user.userId, parentId),
      ]);
      const payload = { items, breadcrumbs };
      await CacheService.setFolderListing(user.userId, parentId, payload);
      return reply.send(payload);
    },
  );

  // 1b. List trashed items
  fastify.get("/trash", async (request, reply) => {
    const user = request.user as { userId: string };
    const cached = await CacheService.getTrashListing(user.userId);
    if (cached) {
      return reply.send({ items: cached });
    }
    const items = await VfsService.listTrash(user.userId);
    await CacheService.setTrashListing(user.userId, items);
    return reply.send({ items });
  });

  // 1b-ii. Empty all trashed items
  fastify.delete("/trash/empty", async (request, reply) => {
    const user = request.user as { userId: string };
    const result = await VfsService.emptyTrash(user.userId);
    await CacheService.invalidateUserVfs(user.userId);
    await CacheService.invalidateUserProviders(user.userId);
    return reply.send({ success: true, ...result });
  });

  // 1c. List starred items
  fastify.get("/starred", async (request, reply) => {
    const user = request.user as { userId: string };
    const cached = await CacheService.getStarredListing(user.userId);
    if (cached) {
      return reply.send({ items: cached });
    }
    const items = await VfsService.listStarred(user.userId);
    await CacheService.setStarredListing(user.userId, items);
    return reply.send({ items });
  });

  // 1d. List all folders (for move modal destination tree)
  fastify.get("/folders", async (request, reply) => {
    const user = request.user as { userId: string };
    const cached = await CacheService.getFoldersTree(user.userId);
    if (cached) {
      return reply.send({ folders: cached });
    }
    const folders = await db
      .select({
        id: vfsNodes.id,
        name: vfsNodes.name,
        parentId: vfsNodes.parentId,
        createdAt: vfsNodes.createdAt,
      })
      .from(vfsNodes)
      .where(
        and(
          eq(vfsNodes.userId, user.userId),
          eq(vfsNodes.type, "folder"),
          isNull(vfsNodes.trashedAt),
        ),
      );
    await CacheService.setFoldersTree(user.userId, folders);
    return reply.send({ folders });
  });

  // 1e. Move items (single or multiple) to destination folder
  fastify.post(
    "/move",
    async (
      request: FastifyRequest<{
        Body: { nodeIds: string[]; targetParentId: string | null };
      }>,
      reply,
    ) => {
      const user = request.user as { userId: string };
      const { nodeIds, targetParentId } = request.body || {};
      if (!Array.isArray(nodeIds) || nodeIds.length === 0) {
        return reply.status(400).send({ error: "nodeIds array is required" });
      }

      try {
        const moved = await VfsService.moveNodes(
          user.userId,
          nodeIds,
          targetParentId || null,
        );
        await CacheService.invalidateUserVfs(user.userId);
        return reply.send({ success: true, moved });
      } catch (err: unknown) {
        return reply.status(400).send({
          error: err instanceof Error ? err.message : "Failed to move items",
        });
      }
    },
  );

  // 1f. Batch trash items
  fastify.post(
    "/batch-trash",
    async (
      request: FastifyRequest<{
        Body: { nodeIds: string[] };
      }>,
      reply,
    ) => {
      const user = request.user as { userId: string };
      const { nodeIds } = request.body || {};
      if (!Array.isArray(nodeIds) || nodeIds.length === 0) {
        return reply.status(400).send({ error: "nodeIds array is required" });
      }

      await db
        .update(vfsNodes)
        .set({ trashedAt: new Date() })
        .where(
          and(inArray(vfsNodes.id, nodeIds), eq(vfsNodes.userId, user.userId)),
        );

      for (const id of nodeIds) {
        socketManager.broadcastToUser(user.userId, {
          type: "FILE_DELETED",
          payload: { id },
        });
      }

      await CacheService.invalidateUserVfs(user.userId);
      return reply.send({ success: true });
    },
  );

  // 1f-ii. Batch restore items
  fastify.post(
    "/batch-restore",
    async (
      request: FastifyRequest<{
        Body: { nodeIds: string[] };
      }>,
      reply,
    ) => {
      const user = request.user as { userId: string };
      const { nodeIds } = request.body || {};
      if (!Array.isArray(nodeIds) || nodeIds.length === 0) {
        return reply.status(400).send({ error: "nodeIds array is required" });
      }

      await VfsService.batchRestore(user.userId, nodeIds);
      await CacheService.invalidateUserVfs(user.userId);
      return reply.send({ success: true });
    },
  );

  // 1f-iii. Batch permanently delete items
  fastify.post(
    "/batch-permanent",
    async (
      request: FastifyRequest<{
        Body: { nodeIds: string[] };
      }>,
      reply,
    ) => {
      const user = request.user as { userId: string };
      const { nodeIds } = request.body || {};
      if (!Array.isArray(nodeIds) || nodeIds.length === 0) {
        return reply.status(400).send({ error: "nodeIds array is required" });
      }

      await VfsService.batchPermanentlyDelete(user.userId, nodeIds);
      await CacheService.invalidateUserVfs(user.userId);
      await CacheService.invalidateUserProviders(user.userId);
      return reply.send({ success: true });
    },
  );

  // 1g. Batch star/unstar items
  fastify.post(
    "/batch-star",
    async (
      request: FastifyRequest<{
        Body: { nodeIds: string[]; starred: boolean };
      }>,
      reply,
    ) => {
      const user = request.user as { userId: string };
      const { nodeIds, starred } = request.body || {};
      if (!Array.isArray(nodeIds) || nodeIds.length === 0) {
        return reply.status(400).send({ error: "nodeIds array is required" });
      }

      await db
        .update(vfsNodes)
        .set({ starred: !!starred, updatedAt: new Date() })
        .where(
          and(inArray(vfsNodes.id, nodeIds), eq(vfsNodes.userId, user.userId)),
        );

      await CacheService.invalidateUserVfs(user.userId);
      return reply.send({ success: true });
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
      await CacheService.invalidateUserVfs(user.userId);
      return reply.status(201).send({ folder });
    },
  );

  // 2b. Rename item (File or Folder)
  fastify.patch(
    "/:id",
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: { name: string };
      }>,
      reply,
    ) => {
      const user = request.user as { userId: string };
      const { id } = request.params;
      const { name } = request.body || {};

      if (!name || typeof name !== "string" || !name.trim()) {
        return reply.status(400).send({ error: "Valid name is required" });
      }

      try {
        const updated = await VfsService.renameNode(
          user.userId,
          id,
          name.trim(),
        );
        await CacheService.invalidateUserVfs(user.userId);
        return reply.send({ success: true, item: updated });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to rename item";
        return reply.status(400).send({ error: message });
      }
    },
  );

  // 3. Move to trash (Soft delete)
  fastify.delete(
    "/:id",
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const user = request.user as { userId: string };
      await VfsService.moveToTrash(user.userId, request.params.id);
      await CacheService.invalidateUserVfs(user.userId);
      return reply.send({ success: true });
    },
  );

  // 4. Restore from trash
  fastify.post(
    "/:id/restore",
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const user = request.user as { userId: string };
      await VfsService.restoreFromTrash(user.userId, request.params.id);
      await CacheService.invalidateUserVfs(user.userId);
      return reply.send({ success: true });
    },
  );

  // 5. Permanently delete (Reclaims cloud bytes)
  fastify.delete(
    "/:id/permanent",
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const user = request.user as { userId: string };
      await VfsService.permanentlyDelete(user.userId, request.params.id);
      await CacheService.invalidateUserVfs(user.userId);
      await CacheService.invalidateUserProviders(user.userId);
      return reply.send({ success: true });
    },
  );

  // 6. Toggle Starred / Favorite
  fastify.post(
    "/:id/star",
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body?: { starred?: boolean };
      }>,
      reply,
    ) => {
      const user = request.user as { userId: string };
      const [existing] = await db
        .select({ id: vfsNodes.id, starred: vfsNodes.starred })
        .from(vfsNodes)
        .where(
          and(
            eq(vfsNodes.id, request.params.id),
            eq(vfsNodes.userId, user.userId),
          ),
        );

      if (!existing) {
        return reply.status(404).send({ error: "Item not found" });
      }

      const nextStarred =
        request.body?.starred !== undefined
          ? !!request.body.starred
          : !existing.starred;

      const [node] = await db
        .update(vfsNodes)
        .set({ starred: nextStarred, updatedAt: new Date() })
        .where(
          and(
            eq(vfsNodes.id, request.params.id),
            eq(vfsNodes.userId, user.userId),
          ),
        )
        .returning();

      await CacheService.invalidateUserVfs(user.userId);
      return reply.send({ file: node, starred: nextStarred });
    },
  );

  fastify.patch(
    "/:id/star",
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body?: { starred?: boolean };
      }>,
      reply,
    ) => {
      const user = request.user as { userId: string };
      const [existing] = await db
        .select({ id: vfsNodes.id, starred: vfsNodes.starred })
        .from(vfsNodes)
        .where(
          and(
            eq(vfsNodes.id, request.params.id),
            eq(vfsNodes.userId, user.userId),
          ),
        );

      if (!existing) {
        return reply.status(404).send({ error: "Item not found" });
      }

      const nextStarred =
        request.body?.starred !== undefined
          ? !!request.body.starred
          : !existing.starred;

      const [node] = await db
        .update(vfsNodes)
        .set({ starred: nextStarred, updatedAt: new Date() })
        .where(
          and(
            eq(vfsNodes.id, request.params.id),
            eq(vfsNodes.userId, user.userId),
          ),
        )
        .returning();

      await CacheService.invalidateUserVfs(user.userId);
      return reply.send({ file: node, starred: nextStarred });
    },
  );

  // 7. FILE DOWNLOAD (High-speed direct CDN redirect or zero-memory stream)
  fastify.get(
    "/:id/download",
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Querystring: { info?: string; inline?: string };
      }>,
      reply,
    ) => {
      const user = request.user as { userId: string };
      const { id } = request.params;
      const { info, inline } = request.query;

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

      const streamUrl = `/files/${file.id}/download?inline=true`;

      // If single chunk (whole file)
      if (chunks.length === 1) {
        const single = chunks[0]!;
        let token: string;
        try {
          token = await TokenService.getValidAccessToken(
            single.providerIdentityId,
          );
        } catch (err: any) {
          return reply.status(401).send({
            error: `Storage provider (${single.provider}) connection expired. Please reconnect the account in Settings.`,
          });
        }
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
            streamUrl,
          });
        }

        // Stream bytes to client with proper Content-Disposition to ensure exact file size and name
        const cdnHeaders: Record<string, string> = {
          ...getProviderAuthHeaders(single.provider, token),
        };
        if (request.headers.range) {
          cdnHeaders["Range"] = request.headers.range;
        }

        const cdnRes = await fetch(directUrl, { headers: cdnHeaders });

        if (!cdnRes.ok || !cdnRes.body) {
          return reply.status(cdnRes.status || 502).send({
            error: `Failed to stream file from ${single.provider} (HTTP ${cdnRes.status})`,
          });
        }

        if (cdnRes.status === 206) {
          reply.status(206);
          const cr = cdnRes.headers.get("content-range");
          if (cr) reply.header("Content-Range", cr);
        }

        const isInline = inline === "true";
        reply.header("Accept-Ranges", "bytes");
        reply.header(
          "Content-Disposition",
          `${isInline ? "inline" : "attachment"}; filename="${encodeURIComponent(file.name)}"`,
        );
        reply.header(
          "Content-Type",
          file.mimeType || "application/octet-stream",
        );
        const actualLength =
          cdnRes.headers.get("content-length") ||
          (file.size ? file.size.toString() : null);
        if (actualLength) reply.header("Content-Length", actualLength);

        return reply.send(Readable.fromWeb(cdnRes.body as any));
      }

      // If multi-cloud chunked
      if (info === "true") {
        const chunkDownloads = [];
        for (const c of chunks.sort((a, b) => a.chunkIndex - b.chunkIndex)) {
          let token: string;
          try {
            token = await TokenService.getValidAccessToken(
              c.providerIdentityId,
            );
          } catch (err: any) {
            return reply.status(401).send({
              error: `Storage provider (${c.provider}) connection expired. Please reconnect the account in Settings.`,
            });
          }
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
          streamUrl,
          chunks: chunkDownloads,
        });
      }

      // Multi-chunk sequential stream
      const isInline = inline === "true";
      reply.header("Accept-Ranges", "bytes");
      reply.header(
        "Content-Disposition",
        `${isInline ? "inline" : "attachment"}; filename="${encodeURIComponent(file.name)}"`,
      );
      reply.header("Content-Type", file.mimeType || "application/octet-stream");
      if (file.size) reply.header("Content-Length", file.size.toString());

      const passThrough = new PassThrough();

      request.raw.on("close", () => {
        if (!passThrough.destroyed) {
          passThrough.destroy();
        }
      });

      (async () => {
        try {
          for (const c of chunks.sort((a, b) => a.chunkIndex - b.chunkIndex)) {
            if (passThrough.destroyed) break;

            const token = await TokenService.getValidAccessToken(
              c.providerIdentityId,
            );
            const adapter = getStorageAdapter(c.provider);
            const url = await adapter.getDownloadUrl({
              providerFileId: c.providerFileId,
              accessToken: token,
            });

            const headers: Record<string, string> = {
              ...getProviderAuthHeaders(c.provider, token),
            };

            const res = await fetch(url, { headers });
            if (!res.ok || !res.body) {
              throw new Error(
                `Failed to fetch chunk ${c.chunkIndex} from ${c.provider} (status: ${res.status})`,
              );
            }

            const reader = res.body.getReader();
            while (true) {
              if (passThrough.destroyed) break;
              const { done, value } = await reader.read();
              if (done) break;
              if (value) {
                const canContinue = passThrough.write(Buffer.from(value));
                if (!canContinue) {
                  await new Promise((resolve) =>
                    passThrough.once("drain", resolve),
                  );
                }
              }
            }
          }

          if (!passThrough.destroyed) {
            passThrough.end();
          }
        } catch (err: any) {
          console.error(
            `[Download Error] Failed streaming chunks for node ${file.id}:`,
            err,
          );
          passThrough.destroy(err);
        }
      })();

      return reply.send(passThrough);
    },
  );

  // 7b. FILE THUMBNAIL (Stream image or video preview with configurable local LRU cache and ETag 304 support)
  fastify.get(
    "/:id/thumbnail",
    async (
      request: FastifyRequest<{
        Params: { id: string };
      }>,
      reply,
    ) => {
      const user = request.user as { userId: string };
      const { id } = request.params;

      const [file] = await db
        .select()
        .from(vfsNodes)
        .where(and(eq(vfsNodes.id, id), eq(vfsNodes.userId, user.userId)));

      if (!file || file.type !== "file") {
        return reply.status(404).send({ error: "File not found" });
      }

      const ext = (file.name.split(".").pop() || "").toLowerCase();
      const mime = (file.mimeType || "").toLowerCase();
      const isImg =
        mime.startsWith("image/") ||
        ["png", "jpg", "jpeg", "webp", "gif", "svg", "bmp", "avif"].includes(
          ext,
        );
      const isVid =
        mime.startsWith("video/") ||
        ["mp4", "webm", "mov", "mkv", "m4v"].includes(ext);

      const versionTag = file.updatedAt
        ? file.updatedAt.getTime().toString()
        : "1";
      const etag = `"${file.id}-${versionTag}"`;

      // 1. HTTP 304 Not Modified validation (instant response, zero server bandwidth)
      if (request.headers["if-none-match"] === etag) {
        reply.header("ETag", etag);
        reply.header(
          "Cache-Control",
          "public, max-age=3600, stale-while-revalidate=86400",
        );
        return reply.status(304).send();
      }

      // 2. Check local disk LRU cache
      const cached = await ThumbnailCacheService.get(file.id, versionTag);
      if (cached) {
        reply.header("ETag", etag);
        reply.header(
          "Cache-Control",
          "public, max-age=3600, stale-while-revalidate=86400",
        );
        reply.header("Content-Type", cached.mimeType);
        reply.header("Content-Length", cached.size.toString());
        reply.header("Accept-Ranges", "bytes");
        reply.header("X-Cache-Status", "HIT");
        return reply.send(createReadStream(cached.filePath));
      }

      // 3. Cache Miss: Query file chunks from DB
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

      // Max item size allowed into disk cache to protect memory and storage on free servers (15 MB)
      const MAX_CACHEABLE_FILE_SIZE = 15 * 1024 * 1024;
      const contentType = file.mimeType || (isImg ? "image/jpeg" : "video/mp4");

      // Case A: Single chunk (whole file on one cloud provider)
      if (chunks.length === 1) {
        const single = chunks[0]!;
        let token: string;
        try {
          token = await TokenService.getValidAccessToken(
            single.providerIdentityId,
          );
        } catch (err: any) {
          return reply.status(424).send({
            error: "Storage provider connection expired or invalid",
            provider: single.provider,
            details: err?.message,
          });
        }
        const adapter = getStorageAdapter(single.provider);

        // 1. First attempt: Ask provider for a native lightweight thumbnail (works for videos, docs, and images)
        if (adapter.getThumbnail) {
          try {
            const nativeThumb = await adapter.getThumbnail({
              providerFileId: single.providerFileId,
              accessToken: token,
            });
            if (nativeThumb && nativeThumb.buffer.length > 0) {
              await ThumbnailCacheService.save(
                file.id,
                nativeThumb.buffer,
                nativeThumb.mimeType,
                versionTag,
              );

              reply.header("ETag", etag);
              reply.header(
                "Cache-Control",
                "public, max-age=3600, stale-while-revalidate=86400",
              );
              reply.header("Content-Type", nativeThumb.mimeType);
              reply.header(
                "Content-Length",
                nativeThumb.buffer.length.toString(),
              );
              reply.header("Accept-Ranges", "bytes");
              reply.header("X-Cache-Status", "MISS-CACHED");
              return reply.send(nativeThumb.buffer);
            }
          } catch (err: any) {
            console.warn(
              `[Thumbnail] Native thumbnail fetch failed on ${single.provider} for node ${file.id}:`,
              err?.message,
            );
          }
        }

        // 2. If not a media file (e.g. unsupported document/archive) and native thumbnail failed, return 404
        if (!isImg && !isVid) {
          return reply
            .status(404)
            .send({ error: "No thumbnail available for this file type" });
        }

        const directUrl = await adapter.getDownloadUrl({
          providerFileId: single.providerFileId,
          accessToken: token,
        });

        const cdnHeaders: Record<string, string> = {
          ...getProviderAuthHeaders(single.provider, token),
        };
        if (request.headers.range) {
          cdnHeaders["Range"] = request.headers.range;
        }

        const cdnRes = await fetch(directUrl, { headers: cdnHeaders });
        if (!cdnRes.ok || !cdnRes.body) {
          return reply.status(cdnRes.status || 502).send({
            error: "Failed to stream media thumbnail",
          });
        }

        const contentLength = cdnRes.headers.get("content-length")
          ? parseInt(cdnRes.headers.get("content-length")!, 10)
          : file.size || 0;

        // Cache image if whole file is within our safe size limit and not a partial range request
        if (
          !request.headers.range &&
          cdnRes.status === 200 &&
          isImg &&
          contentLength > 0 &&
          contentLength <= MAX_CACHEABLE_FILE_SIZE
        ) {
          const arrayBuf = await cdnRes.arrayBuffer();
          const buf = Buffer.from(arrayBuf);

          // Save thumbnail to configurable disk cache asynchronously
          await ThumbnailCacheService.save(
            file.id,
            buf,
            contentType,
            versionTag,
          );

          reply.header("ETag", etag);
          reply.header(
            "Cache-Control",
            "public, max-age=3600, stale-while-revalidate=86400",
          );
          reply.header("Content-Type", contentType);
          reply.header("Content-Length", buf.length.toString());
          reply.header("Accept-Ranges", "bytes");
          reply.header("X-Cache-Status", "MISS-CACHED");
          return reply.send(buf);
        }

        // Direct stream for video, range requests, or files exceeding MAX_CACHEABLE_FILE_SIZE
        reply.header("ETag", etag);
        reply.header(
          "Cache-Control",
          "public, max-age=86400, stale-while-revalidate=604800",
        );
        reply.header("Content-Type", contentType);
        reply.header("Accept-Ranges", "bytes");
        reply.header("X-Cache-Status", "BYPASS");

        if (cdnRes.status === 206) {
          reply.status(206);
          const cr = cdnRes.headers.get("content-range");
          if (cr) reply.header("Content-Range", cr);
        }
        const len =
          cdnRes.headers.get("content-length") ||
          (file.size ? file.size.toString() : null);
        if (len) reply.header("Content-Length", len);

        return reply.send(Readable.fromWeb(cdnRes.body as any));
      }

      // Case B: Multi-cloud chunked file
      const totalSize = file.size || 0;
      if (
        isImg &&
        totalSize > 0 &&
        totalSize <= MAX_CACHEABLE_FILE_SIZE &&
        !request.headers.range
      ) {
        try {
          const buffers: Buffer[] = [];
          for (const c of chunks.sort((a, b) => a.chunkIndex - b.chunkIndex)) {
            const token = await TokenService.getValidAccessToken(
              c.providerIdentityId,
            );
            const adapter = getStorageAdapter(c.provider);
            const url = await adapter.getDownloadUrl({
              providerFileId: c.providerFileId,
              accessToken: token,
            });
            const headers: Record<string, string> = {
              ...getProviderAuthHeaders(c.provider, token),
            };
            const res = await fetch(url, { headers });
            if (!res.ok) throw new Error(`Chunk ${c.chunkIndex} fetch failed`);
            const chunkBuf = Buffer.from(await res.arrayBuffer());
            buffers.push(chunkBuf);
          }
          const fullBuf = Buffer.concat(buffers);
          await ThumbnailCacheService.save(
            file.id,
            fullBuf,
            contentType,
            versionTag,
          );

          reply.header("ETag", etag);
          reply.header(
            "Cache-Control",
            "public, max-age=86400, stale-while-revalidate=604800",
          );
          reply.header("Content-Type", contentType);
          reply.header("Content-Length", fullBuf.length.toString());
          reply.header("Accept-Ranges", "bytes");
          reply.header("X-Cache-Status", "MISS-CACHED");
          return reply.send(fullBuf);
        } catch (err: any) {
          console.warn(
            "[Thumbnail] Multi-chunk buffering failed, falling back to sequential stream:",
            err?.message,
          );
        }
      }

      // Fallback: Multi-cloud sequential stream
      reply.header("ETag", etag);
      reply.header(
        "Cache-Control",
        "public, max-age=86400, stale-while-revalidate=604800",
      );
      reply.header("Content-Type", contentType);
      reply.header("Accept-Ranges", "bytes");
      reply.header("X-Cache-Status", "BYPASS");
      if (file.size) reply.header("Content-Length", file.size.toString());

      const passThrough = new PassThrough();
      request.raw.on("close", () => {
        if (!passThrough.destroyed) passThrough.destroy();
      });

      (async () => {
        try {
          for (const c of chunks.sort((a, b) => a.chunkIndex - b.chunkIndex)) {
            if (passThrough.destroyed) break;
            const token = await TokenService.getValidAccessToken(
              c.providerIdentityId,
            );
            const adapter = getStorageAdapter(c.provider);
            const url = await adapter.getDownloadUrl({
              providerFileId: c.providerFileId,
              accessToken: token,
            });
            const headers: Record<string, string> = {
              ...getProviderAuthHeaders(c.provider, token),
            };
            const res = await fetch(url, { headers });
            if (!res.ok || !res.body) break;
            const reader = res.body.getReader();
            while (true) {
              if (passThrough.destroyed) break;
              const { done, value } = await reader.read();
              if (done) break;
              if (value) passThrough.write(Buffer.from(value));
            }
          }
          if (!passThrough.destroyed) passThrough.end();
        } catch (err: any) {
          if (!passThrough.destroyed) passThrough.destroy(err);
        }
      })();

      return reply.send(passThrough);
    },
  );

  // 8. FILE DETAILS & CHUNK INSPECTOR
  fastify.get(
    "/:id/details",
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const user = request.user as { userId: string };
      const { id } = request.params;

      const cached = await CacheService.getFileDetails(user.userId, id);
      if (cached) {
        return reply.send(cached);
      }

      const [file] = await db
        .select()
        .from(vfsNodes)
        .where(and(eq(vfsNodes.id, id), eq(vfsNodes.userId, user.userId)));

      if (!file) return reply.status(404).send({ error: "File not found" });

      let parentName = "My Drive";
      if (file.parentId) {
        const [parent] = await db
          .select({ name: vfsNodes.name })
          .from(vfsNodes)
          .where(eq(vfsNodes.id, file.parentId));
        if (parent) {
          parentName = parent.name;
        }
      }

      const [owner] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, user.userId));

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

      const payload = {
        file: {
          ...file,
          parentName,
          ownerEmail: owner?.email || null,
        },
        chunks: chunks.sort((a, b) => a.chunkIndex - b.chunkIndex),
      };

      await CacheService.setFileDetails(user.userId, id, payload);
      return reply.send(payload);
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

  // 10. FILE SHARE ACCESS (Validate token & password, return chunked/whole download plan)
  fastify.get(
    "/share/:token",
    async (
      request: FastifyRequest<{
        Params: { token: string };
        Querystring: { password?: string };
      }>,
      reply: FastifyReply,
    ) => {
      const { token } = request.params;
      const { password } = request.query;
      const headerPassword = request.headers["x-share-password"] as
        | string
        | undefined;
      const passAttempt = password || headerPassword;

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
        if (!passAttempt) {
          return reply.send({
            isPasswordProtected: true,
            fileName: file.name,
            size: file.size,
            mimeType: file.mimeType,
          });
        }
        const matches = await bcrypt.compare(passAttempt, share.passwordHash);
        if (!matches) {
          return reply.status(401).send({
            isPasswordProtected: true,
            error: "Incorrect password",
            fileName: file.name,
            size: file.size,
            mimeType: file.mimeType,
          });
        }
      }

      // Fetch all chunks for this shared file
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
        .where(eq(fileChunks.vfsNodeId, file.id));

      if (chunks.length === 0) {
        return reply.status(404).send({ error: "File chunk data missing." });
      }

      if (chunks.length === 1) {
        const single = chunks[0]!;
        const accessToken = await TokenService.getValidAccessToken(
          single.providerIdentityId,
        );
        const adapter = getStorageAdapter(single.provider);
        const directUrl = await adapter.getDownloadUrl({
          providerFileId: single.providerFileId,
          accessToken,
        });

        return reply.send({
          isPasswordProtected: false,
          file: {
            id: file.id,
            name: file.name,
            size: file.size,
            mimeType: file.mimeType,
            createdAt: file.createdAt,
          },
          strategy: "whole",
          downloadUrl: directUrl,
          chunks: [
            {
              index: 0,
              byteStart: 0,
              byteEnd: file.size,
              downloadUrl: directUrl,
            },
          ],
        });
      }

      // Multi-chunk plan
      const chunkList = [];
      for (const c of chunks.sort((a, b) => a.chunkIndex - b.chunkIndex)) {
        const accessToken = await TokenService.getValidAccessToken(
          c.providerIdentityId,
        );
        const adapter = getStorageAdapter(c.provider);
        const url = await adapter.getDownloadUrl({
          providerFileId: c.providerFileId,
          accessToken,
        });

        chunkList.push({
          index: c.chunkIndex,
          byteStart: c.byteStart,
          byteEnd: c.byteEnd,
          downloadUrl: url,
        });
      }

      return reply.send({
        isPasswordProtected: false,
        file: {
          id: file.id,
          name: file.name,
          size: file.size,
          mimeType: file.mimeType,
          createdAt: file.createdAt,
        },
        strategy: "chunked",
        chunks: chunkList,
      });
    },
  );

  // 11. FILE SHARE DOWNLOAD STREAM (Public stream fallback for shares)
  fastify.get(
    "/share/:token/download",
    async (
      request: FastifyRequest<{
        Params: { token: string };
        Querystring: { password?: string; info?: string };
      }>,
      reply: FastifyReply,
    ) => {
      const { token } = request.params;
      const { password, info } = request.query;

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

      if (share.passwordHash) {
        if (!password) {
          return reply.status(401).send({ error: "Password required" });
        }
        const matches = await bcrypt.compare(password, share.passwordHash);
        if (!matches) {
          return reply.status(401).send({ error: "Incorrect password" });
        }
      }

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
        .where(eq(fileChunks.vfsNodeId, file.id));

      if (chunks.length === 0) {
        return reply.status(404).send({ error: "File chunks missing" });
      }

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

        if (info === "true") {
          return reply.send({
            strategy: "whole",
            fileName: file.name,
            mimeType: file.mimeType,
            size: file.size,
            downloadUrl: directUrl,
          });
        }

        const cdnRes = await fetch(directUrl, {
          headers: getProviderAuthHeaders(single.provider, token),
        });

        if (!cdnRes.ok || !cdnRes.body) {
          return reply.status(502).send({
            error: `Failed to stream file from ${single.provider} (HTTP ${cdnRes.status})`,
          });
        }

        reply.header(
          "Content-Disposition",
          `attachment; filename="${encodeURIComponent(file.name)}"`,
        );
        reply.header(
          "Content-Type",
          file.mimeType || "application/octet-stream",
        );
        const actualLength =
          cdnRes.headers.get("content-length") ||
          (file.size ? file.size.toString() : null);
        if (actualLength) reply.header("Content-Length", actualLength);

        return reply.send(Readable.fromWeb(cdnRes.body as any));
      }

      // Multi-chunk sequential stream
      reply.header(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(file.name)}"`,
      );
      reply.header("Content-Type", file.mimeType || "application/octet-stream");
      if (file.size) reply.header("Content-Length", file.size.toString());

      const passThrough = new PassThrough();

      request.raw.on("close", () => {
        if (!passThrough.destroyed) {
          passThrough.destroy();
        }
      });

      (async () => {
        try {
          for (const c of chunks.sort((a, b) => a.chunkIndex - b.chunkIndex)) {
            if (passThrough.destroyed) break;

            const token = await TokenService.getValidAccessToken(
              c.providerIdentityId,
            );
            const adapter = getStorageAdapter(c.provider);
            const url = await adapter.getDownloadUrl({
              providerFileId: c.providerFileId,
              accessToken: token,
            });

            const headers: Record<string, string> = {
              ...getProviderAuthHeaders(c.provider, token),
            };

            const res = await fetch(url, { headers });
            if (!res.ok || !res.body) {
              throw new Error(
                `Failed to fetch chunk ${c.chunkIndex} from ${c.provider} (status: ${res.status})`,
              );
            }

            const reader = res.body.getReader();
            while (true) {
              if (passThrough.destroyed) break;
              const { done, value } = await reader.read();
              if (done) break;
              if (value) {
                const canContinue = passThrough.write(Buffer.from(value));
                if (!canContinue) {
                  await new Promise((resolve) =>
                    passThrough.once("drain", resolve),
                  );
                }
              }
            }
          }

          if (!passThrough.destroyed) {
            passThrough.end();
          }
        } catch (err: any) {
          console.error(
            `[Share Download Error] Failed streaming chunks for node ${file.id}:`,
            err,
          );
          passThrough.destroy(err);
        }
      })();

      return reply.send(passThrough);
    },
  );
}

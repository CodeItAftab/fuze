import { db, vfsNodes, fileChunks, providerIdentities } from "../db/index.js";
import { eq, and, isNull, isNotNull } from "drizzle-orm";
import { TokenService } from "./token.service.js";
import { GoogleDriveAdapter } from "../adapters/gdrive.adapter.js";
import { socketManager } from "../websocket/socket-manager.js";
import { getStorageAdapter } from "../adapters/factory.js";

export class VfsService {
  static async listChildren(userId: string, parentId: string | null = null) {
    const parentCondition = parentId
      ? eq(vfsNodes.parentId, parentId)
      : isNull(vfsNodes.parentId);

    return db
      .select()
      .from(vfsNodes)
      .where(
        and(
          eq(vfsNodes.userId, userId),
          parentCondition,
          isNull(vfsNodes.trashedAt),
        ),
      );
  }

  static async listTrash(userId: string) {
    return db
      .select()
      .from(vfsNodes)
      .where(
        and(
          eq(vfsNodes.userId, userId),
          isNotNull(vfsNodes.trashedAt),
        ),
      );
  }

  static async createFolder(
    userId: string,
    name: string,
    parentId: string | null = null,
  ) {
    const [folder] = await db
      .insert(vfsNodes)
      .values({
        userId,
        name,
        type: "folder",
        parentId,
      })
      .returning();

    socketManager.broadcastToUser(userId, {
      type: "FILE_CREATED",
      payload: folder,
    });
    return folder;
  }

  static async moveToTrash(userId: string, nodeId: string) {
    const [node] = await db
      .update(vfsNodes)
      .set({ trashedAt: new Date() })
      .where(and(eq(vfsNodes.id, nodeId), eq(vfsNodes.userId, userId)))
      .returning();

    socketManager.broadcastToUser(userId, {
      type: "FILE_DELETED",
      payload: { id: nodeId },
    });
    return node;
  }

  static async restoreFromTrash(userId: string, nodeId: string) {
    const [node] = await db
      .update(vfsNodes)
      .set({ trashedAt: null })
      .where(and(eq(vfsNodes.id, nodeId), eq(vfsNodes.userId, userId)))
      .returning();

    socketManager.broadcastToUser(userId, {
      type: "FILE_CREATED",
      payload: node,
    });
    return node;
  }

  /**
   * Permanent Delete: Free cloud quota first, then purge database row.
   */
  static async permanentlyDelete(userId: string, nodeId: string) {
    // 1. Fetch file chunks along with their provider type
    const chunks = await db
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
      .where(eq(fileChunks.vfsNodeId, nodeId));
    // 2. Delete bytes from respective cloud providers dynamically
    for (const chunk of chunks) {
      try {
        const accessToken = await TokenService.getValidAccessToken(
          chunk.providerIdentityId,
        );
        const adapter = getStorageAdapter(chunk.provider);
        await adapter.deleteFile({
          providerFileId: chunk.providerFileId,
          accessToken,
        });
      } catch (err) {
        console.error(
          `Failed to delete chunk ${chunk.providerFileId} from ${chunk.provider}:`,
          err,
        );
      }
    }
    // 3. Delete database row (cascades to file_chunks)
    await db
      .delete(vfsNodes)
      .where(and(eq(vfsNodes.id, nodeId), eq(vfsNodes.userId, userId)));
    socketManager.broadcastToUser(userId, {
      type: "FILE_DELETED",
      payload: { id: nodeId },
    });
  }
}

import {
  db,
  vfsNodes,
  fileChunks,
  providerIdentities,
  uploadSessions,
  uploadChunks,
} from "../db/index.js";
import { eq, and, isNull, isNotNull, inArray } from "drizzle-orm";
import { TokenService } from "./token.service.js";
import { socketManager } from "../websocket/socket-manager.js";
import { getStorageAdapter } from "../adapters/factory.js";
import { ThumbnailCacheService } from "./thumbnail-cache.service.js";

export class VfsService {
  static async listChildren(userId: string, parentId: string | null = null) {
    const parentCondition = parentId
      ? eq(vfsNodes.parentId, parentId)
      : isNull(vfsNodes.parentId);

    const nodes = await db
      .select()
      .from(vfsNodes)
      .where(
        and(
          eq(vfsNodes.userId, userId),
          parentCondition,
          isNull(vfsNodes.trashedAt),
        ),
      );

    const fileIds = nodes.filter((n) => n.type === "file").map((n) => n.id);
    const chunksByFile = new Map<string, Array<{ provider: string }>>();

    const activeFileIds = new Set<string>();
    const trackedFileIds = new Set<string>();

    if (fileIds.length > 0) {
      const chunks = await db
        .select({
          vfsNodeId: fileChunks.vfsNodeId,
          provider: providerIdentities.provider,
          isDisconnected: providerIdentities.isDisconnected,
        })
        .from(fileChunks)
        .innerJoin(
          providerIdentities,
          eq(fileChunks.providerIdentityId, providerIdentities.id),
        )
        .where(inArray(fileChunks.vfsNodeId, fileIds));

      for (const c of chunks) {
        trackedFileIds.add(c.vfsNodeId);
        if (!c.isDisconnected) {
          activeFileIds.add(c.vfsNodeId);
        }
        if (!chunksByFile.has(c.vfsNodeId)) {
          chunksByFile.set(c.vfsNodeId, []);
        }
        chunksByFile.get(c.vfsNodeId)!.push({ provider: c.provider });
      }
    }

    // Filter out files whose storage providers are currently disconnected
    const visibleNodes = nodes.filter(
      (n) =>
        n.type === "folder" ||
        activeFileIds.has(n.id) ||
        !trackedFileIds.has(n.id),
    );

    const items = visibleNodes.map((node) => {
      if (node.type === "folder") {
        return { ...node, providerBadge: null };
      }
      const chunks = chunksByFile.get(node.id) || [];
      let providerBadge = "Zero-Proxy Cloud";
      if (chunks.length === 1) {
        const prov = chunks[0].provider;
        const nameMap: Record<string, string> = {
          google_drive: "Google Drive (Whole)",
          one_drive: "OneDrive (Whole)",
          dropbox: "Dropbox (Whole)",
          pcloud: "pCloud (Whole)",
          box: "Box (Whole)",
        };
        providerBadge = nameMap[prov] || `${prov} (Whole)`;
      } else if (chunks.length > 1) {
        const unique = new Set(chunks.map((c) => c.provider));
        providerBadge = `Multi-Cloud (${unique.size} Providers)`;
      }
      return {
        ...node,
        providerBadge,
      };
    });

    return items;
  }

  static async getBreadcrumbs(userId: string, folderId: string | null = null) {
    if (!folderId) {
      return [{ id: null, name: "My Drive" }];
    }

    const crumbs: Array<{ id: string | null; name: string }> = [];
    let currId: string | null = folderId;
    const visited = new Set<string>();

    while (currId && !visited.has(currId)) {
      visited.add(currId);
      const [node] = await db
        .select({
          id: vfsNodes.id,
          name: vfsNodes.name,
          parentId: vfsNodes.parentId,
        })
        .from(vfsNodes)
        .where(and(eq(vfsNodes.id, currId), eq(vfsNodes.userId, userId)));

      if (!node) break;
      crumbs.unshift({ id: node.id, name: node.name });
      currId = node.parentId;
    }

    return [{ id: null, name: "My Drive" }, ...crumbs];
  }

  static async listTrash(userId: string) {
    return db
      .select()
      .from(vfsNodes)
      .where(and(eq(vfsNodes.userId, userId), isNotNull(vfsNodes.trashedAt)));
  }

  /**
   * Resolves a non-conflicting unique name for a file or folder in a directory.
   * If "README.md" already exists, returns "README (1).md", "README (2).md", etc.
   */
  static async resolveUniqueName(
    userId: string,
    parentId: string | null = null,
    desiredName: string,
  ): Promise<string> {
    const trimmed = desiredName.trim();
    if (!trimmed) return "Untitled";

    const parentCondition = parentId
      ? eq(vfsNodes.parentId, parentId)
      : isNull(vfsNodes.parentId);

    const existingNodes = await db
      .select({ name: vfsNodes.name })
      .from(vfsNodes)
      .where(
        and(
          eq(vfsNodes.userId, userId),
          parentCondition,
          isNull(vfsNodes.trashedAt),
        ),
      );

    const existingNames = new Set(
      existingNodes.map((n) => n.name.toLowerCase()),
    );

    if (!existingNames.has(trimmed.toLowerCase())) {
      return trimmed;
    }

    const lastDotIndex = trimmed.lastIndexOf(".");
    const baseName =
      lastDotIndex > 0 ? trimmed.slice(0, lastDotIndex) : trimmed;
    const ext = lastDotIndex > 0 ? trimmed.slice(lastDotIndex) : "";

    let counter = 1;
    while (counter < 1000) {
      const candidate = `${baseName} (${counter})${ext}`;
      if (!existingNames.has(candidate.toLowerCase())) {
        return candidate;
      }
      counter++;
    }

    return `${baseName} (${Date.now()})${ext}`;
  }

  static async createFolder(
    userId: string,
    name: string,
    parentId: string | null = null,
  ) {
    const resolvedName = await this.resolveUniqueName(userId, parentId, name);

    const [folder] = await db
      .insert(vfsNodes)
      .values({
        userId,
        name: resolvedName,
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

  static async getSubtreeNodeIds(
    userId: string,
    rootId: string,
  ): Promise<string[]> {
    const result: string[] = [rootId];
    let currentLevel = [rootId];

    while (currentLevel.length > 0) {
      const children = await db
        .select({ id: vfsNodes.id })
        .from(vfsNodes)
        .where(
          and(
            eq(vfsNodes.userId, userId),
            inArray(vfsNodes.parentId, currentLevel),
          ),
        );

      if (children.length === 0) break;
      const childIds = children.map((c) => c.id);
      result.push(...childIds);
      currentLevel = childIds;
    }

    return result;
  }

  /**
   * Permanent Delete: Free cloud quota first across subtree, then purge database row.
   */
  static async permanentlyDelete(userId: string, nodeId: string) {
    const allNodeIds = await this.getSubtreeNodeIds(userId, nodeId);

    // 1. Clean up or decouple any upload_sessions referencing any nodes in this subtree
    await db
      .update(uploadSessions)
      .set({ parentId: null })
      .where(inArray(uploadSessions.parentId, allNodeIds));

    // 2. Fetch all file chunks across all affected nodes
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
      .where(inArray(fileChunks.vfsNodeId, allNodeIds));

    // 3. Delete bytes from respective cloud providers dynamically
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

    // 4. Delete database row (cascades to child vfs_nodes and file_chunks)
    await db
      .delete(vfsNodes)
      .where(and(eq(vfsNodes.id, nodeId), eq(vfsNodes.userId, userId)));

    for (const id of allNodeIds) {
      void ThumbnailCacheService.delete(id);
      socketManager.broadcastToUser(userId, {
        type: "FILE_DELETED",
        payload: { id },
      });
    }
  }

  static async batchRestore(userId: string, nodeIds: string[]) {
    if (nodeIds.length === 0) return [];
    const nodes = await db
      .update(vfsNodes)
      .set({ trashedAt: null })
      .where(and(inArray(vfsNodes.id, nodeIds), eq(vfsNodes.userId, userId)))
      .returning();

    for (const node of nodes) {
      socketManager.broadcastToUser(userId, {
        type: "FILE_CREATED",
        payload: node,
      });
    }
    return nodes;
  }

  static async batchPermanentlyDelete(userId: string, nodeIds: string[]) {
    for (const id of nodeIds) {
      await this.permanentlyDelete(userId, id);
    }
  }

  static async emptyTrash(userId: string) {
    const trashed = await this.listTrash(userId);
    for (const item of trashed) {
      await this.permanentlyDelete(userId, item.id);
    }
    return { count: trashed.length };
  }

  static async listStarred(userId: string) {
    const nodes = await db
      .select()
      .from(vfsNodes)
      .where(
        and(
          eq(vfsNodes.userId, userId),
          eq(vfsNodes.starred, true),
          isNull(vfsNodes.trashedAt),
        ),
      );

    const fileIds = nodes.filter((n) => n.type === "file").map((n) => n.id);
    const chunksByFile = new Map<string, Array<{ provider: string }>>();

    if (fileIds.length > 0) {
      const chunks = await db
        .select({
          vfsNodeId: fileChunks.vfsNodeId,
          provider: providerIdentities.provider,
        })
        .from(fileChunks)
        .innerJoin(
          providerIdentities,
          eq(fileChunks.providerIdentityId, providerIdentities.id),
        )
        .where(inArray(fileChunks.vfsNodeId, fileIds));

      for (const c of chunks) {
        if (!chunksByFile.has(c.vfsNodeId)) {
          chunksByFile.set(c.vfsNodeId, []);
        }
        chunksByFile.get(c.vfsNodeId)!.push({ provider: c.provider });
      }
    }

    const items = nodes.map((node) => {
      if (node.type === "folder") {
        return { ...node, providerBadge: null };
      }
      const chunks = chunksByFile.get(node.id) || [];
      let providerBadge = "Zero-Proxy Cloud";
      if (chunks.length === 1) {
        const prov = chunks[0].provider;
        const nameMap: Record<string, string> = {
          google_drive: "Google Drive (Whole)",
          one_drive: "OneDrive (Whole)",
          dropbox: "Dropbox (Whole)",
          pcloud: "pCloud (Whole)",
          box: "Box (Whole)",
        };
        providerBadge = nameMap[prov] || `${prov} (Whole)`;
      } else if (chunks.length > 1) {
        const unique = new Set(chunks.map((c) => c.provider));
        providerBadge = `Multi-Cloud (${unique.size} Providers)`;
      }
      return {
        ...node,
        providerBadge,
      };
    });

    return items;
  }

  static async moveNodes(
    userId: string,
    nodeIds: string[],
    targetParentId: string | null,
  ) {
    if (targetParentId) {
      const [targetFolder] = await db
        .select()
        .from(vfsNodes)
        .where(
          and(
            eq(vfsNodes.id, targetParentId),
            eq(vfsNodes.userId, userId),
            isNull(vfsNodes.trashedAt),
          ),
        );
      if (!targetFolder || targetFolder.type !== "folder") {
        throw new Error("Target folder not found or is not a valid folder.");
      }
    }

    for (const id of nodeIds) {
      if (id === targetParentId) {
        throw new Error("Cannot move a folder into itself.");
      }
      if (targetParentId) {
        let curr: string | null = targetParentId;
        const visited = new Set<string>();
        while (curr && !visited.has(curr)) {
          if (curr === id) {
            throw new Error("Cannot move a folder into its own subfolder.");
          }
          visited.add(curr);
          const [parent] = await db
            .select({ parentId: vfsNodes.parentId })
            .from(vfsNodes)
            .where(and(eq(vfsNodes.id, curr), eq(vfsNodes.userId, userId)));
          curr = parent ? parent.parentId : null;
        }
      }
    }

    const updated = await db
      .update(vfsNodes)
      .set({ parentId: targetParentId, updatedAt: new Date() })
      .where(and(inArray(vfsNodes.id, nodeIds), eq(vfsNodes.userId, userId)))
      .returning();

    return updated;
  }

  static async renameNode(userId: string, nodeId: string, newName: string) {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      throw new Error("Name cannot be empty");
    }

    // 1. Fetch current node
    const [node] = await db
      .select()
      .from(vfsNodes)
      .where(and(eq(vfsNodes.id, nodeId), eq(vfsNodes.userId, userId)));

    if (!node) {
      throw new Error("Item not found");
    }

    if (node.name === trimmedName) {
      return node;
    }

    // 2. Check for duplicate name in same directory
    const existingSameName = await db
      .select({ id: vfsNodes.id })
      .from(vfsNodes)
      .where(
        and(
          eq(vfsNodes.userId, userId),
          node.parentId
            ? eq(vfsNodes.parentId, node.parentId)
            : isNull(vfsNodes.parentId),
          eq(vfsNodes.name, trimmedName),
          isNull(vfsNodes.trashedAt),
        ),
      );

    if (existingSameName.length > 0) {
      throw new Error(
        `An item named "${trimmedName}" already exists in this folder.`,
      );
    }

    // 3. Update name in VFS
    const [updated] = await db
      .update(vfsNodes)
      .set({ name: trimmedName, updatedAt: new Date() })
      .where(and(eq(vfsNodes.id, nodeId), eq(vfsNodes.userId, userId)))
      .returning();

    // 4. If this is a file, propagate the new name to cloud providers
    if (node.type === "file") {
      try {
        const chunks = await db
          .select({
            id: fileChunks.id,
            chunkIndex: fileChunks.chunkIndex,
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

        const isWhole = chunks.length === 1;

        for (const chunk of chunks) {
          try {
            const accessToken = await TokenService.getValidAccessToken(
              chunk.providerIdentityId,
            );
            const adapter = getStorageAdapter(chunk.provider);
            if (adapter.renameFile) {
              const targetChunkName = isWhole
                ? trimmedName
                : `${trimmedName}.part${chunk.chunkIndex}`;

              const newProviderFileId = await adapter.renameFile({
                providerFileId: chunk.providerFileId,
                newName: targetChunkName,
                accessToken,
              });

              // If provider returns an updated file identifier / path (e.g. Dropbox path)
              if (
                newProviderFileId &&
                typeof newProviderFileId === "string" &&
                newProviderFileId !== chunk.providerFileId
              ) {
                await db
                  .update(fileChunks)
                  .set({ providerFileId: newProviderFileId })
                  .where(eq(fileChunks.id, chunk.id));
              }
            }
          } catch (providerErr) {
            console.warn(
              `[VfsService] Provider rename failed for chunk ${chunk.chunkIndex} (${chunk.provider}):`,
              providerErr,
            );
          }
        }
      } catch (err) {
        console.warn("[VfsService] Failed to sync rename with providers:", err);
      }
    }

    // 5. Broadcast real-time update
    socketManager.broadcastToUser(userId, {
      type: "FILE_RENAMED",
      payload: updated,
    });

    return updated;
  }

  /**
   * Purges all user data across VFS and (optionally) cloud providers.
   * If deleteCloudFiles is true, physically deletes all files and chunks
   * from Google Drive, OneDrive, Dropbox, Box, and pCloud before database cascading.
   */
  static async purgeAllUserData(userId: string, deleteCloudFiles = false) {
    // 1. Fetch all user nodes to clear disk thumbnail cache
    const userNodes = await db
      .select({ id: vfsNodes.id })
      .from(vfsNodes)
      .where(eq(vfsNodes.userId, userId));

    for (const node of userNodes) {
      void ThumbnailCacheService.delete(node.id);
    }

    // 2. If user requested cloud deletion, remove all chunks from providers
    if (deleteCloudFiles) {
      // 2a. Finalized file chunks
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
        .innerJoin(vfsNodes, eq(fileChunks.vfsNodeId, vfsNodes.id))
        .where(eq(vfsNodes.userId, userId));

      // 2b. Unfinalized upload chunks with a valid providerFileId
      const abandonedUploadChunks = await db
        .select({
          providerFileId: uploadChunks.providerFileId,
          providerIdentityId: uploadChunks.providerIdentityId,
          provider: providerIdentities.provider,
        })
        .from(uploadChunks)
        .innerJoin(
          uploadSessions,
          eq(uploadChunks.uploadSessionId, uploadSessions.id),
        )
        .innerJoin(
          providerIdentities,
          eq(uploadChunks.providerIdentityId, providerIdentities.id),
        )
        .where(
          and(
            eq(uploadSessions.userId, userId),
            isNotNull(uploadChunks.providerFileId),
          ),
        );

      const allItemsToDelete = [
        ...chunks.map((c) => ({
          providerFileId: c.providerFileId,
          providerIdentityId: c.providerIdentityId,
          provider: c.provider,
        })),
        ...abandonedUploadChunks
          .filter((c) => c.providerFileId)
          .map((c) => ({
            providerFileId: c.providerFileId!,
            providerIdentityId: c.providerIdentityId,
            provider: c.provider,
          })),
      ];

      // Pre-fetch tokens per provider identity
      const tokenMap = new Map<string, string>();
      for (const item of allItemsToDelete) {
        if (!tokenMap.has(item.providerIdentityId)) {
          try {
            const token = await TokenService.getValidAccessToken(
              item.providerIdentityId,
            );
            tokenMap.set(item.providerIdentityId, token);
          } catch (tokenErr) {
            console.warn(
              `[VfsService] Token retrieval failed for identity ${item.providerIdentityId}:`,
              tokenErr,
            );
          }
        }
      }

      // Delete in parallel batches of 5
      const BATCH_SIZE = 5;
      for (let i = 0; i < allItemsToDelete.length; i += BATCH_SIZE) {
        const batch = allItemsToDelete.slice(i, i + BATCH_SIZE);
        await Promise.allSettled(
          batch.map(async (item) => {
            const accessToken = tokenMap.get(item.providerIdentityId);
            if (!accessToken) return;
            try {
              const adapter = getStorageAdapter(item.provider);
              await adapter.deleteFile({
                providerFileId: item.providerFileId,
                accessToken,
              });
            } catch (delErr) {
              console.warn(
                `[VfsService] Failed to delete file ${item.providerFileId} from ${item.provider}:`,
                delErr,
              );
            }
          }),
        );
      }
    }
  }
}

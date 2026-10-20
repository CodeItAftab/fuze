import { db, providerIdentities, fileChunks, vfsNodes } from "../db/index.js";
import { eq, and, isNull } from "drizzle-orm";
import { getStorageAdapter } from "../adapters/factory.js";
import { TokenService } from "./token.service.js";
import { socketManager } from "../websocket/socket-manager.js";

export class ProviderSyncService {
  /**
   * Scans the native /Fuze directory on a connected cloud provider and
   * restores any files that exist in the cloud but are missing from Fuze VFS.
   */
  static async syncFiles(
    userId: string,
    providerIdentityId: string,
  ): Promise<{ discovered: number; restored: number }> {
    const [identity] = await db
      .select()
      .from(providerIdentities)
      .where(
        and(
          eq(providerIdentities.id, providerIdentityId),
          eq(providerIdentities.userId, userId),
        ),
      );

    if (!identity) {
      throw new Error("Provider not found");
    }

    const adapter = getStorageAdapter(identity.provider);
    if (!adapter.listFiles) {
      return { discovered: 0, restored: 0 };
    }

    const accessToken = await TokenService.getValidAccessToken(identity.id);
    const remoteFiles = await adapter.listFiles(accessToken);

    if (remoteFiles.length === 0) {
      return { discovered: 0, restored: 0 };
    }

    // Get all tracked providerFileIds for this provider
    const existingChunks = await db
      .select({
        providerFileId: fileChunks.providerFileId,
        vfsNodeId: fileChunks.vfsNodeId,
      })
      .from(fileChunks)
      .where(eq(fileChunks.providerIdentityId, identity.id));

    const existingFileIds = new Set(
      existingChunks.map((c) => c.providerFileId.toLowerCase()),
    );

    let restored = 0;

    for (const remoteFile of remoteFiles) {
      const fileIdNormalized = remoteFile.providerFileId.toLowerCase();
      // Skip if already tracked
      if (existingFileIds.has(fileIdNormalized)) {
        continue;
      }

      // Skip multipart chunks (.part0, .part1, etc.) for now to prevent incomplete files
      if (/\.part\d+(\.[^.]+)?$/i.test(remoteFile.fileName)) {
        continue;
      }

      // Clean session suffix (e.g. Document_3e64ea72.pdf -> Document.pdf)
      const cleanName = remoteFile.fileName.replace(
        /_[a-f0-9]{8}(\.[^.]+)$/i,
        "$1",
      );

      // Check if node already exists with same name and size
      let [existingNode] = await db
        .select()
        .from(vfsNodes)
        .where(
          and(
            eq(vfsNodes.userId, userId),
            eq(vfsNodes.name, cleanName),
            isNull(vfsNodes.parentId),
            isNull(vfsNodes.trashedAt),
          ),
        );

      let nodeId = existingNode?.id;

      if (!nodeId) {
        const [newNode] = await db
          .insert(vfsNodes)
          .values({
            userId,
            name: cleanName,
            type: "file",
            size: remoteFile.size,
            mimeType: "application/octet-stream",
          })
          .returning();
        nodeId = newNode.id;
      }

      // Create file chunk mapping
      await db.insert(fileChunks).values({
        vfsNodeId: nodeId,
        providerIdentityId: identity.id,
        providerFileId: remoteFile.providerFileId,
        chunkIndex: 0,
        byteStart: 0,
        byteEnd: remoteFile.size,
        chunkHash: "synced_from_cloud",
      });

      existingFileIds.add(fileIdNormalized);
      restored++;
    }

    if (restored > 0) {
      socketManager.broadcastToUser(userId, {
        type: "FILE_CREATED",
        payload: { action: "sync", count: restored },
      });
      console.log(
        `[ProviderSync] ✅ Restored ${restored} file(s) from ${identity.provider} into Fuze VFS.`,
      );
    }

    return {
      discovered: remoteFiles.length,
      restored,
    };
  }
}

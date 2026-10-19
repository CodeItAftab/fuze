import { db, providerIdentities, fileChunks, vfsNodes } from "../db/index.js";
import { eq, sql } from "drizzle-orm";
import { getStorageAdapter } from "../adapters/factory.js";
import { TokenService } from "./token.service.js";
import { socketManager } from "../websocket/socket-manager.js";

export class CascadePurgeService {
  static async purgeUnsalvageableFile(
    userId: string,
    vfsNodeId: string,
    excludeProviderIdentityId?: string,
  ): Promise<void> {
    const chunks = await db
      .select({
        id: fileChunks.id,
        providerIdentityId: fileChunks.providerIdentityId,
        providerFileId: fileChunks.providerFileId,
        byteStart: fileChunks.byteStart,
        byteEnd: fileChunks.byteEnd,
      })
      .from(fileChunks)
      .where(eq(fileChunks.vfsNodeId, vfsNodeId));

    if (chunks.length === 0) {
      await db.delete(vfsNodes).where(eq(vfsNodes.id, vfsNodeId));
      return;
    }

    console.warn(
      `[CascadePurge] Purging ${chunks.length} orphan chunk(s) for unsalvageable VFS file [${vfsNodeId}]...`,
    );

    for (const chunk of chunks) {
      if (
        excludeProviderIdentityId &&
        chunk.providerIdentityId === excludeProviderIdentityId
      ) {
        continue;
      }

      const chunkSize = chunk.byteEnd - chunk.byteStart;

      try {
        const [identity] = await db
          .select({
            id: providerIdentities.id,
            provider: providerIdentities.provider,
          })
          .from(providerIdentities)
          .where(eq(providerIdentities.id, chunk.providerIdentityId));

        if (identity) {
          const adapter = getStorageAdapter(identity.provider);
          const accessToken = await TokenService.getValidAccessToken(
            identity.id,
          );
          await adapter.deleteFile({
            providerFileId: chunk.providerFileId,
            accessToken,
          });
          console.log(
            `[CascadePurge] ✓ Deleted sibling chunk [${chunk.providerFileId}] from ${identity.provider}`,
          );
        }
      } catch (err: any) {
        console.warn(
          `[CascadePurge] ⚠️ Failed deleting sibling chunk:`,
          err?.message,
        );
      }

      try {
        await db
          .update(providerIdentities)
          .set({
            quotaUsed: sql`GREATEST(0, ${providerIdentities.quotaUsed} - ${chunkSize})`,
          })
          .where(eq(providerIdentities.id, chunk.providerIdentityId));
      } catch (err: any) {
        console.warn(`[CascadePurge] Failed to update quota:`, err?.message);
      }
    }

    await db.delete(fileChunks).where(eq(fileChunks.vfsNodeId, vfsNodeId));
    await db.delete(vfsNodes).where(eq(vfsNodes.id, vfsNodeId));

    socketManager.broadcastToUser(userId, {
      type: "FILE_DELETED",
      payload: { id: vfsNodeId },
    });

    console.log(
      `[CascadePurge] ✅ Successfully purged VFS file [${vfsNodeId}] and reclaimed quota.`,
    );
  }
}

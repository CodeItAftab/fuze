import { db, providerIdentities, fileChunks, vfsNodes } from "../db/index.js";
import { eq, and, ne, inArray } from "drizzle-orm";

export interface DisconnectPreviewResult {
  provider: string;
  accountEmail: string | null;
  totalBytesOnProvider: number;
  affectedFilesCount: number;
  wholeFilesCount: number;
  chunkedFilesCount: number;
  affectedFiles: Array<{
    id: string;
    name: string;
    size: number;
    strategy: "whole" | "chunked";
  }>;
  canMigrate: boolean;
  remainingFreeBytes: number;
  otherProvidersCount: number;
}

export class ProviderCleanupService {
  /**
   * Pre-flight Check: Calculates exactly which files are affected,
   * categorizes them into whole vs. chunked, and verifies if remaining
   * cloud accounts have enough free space to absorb the bytes.
   */
  static async getDisconnectPreview(
    userId: string,
    providerIdentityId: string,
  ): Promise<DisconnectPreviewResult> {
    const [targetProvider] = await db
      .select()
      .from(providerIdentities)
      .where(
        and(
          eq(providerIdentities.id, providerIdentityId),
          eq(providerIdentities.userId, userId),
        ),
      );

    if (!targetProvider) {
      throw new Error("Storage provider not found");
    }

    // 1. Fetch all chunks stored on this provider
    const chunksOnProvider = await db
      .select({
        chunkId: fileChunks.id,
        vfsNodeId: fileChunks.vfsNodeId,
        start: fileChunks.byteStart,
        end: fileChunks.byteEnd,
      })
      .from(fileChunks)
      .where(eq(fileChunks.providerIdentityId, providerIdentityId));

    const totalBytesOnProvider = chunksOnProvider.reduce(
      (sum, c) => sum + (Number(c.end) - Number(c.start)),
      0,
    );

    // 2. Fetch affected VFS files
    const affectedNodeIds = Array.from(
      new Set(chunksOnProvider.map((c) => c.vfsNodeId)),
    );

    let affectedFiles: Array<{
      id: string;
      name: string;
      size: number;
      strategy: "whole" | "chunked";
    }> = [];

    let wholeFilesCount = 0;
    let chunkedFilesCount = 0;

    if (affectedNodeIds.length > 0) {
      const nodes = await db
        .select({ id: vfsNodes.id, name: vfsNodes.name, size: vfsNodes.size })
        .from(vfsNodes)
        .where(inArray(vfsNodes.id, affectedNodeIds));

      // Check how many chunks each file has in total across all clouds
      const allChunksForNodes = await db
        .select({ vfsNodeId: fileChunks.vfsNodeId })
        .from(fileChunks)
        .where(inArray(fileChunks.vfsNodeId, affectedNodeIds));

      const chunkCountMap = new Map<string, number>();
      for (const c of allChunksForNodes) {
        chunkCountMap.set(
          c.vfsNodeId,
          (chunkCountMap.get(c.vfsNodeId) || 0) + 1,
        );
      }

      affectedFiles = nodes.map((node) => {
        const totalChunks = chunkCountMap.get(node.id) || 1;
        const strategy: "whole" | "chunked" =
          totalChunks > 1 ? "chunked" : "whole";
        if (strategy === "whole") wholeFilesCount++;
        else chunkedFilesCount++;

        return {
          id: node.id,
          name: node.name,
          size: node.size,
          strategy,
        };
      });
    }

    // 3. Check remaining free space across OTHER connected providers
    const otherProviders = await db
      .select()
      .from(providerIdentities)
      .where(
        and(
          eq(providerIdentities.userId, userId),
          ne(providerIdentities.id, providerIdentityId),
        ),
      );

    const remainingFreeBytes = otherProviders.reduce(
      (sum, p) => sum + Math.max(0, p.quotaTotal - p.quotaUsed),
      0,
    );

    const canMigrate =
      remainingFreeBytes >= totalBytesOnProvider && otherProviders.length > 0;

    return {
      provider: targetProvider.provider,
      accountEmail: targetProvider.accountEmail,
      totalBytesOnProvider,
      affectedFilesCount: affectedFiles.length,
      wholeFilesCount,
      chunkedFilesCount,
      affectedFiles,
      canMigrate,
      remainingFreeBytes,
      otherProvidersCount: otherProviders.length,
    };
  }
}

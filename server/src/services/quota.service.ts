import { db, providerIdentities, fileChunks } from "../db/index.js";
import { eq, sql } from "drizzle-orm";
import { TokenService } from "./token.service.js";
import { getStorageAdapter } from "../adapters/factory.js";
import { socketManager } from "../websocket/socket-manager.js";
import { CacheService } from "./cache.service.js";

export class QuotaService {
  /**
   * Synchronizes quota for a specific provider identity.
   * Guarantees that data usage is never reported as 0 B when chunks exist in the database,
   * and syncs accurately with cloud provider APIs and user actions (upload, delete, migrate).
   */
  static async syncProviderQuota(
    providerIdentityId: string,
    options: { forceApi?: boolean } = {},
  ): Promise<{ usedBytes: number; totalBytes: number }> {
    const [identity] = await db
      .select()
      .from(providerIdentities)
      .where(eq(providerIdentities.id, providerIdentityId));

    if (!identity) {
      return { usedBytes: 0, totalBytes: 0 };
    }

    // 1. Calculate the exact bytes stored across all active chunks for this provider
    const [chunkStat] = await db
      .select({
        totalBytes: sql<string>`COALESCE(SUM(${fileChunks.byteEnd} - ${fileChunks.byteStart} + 1), 0)`,
      })
      .from(fileChunks)
      .where(eq(fileChunks.providerIdentityId, providerIdentityId));

    const dbStoredBytes = Number(chunkStat?.totalBytes || 0);

    let apiUsedBytes = 0;
    let apiTotalBytes = identity.quotaTotal || 10 * 1024 * 1024 * 1024;

    if (options.forceApi) {
      try {
        const accessToken = await TokenService.getValidAccessToken(providerIdentityId);
        const adapter = getStorageAdapter(identity.provider);
        const quota = await adapter.fetchQuota(accessToken);
        apiUsedBytes = quota.usedBytes;
        apiTotalBytes = quota.totalBytes;
      } catch (err: any) {
        console.warn(
          `[QuotaService] Failed to query external API quota for ${identity.provider} (${identity.id}):`,
          err?.message || err,
        );
      }
    }

    // Actual usage is at least what Fuze stores in chunks, or what the cloud provider reports
    const finalUsedBytes = Math.max(dbStoredBytes, apiUsedBytes);
    const finalTotalBytes = Math.max(apiTotalBytes, finalUsedBytes, 1024 * 1024);

    await db
      .update(providerIdentities)
      .set({
        quotaUsed: finalUsedBytes,
        quotaTotal: finalTotalBytes,
        lastSyncedAt: new Date(),
      })
      .where(eq(providerIdentities.id, providerIdentityId));

    // Broadcast real-time update to user's connected browsers
    socketManager.broadcastToUser(identity.userId, {
      type: "QUOTA_UPDATED",
      payload: {
        providerId: providerIdentityId,
        quota: {
          totalBytes: finalTotalBytes,
          usedBytes: finalUsedBytes,
        },
      },
    });

    socketManager.broadcastToUser(identity.userId, {
      type: "PROVIDER_STATUS_CHANGED",
      payload: {
        providerId: providerIdentityId,
        provider: identity.provider,
        accountEmail: identity.accountEmail,
        isRevoked: identity.isRevoked,
        quotaUsed: finalUsedBytes,
        quotaTotal: finalTotalBytes,
      },
    });

    await CacheService.invalidateUserProviders(identity.userId);

    return { usedBytes: finalUsedBytes, totalBytes: finalTotalBytes };
  }

  /**
   * Synchronizes quota across all active providers for a user.
   */
  static async syncAllUserProviders(
    userId: string,
    options: { forceApi?: boolean } = {},
  ): Promise<void> {
    const identities = await db
      .select({ id: providerIdentities.id })
      .from(providerIdentities)
      .where(eq(providerIdentities.userId, userId));

    for (const identity of identities) {
      await this.syncProviderQuota(identity.id, options);
    }
  }
}

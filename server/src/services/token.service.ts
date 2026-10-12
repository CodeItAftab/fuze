import IORedis from "ioredis";
import { db, providerIdentities } from "../db/index.js";
import { eq } from "drizzle-orm";
import { decrypt, encrypt } from "../utils/crypto.js";
import { getStorageAdapter } from "../adapters/factory.js";
import { socketManager } from "../websocket/socket-manager.js";

const redis = new IORedis(process.env.REDIS_URL || "redis://localhost:6379");

export class ProviderAuthExpiredError extends Error {
  constructor(public provider: string, originalMessage: string) {
    super(
      `Storage provider connection for '${provider}' has expired or been revoked. Please reconnect in Settings / Storage Providers.`,
    );
    this.name = "ProviderAuthExpiredError";
  }
}

export class TokenService {
  static async getValidAccessToken(
    providerIdentityId: string,
  ): Promise<string> {
    const [identity] = await db
      .select()
      .from(providerIdentities)
      .where(eq(providerIdentities.id, providerIdentityId));

    if (!identity) {
      throw new Error(`Provider identity ${providerIdentityId} not found`);
    }

    const now = new Date();
    // Return existing token if valid (with 2-minute safety buffer)
    if (new Date(identity.tokenExpiresAt.getTime() - 120000) > now) {
      return decrypt(identity.encryptedAccessToken);
    }

    // Token expired -> Acquire Redis distributed lock
    const lockKey = `lock:token_refresh:${providerIdentityId}`;
    const acquired = await redis.set(lockKey, "1", "PX", 10000, "NX");

    if (!acquired) {
      await new Promise((r) => setTimeout(r, 1000));
      return this.getValidAccessToken(providerIdentityId);
    }

    try {
      const refreshToken = decrypt(identity.encryptedRefreshToken);

      // DYNAMIC ADAPTER LOOKUP (Google, OneDrive, Dropbox, or Box)
      const adapter = getStorageAdapter(identity.provider);
      const refreshed = await adapter.refreshAccessToken(refreshToken);

      const newExpiresAt = new Date(
        Date.now() + refreshed.expiresInSeconds * 1000,
      );

      const updateData: {
        encryptedAccessToken: string;
        tokenExpiresAt: Date;
        encryptedRefreshToken?: string;
        isRevoked: boolean;
      } = {
        encryptedAccessToken: encrypt(refreshed.accessToken),
        tokenExpiresAt: newExpiresAt,
        isRevoked: false,
      };

      if (refreshed.refreshToken) {
        updateData.encryptedRefreshToken = encrypt(refreshed.refreshToken);
      }

      await db
        .update(providerIdentities)
        .set(updateData)
        .where(eq(providerIdentities.id, providerIdentityId));

      return refreshed.accessToken;
    } catch (err: any) {
      const msg = err?.message || "";
      if (
        msg.includes("invalid_grant") ||
        msg.includes("expired") ||
        msg.includes("revoked") ||
        msg.includes("token refresh failed") ||
        msg.includes("401") ||
        msg.includes("unauthorized")
      ) {
        await db
          .update(providerIdentities)
          .set({ isRevoked: true })
          .where(eq(providerIdentities.id, providerIdentityId));

        socketManager.broadcastToUser(identity.userId, {
          type: "PROVIDER_STATUS_CHANGED",
          payload: {
            providerId: providerIdentityId,
            provider: identity.provider,
            accountEmail: identity.accountEmail,
            isRevoked: true,
          },
        });

        throw new ProviderAuthExpiredError(identity.provider, msg);
      }
      throw err;
    } finally {
      await redis.del(lockKey);
    }
  }

  static async markRevoked(
    providerIdentityId: string,
    reason?: string,
  ): Promise<void> {
    const [identity] = await db
      .select({
        id: providerIdentities.id,
        userId: providerIdentities.userId,
        provider: providerIdentities.provider,
        accountEmail: providerIdentities.accountEmail,
      })
      .from(providerIdentities)
      .where(eq(providerIdentities.id, providerIdentityId));

    if (identity) {
      await db
        .update(providerIdentities)
        .set({ isRevoked: true })
        .where(eq(providerIdentities.id, providerIdentityId));

      socketManager.broadcastToUser(identity.userId, {
        type: "PROVIDER_STATUS_CHANGED",
        payload: {
          providerId: identity.id,
          provider: identity.provider,
          accountEmail: identity.accountEmail,
          isRevoked: true,
          reason,
        },
      });
    }
  }

  static async verifyConnection(providerIdentityId: string): Promise<{
    valid: boolean;
    isRevoked: boolean;
    error?: string;
  }> {
    const [identity] = await db
      .select()
      .from(providerIdentities)
      .where(eq(providerIdentities.id, providerIdentityId));

    if (!identity) {
      return { valid: false, isRevoked: false, error: "Identity not found" };
    }

    try {
      const accessToken = await this.getValidAccessToken(providerIdentityId);
      const adapter = getStorageAdapter(identity.provider);
      const quota = await adapter.fetchQuota(accessToken);

      await db
        .update(providerIdentities)
        .set({
          quotaTotal: quota.totalBytes,
          quotaUsed: quota.usedBytes,
          isRevoked: false,
          lastSyncedAt: new Date(),
        })
        .where(eq(providerIdentities.id, providerIdentityId));

      return { valid: true, isRevoked: false };
    } catch (err: any) {
      const isRevoked =
        err instanceof ProviderAuthExpiredError ||
        err.message?.includes("invalid_grant") ||
        err.message?.includes("expired") ||
        err.message?.includes("revoked") ||
        err.message?.includes("401");

      if (isRevoked) {
        await this.markRevoked(providerIdentityId, err.message);
      }

      return { valid: false, isRevoked: true, error: err.message };
    }
  }
}

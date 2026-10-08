// Replace server/src/services/token.service.ts with this:

import IORedis from "ioredis";
import { db, providerIdentities } from "../db/index.js";
import { eq } from "drizzle-orm";
import { decrypt, encrypt } from "../utils/crypto.js";
import { getStorageAdapter } from "../adapters/factory.js";

const redis = new IORedis(process.env.REDIS_URL || "redis://localhost:6379");

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

      // DYNAMIC ADAPTER LOOKUP (Google, OneDrive, Dropbox, or pCloud)
      const adapter = getStorageAdapter(identity.provider);
      const refreshed = await adapter.refreshAccessToken(refreshToken);

      const newExpiresAt = new Date(
        Date.now() + refreshed.expiresInSeconds * 1000,
      );

      await db
        .update(providerIdentities)
        .set({
          encryptedAccessToken: encrypt(refreshed.accessToken),
          tokenExpiresAt: newExpiresAt,
        })
        .where(eq(providerIdentities.id, providerIdentityId));

      return refreshed.accessToken;
    } finally {
      await redis.del(lockKey);
    }
  }
}

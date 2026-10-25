import IORedis from "ioredis";

const redis = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
});

redis.on("error", (err) => {
  console.warn(`[Redis:CacheService] Warning: ${err.message}`);
});

/**
 * High-performance, lean server-side Redis cache with O(1) revision invalidation.
 * Strictly caches lightweight JSON metadata to avoid V8 heap bloat on 1-core systems.
 * NEVER stores file streams or binary payloads.
 */
export class CacheService {
  /**
   * Low-level safe get. Returns null on miss or Redis unavailability.
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await redis.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  /**
   * Low-level safe set with TTL in seconds.
   */
  static async set(
    key: string,
    data: any,
    ttlSeconds: number = 300,
  ): Promise<void> {
    try {
      const str = JSON.stringify(data);
      await redis.set(key, str, "EX", ttlSeconds);
    } catch {}
  }

  /**
   * Low-level safe delete.
   */
  static async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch {}
  }

  // ==========================================
  // O(1) User Revision Counter Mechanics
  // ==========================================

  /**
   * Get the current VFS revision number for a user.
   */
  static async getVfsRevision(userId: string): Promise<number> {
    try {
      const rev = await redis.get(`vfs_rev:${userId}`);
      return rev ? parseInt(rev, 10) : 1;
    } catch {
      return 1;
    }
  }

  /**
   * Invalidate ALL directory listings, trash, starred items, and trees for a user.
   * Runs in O(1) by atomically incrementing the user's VFS revision.
   */
  static async invalidateUserVfs(userId: string): Promise<void> {
    try {
      await redis.incr(`vfs_rev:${userId}`);
    } catch {}
  }

  /**
   * Get the current Provider quota/sync revision number for a user.
   */
  static async getProviderRevision(userId: string): Promise<number> {
    try {
      const rev = await redis.get(`prov_rev:${userId}`);
      return rev ? parseInt(rev, 10) : 1;
    } catch {
      return 1;
    }
  }

  /**
   * Invalidate cached provider quota summaries for a user.
   * Runs in O(1) by atomically incrementing the user's provider revision.
   */
  static async invalidateUserProviders(userId: string): Promise<void> {
    try {
      await redis.incr(`prov_rev:${userId}`);
    } catch {}
  }

  // ==========================================
  // Domain Specific Cache Wrappers
  // ==========================================

  /**
   * Directory listing cache (items + breadcrumbs).
   */
  static async getFolderListing(
    userId: string,
    parentId: string | null,
  ): Promise<{ items: any[]; breadcrumbs: any[] } | null> {
    const rev = await this.getVfsRevision(userId);
    const key = `cache:vfs:${userId}:r${rev}:dir:${parentId || "root"}`;
    return this.get<{ items: any[]; breadcrumbs: any[] }>(key);
  }

  static async setFolderListing(
    userId: string,
    parentId: string | null,
    data: { items: any[]; breadcrumbs: any[] },
    ttlSeconds: number = 300,
  ): Promise<void> {
    const rev = await this.getVfsRevision(userId);
    const key = `cache:vfs:${userId}:r${rev}:dir:${parentId || "root"}`;
    await this.set(key, data, ttlSeconds);
  }

  /**
   * Starred items cache.
   */
  static async getStarredListing(userId: string): Promise<any[] | null> {
    const rev = await this.getVfsRevision(userId);
    const key = `cache:vfs:${userId}:r${rev}:starred`;
    return this.get<any[]>(key);
  }

  static async setStarredListing(
    userId: string,
    items: any[],
    ttlSeconds: number = 300,
  ): Promise<void> {
    const rev = await this.getVfsRevision(userId);
    const key = `cache:vfs:${userId}:r${rev}:starred`;
    await this.set(key, items, ttlSeconds);
  }

  /**
   * Trashed items cache.
   */
  static async getTrashListing(userId: string): Promise<any[] | null> {
    const rev = await this.getVfsRevision(userId);
    const key = `cache:vfs:${userId}:r${rev}:trash`;
    return this.get<any[]>(key);
  }

  static async setTrashListing(
    userId: string,
    items: any[],
    ttlSeconds: number = 300,
  ): Promise<void> {
    const rev = await this.getVfsRevision(userId);
    const key = `cache:vfs:${userId}:r${rev}:trash`;
    await this.set(key, items, ttlSeconds);
  }

  /**
   * Folder hierarchy tree (used for Move Modal destination selector).
   */
  static async getFoldersTree(userId: string): Promise<any[] | null> {
    const rev = await this.getVfsRevision(userId);
    const key = `cache:vfs:${userId}:r${rev}:folders`;
    return this.get<any[]>(key);
  }

  static async setFoldersTree(
    userId: string,
    folders: any[],
    ttlSeconds: number = 300,
  ): Promise<void> {
    const rev = await this.getVfsRevision(userId);
    const key = `cache:vfs:${userId}:r${rev}:folders`;
    await this.set(key, folders, ttlSeconds);
  }

  /**
   * File details & chunk layout cache.
   */
  static async getFileDetails(
    userId: string,
    fileId: string,
  ): Promise<any | null> {
    const rev = await this.getVfsRevision(userId);
    const key = `cache:vfs:${userId}:r${rev}:details:${fileId}`;
    return this.get<any>(key);
  }

  static async setFileDetails(
    userId: string,
    fileId: string,
    details: any,
    ttlSeconds: number = 300,
  ): Promise<void> {
    const rev = await this.getVfsRevision(userId);
    const key = `cache:vfs:${userId}:r${rev}:details:${fileId}`;
    await this.set(key, details, ttlSeconds);
  }

  /**
   * Providers listing & pool quota summary cache.
   */
  static async getProvidersSummary(
    userId: string,
  ): Promise<{ providers: any[]; summary: any } | null> {
    const rev = await this.getProviderRevision(userId);
    const key = `cache:prov:${userId}:r${rev}:summary`;
    return this.get<{ providers: any[]; summary: any }>(key);
  }

  static async setProvidersSummary(
    userId: string,
    data: { providers: any[]; summary: any },
    ttlSeconds: number = 120,
  ): Promise<void> {
    const rev = await this.getProviderRevision(userId);
    const key = `cache:prov:${userId}:r${rev}:summary`;
    await this.set(key, data, ttlSeconds);
  }
}

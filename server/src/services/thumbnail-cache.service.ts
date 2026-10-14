import fs from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export interface ThumbnailCacheItem {
  filePath: string;
  mimeType: string;
  size: number;
  versionTag: string;
}

export interface ThumbnailMeta {
  fileId: string;
  mimeType: string;
  size: number;
  versionTag: string;
  createdAt: number;
  lastAccessedAt: number;
}

export interface CacheStats {
  totalFiles: number;
  totalSizeBytes: number;
  maxSizeBytes: number;
  maxMb: number;
  usagePercent: number;
}

export class ThumbnailCacheService {
  private static cacheDir: string =
    process.env.THUMBNAIL_CACHE_DIR ||
    path.join(process.cwd(), ".cache", "thumbnails");

  private static isInitialized = false;
  private static isPruning = false;

  /**
   * Configurable Maximum Cache limit in Megabytes.
   * Defaults to 150 MB (tailored for free tier hosting).
   */
  private static getMaxBytes(): number {
    const mb = parseInt(process.env.THUMBNAIL_CACHE_MAX_MB || "150", 10);
    const validMb = isNaN(mb) || mb <= 0 ? 150 : mb;
    return validMb * 1024 * 1024;
  }

  /**
   * Configurable Time-To-Live in Milliseconds.
   * Defaults to 14 days. Untouched thumbnails older than this are evicted.
   */
  private static getTtlMs(): number {
    const days = parseInt(process.env.THUMBNAIL_CACHE_TTL_DAYS || "14", 10);
    const validDays = isNaN(days) || days <= 0 ? 14 : days;
    return validDays * 24 * 60 * 60 * 1000;
  }

  /**
   * Ensure thumbnail cache directory exists on disk.
   */
  private static async ensureDir(): Promise<void> {
    if (this.isInitialized) return;
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      this.isInitialized = true;
    } catch (err) {
      console.error("[ThumbnailCache] Failed to create cache directory:", err);
    }
  }

  private static getPaths(fileId: string) {
    const safeId = fileId.replace(/[^a-zA-Z0-9_-]/g, ""); // Sanitize fileId to avoid path traversal or invalid characters
    return {
      thumbPath: path.join(this.cacheDir, `${safeId}.thumb`),
      metaPath: path.join(this.cacheDir, `${safeId}.meta.json`),
    };
  }

  /**
   * Lookup a cached thumbnail by file ID and optional version tag.
   * Updates last accessed timestamp on hit (LRU support).
   */
  static async get(
    fileId: string,
    versionTag?: string,
  ): Promise<ThumbnailCacheItem | null> {
    await this.ensureDir();
    const { thumbPath, metaPath } = this.getPaths(fileId);

    if (!existsSync(thumbPath) || !existsSync(metaPath)) {
      return null;
    }

    try {
      const metaRaw = await fs.readFile(metaPath, "utf-8");
      const meta = JSON.parse(metaRaw) as ThumbnailMeta;

      // Invalidate if file version/hash changed
      if (versionTag && meta.versionTag && meta.versionTag !== versionTag) {
        await this.delete(fileId);
        return null;
      }

      // Evict if older than TTL
      const now = Date.now();
      if (now - meta.lastAccessedAt > this.getTtlMs()) {
        await this.delete(fileId);
        return null;
      }

      // Update LRU access time asynchronously
      meta.lastAccessedAt = now;
      void fs.writeFile(metaPath, JSON.stringify(meta)).catch(() => {});
      const dateNow = new Date();
      void fs.utimes(thumbPath, dateNow, dateNow).catch(() => {});

      return {
        filePath: thumbPath,
        mimeType: meta.mimeType || "image/jpeg",
        size: meta.size,
        versionTag: meta.versionTag || "1",
      };
    } catch {
      return null;
    }
  }

  /**
   * Save a newly fetched thumbnail buffer to local disk.
   * Automatically triggers asynchronous LRU pruning if limit is exceeded.
   */
  static async save(
    fileId: string,
    buffer: Buffer,
    mimeType: string,
    versionTag: string = "1",
  ): Promise<void> {
    await this.ensureDir();
    const { thumbPath, metaPath } = this.getPaths(fileId);
    const tempThumbPath = path.join(
      this.cacheDir,
      `${fileId}.${crypto.randomBytes(6).toString("hex")}.tmp`,
    );

    try {
      // 1. Atomic write data
      await fs.writeFile(tempThumbPath, buffer);
      await fs.rename(tempThumbPath, thumbPath);

      // 2. Write metadata
      const meta: ThumbnailMeta = {
        fileId,
        mimeType: mimeType || "image/jpeg",
        size: buffer.length,
        versionTag,
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
      };
      await fs.writeFile(metaPath, JSON.stringify(meta));

      // 3. Trigger LRU background check if needed
      void this.pruneIfNeeded();
    } catch (err) {
      console.warn(
        `[ThumbnailCache] Failed to save thumbnail for ${fileId}:`,
        err,
      );
      // Clean up orphaned temp file if needed
      await fs.unlink(tempThumbPath).catch(() => {});
    }
  }

  /**
   * Remove a thumbnail from disk (e.g. on file delete or modification).
   */
  static async delete(fileId: string): Promise<void> {
    const { thumbPath, metaPath } = this.getPaths(fileId);
    await Promise.all([
      fs.unlink(thumbPath).catch(() => {}),
      fs.unlink(metaPath).catch(() => {}),
    ]);
  }

  /**
   * Check total cache size and prune oldest accessed thumbnails if above max limit.
   */
  private static async pruneIfNeeded(): Promise<void> {
    if (this.isPruning) return;
    this.isPruning = true;

    try {
      await this.ensureDir();
      const files = await fs.readdir(this.cacheDir);
      const thumbFiles = files.filter((f) => f.endsWith(".thumb"));

      const maxBytes = this.getMaxBytes();
      const targetBytes = Math.floor(maxBytes * 0.8); // Prune to 80% to avoid constant pruning cycles
      const ttlMs = this.getTtlMs();
      const now = Date.now();

      let totalSize = 0;
      const fileStats: Array<{
        fileId: string;
        thumbPath: string;
        metaPath: string;
        size: number;
        lastAccessedAt: number;
      }> = [];

      for (const thumbName of thumbFiles) {
        const fileId = thumbName.replace(/\.thumb$/, "");
        const tPath = path.join(this.cacheDir, thumbName);
        const mPath = path.join(this.cacheDir, `${fileId}.meta.json`);

        try {
          const stat = await fs.stat(tPath);
          totalSize += stat.size;

          let lastAccessedAt = stat.atimeMs || stat.mtimeMs;
          if (existsSync(mPath)) {
            try {
              const mData = JSON.parse(await fs.readFile(mPath, "utf-8"));
              if (mData.lastAccessedAt) lastAccessedAt = mData.lastAccessedAt;
            } catch {}
          }

          fileStats.push({
            fileId,
            thumbPath: tPath,
            metaPath: mPath,
            size: stat.size,
            lastAccessedAt,
          });
        } catch {}
      }

      // First pass: Evict any files exceeding TTL
      for (const item of fileStats) {
        if (now - item.lastAccessedAt > ttlMs) {
          await fs.unlink(item.thumbPath).catch(() => {});
          await fs.unlink(item.metaPath).catch(() => {});
          totalSize -= item.size;
        }
      }

      // Second pass: If still over maxBytes, evict least recently used (LRU) files
      if (totalSize > maxBytes) {
        // Sort oldest access first
        fileStats.sort((a, b) => a.lastAccessedAt - b.lastAccessedAt);

        for (const item of fileStats) {
          if (totalSize <= targetBytes) break;

          await fs.unlink(item.thumbPath).catch(() => {});
          await fs.unlink(item.metaPath).catch(() => {});
          totalSize -= item.size;
        }

        console.log(
          `[ThumbnailCache] LRU Pruning completed: freed cache to ${(totalSize / (1024 * 1024)).toFixed(2)} MB (Max: ${(maxBytes / (1024 * 1024)).toFixed(2)} MB)`,
        );
      }
    } catch (err) {
      console.warn("[ThumbnailCache] Prune warning:", err);
    } finally {
      this.isPruning = false;
    }
  }

  /**
   * Get live cache statistics (for health checks or admin diagnostics).
   */
  static async getStats(): Promise<CacheStats> {
    await this.ensureDir();
    const maxBytes = this.getMaxBytes();
    try {
      const files = await fs.readdir(this.cacheDir);
      const thumbFiles = files.filter((f) => f.endsWith(".thumb"));

      let totalSizeBytes = 0;
      for (const tf of thumbFiles) {
        try {
          const stat = await fs.stat(path.join(this.cacheDir, tf));
          totalSizeBytes += stat.size;
        } catch {}
      }

      return {
        totalFiles: thumbFiles.length,
        totalSizeBytes,
        maxSizeBytes: maxBytes,
        maxMb: Math.round(maxBytes / (1024 * 1024)),
        usagePercent: Math.min(
          100,
          Math.round((totalSizeBytes / maxBytes) * 100),
        ),
      };
    } catch {
      return {
        totalFiles: 0,
        totalSizeBytes: 0,
        maxSizeBytes: maxBytes,
        maxMb: Math.round(maxBytes / (1024 * 1024)),
        usagePercent: 0,
      };
    }
  }

  /**
   * Completely clear the thumbnail cache (optional maintenance).
   */
  static async clear(): Promise<void> {
    await this.ensureDir();
    try {
      const files = await fs.readdir(this.cacheDir);
      await Promise.all(
        files.map((f) =>
          fs.unlink(path.join(this.cacheDir, f)).catch(() => {}),
        ),
      );
    } catch (err) {
      console.warn("[ThumbnailCache] Clear warning:", err);
    }
  }
}

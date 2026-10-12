export interface StorageProviderQuota {
  providerIdentityId: string;
  provider: "google_drive" | "dropbox" | "one_drive" | "pcloud" | "box";
  freeBytes: number;
}

export interface ChunkPlanItem {
  index: number;
  byteStart: number;
  byteEnd: number;
  size: number;
  provider: "google_drive" | "dropbox" | "one_drive" | "pcloud" | "box";
  providerIdentityId: string;
}

export interface DecisionResult {
  strategy: "whole" | "chunked";
  chunks: ChunkPlanItem[];
  error?: string;
}

// Provider-specific single-file limits on free tier
const PROVIDER_MAX_FILE_LIMITS: Record<string, number> = {
  box: 50 * 1024 * 1024, // Box direct multipart upload endpoint supports files up to 50 MB
  google_drive: 5 * 1024 * 1024 * 1024 * 1024, // 5 TB
  one_drive: 250 * 1024 * 1024 * 1024, // 250 GB
  dropbox: 140 * 1024 * 1024, // Dropbox direct upload endpoint has a 150 MB ceiling
  pcloud: 10 * 1024 * 1024 * 1024, // 10 GB
};

// Provider-specific minimum chunk/file limits for chunked/resumable upload APIs
const PROVIDER_MIN_FILE_LIMITS: Record<string, number> = {};

export class ChunkDecisionService {
  static plan(
    fileSize: number,
    providers: StorageProviderQuota[],
  ): DecisionResult {
    if (providers.length === 0) {
      return {
        strategy: "whole",
        chunks: [],
        error: "No connected storage providers found.",
      };
    }

    // Sort providers by descending free space
    const sorted = [...providers]
      .map((p) => ({ ...p }))
      .sort((a, b) => b.freeBytes - a.freeBytes);

    // Rule 1: Does the file fit entirely in ANY single provider (respecting both min and max limits)?
    const singleFit = sorted.find((p) => {
      const minAllowed = PROVIDER_MIN_FILE_LIMITS[p.provider] ?? 0;
      const maxAllowed = PROVIDER_MAX_FILE_LIMITS[p.provider] ?? Infinity;
      return (
        p.freeBytes >= fileSize &&
        fileSize >= minAllowed &&
        fileSize <= maxAllowed
      );
    });

    if (singleFit) {
      return {
        strategy: "whole",
        chunks: [
          {
            index: 0,
            byteStart: 0,
            byteEnd: fileSize,
            size: fileSize,
            provider: singleFit.provider,
            providerIdentityId: singleFit.providerIdentityId,
          },
        ],
      };
    }

    // Rule 2: Exceeds every single provider -> Chunk across combined free space
    const totalFreeSpace = sorted.reduce((sum, p) => sum + p.freeBytes, 0);
    if (totalFreeSpace < fileSize) {
      const neededGB = (fileSize / 1e9).toFixed(2);
      const availableGB = (totalFreeSpace / 1e9).toFixed(2);
      return {
        strategy: "chunked",
        chunks: [],
        error: `Insufficient storage. Needed: ${neededGB} GB, Total Available: ${availableGB} GB.`,
      };
    }

    // Allocate chunks across providers
    let remainingBytes = fileSize;
    let currentByte = 0;
    let chunkIndex = 0;
    const chunks: ChunkPlanItem[] = [];

    for (const p of sorted) {
      if (remainingBytes <= 0) break;
      if (p.freeBytes <= 0) continue;

      const minChunkAllowed = PROVIDER_MIN_FILE_LIMITS[p.provider] ?? 0;
      // If remainingBytes or available free space is below the provider's API minimum, skip this provider
      if (minChunkAllowed > 0 && (remainingBytes < minChunkAllowed || p.freeBytes < minChunkAllowed)) {
        continue;
      }

      // Cap chunk slices to 64 MB so they upload smoothly and reliably across all cloud endpoints
      const maxSlice = 64 * 1024 * 1024;

      while (remainingBytes > 0 && p.freeBytes > 0) {
        const takeBytes = Math.min(remainingBytes, p.freeBytes, maxSlice);
        if (takeBytes <= 0) break;

        // Ensure the last slice doesn't violate provider minimum chunk limit
        if (minChunkAllowed > 0 && takeBytes < minChunkAllowed) {
          break;
        }

        chunks.push({
          index: chunkIndex++,
          byteStart: currentByte,
          byteEnd: currentByte + takeBytes,
          size: takeBytes,
          provider: p.provider,
          providerIdentityId: p.providerIdentityId,
        });

        currentByte += takeBytes;
        remainingBytes -= takeBytes;
        p.freeBytes -= takeBytes;
      }
    }

    return {
      strategy: "chunked",
      chunks,
    };
  }
}

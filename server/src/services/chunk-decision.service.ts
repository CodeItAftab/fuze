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
  google_drive: 5 * 1024 * 1024 * 1024 * 1024, // 5 TB
  one_drive: 250 * 1024 * 1024 * 1024, // 250 GB
  pcloud: 10 * 1024 * 1024 * 1024, // 10 GB
  box: 250 * 1024 * 1024, // 250 MB (standard account single-file upload ceiling)
  dropbox: 150 * 1024 * 1024, // 150 MB
};

// Provider throughput and capability preference weights for Whole files
const PROVIDER_PRIORITY_WEIGHT: Record<string, number> = {
  google_drive: 100, // 15 GB free, global high-speed CDN, instant native previews
  pcloud: 95, // 10 GB free, direct high-speed transfers, native previews
  one_drive: 90, // 5 GB free, high reliability, Office previews
  box: 85, // 10 GB free, rich preview engine (120+ formats)
  dropbox: 70, // 2 GB free
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

    // -------------------------------------------------------------------------
    // RULE 1: STRICT "WHOLE FILE" PRIORITY
    // Check if ANY active provider can host the entire file as a single whole object.
    // Whole uploads are vastly faster, avoid multi-provider assembly overhead,
    // and enable instant provider-native thumbnail generation.
    // -------------------------------------------------------------------------
    const wholeCandidates = providers.filter((p) => {
      const minAllowed = PROVIDER_MIN_FILE_LIMITS[p.provider] ?? 0;
      const maxAllowed = PROVIDER_MAX_FILE_LIMITS[p.provider] ?? Infinity;
      return (
        p.freeBytes >= fileSize &&
        fileSize >= minAllowed &&
        fileSize <= maxAllowed
      );
    });

    if (wholeCandidates.length > 0) {
      // Prioritize the best provider:
      // 1. Providers that have abundant free space relative to file size (so we don't exhaust small providers)
      // 2. High-performance providers (Google Drive > pCloud > OneDrive > Box > Dropbox)
      wholeCandidates.sort((a, b) => {
        const spaceDiff = b.freeBytes - a.freeBytes;
        // If one provider has substantially more space (> 1 GB difference), prioritize it
        if (Math.abs(spaceDiff) > 1024 * 1024 * 1024) {
          return spaceDiff;
        }
        const weightA = PROVIDER_PRIORITY_WEIGHT[a.provider] || 50;
        const weightB = PROVIDER_PRIORITY_WEIGHT[b.provider] || 50;
        return weightB - weightA;
      });

      const selected = wholeCandidates[0]!;
      return {
        strategy: "whole",
        chunks: [
          {
            index: 0,
            byteStart: 0,
            byteEnd: fileSize,
            size: fileSize,
            provider: selected.provider,
            providerIdentityId: selected.providerIdentityId,
          },
        ],
      };
    }

    // -------------------------------------------------------------------------
    // RULE 2: MULTI-CLOUD CHUNKING (STRICT LAST RESORT)
    // Only triggered when NO single provider has enough remaining space for the file.
    // Combines free quota across all connected providers to host the file.
    // -------------------------------------------------------------------------
    const sorted = [...providers]
      .map((p) => ({ ...p }))
      .sort((a, b) => b.freeBytes - a.freeBytes);

    const totalFreeSpace = sorted.reduce((sum, p) => sum + p.freeBytes, 0);
    if (totalFreeSpace < fileSize) {
      const neededGB = (fileSize / 1e9).toFixed(2);
      const availableGB = (totalFreeSpace / 1e9).toFixed(2);
      return {
        strategy: "chunked",
        chunks: [],
        error: `Insufficient storage across all providers. Needed: ${neededGB} GB, Total Available: ${availableGB} GB.`,
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

import { SupportedProvider } from "../adapters/factory.js";

export interface StorageProviderQuota {
  providerIdentityId: string;
  provider: SupportedProvider;
  freeBytes: number;
}

export interface ChunkPlanItem {
  index: number;
  byteStart: number;
  byteEnd: number;
  size: number;
  provider: SupportedProvider;
  providerIdentityId: string;
}

export interface DecisionResult {
  strategy: "whole" | "chunked";
  chunks: ChunkPlanItem[];
  error?: string;
}

// Provider-specific single-file limits on free tier
export const PROVIDER_MAX_FILE_LIMITS: Record<string, number> = {
  google_drive: 5 * 1024 * 1024 * 1024 * 1024, // 5 TB
  one_drive: 250 * 1024 * 1024 * 1024, // 250 GB
  pcloud: 10 * 1024 * 1024 * 1024, // 10 GB
  box: 250 * 1024 * 1024, // 250 MB (standard account single-file upload ceiling)
  dropbox: 140 * 1024 * 1024, // 140 MB (hard cap for Dropbox single files/upload)
  mega: 20 * 1024 * 1024 * 1024, // 20 GB
  koofr: 10 * 1024 * 1024 * 1024, // 10 GB
};

// Provider throughput and capability preference weights for Whole files
const PROVIDER_PRIORITY_WEIGHT: Record<string, number> = {
  google_drive: 100, // 15 GB free, global high-speed CDN, instant native previews
  pcloud: 95, // 10 GB free, direct high-speed transfers, native previews
  mega: 92, // 20 GB free, high capacity
  one_drive: 90, // 5 GB free, high reliability, Office previews
  koofr: 89, // 10 GB free, fast European storage
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
      wholeCandidates.sort((a, b) => {
        const spaceDiff = b.freeBytes - a.freeBytes;
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

    let remainingBytes = fileSize;
    let currentByte = 0;
    let chunkIndex = 0;
    const chunks: ChunkPlanItem[] = [];

    for (const p of sorted) {
      if (remainingBytes <= 0) break;
      if (p.freeBytes <= 0) continue;

      const minChunkAllowed = PROVIDER_MIN_FILE_LIMITS[p.provider] ?? 0;
      if (minChunkAllowed > 0 && (remainingBytes < minChunkAllowed || p.freeBytes < minChunkAllowed)) {
        continue;
      }

      const maxSlice = 64 * 1024 * 1024; // 64 MB

      while (remainingBytes > 0 && p.freeBytes > 0) {
        const takeBytes = Math.min(remainingBytes, p.freeBytes, maxSlice);
        if (takeBytes <= 0) break;

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

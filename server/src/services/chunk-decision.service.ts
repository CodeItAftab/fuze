export interface StorageProviderQuota {
  providerIdentityId: string;
  provider: "google_drive" | "dropbox" | "one_drive" | "pcloud";
  freeBytes: number;
}

export interface ChunkPlanItem {
  index: number;
  byteStart: number;
  byteEnd: number;
  size: number;
  provider: "google_drive" | "dropbox" | "one_drive" | "pcloud";
  providerIdentityId: string;
}

export interface DecisionResult {
  strategy: "whole" | "chunked";
  chunks: ChunkPlanItem[];
  error?: string;
}

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
    const sorted = [...providers].sort((a, b) => b.freeBytes - a.freeBytes);

    // Rule 1: Does the file fit entirely in ANY single provider?
    const singleFit = sorted.find((p) => p.freeBytes >= fileSize);
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

      const takeBytes = Math.min(remainingBytes, p.freeBytes);
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
    }

    return {
      strategy: "chunked",
      chunks,
    };
  }
}

/**
 * Zero-Proxy Client-Side Download & Chunk Assembly Engine
 * Handles direct cloud provider downloading, parallel chunk retrieval,
 * in-memory assembly, and seamless fallback to server stream if CORS is blocked.
 */

export interface DownloadChunk {
  index: number;
  byteStart: number;
  byteEnd: number;
  downloadUrl: string;
}

export interface DownloadPlan {
  isPasswordProtected?: boolean;
  file: {
    id: string;
    name: string;
    size: number;
    mimeType: string;
    createdAt?: string;
  };
  strategy: "whole" | "chunked";
  downloadUrl?: string;
  streamUrl?: string;
  chunks: DownloadChunk[];
}

export interface ProgressCallbackData {
  percent: number;
  loaded: number;
  total: number;
  statusText?: string;
}

export async function fetchFilePlan(params: {
  fileId?: string;
  shareToken?: string;
  password?: string;
}): Promise<DownloadPlan> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  if (params.shareToken) {
    const url = new URL(`${apiUrl}/files/share/${params.shareToken}`);
    if (params.password) {
      url.searchParams.set("password", params.password);
    }
    const res = await fetch(url.toString());
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to load share data");
    }
    if (data.isPasswordProtected) {
      return {
        isPasswordProtected: true,
        file: {
          id: "",
          name: data.fileName || "Protected File",
          size: data.size || 0,
          mimeType: data.mimeType || "application/octet-stream",
        },
        strategy: "whole",
        chunks: [],
      };
    }
    return {
      ...data,
      streamUrl: `${apiUrl}/files/share/${params.shareToken}/download?inline=true`,
    } as DownloadPlan;
  }

  if (params.fileId) {
    const res = await fetch(`${apiUrl}/files/${params.fileId}/download?info=true`, {
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to get download plan");
    }

    const streamUrl = data.streamUrl
      ? `${apiUrl}${data.streamUrl}`
      : `${apiUrl}/files/${params.fileId}/download?inline=true`;

    if (data.strategy === "whole") {
      return {
        file: {
          id: params.fileId,
          name: data.fileName,
          size: data.size,
          mimeType: data.mimeType,
        },
        strategy: "whole",
        downloadUrl: data.downloadUrl,
        streamUrl,
        chunks: [
          {
            index: 0,
            byteStart: 0,
            byteEnd: data.size,
            downloadUrl: data.downloadUrl,
          },
        ],
      };
    }

    return {
      file: {
        id: params.fileId,
        name: data.fileName,
        size: data.size,
        mimeType: data.mimeType,
      },
      strategy: "chunked",
      streamUrl,
      chunks: data.chunks,
    };
  }

  throw new Error("Either fileId or shareToken is required");
}

export async function downloadAndAssembleChunks(
  plan: DownloadPlan,
  options?: {
    onProgress?: (progress: ProgressCallbackData) => void;
    signal?: AbortSignal;
    shareToken?: string;
    password?: string;
  },
): Promise<{ blob: Blob; objectUrl: string }> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const totalSize = plan.file.size || 1;
  const mimeType = plan.file.mimeType || "application/octet-stream";

  // Case 1: Single whole file
  if (plan.strategy === "whole" && plan.downloadUrl) {
    options?.onProgress?.({
      percent: 0,
      loaded: 0,
      total: totalSize,
      statusText: "Starting download...",
    });

    try {
      // Try direct provider fetch (CORS allowed by Box/Dropbox)
      const res = await fetch(plan.downloadUrl, { signal: options?.signal });
      if (!res.ok) throw new Error(`Direct download error: ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) {
        const blob = await res.blob();
        options?.onProgress?.({
          percent: 100,
          loaded: totalSize,
          total: totalSize,
          statusText: "Complete",
        });
        return { blob, objectUrl: URL.createObjectURL(blob) };
      }

      const chunks: Uint8Array[] = [];
      let loaded = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          loaded += value.length;
          options?.onProgress?.({
            percent: Math.min(99, Math.round((loaded / totalSize) * 100)),
            loaded,
            total: totalSize,
            statusText: "Downloading...",
          });
        }
      }

      const blob = new Blob(chunks as unknown as BlobPart[], { type: mimeType });
      options?.onProgress?.({
        percent: 100,
        loaded: totalSize,
        total: totalSize,
        statusText: "Complete",
      });
      return { blob, objectUrl: URL.createObjectURL(blob) };
    } catch (directErr) {
      // Fall back to server stream if CORS or network restricted
      const fallbackUrl = options?.shareToken
        ? `${apiUrl}/files/share/${options.shareToken}/download${
            options?.password ? `?password=${encodeURIComponent(options.password)}` : ""
          }`
        : `${apiUrl}/files/${plan.file.id}/download`;

      const fallbackRes = await fetch(fallbackUrl, {
        credentials: "include",
        signal: options?.signal,
      });

      if (!fallbackRes.ok) throw directErr;
      const blob = await fallbackRes.blob();
      return { blob, objectUrl: URL.createObjectURL(blob) };
    }
  }

  // Case 2: Multi-chunk file
  const sortedChunks = [...plan.chunks].sort((a, b) => a.index - b.index);
  const downloadedParts = new Map<number, Uint8Array>();
  const chunkLoadedBytes = new Map<number, number>();

  const reportOverallProgress = () => {
    let currentTotal = 0;
    for (const val of chunkLoadedBytes.values()) {
      currentTotal += val;
    }
    const percent = Math.min(99, Math.round((currentTotal / totalSize) * 100));
    options?.onProgress?.({
      percent,
      loaded: currentTotal,
      total: totalSize,
      statusText: `Streaming chunks (${downloadedParts.size}/${sortedChunks.length})...`,
    });
  };

  // Download chunks concurrently with a pool of max 3 parallel requests
  const CONCURRENCY = 3;
  let currentIndex = 0;

  const downloadWorker = async () => {
    while (currentIndex < sortedChunks.length) {
      if (options?.signal?.aborted) throw new Error("Download aborted");
      const chunk = sortedChunks[currentIndex++];
      const chunkSize = chunk.byteEnd - chunk.byteStart;

      try {
        // Attempt direct zero-proxy provider fetch
        const res = await fetch(chunk.downloadUrl, {
          signal: options?.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`Failed to fetch chunk ${chunk.index} directly`);
        }

        const reader = res.body.getReader();
        const parts: Uint8Array[] = [];
        let chunkLoaded = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            parts.push(value);
            chunkLoaded += value.length;
            chunkLoadedBytes.set(chunk.index, chunkLoaded);
            reportOverallProgress();
          }
        }

        // Merge chunk buffer
        const fullChunk = new Uint8Array(chunkLoaded);
        let offset = 0;
        for (const p of parts) {
          fullChunk.set(p, offset);
          offset += p.length;
        }

        downloadedParts.set(chunk.index, fullChunk);
      } catch (err) {
        // Fallback: If direct chunk fetch had CORS or network error, fetch from server fallback
        console.warn(`[Download] Direct fetch for chunk ${chunk.index} failed, falling back:`, err);
        const fallbackUrl = options?.shareToken
          ? `${apiUrl}/files/share/${options.shareToken}/download${
              options?.password ? `?password=${encodeURIComponent(options.password)}` : ""
            }`
          : `${apiUrl}/files/${plan.file.id}/download`;

        const res = await fetch(fallbackUrl, {
          credentials: "include",
          signal: options?.signal,
        });

        if (!res.ok) throw new Error(`Fallback failed: ${res.statusText}`);
        const fullBlob = await res.blob();
        return { blob: fullBlob, objectUrl: URL.createObjectURL(fullBlob) };
      }
    }
  };

  const workers = Array.from({ length: Math.min(CONCURRENCY, sortedChunks.length) }).map(
    () => downloadWorker(),
  );

  await Promise.all(workers);

  // If one of the workers returned early from fallback:
  if (downloadedParts.size < sortedChunks.length) {
    // If fallback was invoked
    const fallbackUrl = options?.shareToken
      ? `${apiUrl}/files/share/${options.shareToken}/download${
          options?.password ? `?password=${encodeURIComponent(options.password)}` : ""
        }`
      : `${apiUrl}/files/${plan.file.id}/download`;

    const res = await fetch(fallbackUrl, {
      credentials: "include",
      signal: options?.signal,
    });
    const blob = await res.blob();
    return { blob, objectUrl: URL.createObjectURL(blob) };
  }

  // Merge all chunks in exact index order
  const orderedBlobs: BlobPart[] = [];
  for (let i = 0; i < sortedChunks.length; i++) {
    const chunkData = downloadedParts.get(i);
    if (!chunkData) throw new Error(`Missing chunk ${i} after assembly`);
    orderedBlobs.push(chunkData as unknown as BlobPart);
  }

  const mergedBlob = new Blob(orderedBlobs, { type: mimeType });
  const objectUrl = URL.createObjectURL(mergedBlob);

  options?.onProgress?.({
    percent: 100,
    loaded: totalSize,
    total: totalSize,
    statusText: "Ready",
  });

  return { blob: mergedBlob, objectUrl };
}

export function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function downloadFile(params: {
  fileId?: string;
  shareToken?: string;
  password?: string;
  fileName?: string;
  onProgress?: (progress: ProgressCallbackData) => void;
  signal?: AbortSignal;
}): Promise<void> {
  const plan = await fetchFilePlan({
    fileId: params.fileId,
    shareToken: params.shareToken,
    password: params.password,
  });

  const { blob } = await downloadAndAssembleChunks(plan, {
    onProgress: params.onProgress,
    signal: params.signal,
    shareToken: params.shareToken,
    password: params.password,
  });

  triggerBlobDownload(blob, params.fileName || plan.file.name);
}

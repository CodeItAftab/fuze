export interface QueueItem {
  id: string;
  file: File;
  sessionId?: string;
  progress: number;
  uploadedBytes: number;
  totalBytes: number;
  status: "queued" | "uploading" | "completed" | "failed" | "cancelled";
  error?: string;
  strategy?: "whole" | "chunked";
  currentSpeed?: string;
  parentId?: string | null;
  abortController?: AbortController;
  activeXhr?: XMLHttpRequest | null;
}

type QueueListener = (items: QueueItem[]) => void;

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec <= 0 || !Number.isFinite(bytesPerSec)) return "";
  const mb = bytesPerSec / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB/s`;
  const kb = bytesPerSec / 1024;
  return `${kb.toFixed(0)} KB/s`;
}

export class UploadQueueManager {
  private queue: QueueItem[] = [];
  private activeUploads = 0;
  private maxConcurrent = 2; // Up to 2 concurrent uploads to maximize bandwidth and prevent uplink starvation
  private listeners: Set<QueueListener> = new Set();
  private isDismissed = false;

  subscribe(listener: QueueListener) {
    this.listeners.add(listener);
    listener([...this.queue]);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const snapshot = [...this.queue];
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  getDismissed(): boolean {
    return this.isDismissed;
  }

  setDismissed(dismissed: boolean) {
    this.isDismissed = dismissed;
  }

  addFiles(files: File[], parentId: string | null = null) {
    this.isDismissed = false; // Auto-show widget when new files are added
    const newItems: QueueItem[] = files.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      file,
      progress: 0,
      uploadedBytes: 0,
      totalBytes: file.size,
      status: "queued",
      parentId,
    }));

    this.queue.push(...newItems);
    this.notify();
    this.processQueue();
  }

  private processQueue() {
    while (this.activeUploads < this.maxConcurrent) {
      const nextItem = this.queue.find((item) => item.status === "queued");
      if (!nextItem) break;

      this.activeUploads++;
      nextItem.status = "uploading";
      nextItem.abortController = new AbortController();
      this.notify();

      this.startUpload(nextItem);
    }
  }

  private async startUpload(item: QueueItem) {
    try {
      await this.uploadSingleFile(item);
      if (item.status === "uploading") {
        item.status = "completed";
        item.progress = 100;
        item.uploadedBytes = item.file.size;
        item.currentSpeed = undefined;
      }
    } catch (err: unknown) {
      if (item.status !== "cancelled") {
        item.status = "failed";
        item.error = err instanceof Error ? err.message : "Upload failed";
        item.currentSpeed = undefined;
      }
    } finally {
      this.activeUploads = Math.max(0, this.activeUploads - 1);
      item.activeXhr = null;
      this.notify();
      this.processQueue();
    }
  }

  hasActiveUploads(): boolean {
    return this.queue.some(
      (item) => item.status === "uploading" || item.status === "queued",
    );
  }

  getActiveSessionIds(): string[] {
    return this.queue
      .filter(
        (item) =>
          (item.status === "uploading" || item.status === "queued") &&
          Boolean(item.sessionId),
      )
      .map((item) => item.sessionId as string);
  }

  cancelUpload(id: string) {
    const item = this.queue.find((i) => i.id === id);
    if (!item) return;

    const sessionId = item.sessionId;

    if (item.status === "uploading") {
      item.status = "cancelled";
      item.error = "Upload cancelled";
      item.currentSpeed = undefined;
      if (item.activeXhr) {
        try {
          item.activeXhr.abort();
        } catch {}
      }
      if (item.abortController) {
        try {
          item.abortController.abort();
        } catch {}
      }
      this.activeUploads = Math.max(0, this.activeUploads - 1);
      this.notify();
      this.processQueue();
    } else if (item.status === "queued") {
      item.status = "cancelled";
      item.error = "Upload cancelled";
      this.notify();
    }

    // Immediately notify server to clean up any partial chunks from cloud providers & database
    if (sessionId) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      fetch(`${apiUrl}/uploads/${sessionId}/abort`, {
        method: "POST",
        credentials: "include",
      }).catch(() => {});
    }
  }

  retryUpload(id: string) {
    const item = this.queue.find((i) => i.id === id);
    if (!item) return;

    if (item.sessionId) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      fetch(`${apiUrl}/uploads/${item.sessionId}/abort`, {
        method: "POST",
        credentials: "include",
      }).catch(() => {});
      item.sessionId = undefined;
    }

    item.status = "queued";
    item.progress = 0;
    item.uploadedBytes = 0;
    item.error = undefined;
    item.currentSpeed = undefined;
    item.abortController = undefined;
    item.activeXhr = undefined;
    this.notify();
    this.processQueue();
  }

  removeUpload(id: string) {
    const item = this.queue.find((i) => i.id === id);
    if (item) {
      if (item.status === "uploading") {
        this.cancelUpload(id);
      } else if (item.sessionId && item.status !== "completed") {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        fetch(`${apiUrl}/uploads/${item.sessionId}/abort`, {
          method: "POST",
          credentials: "include",
        }).catch(() => {});
      }
    }
    this.queue = this.queue.filter((i) => i.id !== id);
    this.notify();
  }

  clearCompleted() {
    this.queue = this.queue.filter((item) => item.status !== "completed");
    this.notify();
  }

  clearFinished() {
    this.queue = this.queue.filter(
      (item) => item.status !== "completed" && item.status !== "cancelled",
    );
    this.notify();
  }

  clearAll() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    for (const item of this.queue) {
      if (item.status === "uploading") {
        if (item.activeXhr) try { item.activeXhr.abort(); } catch {}
        if (item.abortController) try { item.abortController.abort(); } catch {}
      }
      if (item.sessionId && item.status !== "completed") {
        fetch(`${apiUrl}/uploads/${item.sessionId}/abort`, {
          method: "POST",
          credentials: "include",
        }).catch(() => {});
      }
    }
    this.activeUploads = 0;
    this.queue = [];
    this.notify();
  }

  private async uploadSingleFile(item: QueueItem) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const signal = item.abortController?.signal;

    if (signal?.aborted) throw new Error("Upload cancelled");

    // 1. Initiate stateful session on Fuze Server
    const sessionRes = await fetch(`${apiUrl}/uploads`, {
      method: "POST",
      credentials: "include",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: item.file.name,
        mimeType: item.file.type || "application/octet-stream",
        totalSize: item.file.size,
        parentId: item.parentId || null,
      }),
    });

    if (!sessionRes.ok) {
      const err = await sessionRes.json().catch(() => ({}));
      throw new Error(err.error || "Failed to initialize upload session");
    }

    const sessionData = await sessionRes.json();
    item.sessionId = sessionData.sessionId;
    item.strategy = sessionData.strategy;
    this.notify();

    const chunks = sessionData.chunks as Array<{
      index: number;
      byteStart: number;
      byteEnd: number;
    }>;

    let completedChunksBytes = 0;
    let lastTime = Date.now();
    let lastLoaded = 0;

    // 2. Upload chunks directly to Cloud Providers with real-time XHR streaming
    for (const chunk of chunks) {
      if (signal?.aborted) throw new Error("Upload cancelled");

      // Obtain provider presigned/resumable instruction URL
      const urlRes = await fetch(
        `${apiUrl}/uploads/${sessionData.sessionId}/chunks/${chunk.index}/url`,
        { credentials: "include", signal },
      );

      if (!urlRes.ok) {
        const errJson = await urlRes.json().catch(() => ({}));
        throw new Error(
          errJson.error || `Failed to get upload URL for chunk ${chunk.index}`,
        );
      }

      const instruction = (await urlRes.json()) as {
        uploadUrl: string;
        httpMethod?: string;
        headers?: Record<string, string>;
      };

      const chunkBlob = item.file.slice(chunk.byteStart, chunk.byteEnd);
      const chunkSize = chunk.byteEnd - chunk.byteStart;

      // Real-time progress upload via XMLHttpRequest with stall/inactivity watchdog and auto-retry support
      let uploadSuccess: { status: number; responseText: string } | null = null;
      let lastChunkError: Error | null = null;
      const MAX_CHUNK_RETRIES = 2;

      for (let attempt = 0; attempt <= MAX_CHUNK_RETRIES; attempt++) {
        if (signal?.aborted) throw new Error("Upload cancelled");

        try {
          if (attempt > 0) {
            await new Promise((r) => setTimeout(r, 1500 * attempt));
            if (signal?.aborted) throw new Error("Upload cancelled");
          }

          uploadSuccess = await new Promise<{
            status: number;
            responseText: string;
          }>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            item.activeXhr = xhr;

            let stallTimer: ReturnType<typeof setTimeout> | null = null;
            const STALL_TIMEOUT_MS = 60000; // 60 seconds of zero data transfer

            const cleanup = () => {
              if (stallTimer) {
                clearTimeout(stallTimer);
                stallTimer = null;
              }
              signal?.removeEventListener("abort", onAbort);
              item.activeXhr = null;
            };

            const resetStallTimer = () => {
              if (stallTimer) clearTimeout(stallTimer);
              stallTimer = setTimeout(() => {
                cleanup();
                try {
                  xhr.abort();
                } catch {}
                reject(
                  new Error(
                    `Upload stalled for chunk ${chunk.index} (no progress received for 60 seconds)`,
                  ),
                );
              }, STALL_TIMEOUT_MS);
            };

            const onAbort = () => {
              cleanup();
              try {
                xhr.abort();
              } catch {}
              reject(new Error("Upload cancelled"));
            };
            signal?.addEventListener("abort", onAbort, { once: true });

            xhr.upload.onprogress = (evt) => {
              resetStallTimer(); // Reset inactivity watchdog as long as data is being transferred
              if (evt.lengthComputable && item.status === "uploading") {
                const currentTotal = completedChunksBytes + evt.loaded;
                item.uploadedBytes = currentTotal;
                item.progress = Math.min(
                  99,
                  Math.round((currentTotal / item.file.size) * 100),
                );

                const now = Date.now();
                const elapsed = (now - lastTime) / 1000;
                if (elapsed >= 0.5) {
                  const speed = (currentTotal - lastLoaded) / elapsed;
                  item.currentSpeed = formatSpeed(speed);
                  lastTime = now;
                  lastLoaded = currentTotal;
                }
                this.notify();
              }
            };

            xhr.onload = () => {
              cleanup();
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve({ status: xhr.status, responseText: xhr.responseText });
              } else {
                reject(
                  new Error(
                    `Direct cloud upload failed for chunk ${chunk.index} (HTTP ${xhr.status})`,
                  ),
                );
              }
            };

            xhr.onerror = () => {
              cleanup();
              reject(
                new Error(
                  `Network error uploading chunk ${chunk.index} to storage provider`,
                ),
              );
            };

            xhr.open(instruction.httpMethod || "PUT", instruction.uploadUrl);

            if (instruction.headers) {
              for (const [key, val] of Object.entries(instruction.headers)) {
                try {
                  xhr.setRequestHeader(key, val);
                } catch {}
              }
            }

            resetStallTimer();
            xhr.send(chunkBlob);
          });

          // Chunk upload succeeded
          break;
        } catch (err) {
          lastChunkError = err instanceof Error ? err : new Error(String(err));
          if (signal?.aborted || attempt === MAX_CHUNK_RETRIES) {
            throw lastChunkError;
          }
        }
      }

      if (!uploadSuccess) {
        throw lastChunkError || new Error(`Upload failed for chunk ${chunk.index}`);
      }

      // Extract real cloud provider file identifier if returned
      let providerFileId = `file-${Date.now()}-${chunk.index}`;
      try {
        if (uploadSuccess.responseText) {
          const cd = JSON.parse(uploadSuccess.responseText);
          if (cd && typeof cd === "object") {
            if (typeof cd.path_display === "string") {
              providerFileId = cd.path_display;
            } else if (typeof cd.id === "string") {
              providerFileId = cd.id;
            }
          }
        }
      } catch {}

      // Hash chunk with Web Crypto API for cryptographic Merkle verification
      const arrayBuffer = await chunkBlob.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
      const chunkHash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (signal?.aborted) throw new Error("Upload cancelled");

      // Mark chunk completed on server
      const patchRes = await fetch(
        `${apiUrl}/uploads/${sessionData.sessionId}/chunks/${chunk.index}`,
        {
          method: "PATCH",
          credentials: "include",
          signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chunkHash, providerFileId }),
        },
      );

      if (!patchRes.ok) {
        throw new Error(`Failed to commit chunk ${chunk.index} to session`);
      }

      completedChunksBytes += chunkSize;
      item.uploadedBytes = completedChunksBytes;
      item.progress = Math.min(
        99,
        Math.round((completedChunksBytes / item.file.size) * 100),
      );
      this.notify();
    }

    if (signal?.aborted) throw new Error("Upload cancelled");

    // 3. Finalize upload session (computes Merkle Root and commits to VFS)
    const finalizeRes = await fetch(
      `${apiUrl}/uploads/${sessionData.sessionId}/complete`,
      {
        method: "POST",
        credentials: "include",
        signal,
      },
    );

    if (!finalizeRes.ok) {
      const errJson = await finalizeRes.json().catch(() => ({}));
      throw new Error(errJson.error || "Failed to finalize file upload");
    }
  }
}

export const uploadQueueManager = new UploadQueueManager();

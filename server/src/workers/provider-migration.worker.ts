import { Queue, Worker as BullWorker, Job } from "bullmq";
import IORedis from "ioredis";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import {
  db,
  providerIdentities,
  fileChunks,
  vfsNodes,
  uploadChunks,
  migrationJobs,
} from "../db/index.js";
import { eq, and, ne, inArray } from "drizzle-orm";
import { getStorageAdapter } from "../adapters/factory.js";
import { TokenService } from "../services/token.service.js";
import { socketManager } from "../websocket/socket-manager.js";
import { PROVIDER_MAX_FILE_LIMITS } from "../services/chunk-decision.service.js";
import { CascadePurgeService } from "../services/cascade-purge.service.js";
import { RecoveryKitService } from "../services/recovery-kit.service.js";

export interface ProviderMigrationJobData {
  userId: string;
  providerIdentityId: string;
  action: "migrate" | "delete" | "smart_unlink";
  migrationJobId?: string;
}

/**
 * Transfers a single chunk from source provider to destination provider via streaming.
 */
async function transferChunk(
  sourceProvider: any,
  sourceToken: string,
  destProvider: any,
  destToken: string,
  chunk: any,
  chunkSize: number,
  targetFileName?: string,
  targetMimeType?: string,
): Promise<string> {
  const tempFilePath = path.join(
    os.tmpdir(),
    `fuze_transfer_${chunk.id}_${Date.now()}.tmp`,
  );

  try {
    const sourceAdapter = getStorageAdapter(sourceProvider.provider);
    const destAdapter = getStorageAdapter(destProvider.provider);

    // 1. Download stream directly to disk
    const downloadUrl = await sourceAdapter.getDownloadUrl({
      providerFileId: chunk.providerFileId,
      accessToken: sourceToken,
    });
    const downloadHeaders: Record<string, string> = {};
    if (sourceProvider.provider === "google_drive") {
      downloadHeaders["Authorization"] = `Bearer ${sourceToken}`;
    }
    const fileStream = await fetch(downloadUrl, { headers: downloadHeaders });
    if (!fileStream.ok || !fileStream.body) {
      throw new Error(`Download failed with status HTTP ${fileStream.status}`);
    }

    await pipeline(
      Readable.fromWeb(fileStream.body as any),
      fs.createWriteStream(tempFilePath),
    );

    const stat = await fs.promises.stat(tempFilePath);
    const actualSize = stat.size;
    const fileName = targetFileName || `fuze_chunk_${chunk.id}`;
    const mimeType = targetMimeType || "application/octet-stream";

    // 2. Upload stream to destination
    const destSession = await destAdapter.createResumableUploadSession({
      fileName,
      mimeType,
      size: actualSize,
      accessToken: destToken,
    });

    const fileBlob = await fs.openAsBlob(tempFilePath);
    let uploadRes: Response;

    if (destSession.uploadType === "multipart") {
      const formData = new FormData();
      if (destSession.formDataFields) {
        for (const [k, v] of Object.entries(destSession.formDataFields)) {
          formData.append(k, v);
        }
      }
      formData.append("file", fileBlob, fileName);
      uploadRes = await fetch(destSession.sessionUrl, {
        method: destSession.httpMethod || "POST",
        headers: destSession.headers,
        body: formData,
      });
    } else {
      const uploadHeaders: Record<string, string> = {
        "Content-Type": mimeType,
        ...(destSession.headers || {}),
      };
      if (
        destProvider.provider === "google_drive" ||
        destProvider.provider === "one_drive"
      ) {
        uploadHeaders["Content-Range"] =
          `bytes 0-${actualSize - 1}/${actualSize}`;
        uploadHeaders["Content-Length"] = String(actualSize);
      }
      uploadRes = await fetch(destSession.sessionUrl, {
        method: destSession.httpMethod || "PUT",
        headers: uploadHeaders,
        body: fileBlob,
      });
    }

    if (!uploadRes.ok) {
      const errText = await uploadRes.text().catch(() => "");
      throw new Error(
        `Upload to destination failed (${uploadRes.status}): ${errText}`,
      );
    }

    // 3. Extract real destination providerFileId
    const resData: any = await uploadRes.json().catch(() => ({}));
    if (
      destProvider.provider === "pcloud" &&
      typeof resData.result === "number" &&
      resData.result !== 0
    ) {
      throw new Error(
        `pCloud upload failed: ${resData.error || `Error code ${resData.result}`}`,
      );
    }

    const newFileId: string | null =
      resData.entries?.[0]?.id || // Box returns { entries: [{ id: "12345" }] }
      resData.id ||               // Google Drive & OneDrive return { id: "..." }
      (resData.fileids?.[0] ? String(resData.fileids[0]) : null) || // pCloud
      resData.path_lower ||       // Dropbox
      null;

    if (!newFileId) {
      throw new Error(
        `Upload to ${destProvider.provider} succeeded but no valid providerFileId was returned.`,
      );
    }

    // 4. Delete old chunk from source provider only after confirmed upload
    await sourceAdapter
      .deleteFile({
        providerFileId: chunk.providerFileId,
        accessToken: sourceToken,
      })
      .catch(() => {});

    return newFileId;
  } finally {
    await fs.promises.unlink(tempFilePath).catch(() => {});
  }
}


export interface MigrationLogItem {
  timestamp: string;
  level: "info" | "warn" | "error" | "success";
  message: string;
}

export class MigrationLogger {
  private logs: MigrationLogItem[] = [];

  constructor(
    private jobId: string | undefined,
    private userId: string,
    private providerId: string,
    private providerName: string,
  ) {}

  async log(level: "info" | "warn" | "error" | "success", message: string) {
    const entry: MigrationLogItem = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };
    this.logs.push(entry);

    const timeStr = new Date().toLocaleTimeString([], { hour12: false });
    const tag = `[Worker: ProviderMigration ${timeStr}]`;
    if (level === "error") console.error(`${tag} ❌ ${message}`);
    else if (level === "warn") console.warn(`${tag} ⚠️ ${message}`);
    else if (level === "success") console.log(`${tag} ✅ ${message}`);
    else console.log(`${tag} ℹ️ ${message}`);

    if (this.jobId) {
      await db
        .update(migrationJobs)
        .set({ logs: JSON.stringify(this.logs) })
        .where(eq(migrationJobs.id, this.jobId))
        .catch(() => {});
    }
  }

  async updateProgress(params: {
    completed: number;
    total: number;
    percent: number;
    transferredBytes: number;
    totalBytes: number;
    currentFileName?: string;
    statusText: string;
    action: string;
  }) {
    if (this.jobId) {
      await db
        .update(migrationJobs)
        .set({
          completedChunks: params.completed,
          totalChunks: params.total,
          percent: params.percent,
          transferredBytes: params.transferredBytes,
          totalBytes: params.totalBytes,
          currentFileName: params.currentFileName || null,
          statusText: params.statusText,
          logs: JSON.stringify(this.logs),
        })
        .where(eq(migrationJobs.id, this.jobId))
        .catch(() => {});
    }

    socketManager.broadcastToUser(this.userId, {
      type: "PROVIDER_CLEANUP_PROGRESS",
      payload: {
        jobId: this.jobId,
        providerId: this.providerId,
        provider: this.providerName,
        action: params.action,
        completed: params.completed,
        total: params.total,
        percent: params.percent,
        transferredBytes: params.transferredBytes,
        totalBytes: params.totalBytes,
        currentFileName: params.currentFileName,
        statusText: params.statusText,
        logs: this.logs,
      },
    });
  }

  async finish(status: "completed" | "failed", errorMessage?: string) {
    if (this.jobId) {
      await db
        .update(migrationJobs)
        .set({
          status,
          percent: status === "completed" ? 100 : undefined,
          completedAt: new Date(),
          errorMessage: errorMessage || null,
          statusText: status === "completed" ? "Migration completed successfully." : `Failed: ${errorMessage}`,
          logs: JSON.stringify(this.logs),
        })
        .where(eq(migrationJobs.id, this.jobId))
        .catch(() => {});
    }
  }

  getLogs() {
    return this.logs;
  }
}

export async function executeProviderMigration(
  data: ProviderMigrationJobData,
  jobId: string = `mig_${Date.now()}`,
) {
  const startedAt = Date.now();
  const { userId, providerIdentityId, action } = data;

  console.log(
    `[Worker: ProviderMigration] 🚀 Job #${jobId} started: Provider [${providerIdentityId}] (Action: ${action.toUpperCase()})`,
  );

  const [targetProvider] = await db
    .select()
    .from(providerIdentities)
    .where(
      and(
        eq(providerIdentities.id, providerIdentityId),
        eq(providerIdentities.userId, userId),
      ),
    );

  if (!targetProvider) {
    console.warn(`[Worker: ProviderMigration] ⚠️ Provider not found.`);
    return;
  }

  const providerName = targetProvider.provider.toUpperCase();
  const effectiveJobId = data.migrationJobId || jobId;
  const logger = new MigrationLogger(effectiveJobId, userId, providerIdentityId, providerName);
  await logger.log("info", `Job #${effectiveJobId}: Migration worker started for ${providerName} (${action.toUpperCase()} mode).`);

  let targetToken = "";
  try {
    targetToken = await TokenService.getValidAccessToken(providerIdentityId);
  } catch (err) {
    console.warn(
      `[Worker: ProviderMigration] Note: Source token expired or invalid for ${providerName}. Proceeding with best effort.`,
    );
  }

  const localChunks = await db
    .select()
    .from(fileChunks)
    .where(eq(fileChunks.providerIdentityId, providerIdentityId));

  const totalChunks = localChunks.length;
  let processed = 0;
  const totalBytes = localChunks.reduce((sum, c) => sum + (Number(c.byteEnd) - Number(c.byteStart)), 0);
  let transferredBytes = 0;
  await logger.log("info", `Found ${totalChunks} chunk(s) totaling ${(totalBytes / (1024 * 1024)).toFixed(2)} MB on ${providerName}.`);

  // Pre-load all affected VFS nodes to preserve real filenames and extensions
  const affectedNodeIds = Array.from(
    new Set(localChunks.map((c) => c.vfsNodeId)),
  );
  const nodes =
    affectedNodeIds.length > 0
      ? await db
          .select()
          .from(vfsNodes)
          .where(inArray(vfsNodes.id, affectedNodeIds))
      : [];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // -------------------------------------------------------------
  // ACTION: SMART EVACUATE (Smart Preservation + Multi-Destination Relocation)
  // -------------------------------------------------------------
  if (action === "smart_unlink") {
    const otherProviders = await db
      .select()
      .from(providerIdentities)
      .where(
        and(
          eq(providerIdentities.userId, userId),
          ne(providerIdentities.id, providerIdentityId),
          eq(providerIdentities.isDisconnected, false),
          eq(providerIdentities.isRevoked, false),
        ),
      );

    await logger.log(
      "info",
      `Smart Evacuate initiated. Scanning ${affectedNodeIds.length} affected file(s)...`,
    );

    let processedNodes = 0;

    for (const nodeId of affectedNodeIds) {
      const allChunksForNode = await db
        .select()
        .from(fileChunks)
        .where(eq(fileChunks.vfsNodeId, nodeId))
        .orderBy(fileChunks.chunkIndex);

      const node = nodeMap.get(nodeId);

      // 1. Whole File (totalChunks === 1) -> 0 MB transfer! Left intact in cloud
      if (allChunksForNode.length === 1) {
        await logger.log(
          "info",
          `✓ Preserved whole file "${node?.name || nodeId}" intact in ${providerName} (0 MB transfer).`,
        );
        processedNodes++;
        continue;
      }

      // 2. Chunked File: Are all chunks already on this provider?
      const chunksOnOthers = allChunksForNode.filter(
        (c) => c.providerIdentityId !== providerIdentityId,
      );

      if (chunksOnOthers.length === 0) {
        await logger.log(
          "info",
          `✓ All ${allChunksForNode.length} parts of "${node?.name || nodeId}" reside in ${providerName}. Preserved intact.`,
        );
        processedNodes++;
        continue;
      }

      // 3. Chunks are split across clouds: Try FORWARD evacuation first (move this cloud's chunk to remaining clouds)
      const chunkOnThisCloud = allChunksForNode.find(
        (c) => c.providerIdentityId === providerIdentityId,
      );

      let forwardSuccess = false;

      if (chunkOnThisCloud && otherProviders.length > 0) {
        const chunkSize = chunkOnThisCloud.byteEnd - chunkOnThisCloud.byteStart;
        const eligible = otherProviders
          .filter((p) => {
            const limit = PROVIDER_MAX_FILE_LIMITS[p.provider] ?? Infinity;
            return (
              p.quotaTotal - p.quotaUsed >= chunkSize && chunkSize <= limit
            );
          })
          .sort(
            (a, b) => b.quotaTotal - b.quotaUsed - (a.quotaTotal - a.quotaUsed),
          );

        const targetFileName = `${node?.name || "chunk"}.part${chunkOnThisCloud.chunkIndex}`;
        const targetMime = node?.mimeType || "application/octet-stream";

        for (const dest of eligible) {
          try {
            await logger.log(
              "info",
              `Evacuating split chunk ${chunkOnThisCloud.chunkIndex} of "${targetFileName}" (${(chunkSize / (1024 * 1024)).toFixed(2)} MB) to ${dest.provider.toUpperCase()}...`,
            );
            const destToken = await TokenService.getValidAccessToken(dest.id);

            const newFileId = await transferChunk(
              targetProvider,
              targetToken,
              dest,
              destToken,
              chunkOnThisCloud,
              chunkSize,
              targetFileName,
              targetMime,
            );

            await db
              .update(fileChunks)
              .set({ providerIdentityId: dest.id, providerFileId: newFileId })
              .where(eq(fileChunks.id, chunkOnThisCloud.id));

            dest.quotaUsed += chunkSize;
            await db
              .update(providerIdentities)
              .set({ quotaUsed: dest.quotaUsed })
              .where(eq(providerIdentities.id, dest.id));

            transferredBytes += chunkSize;
            forwardSuccess = true;
            await logger.log(
              "success",
              `✓ Successfully relocated split chunk to ${dest.provider.toUpperCase()}`,
            );
            break;
          } catch (err: any) {
            await logger.log(
              "warn",
              `Relocation to ${dest.provider.toUpperCase()} failed (${err?.message || err}). Trying next cloud...`,
            );
          }
        }
      }

      if (forwardSuccess) {
        processedNodes++;
        continue;
      }

      // 4. FORWARD failed (other clouds full or offline): Try REVERSE CONSOLIDATION!
      let reverseSuccess = true;
      const bytesNeeded = chunksOnOthers.reduce(
        (sum, c) => sum + (c.byteEnd - c.byteStart),
        0,
      );
      const targetFreeBytes =
        targetProvider.quotaTotal - targetProvider.quotaUsed;

      if (targetFreeBytes >= bytesNeeded) {
        await logger.log(
          "info",
          `Consolidating ${chunksOnOthers.length} parts of "${node?.name || nodeId}" into ${providerName}...`,
        );

        for (const remoteChunk of chunksOnOthers) {
          const [remoteProvider] = await db
            .select()
            .from(providerIdentities)
            .where(eq(providerIdentities.id, remoteChunk.providerIdentityId));

          if (!remoteProvider) {
            reverseSuccess = false;
            break;
          }

          try {
            const remoteToken = await TokenService.getValidAccessToken(
              remoteProvider.id,
            );
            const chunkSize = remoteChunk.byteEnd - remoteChunk.byteStart;
            const targetFileName = `${node?.name || "chunk"}.part${remoteChunk.chunkIndex}`;
            const targetMime = node?.mimeType || "application/octet-stream";

            const newFileId = await transferChunk(
              remoteProvider,
              remoteToken,
              targetProvider,
              targetToken,
              remoteChunk,
              chunkSize,
              targetFileName,
              targetMime,
            );

            await db
              .update(fileChunks)
              .set({
                providerIdentityId: providerIdentityId,
                providerFileId: newFileId,
              })
              .where(eq(fileChunks.id, remoteChunk.id));

            targetProvider.quotaUsed += chunkSize;
            await db
              .update(providerIdentities)
              .set({ quotaUsed: targetProvider.quotaUsed })
              .where(eq(providerIdentities.id, providerIdentityId));

            transferredBytes += chunkSize;
            await logger.log(
              "success",
              `✓ Consolidated part ${remoteChunk.chunkIndex} into ${providerName}`,
            );
          } catch (err: any) {
            await logger.log(
              "warn",
              `Reverse consolidation failed: ${err?.message || err}`,
            );
            reverseSuccess = false;
            break;
          }
        }
      } else {
        reverseSuccess = false;
      }

      if (!reverseSuccess) {
        await logger.log(
          "warn",
          `File "${node?.name || nodeId}" could not be unified across clouds. Preserving DB record.`,
        );
      }
      processedNodes++;
    }

    try {
      await RecoveryKitService.deployRecoveryKit(userId, providerIdentityId);
    } catch {}

    await logger.updateProgress({
      completed: totalChunks,
      total: totalChunks,
      percent: 100,
      transferredBytes,
      totalBytes,
      statusText: "Smart Evacuation completed successfully.",
      action,
    });
    await logger.finish("completed");
  }

  // -------------------------------------------------------------
  // ACTION: MOVE ALL FILES (Standard Full Evacuation)
  // -------------------------------------------------------------
  if (action === "migrate") {
    const otherProviders = await db
      .select()
      .from(providerIdentities)
      .where(
        and(
          eq(providerIdentities.userId, userId),
          ne(providerIdentities.id, providerIdentityId),
          eq(providerIdentities.isDisconnected, false),
          eq(providerIdentities.isRevoked, false),
        ),
      );

    const failedChunks: typeof localChunks = [];

    for (const chunk of localChunks) {
      const chunkSize = chunk.byteEnd - chunk.byteStart;
      const eligible = otherProviders
        .filter((p) => {
          const limit = PROVIDER_MAX_FILE_LIMITS[p.provider] ?? Infinity;
          return p.quotaTotal - p.quotaUsed >= chunkSize && chunkSize <= limit;
        })
        .sort(
          (a, b) => b.quotaTotal - b.quotaUsed - (a.quotaTotal - a.quotaUsed),
        );

      const node = nodeMap.get(chunk.vfsNodeId);
      const totalPartsForFile = localChunks.filter(
        (c) => c.vfsNodeId === chunk.vfsNodeId,
      ).length;
      const targetFileName =
        totalPartsForFile > 1
          ? `${node?.name || "chunk"}.part${chunk.chunkIndex}`
          : (node?.name || `fuze_file_${chunk.id}`);
      const targetMime = node?.mimeType || "application/octet-stream";

      let chunkMoved = false;

      for (const dest of eligible) {
        try {
          await logger.log(
            "info",
            `Transferring chunk ${processed + 1}/${totalChunks} of "${targetFileName}" (${(chunkSize / (1024 * 1024)).toFixed(2)} MB) to ${dest.provider.toUpperCase()}...`,
          );
          const destToken = await TokenService.getValidAccessToken(dest.id);

          const newFileId = await transferChunk(
            targetProvider,
            targetToken,
            dest,
            destToken,
            chunk,
            chunkSize,
            targetFileName,
            targetMime,
          );

          await db
            .update(fileChunks)
            .set({ providerIdentityId: dest.id, providerFileId: newFileId })
            .where(eq(fileChunks.id, chunk.id));

          dest.quotaUsed += chunkSize;
          await db
            .update(providerIdentities)
            .set({ quotaUsed: dest.quotaUsed })
            .where(eq(providerIdentities.id, dest.id));

          transferredBytes += chunkSize;
          chunkMoved = true;
          await logger.log(
            "success",
            `✓ Relocated chunk ${processed + 1}/${totalChunks} of "${targetFileName}" to ${dest.provider.toUpperCase()}`,
          );
          break;
        } catch (err: any) {
          await logger.log(
            "warn",
            `Transfer to ${dest.provider.toUpperCase()} failed (${err?.message || err}). Trying next cloud...`,
          );
        }
      }

      if (!chunkMoved) {
        await logger.log(
          "error",
          `✗ Failed to relocate chunk "${targetFileName}" to any connected cloud.`,
        );
        failedChunks.push(chunk);
      }

      processed++;
      const currentPercent = Math.round((processed / totalChunks) * 100);
      await logger.updateProgress({
        completed: processed,
        total: totalChunks,
        percent: currentPercent,
        transferredBytes,
        totalBytes,
        currentFileName: targetFileName,
        statusText: `Relocating "${targetFileName}" (${currentPercent}%)`,
        action,
      });
    }

    if (failedChunks.length > 0) {
      await logger.log(
        "error",
        `${failedChunks.length} chunk(s) could not be relocated. Preserving original records and halting disconnection.`,
      );
      await logger.finish(
        "failed",
        `${failedChunks.length} file part(s) could not be moved because destination storage was full or unavailable.`,
      );
      socketManager.broadcastToUser(userId, {
        type: "PROVIDER_MIGRATION_FAILED",
        payload: {
          providerId: providerIdentityId,
          failedCount: failedChunks.length,
          total: totalChunks,
          message: `${failedChunks.length} file part(s) could not be moved because destination storage was full or unavailable. Files remain safe in ${providerName}.`,
        },
      });
      return;
    }

    await logger.finish("completed");
  }

  // -------------------------------------------------------------
  // ACTION: DELETE ALL FILES
  // -------------------------------------------------------------
  if (action === "delete") {
    const adapter = getStorageAdapter(targetProvider.provider);

    for (const chunk of localChunks) {
      await adapter
        .deleteFile({
          providerFileId: chunk.providerFileId,
          accessToken: targetToken,
        })
        .catch(() => {});
    }

    const affectedNodeIds = Array.from(
      new Set(localChunks.map((c) => c.vfsNodeId)),
    );
    for (const nodeId of affectedNodeIds) {
      await CascadePurgeService.purgeUnsalvageableFile(
        userId,
        nodeId,
        providerIdentityId,
      );
    }
    await logger.finish("completed");
  }

  // -------------------------------------------------------------
  // FINALIZE: Unlink provider row and broadcast
  // -------------------------------------------------------------
  if (action === "smart_unlink") {
    await db
      .update(providerIdentities)
      .set({ isDisconnected: true, pendingRestore: true, isRevoked: false })
      .where(eq(providerIdentities.id, providerIdentityId));
    socketManager.broadcastToUser(userId, {
      type: "PROVIDER_DISCONNECTED",
      payload: { providerId: providerIdentityId },
    });
    return;
  }

  await db
    .delete(fileChunks)
    .where(eq(fileChunks.providerIdentityId, providerIdentityId));

  await db
    .delete(uploadChunks)
    .where(eq(uploadChunks.providerIdentityId, providerIdentityId));

  await db
    .delete(providerIdentities)
    .where(eq(providerIdentities.id, providerIdentityId));

  socketManager.broadcastToUser(userId, {
    type: "PROVIDER_DISCONNECTED",
    payload: { providerId: providerIdentityId },
  });

  console.log(
    `[Worker: ProviderMigration] ✅ Disconnected ${providerName} in ${Date.now() - startedAt}ms.`,
  );
}

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const queueRedisConnection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  enableOfflineQueue: false,
});
queueRedisConnection.on("error", () => {});

export const providerMigrationQueue = new Queue<ProviderMigrationJobData>(
  "provider-migration",
  {
    connection: queueRedisConnection,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  },
);

export async function queueProviderMigration(
  data: ProviderMigrationJobData,
): Promise<{ id: string }> {
  try {
    const job = await providerMigrationQueue.add("disconnect-provider", data);
    return { id: String(job.id) };
  } catch (err: any) {
    const jobId = `mig_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setImmediate(async () => {
      try {
        await executeProviderMigration(data, jobId);
      } catch (e: any) {
        console.error(`[Worker: ProviderMigration] Job #${jobId} failed:`, e?.message);
      }
    });
    return { id: jobId };
  }
}

let migrationWorkerInstance: BullWorker<ProviderMigrationJobData> | null = null;

export function initProviderMigrationWorker() {
  if (migrationWorkerInstance) return migrationWorkerInstance;

  try {
    migrationWorkerInstance = new BullWorker<ProviderMigrationJobData>(
      "provider-migration",
      async (job: Job<ProviderMigrationJobData>) => {
        console.log(`[Worker: ProviderMigration] ⚙️ Processing BullMQ job #${job.id}...`);
        await executeProviderMigration(job.data, String(job.id) || `mig_${Date.now()}`);
      },
      {
        connection: new IORedis(redisUrl, {
          maxRetriesPerRequest: null,
          lazyConnect: true,
        }),
        concurrency: 2,
      },
    );

    migrationWorkerInstance.on("failed", (job, err) => {
      console.error(`[Worker: ProviderMigration] ❌ Job #${job?.id} failed:`, err?.message);
    });
  } catch (err: any) {
    console.warn(`[Worker: ProviderMigration] Could not initialize BullMQ worker: ${err.message}`);
  }

  return migrationWorkerInstance;
}

export const providerMigrationWorker = {
  close: async () => {
    if (migrationWorkerInstance) {
      await migrationWorkerInstance.close();
      migrationWorkerInstance = null;
    }
  },
};

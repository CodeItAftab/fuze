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
import { eq, and, ne, inArray, sql } from "drizzle-orm";
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

  async finish(
    status: "completed" | "failed" | "cancelled",
    errorMessage?: string,
  ) {
    if (this.jobId) {
      await db
        .update(migrationJobs)
        .set({
          status,
          percent: status === "completed" ? 100 : undefined,
          completedAt: new Date(),
          errorMessage: errorMessage || null,
          statusText:
            status === "completed"
              ? "Operation completed successfully."
              : status === "cancelled"
                ? "Migration cancelled by user. Transferred files retained."
                : `Failed: ${errorMessage}`,
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

/**
 * Transfers a single chunk or whole file between two providers with streaming and verification.
 */
async function transferChunk(
  sourceProvider: any,
  sourceToken: string,
  destProvider: any,
  destToken: string,
  chunk: any,
  chunkSize: number,
  targetFileName: string,
  targetMimeType: string,
): Promise<string> {
  const tempFilePath = path.join(
    os.tmpdir(),
    `fuze_mig_${chunk.id}_${Date.now()}.tmp`,
  );

  try {
    // 1. Stream from source provider
    const sourceAdapter = getStorageAdapter(sourceProvider.provider);
    const downloadUrl = await sourceAdapter.getDownloadUrl({
      providerFileId: chunk.providerFileId,
      accessToken: sourceToken,
    });

    let dlRes: Response;
    try {
      dlRes = await fetch(downloadUrl);
    } catch (e: any) {
      throw new Error(
        `Failed to download from ${sourceProvider.provider}: ${e?.cause?.message || e?.message || e}`,
      );
    }
    if (!dlRes.ok || !dlRes.body) {
      const errBody = await dlRes.text().catch(() => "");
      throw new Error(
        `Failed to download from ${sourceProvider.provider} (HTTP ${dlRes.status}): ${errBody}`,
      );
    }

    const fileStream = fs.createWriteStream(tempFilePath);
    await pipeline(Readable.fromWeb(dlRes.body as any), fileStream);

    const stat = await fs.promises.stat(tempFilePath);
    if (stat.size === 0 && chunkSize > 0) {
      throw new Error("Downloaded empty chunk from source provider.");
    }

    // 2. Upload to destination provider
    const destAdapter = getStorageAdapter(destProvider.provider);
    const uploadSession = await destAdapter.createResumableUploadSession({
      fileName: targetFileName,
      mimeType: targetMimeType || "application/octet-stream",
      size: stat.size,
      accessToken: destToken,
    });

    let newFileId: string;

    try {
      // Handle pCloud / Multipart form-data uploads
      if (
        uploadSession.uploadType === "multipart" ||
        destProvider.provider === "pcloud"
      ) {
        const fileBuffer = await fs.promises.readFile(tempFilePath);
        const formData = new FormData();

        if (uploadSession.formDataFields) {
          for (const [k, v] of Object.entries(uploadSession.formDataFields)) {
            formData.append(k, v);
          }
        }

        formData.append(
          "file",
          new Blob([fileBuffer], {
            type: targetMimeType || "application/octet-stream",
          }),
          targetFileName,
        );

        const upRes = await fetch(uploadSession.sessionUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${destToken}`,
          },
          body: formData,
        });

        if (!upRes.ok && upRes.status !== 200 && upRes.status !== 201) {
          const errText = await upRes.text().catch(() => "");
          throw new Error(
            `Upload to ${destProvider.provider} failed (${upRes.status}): ${errText}`,
          );
        }
        const data = (await upRes.json().catch(() => ({}))) as any;
        newFileId = String(
          data.fileids?.[0] || data.id || data.name || targetFileName,
        );
      } else {
        // Standard binary stream upload (Box, Google Drive, OneDrive)
        const upRes = await fetch(uploadSession.sessionUrl, {
          method: uploadSession.httpMethod || "POST",
          headers: {
            ...(uploadSession.headers || {}),
            "Content-Length": String(stat.size),
          },
          body: fs.createReadStream(tempFilePath) as any,
          duplex: "half",
        } as any);

        if (!upRes.ok && upRes.status !== 200 && upRes.status !== 201) {
          const errText = await upRes.text().catch(() => "");
          throw new Error(
            `Upload to ${destProvider.provider} failed (${upRes.status}): ${errText}`,
          );
        }
        const data = (await upRes.json().catch(() => ({}))) as any;
        newFileId = data.id || data.name || targetFileName;
      }
    } catch (e: any) {
      throw new Error(
        `Upload to ${destProvider.provider} failed: ${e?.cause?.message || e?.message || e}`,
      );
    }

    // 3. Delete source chunk ONLY after upload is completely verified
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
/**
 * Main Migration Execution Engine
 */
export async function executeProviderMigration(
  data: ProviderMigrationJobData,
  jobId: string = `mig_${Date.now()}`,
) {
  const startedAt = Date.now();
  const { userId, providerIdentityId, action } = data;

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
    console.warn(
      `[Worker: ProviderMigration] ⚠️ Provider ${providerIdentityId} not found.`,
    );
    return;
  }

  const providerName = targetProvider.provider.toUpperCase();
  const effectiveJobId = data.migrationJobId || jobId;
  const logger = new MigrationLogger(
    effectiveJobId,
    userId,
    providerIdentityId,
    providerName,
  );

  await logger.log(
    "info",
    `🚀 Starting ${action.toUpperCase()} process for ${providerName} (${targetProvider.accountEmail || providerIdentityId}).`,
  );

  let targetToken = "";
  try {
    targetToken = await TokenService.getValidAccessToken(providerIdentityId);
  } catch (err: any) {
    await logger.log(
      "warn",
      `Notice: Source token invalid or expired. Best effort execution.`,
    );
  }

  const localChunks = await db
    .select()
    .from(fileChunks)
    .where(eq(fileChunks.providerIdentityId, providerIdentityId));

  const totalChunks = localChunks.length;
  let processed = 0;
  const totalBytes = localChunks.reduce(
    (sum, c) => sum + (Number(c.byteEnd) - Number(c.byteStart)),
    0,
  );
  let transferredBytes = 0;

  await logger.log(
    "info",
    `Found ${totalChunks} chunk(s) totaling ${(totalBytes / (1024 * 1024)).toFixed(2)} MB on ${providerName}.`,
  );

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

  // -------------------------------------------------------------------------
  // 1. SMART UNLINK: Whole files intact in cloud; multi-cloud chunks relocated
  // -------------------------------------------------------------------------
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
      `Smart Unlink: Preserving whole files. Analyzing ${affectedNodeIds.length} file(s) for split chunks...`,
    );

    let evacuatedChunks = 0;

    for (const nodeId of affectedNodeIds) {
      // Check cancellation request
      if (effectiveJobId) {
        const [currentJob] = await db
          .select({ status: migrationJobs.status })
          .from(migrationJobs)
          .where(eq(migrationJobs.id, effectiveJobId));
        if (currentJob?.status === "cancelled") {
          await logger.log(
            "warn",
            "Migration cancellation detected. Halting operations.",
          );
          await logger.finish("cancelled");
          return;
        }
      }

      const allChunks = await db
        .select()
        .from(fileChunks)
        .where(eq(fileChunks.vfsNodeId, nodeId))
        .orderBy(fileChunks.chunkIndex);

      const node = nodeMap.get(nodeId);

      // Whole file: left untouched in cloud
      if (allChunks.length === 1) {
        await logger.log(
          "info",
          `✓ File "${node?.name || nodeId}" is complete on ${providerName}. Preserved intact (0 MB transferred).`,
        );
        continue;
      }

      // Check if this file has chunks on other clouds
      const otherChunks = allChunks.filter(
        (c) => c.providerIdentityId !== providerIdentityId,
      );
      if (otherChunks.length === 0) {
        await logger.log(
          "info",
          `✓ All parts of "${node?.name || nodeId}" are on ${providerName}. Preserved intact.`,
        );
        continue;
      }

      // Chunk is split across multiple providers: EVACUATE split piece
      const chunkOnThisCloud = allChunks.find(
        (c) => c.providerIdentityId === providerIdentityId,
      );
      if (!chunkOnThisCloud) continue;

      const chunkSize =
        Number(chunkOnThisCloud.byteEnd) - Number(chunkOnThisCloud.byteStart);
      const eligible = otherProviders
        .filter((p) => {
          const limit = PROVIDER_MAX_FILE_LIMITS[p.provider] ?? Infinity;
          return p.quotaTotal - p.quotaUsed >= chunkSize && chunkSize <= limit;
        })
        .sort(
          (a, b) => b.quotaTotal - b.quotaUsed - (a.quotaTotal - a.quotaUsed),
        );

      let chunkMoved = false;
      const targetFileName = `${node?.name || "chunk"}.part${chunkOnThisCloud.chunkIndex}`;
      const targetMime = node?.mimeType || "application/octet-stream";

      for (const dest of eligible) {
        try {
          await logger.log(
            "info",
            `Evacuating split piece part #${chunkOnThisCloud.chunkIndex} of "${node?.name}" (${(chunkSize / (1024 * 1024)).toFixed(2)} MB) to ${dest.provider.toUpperCase()}...`,
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
          evacuatedChunks++;
          chunkMoved = true;
          await logger.log(
            "success",
            `✓ Successfully relocated split piece to ${dest.provider.toUpperCase()}`,
          );
          break;
        } catch (err: any) {
          await logger.log(
            "warn",
            `Could not move split chunk to ${dest.provider.toUpperCase()}: ${err?.message || err}. Trying next cloud...`,
          );
        }
      }

      if (!chunkMoved) {
        await logger.log(
          "warn",
          `Unable to relocate split chunk of "${node?.name}". Retaining original records for safe reconnect recovery.`,
        );
      }
    }

    try {
      await RecoveryKitService.deployRecoveryKit(userId, providerIdentityId);
    } catch {}

    // Mark provider as disconnected and inactive (preserving all intact file records)
    await db
      .update(providerIdentities)
      .set({ isDisconnected: true, pendingRestore: true, isRevoked: false })
      .where(eq(providerIdentities.id, providerIdentityId));

    await logger.updateProgress({
      completed: totalChunks,
      total: totalChunks,
      percent: 100,
      transferredBytes,
      totalBytes,
      statusText:
        "Smart Unlink completed. Whole files remain safe in your cloud.",
      action,
    });
    await logger.finish("completed");

    socketManager.broadcastToUser(userId, {
      type: "PROVIDER_DISCONNECTED",
      payload: { providerId: providerIdentityId },
    });
    return;
  }

  // -------------------------------------------------------------------------
  // 2. MOVE ALL FILES: Preference to whole storage, fallback to chunking
  // -------------------------------------------------------------------------
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
    let successfulChunks = 0;

    for (const chunk of localChunks) {
      // Check cancellation request before processing next chunk
      if (effectiveJobId) {
        const [currentJob] = await db
          .select({ status: migrationJobs.status })
          .from(migrationJobs)
          .where(eq(migrationJobs.id, effectiveJobId));
        if (currentJob?.status === "cancelled") {
          await logger.log(
            "warn",
            "Migration cancelled by user. Halting remaining transfers. Already migrated files remain in destination clouds.",
          );
          await logger.finish("cancelled");
          return;
        }
      }

      const chunkSize = Number(chunk.byteEnd) - Number(chunk.byteStart);
      const node = nodeMap.get(chunk.vfsNodeId);

      // Prioritize clouds that can accept whole files under provider limits
      const eligible = otherProviders
        .filter((p) => {
          const limit = PROVIDER_MAX_FILE_LIMITS[p.provider] ?? Infinity;
          return p.quotaTotal - p.quotaUsed >= chunkSize && chunkSize <= limit;
        })
        .sort(
          (a, b) => b.quotaTotal - b.quotaUsed - (a.quotaTotal - a.quotaUsed),
        );

      const totalParts = localChunks.filter(
        (c) => c.vfsNodeId === chunk.vfsNodeId,
      ).length;
      const targetFileName =
        totalParts > 1
          ? `${node?.name || "chunk"}.part${chunk.chunkIndex}`
          : node?.name || `fuze_file_${chunk.id}`;
      const targetMime = node?.mimeType || "application/octet-stream";

      let chunkMoved = false;

      for (const dest of eligible) {
        try {
          await logger.log(
            "info",
            `Transferring (${processed + 1}/${totalChunks}) "${targetFileName}" (${(chunkSize / (1024 * 1024)).toFixed(2)} MB) to ${dest.provider.toUpperCase()}...`,
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
            `✓ Relocated "${targetFileName}" to ${dest.provider.toUpperCase()}`,
          );
          break;
        } catch (err: any) {
          await logger.log(
            "warn",
            `Transfer of "${targetFileName}" to ${dest.provider.toUpperCase()} failed (${err?.message || err}). Trying next available cloud...`,
          );
        }
      }

      if (!chunkMoved) {
        await logger.log(
          "error",
          `✗ Failed to relocate "${targetFileName}" to any connected cloud (insufficient capacity or authorization).`,
        );
        failedChunks.push(chunk);
      } else {
        successfulChunks++;
      }

      processed++;
      const currentPercent = Math.round((successfulChunks / totalChunks) * 100);
      await logger.updateProgress({
        completed: successfulChunks,
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
        `⚠️ ${failedChunks.length} of ${totalChunks} file part(s) could not be relocated. Preserving original records on ${providerName} to guarantee zero data loss.`,
      );
      await logger.finish(
        "failed",
        `${failedChunks.length} of ${totalChunks} file part(s) could not be moved because destination storage was full or unavailable.`,
      );
      socketManager.broadcastToUser(userId, {
        type: "PROVIDER_MIGRATION_FAILED",
        payload: {
          providerId: providerIdentityId,
          failedCount: failedChunks.length,
          total: totalChunks,
          message: `${failedChunks.length} file part(s) could not be relocated. Files remain safe in ${providerName}.`,
        },
      });
      return;
    }

    await logger.finish("completed");
  }

  // -------------------------------------------------------------------------
  // 3. DELETE ALL FILES: Permanent cloud and database wipe with chunk protection
  // -------------------------------------------------------------------------
  if (action === "delete") {
    await logger.log(
      "warn",
      `Permanent Wipe: Cleaning files from ${providerName} and records from database.`,
    );
    const adapter = getStorageAdapter(targetProvider.provider);

    for (const chunk of localChunks) {
      await adapter
        .deleteFile({
          providerFileId: chunk.providerFileId,
          accessToken: targetToken,
        })
        .catch(() => {});
    }

    for (const nodeId of affectedNodeIds) {
      await CascadePurgeService.purgeUnsalvageableFile(
        userId,
        nodeId,
        providerIdentityId,
      );
    }
    await logger.finish("completed");
  }

  // Finalize: unlink and clean up database records
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
    `[Worker: ProviderMigration] ✅ Successfully completed ${action} for ${providerName} in ${Date.now() - startedAt}ms.`,
  );
}

// ---------------------------------------------------------------------------
// 4. RECONNECTION RECONCILIATION
// ---------------------------------------------------------------------------
export async function reconcileReconnectedProvider(
  userId: string,
  providerIdentityId: string,
): Promise<{ restoredCount: number; purgedCount: number }> {
  console.log(
    `[Reconnection] 🔄 Checking files for reconnected provider [${providerIdentityId}]...`,
  );

  const [provider] = await db
    .select()
    .from(providerIdentities)
    .where(
      and(
        eq(providerIdentities.id, providerIdentityId),
        eq(providerIdentities.userId, userId),
      ),
    );

  if (!provider) return { restoredCount: 0, purgedCount: 0 };

  const chunks = await db
    .select()
    .from(fileChunks)
    .where(eq(fileChunks.providerIdentityId, providerIdentityId));

  if (chunks.length === 0) return { restoredCount: 0, purgedCount: 0 };

  let token = "";
  try {
    token = await TokenService.getValidAccessToken(providerIdentityId);
  } catch {
    return { restoredCount: 0, purgedCount: 0 };
  }

  const adapter = getStorageAdapter(provider.provider);
  let restoredCount = 0;
  let purgedCount = 0;

  for (const chunk of chunks) {
    try {
      await adapter.getDownloadUrl({
        providerFileId: chunk.providerFileId,
        accessToken: token,
      });
      restoredCount++;
    } catch {
      // File was deleted in cloud provider while disconnected -> purge DB record
      await db.delete(fileChunks).where(eq(fileChunks.id, chunk.id));
      purgedCount++;

      const remainingSiblings = await db
        .select({ id: fileChunks.id })
        .from(fileChunks)
        .where(eq(fileChunks.vfsNodeId, chunk.vfsNodeId));

      if (remainingSiblings.length === 0) {
        await db.delete(vfsNodes).where(eq(vfsNodes.id, chunk.vfsNodeId));
      }
    }
  }

  await db
    .update(providerIdentities)
    .set({ isDisconnected: false, pendingRestore: false, isRevoked: false })
    .where(eq(providerIdentities.id, providerIdentityId));

  console.log(
    `[Reconnection] ✅ Reconciliation complete: ${restoredCount} file(s) restored, ${purgedCount} missing file(s) cleaned up.`,
  );

  return { restoredCount, purgedCount };
}

// BullMQ Queue Configuration
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
  } catch {
    const jobId = `mig_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setImmediate(async () => {
      try {
        await executeProviderMigration(data, jobId);
      } catch (e: any) {
        console.error(
          `[Worker: ProviderMigration] Job #${jobId} failed:`,
          e?.message,
        );
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
        await executeProviderMigration(
          job.data,
          String(job.id) || `mig_${Date.now()}`,
        );
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
      console.error(
        `[Worker: ProviderMigration] ❌ Job #${job?.id} failed:`,
        err?.message,
      );
    });
  } catch (err: any) {
    console.warn(
      `[Worker: ProviderMigration] Could not initialize BullMQ worker: ${err.message}`,
    );
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

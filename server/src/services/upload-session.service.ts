import {
  db,
  uploadSessions,
  uploadChunks,
  vfsNodes,
  fileChunks,
  providerIdentities,
} from "../db/index.js";
import { eq, and } from "drizzle-orm";
import { ChunkDecisionService } from "./chunk-decision.service.js";
import { TokenService } from "./token.service.js";
import { getStorageAdapter } from "../adapters/factory.js";
import { computeMerkleRoot } from "../utils/crypto.js";
import { socketManager } from "../websocket/socket-manager.js";

export class UploadSessionService {
  static async createSession(params: {
    userId: string;
    fileName: string;
    mimeType: string;
    totalSize: number;
    parentId?: string | null;
  }) {
    // 1. Fetch connected providers and their quotas
    const identities = await db
      .select()
      .from(providerIdentities)
      .where(eq(providerIdentities.userId, params.userId));

    const providerQuotas = identities.map((id) => ({
      providerIdentityId: id.id,
      provider: id.provider,
      freeBytes: Math.max(0, id.quotaTotal - id.quotaUsed),
    }));

    // 2. Run Intelligent Chunking Decision (Whole if fits ANY, Chunked if exceeds all)
    const decision = ChunkDecisionService.plan(
      params.totalSize,
      providerQuotas,
    );
    if (decision.error) {
      throw new Error(decision.error);
    }

    // 3. Create Session in DB (valid for 7 days for web & mobile resumability)
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    const [session] = await db
      .insert(uploadSessions)
      .values({
        userId: params.userId,
        parentId: params.parentId || null,
        fileName: params.fileName,
        mimeType: params.mimeType,
        totalSize: params.totalSize,
        strategy: decision.strategy,
        status: "uploading",
        expiresAt,
      })
      .returning();

    // 4. Create Chunk Rows
    for (const chunk of decision.chunks) {
      await db.insert(uploadChunks).values({
        uploadSessionId: session!.id,
        chunkIndex: chunk.index,
        byteStart: chunk.byteStart,
        byteEnd: chunk.byteEnd,
        providerIdentityId: chunk.providerIdentityId,
        status: "pending",
      });
    }

    return {
      sessionId: session!.id,
      strategy: decision.strategy,
      totalChunks: decision.chunks.length,
      chunks: decision.chunks,
    };
  }

  static async getChunkUploadUrl(
    sessionId: string,
    chunkIndex: number,
    clientOrigin?: string,
  ) {
    const [chunk] = await db
      .select()
      .from(uploadChunks)
      .where(
        and(
          eq(uploadChunks.uploadSessionId, sessionId),
          eq(uploadChunks.chunkIndex, chunkIndex),
        ),
      );

    if (!chunk) throw new Error("Chunk not found");

    const [session] = await db
      .select()
      .from(uploadSessions)
      .where(eq(uploadSessions.id, sessionId));

    if (!session) throw new Error("Upload session not found");

    // 1. Fetch provider identity to know WHICH cloud provider this chunk belongs to
    const [identity] = await db
      .select({ provider: providerIdentities.provider })
      .from(providerIdentities)
      .where(eq(providerIdentities.id, chunk.providerIdentityId));

    if (!identity) throw new Error("Provider identity not found");

    // 2. Obtain valid access token (refreshed automatically via Redis lock if needed)
    const accessToken = await TokenService.getValidAccessToken(
      chunk.providerIdentityId,
    );

    // 3. Dynamically resolve adapter (Google Drive, OneDrive, Dropbox, or Box)
    const adapter = getStorageAdapter(identity.provider);
    const chunkName =
      session.strategy === "whole"
        ? session.fileName
        : `${session.fileName}.part${chunk.chunkIndex}`;

    const chunkSize = chunk.byteEnd - chunk.byteStart;

    const sessionRes = await adapter.createResumableUploadSession({
      fileName: chunkName,
      mimeType: session.mimeType,
      size: chunkSize,
      accessToken,
      origin: clientOrigin,
    });

    // 4. Cache provider URL in DB
    await db
      .update(uploadChunks)
      .set({
        providerSessionUrl: sessionRes.sessionUrl,
        providerSessionExpiresAt: sessionRes.expiresAt,
      })
      .where(eq(uploadChunks.id, chunk.id));

    const headers: Record<string, string> = {
      ...(sessionRes.headers || {}),
    };

    if (identity.provider !== "dropbox") {
      // Chunk byte range relative to this provider's session file
      const chunkRange = `bytes 0-${chunkSize - 1}/${chunkSize}`;
      headers["Content-Range"] = chunkRange;
    }

    return {
      uploadUrl: sessionRes.sessionUrl,
      httpMethod: sessionRes.httpMethod || "PUT",
      headers,
    };
  }

  static async markChunkCompleted(
    sessionId: string,
    chunkIndex: number,
    chunkHash: string,
    providerFileId: string,
  ) {
    await db
      .update(uploadChunks)
      .set({
        chunkHash,
        providerFileId,
        status: "completed",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(uploadChunks.uploadSessionId, sessionId),
          eq(uploadChunks.chunkIndex, chunkIndex),
        ),
      );
  }

  static async finalizeUpload(sessionId: string) {
    const [session] = await db
      .select()
      .from(uploadSessions)
      .where(eq(uploadSessions.id, sessionId));

    if (!session) throw new Error("Session not found");

    const chunks = await db
      .select()
      .from(uploadChunks)
      .where(eq(uploadChunks.uploadSessionId, sessionId));

    // Verify all chunks completed
    const pending = chunks.find((c) => c.status !== "completed");
    if (pending) {
      throw new Error(
        `Cannot finalize: chunk ${pending.chunkIndex} is still pending`,
      );
    }

    // Compute Composite Merkle Root across all chunk hashes
    const hashes = chunks
      .sort((a, b) => a.chunkIndex - b.chunkIndex)
      .map((c) => c.chunkHash!);
    const merkleRoot = computeMerkleRoot(hashes);

    // 1. Create permanent VFS node
    const [vfsNode] = await db
      .insert(vfsNodes)
      .values({
        userId: session.userId,
        parentId: session.parentId,
        name: session.fileName,
        type: "file",
        size: session.totalSize,
        mimeType: session.mimeType,
        merkleRoot,
      })
      .returning();

    // 2. Link fileChunks to permanent VFS node
    for (const c of chunks) {
      await db.insert(fileChunks).values({
        vfsNodeId: vfsNode!.id,
        providerIdentityId: c.providerIdentityId,
        providerFileId: c.providerFileId!,
        byteStart: c.byteStart,
        byteEnd: c.byteEnd,
        chunkHash: c.chunkHash!,
        chunkIndex: c.chunkIndex,
      });
    }

    // 3. Mark upload session completed
    await db
      .update(uploadSessions)
      .set({ status: "completed", merkleRoot, updatedAt: new Date() })
      .where(eq(uploadSessions.id, sessionId));

    // 4. Broadcast live update to all user tabs / devices
    socketManager.broadcastToUser(session.userId, {
      type: "FILE_CREATED",
      payload: vfsNode,
    });

    return vfsNode;
  }

  static async abortSession(sessionId: string, userId?: string) {
    const [session] = await db
      .select()
      .from(uploadSessions)
      .where(eq(uploadSessions.id, sessionId));

    if (!session) {
      return { success: true, message: "Session already removed or does not exist." };
    }

    if (userId && session.userId !== userId) {
      throw new Error("Unauthorized to abort this upload session");
    }

    // Never delete a session that has already completed into permanent VFS
    if (session.status === "completed") {
      return { success: false, message: "Session already finalized." };
    }

    // 1. Fetch all chunks associated with this upload session
    const chunks = await db
      .select()
      .from(uploadChunks)
      .where(eq(uploadChunks.uploadSessionId, sessionId));

    // 2. Clean up any uploaded chunk files or active resumable sessions from cloud providers
    for (const chunk of chunks) {
      try {
        const [identity] = await db
          .select()
          .from(providerIdentities)
          .where(eq(providerIdentities.id, chunk.providerIdentityId));

        if (!identity) continue;

        const adapter = getStorageAdapter(identity.provider);

        // A. If a chunk file was already uploaded to the provider, delete it
        if (chunk.providerFileId) {
          try {
            const accessToken = await TokenService.getValidAccessToken(
              chunk.providerIdentityId,
            );
            await adapter.deleteFile({
              providerFileId: chunk.providerFileId,
              accessToken,
            });
            console.log(
              `[SessionAbort] 🗑️ Cleaned up chunk file [${chunk.providerFileId}] on ${identity.provider}`,
            );
          } catch (delErr: any) {
            console.warn(
              `[SessionAbort] Could not delete chunk file [${chunk.providerFileId}] on ${identity.provider}:`,
              delErr.message,
            );
          }
        }

        // B. If a resumable session URL was created, cancel it
        if (chunk.providerSessionUrl) {
          try {
            if (identity.provider === "google_drive" || identity.provider === "one_drive") {
              await fetch(chunk.providerSessionUrl, {
                method: "DELETE",
                headers: { "Content-Length": "0" },
              }).catch(() => {});
            }
          } catch {}
        }
      } catch (err: any) {
        console.warn(`[SessionAbort] Error processing chunk cleanup:`, err.message);
      }
    }

    // 3. Delete upload chunks and session from database
    await db
      .delete(uploadChunks)
      .where(eq(uploadChunks.uploadSessionId, sessionId));

    await db
      .delete(uploadSessions)
      .where(eq(uploadSessions.id, sessionId));

    console.log(
      `[SessionAbort] ✅ Successfully purged upload session [${sessionId}] (${session.fileName}) from server and cloud.`,
    );

    return { success: true };
  }
}

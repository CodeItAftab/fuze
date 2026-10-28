import {
  StorageAdapter,
  UploadSessionResult,
  QuotaResult,
} from "./base.adapter.js";
import { randomUUID } from "node:crypto";

interface KoofrUserResponse {
  email: string;
  spaceTotal: number;
  spaceUsed: number;
  primaryMountId?: string;
}

interface KoofrMount {
  id: string;
  name: string;
  isPrimary?: boolean;
}

interface KoofrTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  error?: string;
  error_description?: string;
}

export class KoofrAdapter implements StorageAdapter {
  private static folderCache = new Map<string, boolean>();
  private static mountCache = new Map<string, string>();
  private static streamTokens = new Map<
    string,
    { authHeader: string; fileName: string; size: number; expiresAt: number }
  >();

  public static getAuthHeader(accessToken: string): string {
    try {
      const parsed = JSON.parse(accessToken);
      const user = parsed.user || parsed.email;
      const pass = parsed.pass || parsed.password;
      if (user && pass) {
        return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
      }
    } catch {}
    return `Bearer ${accessToken}`;
  }

  async getPrimaryMountId(accessToken: string): Promise<string> {
    if (KoofrAdapter.mountCache.has(accessToken)) {
      return KoofrAdapter.mountCache.get(accessToken)!;
    }
    try {
      const res = await fetch("https://app.koofr.net/api/v2/mounts", {
        headers: { Authorization: KoofrAdapter.getAuthHeader(accessToken) },
      });
      if (res.ok) {
        const mounts = (await res.json()) as KoofrMount[];
        const primary = mounts.find((m) => m.isPrimary) || mounts[0];
        if (primary) {
          KoofrAdapter.mountCache.set(accessToken, primary.id);
          return primary.id;
        }
      }
    } catch {}
    // Fallback default mount ID if primary query is unavailable
    return "primary";
  }

  async ensureFuzeFolder(accessToken: string): Promise<void> {
    if (KoofrAdapter.folderCache.get(accessToken)) return;
    try {
      const res = await fetch("https://app.koofr.net/dav/Koofr/Fuze/", {
        method: "MKCOL",
        headers: {
          Authorization: KoofrAdapter.getAuthHeader(accessToken),
        },
      });
      // 201 Created or 405 Method Not Allowed (collection already exists)
      if (res.status === 201 || res.status === 405) {
        KoofrAdapter.folderCache.set(accessToken, true);
      }
    } catch (err) {
      console.warn("[KoofrAdapter] Could not ensure Fuze folder via MKCOL:", err);
    }
  }

  public static sanitizeKoofrFileName(fileName: string): string {
    // Koofr security filters block downloads of raw .html, .htm, and .exe files (terminating socket with ECONNRESET).
    // Appending .fz transparently shields these files so Koofr stores and serves them as safe binary blobs.
    if (/\.(html?|exe)$/i.test(fileName) && !fileName.endsWith(".fz")) {
      return `${fileName}.fz`;
    }
    return fileName;
  }

  async createResumableUploadSession(params: {
    fileName: string;
    mimeType: string;
    size: number;
    accessToken: string;
    origin?: string;
  }): Promise<UploadSessionResult> {
    await this.ensureFuzeFolder(params.accessToken);

    const safeName = KoofrAdapter.sanitizeKoofrFileName(params.fileName);
    const token = randomUUID();
    const authHeader = KoofrAdapter.getAuthHeader(params.accessToken);
    KoofrAdapter.streamTokens.set(token, {
      authHeader,
      fileName: safeName,
      size: params.size,
      expiresAt: Date.now() + 2 * 3600 * 1000,
    });

    const apiBase = process.env.API_URL || "http://localhost:4000";
    const sessionUrl = `${apiBase}/uploads/provider-stream/koofr?token=${token}`;

    return {
      sessionUrl,
      httpMethod: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
      },
      expiresAt: new Date(Date.now() + 2 * 3600 * 1000),
      uploadType: "binary",
    };
  }

  static async handleStreamUpload(
    token: string,
    stream: NodeJS.ReadableStream | Buffer,
  ): Promise<{ id: string; name: string }> {
    const entry = KoofrAdapter.streamTokens.get(token);
    if (!entry || Date.now() > entry.expiresAt) {
      throw new Error("Invalid or expired Koofr upload stream token");
    }

    const encodedName = encodeURIComponent(entry.fileName);
    const targetUrl = `https://app.koofr.net/dav/Koofr/Fuze/${encodedName}`;

    let bodyBuffer: Buffer;
    if (Buffer.isBuffer(stream)) {
      bodyBuffer = stream;
    } else {
      const chunks: Buffer[] = [];
      for await (const chunk of stream as any) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      bodyBuffer = Buffer.concat(chunks);
    }

    const headers: Record<string, string> = {
      Authorization: entry.authHeader,
      "Content-Type": "application/octet-stream",
      "Content-Length": String(bodyBuffer.length),
    };

    const res = await fetch(targetUrl, {
      method: "PUT",
      headers,
      body: bodyBuffer,
    });

    if (!res.ok && res.status !== 200 && res.status !== 201 && res.status !== 204) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Koofr upload failed (${res.status}): ${errText}`);
    }

    KoofrAdapter.streamTokens.delete(token);
    return { id: entry.fileName, name: entry.fileName };
  }

  async uploadBuffer(params: {
    fileName: string;
    buffer: Buffer;
    accessToken: string;
    mimeType?: string;
  }): Promise<{ id: string; name: string }> {
    await this.ensureFuzeFolder(params.accessToken);
    const safeName = KoofrAdapter.sanitizeKoofrFileName(params.fileName);
    const encodedName = encodeURIComponent(safeName);
    const authHeader = KoofrAdapter.getAuthHeader(params.accessToken);

    const res = await fetch(`https://app.koofr.net/dav/Koofr/Fuze/${encodedName}`, {
      method: "PUT",
      headers: {
        Authorization: authHeader,
        "Content-Type": params.mimeType || "application/octet-stream",
        "Content-Length": String(params.buffer.length),
      },
      body: params.buffer,
    });

    if (!res.ok && res.status !== 200 && res.status !== 201 && res.status !== 204) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Koofr uploadBuffer failed (${res.status}): ${errText}`);
    }

    return { id: safeName, name: safeName };
  }

  async getDownloadUrl(params: {
    providerFileId: string;
    accessToken: string;
  }): Promise<string> {
    const safeId = KoofrAdapter.sanitizeKoofrFileName(params.providerFileId);
    const encodedId = encodeURIComponent(safeId);
    return `https://app.koofr.net/dav/Koofr/Fuze/${encodedId}`;
  }

  getDownloadHeaders(accessToken: string): Record<string, string> {
    return {
      Authorization: KoofrAdapter.getAuthHeader(accessToken),
    };
  }

  async deleteFile(params: {
    providerFileId: string;
    accessToken: string;
  }): Promise<void> {
    const safeId = KoofrAdapter.sanitizeKoofrFileName(params.providerFileId);
    const encodedId = encodeURIComponent(safeId);
    const res = await fetch(`https://app.koofr.net/dav/Koofr/Fuze/${encodedId}`, {
      method: "DELETE",
      headers: {
        Authorization: KoofrAdapter.getAuthHeader(params.accessToken),
      },
    });

    if (safeId !== params.providerFileId) {
      // Also clean up un-suffixed file if it existed
      const rawEncoded = encodeURIComponent(params.providerFileId);
      await fetch(`https://app.koofr.net/dav/Koofr/Fuze/${rawEncoded}`, {
        method: "DELETE",
        headers: {
          Authorization: KoofrAdapter.getAuthHeader(params.accessToken),
        },
      }).catch(() => {});
    }

    if (!res.ok && res.status !== 404 && res.status !== 204) {
      throw new Error(`Failed to delete file on Koofr (${res.status})`);
    }
  }

  async fetchQuota(accessToken: string): Promise<QuotaResult> {
    const res = await fetch("https://app.koofr.net/api/v2/mounts", {
      headers: { Authorization: KoofrAdapter.getAuthHeader(accessToken) },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch Koofr mounts info (${res.status})`);
    }

    const data = (await res.json()) as {
      mounts?: Array<{
        spaceTotal?: number;
        spaceUsed?: number;
        isPrimary?: boolean;
      }>;
    };
    const primary = data.mounts?.find((m) => m.isPrimary) || data.mounts?.[0];

    // Koofr spaceTotal and spaceUsed in /api/v2/mounts are in MegaBytes (MB)
    const totalBytes =
      primary?.spaceTotal != null
        ? Number(primary.spaceTotal) * 1024 * 1024
        : 10 * 1024 * 1024 * 1024;
    const usedBytes =
      primary?.spaceUsed != null
        ? Number(primary.spaceUsed) * 1024 * 1024
        : 0;

    return {
      totalBytes,
      usedBytes,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresInSeconds: number;
  }> {
    const clientId = process.env.KOOFR_CLIENT_ID;
    const clientSecret = process.env.KOOFR_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Koofr client credentials are not configured in environment");
    }

    const res = await fetch("https://app.koofr.net/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const data = (await res.json()) as KoofrTokenResponse;
    if (!res.ok || data.error) {
      throw new Error(
        data.error_description ||
          data.error ||
          "Failed to refresh Koofr access token",
      );
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresInSeconds: data.expires_in || 3600,
    };
  }
}

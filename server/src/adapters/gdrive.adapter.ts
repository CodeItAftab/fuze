import {
  StorageAdapter,
  UploadSessionResult,
  QuotaResult,
  ThumbnailResult,
} from "./base.adapter.js";

interface GoogleDriveAboutResponse {
  storageQuota?: {
    limit?: string | number;
    usage?: string | number;
  };
}

interface GoogleDriveTokenResponse {
  access_token: string;
  expires_in?: number;
}

export class GoogleDriveAdapter implements StorageAdapter {
  private static folderCache = new Map<string, string>();

  async getOrCreateFuzeFolder(accessToken: string): Promise<string> {
    const cached = GoogleDriveAdapter.folderCache.get(accessToken);
    if (cached) return cached;

    try {
      // 1. Search for existing "Fuze" folder in root
      const query = encodeURIComponent(
        "name = 'Fuze' and 'root' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      );
      const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&pageSize=1`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (searchRes.ok) {
        const searchData = (await searchRes.json()) as {
          files?: Array<{ id: string; name: string }>;
        };
        if (searchData.files && searchData.files.length > 0) {
          const folderId = searchData.files[0].id;
          GoogleDriveAdapter.folderCache.set(accessToken, folderId);
          return folderId;
        }
      }

      // 2. If not found, create "Fuze" folder in root
      const createRes = await fetch(
        "https://www.googleapis.com/drive/v3/files",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Fuze",
            mimeType: "application/vnd.google-apps.folder",
            parents: ["root"],
          }),
        },
      );

      if (createRes.ok) {
        const createData = (await createRes.json()) as { id: string };
        GoogleDriveAdapter.folderCache.set(accessToken, createData.id);
        return createData.id;
      }
    } catch (err) {
      console.warn(
        "[GoogleDriveAdapter] Could not get/create Fuze folder, falling back to root:",
        err,
      );
    }

    return "root";
  }

  async createResumableUploadSession(params: {
    fileName: string;
    mimeType: string;
    size: number;
    accessToken: string;
    origin?: string;
  }): Promise<UploadSessionResult> {
    const folderId = await this.getOrCreateFuzeFolder(params.accessToken);
    const origin = params.origin || process.env.CLIENT_ORIGIN || "http://localhost:3000";
    const response = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${params.accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Type": params.mimeType,
          "X-Upload-Content-Length": params.size.toString(),
          Origin: origin, // Crucial for direct browser PUT CORS clearance
        },
        body: JSON.stringify({
          name: params.fileName,
          description: "Fuze Distributed File",
          parents: folderId === "root" ? undefined : [folderId],
        }),
      },
    );
    if (!response.ok) {
      const err = await response.text();
      throw new Error(
        `Google Drive upload session failed: ${response.status} - ${err}`,
      );
    }
    const sessionUrl = response.headers.get("Location");
    if (!sessionUrl) {
      throw new Error(
        "Google Drive API did not return Location header for upload session",
      );
    }
    return {
      sessionUrl,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      httpMethod: "PUT",
      headers: {
        "Content-Type": "application/octet-stream",
      },
    };
  }

  async getDownloadUrl(params: {
    providerFileId: string;
    accessToken: string;
  }): Promise<string> {
    return `https://www.googleapis.com/drive/v3/files/${params.providerFileId}?alt=media`;
  }

  getDownloadHeaders(accessToken: string): Record<string, string> {
    return {
      Authorization: `Bearer ${accessToken}`,
    };
  }

  async getThumbnail(params: {
    providerFileId: string;
    accessToken: string;
  }): Promise<ThumbnailResult | null> {
    try {
      const metaRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${params.providerFileId}?fields=thumbnailLink,hasThumbnail`,
        {
          headers: { Authorization: `Bearer ${params.accessToken}` },
        },
      );
      if (!metaRes.ok) return null;
      const meta = (await metaRes.json()) as {
        thumbnailLink?: string;
        hasThumbnail?: boolean;
      };
      if (!meta.thumbnailLink) return null;

      // Google Drive default thumbnail is =s220, replace with =s400 for crisp previews
      const highResUrl = meta.thumbnailLink.replace(/=s\d+$/, "=s400");
      const thumbRes = await fetch(highResUrl, {
        headers: { Authorization: `Bearer ${params.accessToken}` },
      });
      if (!thumbRes.ok) return null;

      const arrayBuf = await thumbRes.arrayBuffer();
      const mimeType = thumbRes.headers.get("content-type") || "image/jpeg";
      return {
        buffer: Buffer.from(arrayBuf),
        mimeType,
      };
    } catch {
      return null;
    }
  }

  async deleteFile(params: {
    providerFileId: string;
    accessToken: string;
  }): Promise<void> {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${params.providerFileId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${params.accessToken}` },
      },
    );
    if (!res.ok && res.status !== 404) {
      throw new Error(`Google Drive delete failed with status ${res.status}`);
    }
  }

  async renameFile(params: {
    providerFileId: string;
    newName: string;
    accessToken: string;
  }): Promise<void> {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${params.providerFileId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${params.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: params.newName }),
      },
    );
    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[GDrive] Rename warning (${res.status}): ${errText}`);
    }
  }

  async fetchQuota(accessToken: string): Promise<QuotaResult> {
    const res = await fetch(
      "https://www.googleapis.com/drive/v3/about?fields=storageQuota",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    if (!res.ok) {
      throw new Error("Failed to fetch Google Drive quota");
    }
    const data = (await res.json()) as GoogleDriveAboutResponse;
    return {
      totalBytes: Number(data.storageQuota?.limit || 16106127360), // 15 GB
      usedBytes: Number(data.storageQuota?.usage || 0),
    };
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; expiresInSeconds: number }> {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to refresh Google OAuth token");
    }

    const data = (await res.json()) as GoogleDriveTokenResponse;
    return {
      accessToken: data.access_token,
      expiresInSeconds: data.expires_in || 3600,
    };
  }
}

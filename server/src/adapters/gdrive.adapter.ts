import {
  StorageAdapter,
  UploadSessionResult,
  QuotaResult,
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
  async createResumableUploadSession(params: {
    fileName: string;
    mimeType: string;
    size: number;
    accessToken: string;
    origin?: string;
  }): Promise<UploadSessionResult> {
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

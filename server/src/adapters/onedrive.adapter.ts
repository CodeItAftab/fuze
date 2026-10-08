import {
  StorageAdapter,
  UploadSessionResult,
  QuotaResult,
} from "./base.adapter.js";

interface OneDriveSessionResponse {
  uploadUrl: string;
  expirationDateTime?: string;
}

interface OneDriveItemResponse {
  "@microsoft.graph.downloadUrl"?: string;
}

interface OneDriveDriveResponse {
  quota?: {
    total?: number;
    used?: number;
  };
}

interface OneDriveTokenResponse {
  access_token: string;
  expires_in?: number;
}

export class OneDriveAdapter implements StorageAdapter {
  async createResumableUploadSession(params: {
    fileName: string;
    mimeType: string;
    size: number;
    accessToken: string;
  }): Promise<UploadSessionResult> {
    const encodedFileName = encodeURIComponent(params.fileName);
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root:/Fuze/${encodedFileName}:/createUploadSession`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${params.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          item: {
            "@microsoft.graph.conflictBehavior": "rename",
            name: params.fileName,
          },
        }),
      },
    );

    if (!res.ok) {
      throw new Error(`OneDrive upload session failed: ${res.status}`);
    }

    const data = (await res.json()) as OneDriveSessionResponse;
    return {
      sessionUrl: data.uploadUrl,
      expiresAt: new Date(
        data.expirationDateTime || Date.now() + 48 * 3600 * 1000,
      ),
    };
  }

  async getDownloadUrl(params: {
    providerFileId: string;
    accessToken: string;
  }): Promise<string> {
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${params.providerFileId}`,
      {
        headers: { Authorization: `Bearer ${params.accessToken}` },
      },
    );

    if (!res.ok) {
      throw new Error(`OneDrive get download link failed: ${res.status}`);
    }

    const data = (await res.json()) as OneDriveItemResponse;
    return data["@microsoft.graph.downloadUrl"] || "";
  }

  async deleteFile(params: {
    providerFileId: string;
    accessToken: string;
  }): Promise<void> {
    await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${params.providerFileId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${params.accessToken}` },
      },
    );
  }

  async fetchQuota(accessToken: string): Promise<QuotaResult> {
    const res = await fetch("https://graph.microsoft.com/v1.0/me/drive", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch OneDrive quota");
    }

    const data = (await res.json()) as OneDriveDriveResponse;
    return {
      totalBytes: Number(data.quota?.total || 5368709120), // 5 GB
      usedBytes: Number(data.quota?.used || 0),
    };
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; expiresInSeconds: number }> {
    const clientId = process.env.MICROSOFT_CLIENT_ID || "";
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET || "";

    const response = await fetch(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          scope: "files.readwrite offline_access user.read",
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OneDrive token refresh failed (${response.status}): ${errorText}`,
      );
    }

    const data = (await response.json()) as OneDriveTokenResponse;
    return {
      accessToken: data.access_token,
      expiresInSeconds: data.expires_in || 3600,
    };
  }
}

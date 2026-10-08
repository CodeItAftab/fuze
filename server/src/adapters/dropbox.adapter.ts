import {
  StorageAdapter,
  UploadSessionResult,
  QuotaResult,
} from "./base.adapter.js";

interface DropboxSessionResponse {
  session_id: string;
}

interface DropboxLinkResponse {
  link: string;
}

interface DropboxSpaceResponse {
  used: number;
  allocation: {
    allocated?: number;
  };
}

interface DropboxTokenResponse {
  access_token: string;
  expires_in?: number;
}

export class DropboxAdapter implements StorageAdapter {
  async createResumableUploadSession(params: {
    fileName: string;
    mimeType: string;
    size: number;
    accessToken: string;
  }): Promise<UploadSessionResult> {
    const res = await fetch(
      "https://content.dropboxapi.com/2/files/upload_session/start",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${params.accessToken}`,
          "Dropbox-API-Arg": JSON.stringify({ close: false }),
          "Content-Type": "application/octet-stream",
        },
      },
    );

    if (!res.ok) {
      throw new Error(`Dropbox upload session start failed: ${res.status}`);
    }

    const data = (await res.json()) as DropboxSessionResponse;
    return {
      sessionUrl: `https://content.dropboxapi.com/2/files/upload_session/append_v2?sessionId=${data.session_id}`,
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
    };
  }

  async getDownloadUrl(params: {
    providerFileId: string;
    accessToken: string;
  }): Promise<string> {
    const res = await fetch(
      "https://api.dropboxapi.com/2/files/get_temporary_link",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${params.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path: params.providerFileId }),
      },
    );

    if (!res.ok) {
      throw new Error(`Dropbox get download link failed: ${res.status}`);
    }

    const data = (await res.json()) as DropboxLinkResponse;
    return data.link;
  }

  async deleteFile(params: {
    providerFileId: string;
    accessToken: string;
  }): Promise<void> {
    await fetch("https://api.dropboxapi.com/2/files/delete_v2", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path: params.providerFileId }),
    });
  }

  async fetchQuota(accessToken: string): Promise<QuotaResult> {
    const res = await fetch(
      "https://api.dropboxapi.com/2/users/get_space_usage",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!res.ok) {
      throw new Error("Failed to fetch Dropbox quota");
    }

    const data = (await res.json()) as DropboxSpaceResponse;
    return {
      totalBytes: Number(data.allocation?.allocated || 2147483648), // Default 2 GB
      usedBytes: Number(data.used || 0),
    };
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; expiresInSeconds: number }> {
    const clientId = process.env.DROPBOX_CLIENT_ID || "";
    const clientSecret = process.env.DROPBOX_CLIENT_SECRET || "";

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64",
    );

    const response = await fetch("https://api.dropboxapi.com/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Dropbox token refresh failed (${response.status}): ${errorText}`,
      );
    }

    const data = (await response.json()) as DropboxTokenResponse;
    return {
      accessToken: data.access_token,
      expiresInSeconds: data.expires_in || 14400, // 4 hours
    };
  }
}

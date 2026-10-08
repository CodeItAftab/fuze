import {
  StorageAdapter,
  UploadSessionResult,
  QuotaResult,
} from "./base.adapter.js";

interface BoxUploadSessionResponse {
  id: string;
  session_endpoints: {
    upload_part: string;
    commit: string;
    abort: string;
  };
  expires_at: string;
}

interface BoxUserResponse {
  space_amount: number; // Total bytes
  space_used: number; // Used bytes
}

interface BoxTokenResponse {
  access_token: string;
  expires_in: number;
}

export class BoxAdapter implements StorageAdapter {
  async createResumableUploadSession(params: {
    fileName: string;
    mimeType: string;
    size: number;
    accessToken: string;
  }): Promise<UploadSessionResult> {
    const response = await fetch(
      "https://upload.box.com/api/2.0/files/upload_sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${params.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folder_id: "0",
          file_name: params.fileName,
          file_size: params.size,
        }),
      },
    );
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Box upload session failed (${response.status}): ${err}`);
    }
    const data = (await response.json()) as BoxUploadSessionResponse;
    return {
      sessionUrl: data.session_endpoints.upload_part,
      expiresAt: new Date(data.expires_at || Date.now() + 24 * 3600 * 1000),
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
    // Box temporary direct download URL
    const res = await fetch(
      `https://api.box.com/2.0/files/${params.providerFileId}/content`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${params.accessToken}` },
        redirect: "manual", // Box returns a 302 redirect with the actual download URL in Location
      },
    );

    const downloadUrl = res.headers.get("Location");
    if (!downloadUrl) {
      throw new Error("Failed to obtain Box download URL");
    }
    return downloadUrl;
  }

  async deleteFile(params: {
    providerFileId: string;
    accessToken: string;
  }): Promise<void> {
    await fetch(`https://api.box.com/2.0/files/${params.providerFileId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${params.accessToken}` },
    });
  }

  async fetchQuota(accessToken: string): Promise<QuotaResult> {
    const res = await fetch("https://api.box.com/2.0/users/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch Box quota");
    }

    const data = (await res.json()) as BoxUserResponse;
    return {
      totalBytes: Number(data.space_amount || 10737418240), // 10 GB
      usedBytes: Number(data.space_used || 0),
    };
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; expiresInSeconds: number }> {
    const clientId = process.env.BOX_CLIENT_ID || "";
    const clientSecret = process.env.BOX_CLIENT_SECRET || "";

    const res = await fetch("https://api.box.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Box token refresh failed: ${err}`);
    }

    const data = (await res.json()) as BoxTokenResponse;
    return {
      accessToken: data.access_token,
      expiresInSeconds: data.expires_in || 3600,
    };
  }
}

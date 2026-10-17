import {
  StorageAdapter,
  UploadSessionResult,
  QuotaResult,
  ThumbnailResult,
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
  refresh_token?: string;
  expires_in: number;
}

export class BoxAdapter implements StorageAdapter {
  private static folderCache = new Map<string, string>();

  async getOrCreateFuzeFolder(accessToken: string): Promise<string> {
    const cached = BoxAdapter.folderCache.get(accessToken);
    if (cached) return cached;

    try {
      // 1. Search root folder items for an existing "Fuze" folder
      const listRes = await fetch(
        "https://api.box.com/2.0/folders/0/items?fields=id,name,type&limit=1000",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (listRes.ok) {
        const listData = (await listRes.json()) as {
          entries?: Array<{ id: string; name: string; type: string }>;
        };
        const existing = listData.entries?.find(
          (e) => e.type === "folder" && e.name.toLowerCase() === "fuze",
        );
        if (existing) {
          BoxAdapter.folderCache.set(accessToken, existing.id);
          return existing.id;
        }
      }

      // 2. If not found, create "Fuze" folder in root folder ("0")
      const createRes = await fetch("https://api.box.com/2.0/folders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Fuze",
          parent: { id: "0" },
        }),
      });

      if (createRes.ok) {
        const createData = (await createRes.json()) as { id: string };
        BoxAdapter.folderCache.set(accessToken, createData.id);
        return createData.id;
      }

      // 3. If 409 Conflict, Box returns existing folder ID in context_info
      if (createRes.status === 409) {
        const errJson = (await createRes.json().catch(() => ({}))) as {
          context_info?: {
            conflicts?: Array<{ id: string }> | { id: string };
          };
        };
        const conflictId = Array.isArray(errJson.context_info?.conflicts)
          ? errJson.context_info.conflicts[0]?.id
          : (errJson.context_info?.conflicts as { id: string } | undefined)?.id;

        if (conflictId) {
          BoxAdapter.folderCache.set(accessToken, conflictId);
          return conflictId;
        }
      }
    } catch (err) {
      console.warn(
        "[BoxAdapter] Could not get/create Fuze folder, falling back to root:",
        err,
      );
    }

    return "0";
  }

  async createResumableUploadSession(params: {
    fileName: string;
    mimeType: string;
    size: number;
    accessToken: string;
  }): Promise<UploadSessionResult> {
    const folderId = await this.getOrCreateFuzeFolder(params.accessToken);

    // With CORS configured for http://localhost:3000, Box supports direct client-side
    // multipart upload to https://upload.box.com/api/2.0/files/content
    // Attributes specify name and the dedicated Fuze folder id
    return {
      sessionUrl: "https://upload.box.com/api/2.0/files/content",
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
      httpMethod: "POST",
      uploadType: "multipart",
      formDataFields: {
        attributes: JSON.stringify({
          name: params.fileName,
          parent: { id: folderId },
        }),
      },
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
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
      const errText = await res.text().catch(() => "");
      throw new Error(
        `Failed to obtain Box download URL (HTTP ${res.status}): ${errText || "No Location redirect header"}`,
      );
    }
    return downloadUrl;
  }

  async getThumbnail(params: {
    providerFileId: string;
    accessToken: string;
  }): Promise<ThumbnailResult | null> {
    try {
      const res = await fetch(
        `https://api.box.com/2.0/files/${params.providerFileId}/thumbnail.png?min_height=256&min_width=256`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${params.accessToken}` },
          redirect: "follow",
        },
      );
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        return {
          buffer: Buffer.from(arrayBuf),
          mimeType: "image/png",
        };
      }
      return null;
    } catch {
      return null;
    }
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

  async renameFile(params: {
    providerFileId: string;
    newName: string;
    accessToken: string;
  }): Promise<void> {
    const res = await fetch(`https://api.box.com/2.0/files/${params.providerFileId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: params.newName }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[Box] Rename warning (${res.status}): ${errText}`);
    }
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
  ): Promise<{ accessToken: string; refreshToken?: string; expiresInSeconds: number }> {
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
      refreshToken: data.refresh_token,
      expiresInSeconds: data.expires_in || 3600,
    };
  }
}

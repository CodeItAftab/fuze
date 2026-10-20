import {
  StorageAdapter,
  UploadSessionResult,
  QuotaResult,
  ThumbnailResult,
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
    const cleanPath = params.fileName.startsWith("/")
      ? params.fileName
      : `/Fuze/${params.fileName}`;

    return {
      sessionUrl: "https://content.dropboxapi.com/2/files/upload",
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
      httpMethod: "POST",
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        "Dropbox-API-Arg": JSON.stringify({
          path: cleanPath,
          mode: "overwrite",
          autorename: false,
          mute: false,
          strict_conflict: false,
        }),
        "Content-Type": "application/octet-stream",
      },
    };
  }

  async getDownloadUrl(params: {
    providerFileId: string;
    accessToken: string;
  }): Promise<string> {
    const cleanPath = params.providerFileId.startsWith("/")
      ? params.providerFileId
      : `/Fuze/${params.providerFileId}`;

    const res = await fetch(
      "https://api.dropboxapi.com/2/files/get_temporary_link",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${params.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path: cleanPath }),
      },
    );

    if (!res.ok) {
      throw new Error(`Dropbox get download link failed: ${res.status}`);
    }

    const data = (await res.json()) as DropboxLinkResponse;
    return data.link;
  }

  async getThumbnail(params: {
    providerFileId: string;
    accessToken: string;
  }): Promise<ThumbnailResult | null> {
    try {
      const cleanPath = params.providerFileId.startsWith("/")
        ? params.providerFileId
        : `/${params.providerFileId}`;

      const res = await fetch(
        "https://content.dropboxapi.com/2/files/get_thumbnail_v2",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${params.accessToken}`,
            "Dropbox-API-Arg": JSON.stringify({
              resource: { ".tag": "path", path: cleanPath },
              format: "jpeg",
              size: "w256h256",
              mode: "strict",
            }),
          },
        },
      );
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        return {
          buffer: Buffer.from(arrayBuf),
          mimeType: "image/jpeg",
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
    const cleanPath = params.providerFileId.startsWith("/")
      ? params.providerFileId
      : `/Fuze/${params.providerFileId}`;

    await fetch("https://api.dropboxapi.com/2/files/delete_v2", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path: cleanPath }),
    });
  }

  async renameFile(params: {
    providerFileId: string;
    newName: string;
    accessToken: string;
  }): Promise<string | void> {
    const fromPath = params.providerFileId.startsWith("/")
      ? params.providerFileId
      : `/Fuze/${params.providerFileId}`;

    const lastSlashIdx = fromPath.lastIndexOf("/");
    const dir = lastSlashIdx !== -1 ? fromPath.substring(0, lastSlashIdx) : "/Fuze";
    const toPath = `${dir}/${params.newName}`;

    const res = await fetch("https://api.dropboxapi.com/2/files/move_v2", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from_path: fromPath,
        to_path: toPath,
        autorename: false,
      }),
    });

    if (res.ok) {
      return toPath.startsWith("/Fuze/") ? toPath.substring(6) : toPath;
    } else {
      const errText = await res.text();
      console.warn(`[Dropbox] Rename warning (${res.status}): ${errText}`);
    }
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

  async listFiles(
    accessToken: string,
  ): Promise<Array<{ providerFileId: string; fileName: string; size: number }>> {
    try {
      const res = await fetch("https://api.dropboxapi.com/2/files/list_folder", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path: "/Fuze", recursive: false }),
      });
      if (!res.ok) return [];
      const data = (await res.json()) as any;
      return (data.entries || [])
        .filter((e: any) => e[".tag"] === "file")
        .map((e: any) => ({
          providerFileId: e.path_lower || `/Fuze/${e.name}`,
          fileName: e.name,
          size: Number(e.size || 0),
        }));
    } catch {
      return [];
    }
  }
}

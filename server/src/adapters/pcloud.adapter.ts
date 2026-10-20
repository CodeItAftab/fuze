import {
  StorageAdapter,
  UploadSessionResult,
  QuotaResult,
  ThumbnailResult,
} from "./base.adapter.js";

interface PCloudSpaceResponse {
  result: number;
  quota?: number;
  usedquota?: number;
}

interface PCloudFileResponse {
  result: number;
  hosts?: string[];
  path?: string;
}

export class PCloudAdapter implements StorageAdapter {
  private static folderCache = new Map<string, boolean>();

  async ensureFuzeFolder(accessToken: string): Promise<void> {
    if (PCloudAdapter.folderCache.get(accessToken)) return;
    try {
      await fetch(
        `https://api.pcloud.com/createfolderifnotexists?access_token=${accessToken}&path=/Fuze`,
      );
      PCloudAdapter.folderCache.set(accessToken, true);
    } catch (err) {
      console.warn("[PCloudAdapter] Could not ensure Fuze folder:", err);
    }
  }

  async createResumableUploadSession(params: {
    fileName: string;
    mimeType: string;
    size: number;
    accessToken: string;
  }): Promise<UploadSessionResult> {
    await this.ensureFuzeFolder(params.accessToken);

    // pCloud direct file upload endpoint with path=/Fuze
    const encodedName = encodeURIComponent(params.fileName);
    const sessionUrl = `https://api.pcloud.com/uploadfile?access_token=${params.accessToken}&path=/Fuze&filename=${encodedName}&nopartial=0&renameifexists=1`;

    return {
      sessionUrl,
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
    };
  }

  async getDownloadUrl(params: {
    providerFileId: string;
    accessToken: string;
  }): Promise<string> {
    const res = await fetch(
      `https://api.pcloud.com/getfilelink?fileid=${params.providerFileId}&access_token=${params.accessToken}`,
    );
    const data = (await res.json()) as PCloudFileResponse;
    if (data.result !== 0 || !data.hosts || !data.path) {
      throw new Error("Failed to obtain pCloud download link");
    }
    return `https://${data.hosts[0]}${data.path}`;
  }

  async getThumbnail(params: {
    providerFileId: string;
    accessToken: string;
  }): Promise<ThumbnailResult | null> {
    try {
      const res = await fetch(
        `https://api.pcloud.com/getthumb?fileid=${params.providerFileId}&size=256x256&crop=0&access_token=${params.accessToken}`,
      );
      if (res.ok) {
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("image")) {
          const arrayBuf = await res.arrayBuffer();
          return {
            buffer: Buffer.from(arrayBuf),
            mimeType: contentType,
          };
        }
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
    await fetch(
      `https://api.pcloud.com/deletefile?fileid=${params.providerFileId}&access_token=${params.accessToken}`,
    );
  }

  async renameFile(params: {
    providerFileId: string;
    newName: string;
    accessToken: string;
  }): Promise<void> {
    const res = await fetch(
      `https://api.pcloud.com/renamefile?fileid=${params.providerFileId}&toname=${encodeURIComponent(params.newName)}&access_token=${params.accessToken}`,
    );
    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[pCloud] Rename warning (${res.status}): ${errText}`);
    }
  }

  async fetchQuota(accessToken: string): Promise<QuotaResult> {
    const res = await fetch(
      `https://api.pcloud.com/userinfo?access_token=${accessToken}`,
    );
    const data = (await res.json()) as PCloudSpaceResponse;
    if (data.result !== 0) {
      throw new Error("Failed to fetch pCloud quota");
    }
    return {
      totalBytes: Number(data.quota || 10737418240), // 10 GB
      usedBytes: Number(data.usedquota || 0),
    };
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; expiresInSeconds: number }> {
    // pCloud OAuth tokens are permanent until revoked
    return {
      accessToken: refreshToken,
      expiresInSeconds: 315360000, // 10 years
    };
  }

  async listFiles(
    accessToken: string,
  ): Promise<Array<{ providerFileId: string; fileName: string; size: number }>> {
    try {
      const res = await fetch(
        `https://api.pcloud.com/listfolder?access_token=${accessToken}&path=/Fuze`,
      );
      if (!res.ok) return [];
      const data = (await res.json()) as any;
      if (data.result !== 0 || !data.metadata?.contents) return [];
      return data.metadata.contents
        .filter((e: any) => !e.isfolder)
        .map((e: any) => ({
          providerFileId: String(e.fileid),
          fileName: e.name,
          size: Number(e.size || 0),
        }));
    } catch {
      return [];
    }
  }
}

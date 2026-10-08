import {
  StorageAdapter,
  UploadSessionResult,
  QuotaResult,
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
  async createResumableUploadSession(params: {
    fileName: string;
    mimeType: string;
    size: number;
    accessToken: string;
  }): Promise<UploadSessionResult> {
    // pCloud direct file upload endpoint
    const encodedName = encodeURIComponent(params.fileName);
    const sessionUrl = `https://api.pcloud.com/uploadfile?access_token=${params.accessToken}&filename=${encodedName}&nopartial=0`;

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

  async deleteFile(params: {
    providerFileId: string;
    accessToken: string;
  }): Promise<void> {
    await fetch(
      `https://api.pcloud.com/deletefile?fileid=${params.providerFileId}&access_token=${params.accessToken}`,
    );
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
}

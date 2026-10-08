export interface UploadSessionResult {
  sessionUrl: string;
  expiresAt: Date;
  headers?: Record<string, string>;
}

export interface QuotaResult {
  totalBytes: number;
  usedBytes: number;
}

export interface StorageAdapter {
  createResumableUploadSession(params: {
    fileName: string;
    mimeType: string;
    size: number;
    accessToken: string;
  }): Promise<UploadSessionResult>;

  getDownloadUrl(params: {
    providerFileId: string;
    accessToken: string;
  }): Promise<string>;

  deleteFile(params: {
    providerFileId: string;
    accessToken: string;
  }): Promise<void>;

  fetchQuota(accessToken: string): Promise<QuotaResult>;

  refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresInSeconds: number;
  }>;
}

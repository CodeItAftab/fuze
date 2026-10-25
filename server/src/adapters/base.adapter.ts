export interface UploadSessionResult {
  sessionUrl: string;
  expiresAt: Date;
  httpMethod?: "PUT" | "POST";
  headers?: Record<string, string>;
  uploadType?: "binary" | "multipart";
  formDataFields?: Record<string, string>;
}
export interface QuotaResult {
  totalBytes: number;
  usedBytes: number;
}

export interface ThumbnailResult {
  buffer: Buffer;
  mimeType: string;
}

export interface StorageAdapter {
  createResumableUploadSession(params: {
    fileName: string;
    mimeType: string;
    size: number;
    accessToken: string;
    origin?: string;
  }): Promise<UploadSessionResult>;

  getDownloadUrl(params: {
    fileName?: string;
    providerFileId: string;
    accessToken: string;
  }): Promise<string>;

  getThumbnail?(params: {
    providerFileId: string;
    accessToken: string;
  }): Promise<ThumbnailResult | null>;

  deleteFile(params: {
    providerFileId: string;
    accessToken: string;
  }): Promise<void>;

  renameFile?(params: {
    providerFileId: string;
    newName: string;
    accessToken: string;
  }): Promise<string | void>;

  fetchQuota(accessToken: string): Promise<QuotaResult>;

  listFiles?(accessToken: string): Promise<
    Array<{ providerFileId: string; fileName: string; size: number }>
  >;

  refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresInSeconds: number;
  }>;
}


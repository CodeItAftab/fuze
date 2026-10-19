export type DisconnectAction = "migrate" | "smart_unlink" | "delete";
export interface DisconnectPreviewResult {
  provider: string;
  accountEmail: string | null;
  totalBytesOnProvider: number;
  affectedFilesCount: number;
  wholeFilesCount: number;
  chunkedFilesCount: number;
  canMigrate: boolean;
  remainingFreeBytes: number;
  otherProvidersCount: number;
}

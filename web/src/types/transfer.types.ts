export type TransferStatus =
  | "queued"
  | "uploading"
  | "completed"
  | "failed"
  | "cancelled"
  | "paused";

export interface QueueItem {
  id: string;
  file: File;
  sessionId?: string;
  progress: number;
  uploadedBytes: number;
  totalBytes: number;
  status: TransferStatus;
  error?: string;
  strategy?: "whole" | "chunked";
  currentSpeed?: string;
  parentId?: string | null;
  abortController?: AbortController;
  activeXhr?: XMLHttpRequest | null;
}

export interface MigrationProgress {
  providerId: string;
  completed: number;
  total: number;
  percent: number;
  mode?: "client" | "server";
  statusText?: string;
  action?: string;
}

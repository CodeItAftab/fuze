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

export interface MigrationLogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "success";
  message: string;
}

export interface MigrationProgress {
  id?: string;
  jobId?: string;
  providerId: string;
  provider?: string;
  completed: number;
  total: number;
  percent: number;
  transferredBytes?: number;
  totalBytes?: number;
  currentFileName?: string | null;
  mode?: "client" | "server";
  statusText?: string;
  action?: string;
  logs?: MigrationLogEntry[];
  status?: string;
  errorMessage?: string | null;
  startedAt?: string;
  completedAt?: string | null;
}

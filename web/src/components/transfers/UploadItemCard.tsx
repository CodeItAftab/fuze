"use client";

import { QueueItem } from "@/types";
import { formatBytes } from "@/utils/formatters";
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  RotateCcw,
  Ban,
} from "lucide-react";

interface UploadItemCardProps {
  item: QueueItem;
  onCancel: (id: string) => void;
  onRetry: (item: QueueItem) => void;
}

export function UploadItemCard({
  item,
  onCancel,
  onRetry,
}: UploadItemCardProps) {
  const isUploading = item.status === "uploading";
  const isQueued = item.status === "queued";
  const isCompleted = item.status === "completed";
  const isFailed = item.status === "failed";
  const isCancelled = item.status === "cancelled";

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
      <div className="flex items-center justify-between gap-3 mb-2.5">
        {/* Left: Icon & File Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-slate-900 truncate">
              {item.file.name}
            </h4>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
              <span>{formatBytes(item.totalBytes || item.file.size)}</span>
              {item.currentSpeed && (
                <>
                  <span>•</span>
                  <span className="text-blue-600 font-mono font-medium">
                    {item.currentSpeed}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Status Badge & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isCompleted && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Completed</span>
            </span>
          )}

          {isUploading && (
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>{item.progress}%</span>
            </span>
          )}

          {isQueued && (
            <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              Queued
            </span>
          )}

          {isFailed && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Failed</span>
              </span>
              <button
                type="button"
                onClick={() => onRetry(item)}
                title="Retry upload"
                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          )}

          {isCancelled && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              <Ban className="h-3.5 w-3.5" />
              <span>Cancelled</span>
            </span>
          )}

          {/* Cancel button for active uploads */}
          {(isUploading || isQueued) && (
            <button
              type="button"
              onClick={() => onCancel(item.id)}
              title="Cancel upload"
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar (Only shown for in-progress or queued items) */}
      {(isUploading || isQueued) && (
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-200"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      )}

      {/* Error message text */}
      {isFailed && item.error && (
        <p className="mt-2 text-[11px] text-rose-600 font-medium">
          {item.error}
        </p>
      )}
    </div>
  );
}

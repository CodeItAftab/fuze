"use client";

import { useEffect, useState } from "react";
import { uploadQueueManager, QueueItem } from "@/lib/upload-queue";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UploadCloud,
  X,
  RotateCcw,
  Trash2,
  Clock,
  Ban,
} from "lucide-react";

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  if (kb >= 1) return `${kb.toFixed(0)} KB`;
  return `${bytes} B`;
}

interface UploadWidgetProps {
  onOpenChange?: (isOpen: boolean) => void;
}

export function UploadWidget({ onOpenChange }: UploadWidgetProps = {}) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const unsubscribe = uploadQueueManager.subscribe((newItems) => {
      setItems(newItems);
      if (
        newItems.some((i) => i.status === "uploading" || i.status === "queued")
      ) {
        setIsDismissed(false);
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (items.length === 0 || isDismissed) {
      onOpenChange?.(false);
    } else {
      onOpenChange?.(isOpen);
    }
  }, [items.length, isDismissed, isOpen, onOpenChange]);

  if (items.length === 0 || isDismissed) return null;

  const activeCount = items.filter(
    (i) => i.status === "uploading" || i.status === "queued",
  ).length;
  const completedCount = items.filter((i) => i.status === "completed").length;
  const failedCount = items.filter(
    (i) => i.status === "failed" || i.status === "cancelled",
  ).length;

  const totalBytes = items.reduce(
    (sum, i) => sum + (i.totalBytes || i.file.size || 0),
    0,
  );
  const uploadedBytes = items.reduce(
    (sum, i) => sum + (i.uploadedBytes || 0),
    0,
  );
  const overallProgress =
    totalBytes > 0
      ? Math.min(100, Math.round((uploadedBytes / totalBytes) * 100))
      : 0;

  const handleCancelItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    uploadQueueManager.cancelUpload(id);
  };

  const handleRetryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    uploadQueueManager.retryUpload(id);
  };

  const handleRemoveItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    uploadQueueManager.removeUpload(id);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  const handleClearCompleted = (e: React.MouseEvent) => {
    e.stopPropagation();
    uploadQueueManager.clearFinished();
  };

  return (
    <div className="fixed bottom-0 sm:bottom-5 left-0 sm:left-auto right-0 sm:right-5 sm:w-96 rounded-t-2xl sm:rounded-2xl shadow-2xl border-t sm:border border-slate-200/90 overflow-hidden z-50 text-xs font-sans transition-all duration-200 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="relative bg-slate-900 text-white px-4 py-3 flex items-center justify-between select-none">
        <div
          className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
          onClick={() => setIsOpen(!isOpen)}
        >
          <UploadCloud className="h-4 w-4 text-blue-400 shrink-0" />
          <div className="truncate">
            <span className="font-semibold text-xs text-white">
              {activeCount > 0
                ? `Uploading ${activeCount} item${activeCount > 1 ? "s" : ""}${overallProgress > 0 ? ` • ${overallProgress}%` : ""}...`
                : failedCount > 0 && completedCount === 0
                  ? `${failedCount} upload${failedCount > 1 ? "s" : ""} failed`
                  : `${completedCount} upload${completedCount > 1 ? "s" : ""} complete`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {completedCount > 0 && activeCount === 0 && (
            <button
              onClick={handleClearCompleted}
              title="Clear completed"
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
          >
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5" />
            )}
          </button>

          <button
            onClick={handleDismiss}
            title="Dismiss widget"
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Global Progress Bar under header */}
        {activeCount > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-200"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Item List */}
      {isOpen && (
        <div className="max-h-80 sm:max-h-72 overflow-y-auto divide-y divide-slate-100 bg-white">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-3 hover:bg-slate-50/70 transition flex flex-col gap-1.5"
            >
              {/* Item Top Row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {item.status === "uploading" && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600 shrink-0" />
                  )}
                  {item.status === "completed" && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  )}
                  {item.status === "failed" && (
                    <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                  )}
                  {item.status === "queued" && (
                    <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  )}
                  {item.status === "cancelled" && (
                    <Ban className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  )}

                  <span
                    className="font-medium text-slate-800 truncate text-[11px]"
                    title={item.file.name}
                  >
                    {item.file.name}
                  </span>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {item.status === "uploading" && (
                    <button
                      onClick={(e) => handleCancelItem(item.id, e)}
                      title="Cancel upload & cleanup chunks"
                      className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {(item.status === "failed" ||
                    item.status === "cancelled") && (
                    <>
                      <button
                        onClick={(e) => handleRetryItem(item.id, e)}
                        title="Retry upload"
                        className="p-1 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleRemoveItem(item.id, e)}
                        title="Remove from list"
                        className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Progress and status message */}
              {item.status === "uploading" && (
                <div className="space-y-1">
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-150"
                      style={{ width: `${Math.round(item.progress)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>
                      {formatBytes(item.uploadedBytes)} of{" "}
                      {formatBytes(item.file.size)}
                    </span>
                    <span className="font-semibold text-slate-600">
                      {Math.round(item.progress)}%
                    </span>
                  </div>
                </div>
              )}

              {item.status === "completed" && (
                <div className="text-[10px] text-emerald-600 font-medium">
                  {formatBytes(item.file.size)} uploaded across connected clouds
                </div>
              )}

              {item.status === "failed" && (
                <div
                  className="text-[10px] text-rose-600 truncate"
                  title={item.error || "Upload failed"}
                >
                  {item.error || "Upload failed"}
                </div>
              )}

              {item.status === "cancelled" && (
                <div className="text-[10px] text-slate-400 italic">
                  Upload cancelled & cleaned up
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { uploadQueueManager } from "@/lib/upload-queue";
import { QueueItem } from "@/types";
import { formatBytes } from "@/utils/formatters";
import { Sidebar } from "@/components/drive/Sidebar";
import { useDriveStore } from "@/stores/drive.store";
import { UploadItemCard } from "./UploadItemCard";
import { SegmentedTabs, TabItem } from "@/components/ui/SegmentedTabs";
import {
  UploadCloud,
  CheckCircle2,
  Loader2,
  Trash2,
  Menu,
  ArrowUpCircle,
} from "lucide-react";

type UploadFilter = "all" | "active" | "completed" | "failed";

export function UploadsView() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [filter, setFilter] = useState<UploadFilter>("all");
  const { setMobileSidebarOpen } = useDriveStore();

  useEffect(() => {
    const unsub = uploadQueueManager.subscribe((newItems) => {
      setItems(newItems);
    });
    return () => {
      unsub();
    };
  }, []);

  const activeItems = items.filter(
    (i) => i.status === "uploading" || i.status === "queued",
  );
  const completedItems = items.filter((i) => i.status === "completed");
  const failedItems = items.filter(
    (i) => i.status === "failed" || i.status === "cancelled",
  );

  const displayedItems = items.filter((i) => {
    if (filter === "active")
      return i.status === "uploading" || i.status === "queued";
    if (filter === "completed") return i.status === "completed";
    if (filter === "failed")
      return i.status === "failed" || i.status === "cancelled";
    return true;
  });

  const totalBytes = items.reduce(
    (sum, i) => sum + (i.totalBytes || i.file.size || 0),
    0,
  );
  const uploadedBytes = items.reduce(
    (sum, i) => sum + (i.uploadedBytes || 0),
    0,
  );
  const overallPercent =
    totalBytes > 0 ? Math.round((uploadedBytes / totalBytes) * 100) : 0;

  const uploadTabs: TabItem<UploadFilter>[] = [
    { id: "all", label: "All", count: items.length },
    { id: "active", label: "Active", count: activeItems.length },
    { id: "completed", label: "Done", count: completedItems.length },
    { id: "failed", label: "Failed", count: failedItems.length },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Sidebar onNewFolderClick={() => {}} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-24 sm:pb-8 w-full">
          {/* Header Bar */}
          <div className="flex items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-100 mb-5 sm:mb-6">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                aria-label="Open navigation menu"
                className="lg:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer shrink-0"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <ArrowUpCircle className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight truncate">
                    Upload Transfers
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
                    Live zero-proxy transfer activity and queue management
                  </p>
                </div>
              </div>
            </div>

            {/* Clear Completed Action */}
            {completedItems.length > 0 && (
              <button
                type="button"
                onClick={() => uploadQueueManager.clearCompleted()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg shadow-2xs transition cursor-pointer shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5 text-slate-400" />
                <span className="hidden sm:inline">Clear Completed</span>
                <span className="sm:hidden">Clear</span>
              </button>
            )}
          </div>

          <div className="space-y-5">
            {/* Stats Progress Banner (Shown when transfers exist) */}
            {items.length > 0 && (
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    <div>
                      <span className="text-slate-500">Total Progress:</span>{" "}
                      <strong className="text-slate-900 font-semibold">
                        {overallPercent}%
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Transferred:</span>{" "}
                      <strong className="text-slate-900 font-semibold">
                        {formatBytes(uploadedBytes)} / {formatBytes(totalBytes)}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    {activeItems.length > 0 && (
                      <span className="flex items-center gap-1 text-blue-600 font-medium">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>{activeItems.length} active</span>
                      </span>
                    )}
                    {completedItems.length > 0 && (
                      <span className="flex items-center gap-1 text-emerald-600 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{completedItems.length} done</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-300"
                    style={{ width: `${overallPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* 🎛️ Reusable Segmented Tabs with Config Array */}
            <SegmentedTabs
              tabs={uploadTabs}
              activeTab={filter}
              onChange={setFilter}
              className="sm:max-w-md"
            />

            {/* Smooth-fading Items Container */}
            <div key={filter} className="animate-in fade-in-50 duration-150">
              {displayedItems.length > 0 ? (
                <div className="space-y-2.5">
                  {displayedItems.map((item) => (
                    <UploadItemCard
                      key={item.id}
                      item={item}
                      onCancel={(id) => uploadQueueManager.cancelUpload(id)}
                      onRetry={(itemToRetry) =>
                        uploadQueueManager.retryUpload(itemToRetry.id)
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 sm:py-20 border border-dashed border-slate-200 rounded-2xl p-6 sm:p-8 bg-slate-50/50">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    No uploads in this view
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                    Files you upload or drag-and-drop into My Drive will appear
                    here with live speeds and progress.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

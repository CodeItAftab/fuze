"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, RefreshCw } from "lucide-react";
import { uploadQueueManager } from "@/lib/upload-queue";
import { QueueItem } from "@/types";
import { useDriveStore } from "@/stores/drive.store";
import { CircularProgressRing } from "./CircularProgressRing";

export function FloatingTransferHub() {
  const router = useRouter();
  const [uploadItems, setUploadItems] = useState<QueueItem[]>([]);
  const migrationProgress = useDriveStore((state) => state.migrationProgress);

  useEffect(() => {
    const unsub = uploadQueueManager.subscribe((items) => {
      setUploadItems(items);
    });
    return () => {
      unsub();
    };
  }, []);

  // 1. Calculate active upload stats
  const activeUploads = uploadItems.filter(
    (i) => i.status === "uploading" || i.status === "queued",
  );
  const totalUploadBytes = uploadItems.reduce(
    (sum, i) => sum + (i.totalBytes || i.file.size || 0),
    0,
  );
  const uploadedBytes = uploadItems.reduce(
    (sum, i) => sum + (i.uploadedBytes || 0),
    0,
  );
  const uploadPercent =
    totalUploadBytes > 0
      ? Math.round((uploadedBytes / totalUploadBytes) * 100)
      : 0;

  // 2. Calculate migration stats
  const isMigrating = migrationProgress !== null;
  const migrationPercent = migrationProgress?.percent ?? 0;

  // Don't render if neither uploads nor migrations are active
  if (activeUploads.length === 0 && !isMigrating) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-5 lg:bottom-6 lg:right-6 z-40 flex flex-col gap-3 items-center pointer-events-auto">
      {/* 🔄 Migration Circular Ring */}
      {isMigrating && (
        <CircularProgressRing
          progress={migrationPercent}
          size={52}
          colorClass="text-emerald-600"
          badge={migrationPercent > 0 ? `${migrationPercent}%` : undefined}
          badgeColorClass="bg-emerald-600 text-white"
          icon={<RefreshCw className="h-5 w-5 animate-spin" />}
          label="Cloud Migration"
          sublabel={
            migrationProgress?.statusText ||
            `${migrationProgress?.completed ?? 0} of ${
              migrationProgress?.total ?? 0
            } chunks moved`
          }
          onClick={() => router.push("/dashboard/migrations")}
        />
      )}

      {/* ⬆️ Uploads Circular Ring */}
      {activeUploads.length > 0 && (
        <CircularProgressRing
          progress={uploadPercent}
          size={52}
          colorClass="text-blue-600"
          badge={activeUploads.length}
          badgeColorClass="bg-blue-600 text-white"
          icon={<UploadCloud className="h-5 w-5 animate-pulse" />}
          label="File Uploads"
          sublabel={`${activeUploads.length} item(s) in progress`}
          onClick={() => router.push("/dashboard/uploads")}
        />
      )}
    </div>
  );
}

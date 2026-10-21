"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useDriveStore } from "@/stores/drive.store";
import { toast } from "@/stores/toast.store";
import { FolderArchive } from "lucide-react";
import { PendingRestoreActions } from "./PendingRestoreActions";
import { usePendingRestore } from "@/hooks/usePendingRestore";

function PendingRestoreBannerContent() {
  const router = useRouter();
  const { refreshProviders } = useDriveStore();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const { pending, setPending } = usePendingRestore(apiUrl);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!pending || dismissed) return null;

  const providerName = pending.provider
    .replace("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const handleAction = async (action: "restore" | "discard") => {
    setIsProcessing(true);
    try {
      const endpoint = action === "restore" ? "restore-pending" : "discard-pending";
      const res = await fetch(`${apiUrl}/providers/${pending.id}/${endpoint}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Action failed");

      toast.success(
        action === "restore" ? "Files Restored" : "Account Cleared",
        action === "restore"
          ? `Restored ${pending.fileCount} file(s) back to your Drive.`
          : "Previous file records cleared. Starting fresh.",
      );

      await refreshProviders();
      setPending(null);
      router.replace("/dashboard");
    } catch {
      toast.error("Error", "Could not complete action. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-3 text-xs text-slate-800">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <FolderArchive className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate">
              Reconnected {providerName}: {pending.fileCount} previous file(s) detected
            </p>
            <p className="text-slate-500 text-[11px] truncate">
              {pending.accountEmail ? `${pending.accountEmail} • ` : ""}
              Restore them to your Drive instantly (0 MB transfer) or start fresh.
            </p>
          </div>
        </div>

        <PendingRestoreActions
          isProcessing={isProcessing}
          onRestore={() => handleAction("restore")}
          onDiscard={() => handleAction("discard")}
          onDismiss={() => setDismissed(true)}
        />
      </div>
    </div>
  );
}

export function PendingRestoreBanner() {
  return (
    <Suspense fallback={null}>
      <PendingRestoreBannerContent />
    </Suspense>
  );
}

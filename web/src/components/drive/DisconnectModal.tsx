"use client";

import { useEffect, useState } from "react";
import { ProviderSummary } from "@/stores/drive.store";
import { AlertTriangle, X, RefreshCw, Trash2, ArrowRight } from "lucide-react";

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

export function DisconnectModal({
  provider,
  onClose,
  onSuccess,
}: {
  provider: ProviderSummary;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [preview, setPreview] = useState<DisconnectPreviewResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    fetch(`${apiUrl}/providers/${provider.id}/disconnect-preview`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data: DisconnectPreviewResult) => {
        setPreview(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [provider.id]);

  const handleAction = async (action: "migrate" | "delete") => {
    setIsSubmitting(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    await fetch(`${apiUrl}/providers/${provider.id}/disconnect`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setIsSubmitting(false);
    onSuccess();
    onClose();
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 B";
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    const kb = bytes / 1024;
    if (kb >= 1) return `${kb.toFixed(1)} KB`;
    return `${bytes} B`;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 p-6 text-xs font-sans animate-in fade-in zoom-in-95 duration-100"
      >
        <div className="flex items-center justify-between gap-3 mb-3 min-w-0">
          <div className="flex items-center gap-3 text-rose-600 font-bold text-sm min-w-0 flex-1">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span className="truncate">
              Disconnect {provider.provider.replace("_", " ").toUpperCase()}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition shrink-0 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-slate-400">
            Checking stored files...
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-slate-600 leading-relaxed">
              This provider currently holds{" "}
              <strong className="text-slate-900">
                {preview?.affectedFilesCount || 0} file
                {(preview?.affectedFilesCount || 0) === 1 ? "" : "s"}
              </strong>{" "}
              ({formatBytes(preview?.totalBytesOnProvider || 0)}).
            </p>

            {preview?.canMigrate ? (
              <div className="space-y-2 pt-2">
                <button
                  disabled={isSubmitting}
                  onClick={() => handleAction("migrate")}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" /> Migrate files to other
                    clouds
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  disabled={isSubmitting}
                  onClick={() => handleAction("delete")}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" /> Delete files permanently
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px]">
                  Not enough free space across other connected clouds to migrate
                  these files.
                </div>
                <button
                  disabled={isSubmitting}
                  onClick={() => handleAction("delete")}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold transition"
                >
                  Delete Files & Disconnect
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  ProviderSummary,
  DisconnectAction,
  DisconnectPreviewResult,
} from "@/types";
import { DisconnectHeader } from "./disconnect/DisconnectHeader";
import { DisconnectStorageSummary } from "./disconnect/DisconnectStorageSummary";
import { DisconnectOptionCard } from "./disconnect/DisconnectOptionCard";
import { DisconnectFooter } from "./disconnect/DisconnectFooter";
import { toast } from "@/stores/toast.store";
import { useDriveStore } from "@/stores/drive.store";
import {
  ArrowRightLeft,
  ShieldCheck,
  Trash2,
  FolderArchive,
  Sparkles,
  Loader2,
} from "lucide-react";

interface DisconnectModalProps {
  provider: ProviderSummary;
  onClose: () => void;
  onSuccess: () => void;
}

export function DisconnectModal({
  provider,
  onClose,
  onSuccess,
}: DisconnectModalProps) {
  const [preview, setPreview] = useState<DisconnectPreviewResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAction, setSelectedAction] =
    useState<DisconnectAction>("smart_unlink");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const providerDisplayName = provider.provider
    .replace("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    fetch(`${apiUrl}/providers/${provider.id}/disconnect-preview`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data: DisconnectPreviewResult) => {
        setPreview(data);
        setSelectedAction("smart_unlink");
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [provider.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isSubmitting]);

  const handleConfirm = async () => {
    setIsSubmitting(true);

    // ⚡ INSTANT FEEDBACK: Populate the migration store right now so the Migrations page is never delayed
    if (
      selectedAction === "migrate" ||
      (selectedAction === "smart_unlink" && sharedChunksCount > 0)
    ) {
      useDriveStore.getState().setMigrationProgress({
        providerId: provider.id,
        completed: 0,
        total: selectedAction === "migrate" ? (wholeFilesCount + sharedChunksCount || 1) : (sharedChunksCount || 1),
        action: selectedAction,
        percent: 0,
        mode: "server",
        statusText: "Preparing migration & allocating cloud storage...",
      });
      toast.info(
        "Migration Started",
        "Preparing files and allocating storage in background...",
      );
    } else if (selectedAction === "smart_unlink") {
      toast.info(
        "Unlinking Storage",
        "Preserving your whole files intact in native cloud...",
      );
    } else {
      toast.warning(
        "Deleting Provider",
        "Purging associated chunks and reclaiming storage...",
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    try {
      const res = await fetch(`${apiUrl}/providers/${provider.id}/disconnect`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: selectedAction }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to disconnect provider");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setIsSubmitting(false);
      useDriveStore.getState().setMigrationProgress(null);
      toast.error(
        "Disconnection Failed",
        err instanceof Error ? err.message : "Network error",
      );
    }
  };

  const otherCloudsCount = preview?.otherProvidersCount ?? 0;
  const canMigrateAll = preview?.canMigrate ?? false;
  const sharedChunksCount = preview?.chunkedFilesCount ?? 0;
  const wholeFilesCount = preview?.wholeFilesCount ?? 0;

  return (
    <div
      onClick={() => !isSubmitting && onClose()}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200/90 p-5 sm:p-6 text-xs font-sans animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
      >
        <DisconnectHeader
          providerDisplayName={providerDisplayName}
          accountEmail={provider.accountEmail}
          isSubmitting={isSubmitting}
          onClose={onClose}
        />

        {isLoading ? (
          <div className="py-16 text-center text-slate-500 space-y-2.5">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
            <p className="text-xs font-medium">
              Analyzing storage allocations...
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-3.5 overflow-y-auto pr-0.5">
            <DisconnectStorageSummary
              totalBytes={preview?.totalBytesOnProvider || 0}
              wholeFilesCount={wholeFilesCount}
              sharedChunksCount={sharedChunksCount}
            />

            <div className="space-y-2.5">
              <p className="text-[11px] font-medium text-slate-500 px-0.5">
                Choose disconnection strategy:
              </p>

              {/* 1. Smart Evacuate */}
              <DisconnectOptionCard
                title="1. Smart Evacuate"
                badge={
                  <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-700 font-bold text-[9px] rounded-full uppercase flex items-center gap-0.5">
                    <Sparkles className="h-2.5 w-2.5" /> Recommended
                  </span>
                }
                icon={ShieldCheck}
                theme="emerald"
                isSelected={selectedAction === "smart_unlink"}
                description={
                  <div className="space-y-1.5">
                    <p>
                      {sharedChunksCount === 0
                        ? `All files on this cloud are whole files. They stay 100% safe in your ${providerDisplayName} account with 0 MB transfer bandwidth.`
                        : otherCloudsCount > 0 && canMigrateAll
                          ? `Whole files stay safe in your ${providerDisplayName} account. Only the ${sharedChunksCount} split chunk(s) will be relocated so multi-cloud files are protected.`
                          : `Whole files stay safe in your ${providerDisplayName} account. Any split pieces will be protected.`}
                    </p>
                    {sharedChunksCount > 0 && (
                      <div className="p-2 rounded-lg bg-emerald-600/10 border border-emerald-200 text-[10.5px] text-emerald-800 flex items-start gap-1.5">
                        <FolderArchive className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          Relocates only split chunks to save time and bandwidth.
                        </span>
                      </div>
                    )}
                  </div>
                }
                onSelect={() => setSelectedAction("smart_unlink")}
              />

              {/* 2. Move All Files */}
              <DisconnectOptionCard
                title="2. Move All Files"
                badge={
                  <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 font-bold text-[9px] rounded-full uppercase">
                    Full Evacuation
                  </span>
                }
                icon={ArrowRightLeft}
                theme="blue"
                isSelected={selectedAction === "migrate"}
                isDisabled={!canMigrateAll}
                disabledReason={
                  otherCloudsCount === 0
                    ? "Requires at least one other connected cloud account."
                    : "Remaining clouds do not have enough free capacity."
                }
                description="Transfers both whole files and chunks to remaining clouds so Fuze Drive keeps active access to every file without keeping this provider connected."
                onSelect={() => setSelectedAction("migrate")}
              />

              {/* 3. Delete All Files */}
              <DisconnectOptionCard
                title="3. Delete All Files"
                icon={Trash2}
                theme="rose"
                isSelected={selectedAction === "delete"}
                description="Permanently deletes all files stored on this cloud. Any associated multi-cloud chunks on other clouds will be cascade-purged to reclaim storage."
                onSelect={() => setSelectedAction("delete")}
              />
            </div>
          </div>
        )}

        {!isLoading && (
          <DisconnectFooter
            selectedAction={selectedAction}
            isSubmitting={isSubmitting}
            onCancel={onClose}
            onConfirm={handleConfirm}
          />
        )}
      </div>
    </div>
  );
}

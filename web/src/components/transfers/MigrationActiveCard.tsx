"use client";

import React, { useState } from "react";
import {
  Loader2,
  HardDrive,
  FileText,
  Terminal,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { MigrationProgress } from "@/types/transfer.types";
import { apiFetch } from "@/lib/api";

interface MigrationActiveCardProps {
  progress?: MigrationProgress | null;
  migration?: MigrationProgress | null;
  onCancelled?: () => void;
}

export function MigrationActiveCard({
  progress,
  migration: migrationProp,
  onCancelled,
}: MigrationActiveCardProps) {
  const migration = progress || migrationProp;
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  if (!migration) return null;

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 MB";
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const handleCancelMigration = async () => {
    setCancelling(true);
    try {
      await apiFetch("/providers/migrations/cancel", {
        method: "POST",
        body: JSON.stringify({
          jobId: migration.jobId || migration.providerId,
        }),
      });
      setShowCancelModal(false);
      if (onCancelled) onCancelled();
    } catch (err: any) {
      alert(`Could not cancel migration: ${err?.message || "Server error"}`);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-b from-blue-50/50 to-white p-6 shadow-sm dark:border-blue-900/50 dark:from-slate-900 dark:to-slate-900/80">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Active Relocation: {migration.provider?.toUpperCase()}
            </h3>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              {migration.action?.toUpperCase() || "SMART UNLINK"}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {migration.statusText ||
              "Processing file relocation safely across clouds..."}
          </p>
        </div>

        <button
          onClick={() => setShowCancelModal(true)}
          className="self-start sm:self-auto flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-colors"
        >
          <XCircle className="h-4 w-4" />
          Cancel Migration
        </button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2 mb-6">
        <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
          <span>Overall Progress</span>
          <span className="font-bold text-blue-600 dark:text-blue-400">
            {migration.percent}%
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{
              width: `${Math.min(100, Math.max(0, migration.percent))}%`,
            }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl border border-slate-100 bg-white/80 p-3 dark:border-slate-800 dark:bg-slate-900/60">
          <span className="text-[11px] font-medium text-slate-500">
            File Chunks
          </span>
          <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-white">
            {migration.completed} / {migration.total}
          </p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white/80 p-3 dark:border-slate-800 dark:bg-slate-900/60">
          <span className="text-[11px] font-medium text-slate-500">
            Transferred Volume
          </span>
          <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-white">
            {formatBytes(migration.transferredBytes || 0)} /{" "}
            {formatBytes(migration.totalBytes || 0)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white/80 p-3 dark:border-slate-800 dark:bg-slate-900/60">
          <span className="text-[11px] font-medium text-slate-500">
            Active File
          </span>
          <p className="mt-0.5 text-xs font-semibold text-slate-800 dark:text-white truncate">
            {migration.currentFileName || "Scanning storage..."}
          </p>
        </div>
      </div>

      {/* Terminal Log Console */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs font-mono text-slate-300">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800 text-slate-400">
          <Terminal className="h-3.5 w-3.5" />
          <span className="font-medium text-[11px]">
            Real-Time Relocation Console
          </span>
        </div>
        <div className="max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
          {!migration.logs || migration.logs.length === 0 ? (
            <p className="text-slate-500 italic">
              Waiting for relocation events...
            </p>
          ) : (
            migration.logs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-[10px] text-slate-500 shrink-0">
                  {log.timestamp
                    ? new Date(log.timestamp).toLocaleTimeString()
                    : "--:--:--"}
                </span>
                <span
                  className={
                    log.level === "error"
                      ? "text-red-400 font-semibold"
                      : log.level === "warn"
                        ? "text-amber-400"
                        : log.level === "success"
                          ? "text-emerald-400"
                          : "text-slate-300"
                  }
                >
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-3 text-amber-600">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="font-bold text-slate-900 dark:text-white">
                Cancel Active Migration?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Cancelling will safely halt all upcoming transfers. Files already
              relocated will remain intact on their new destination clouds,
              while unmigrated files stay on your source cloud.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="rounded-xl px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Continue Migration
              </button>
              <button
                onClick={handleCancelMigration}
                disabled={cancelling}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Yes, Cancel Migration"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

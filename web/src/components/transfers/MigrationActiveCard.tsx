"use client";

import { MigrationProgress } from "@/types";
import { PROVIDERS_CONFIG } from "@/config/providers.config";
import {
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  Laptop,
  Server,
  Terminal,
  FileText,
  Activity,
} from "lucide-react";

interface MigrationActiveCardProps {
  progress: MigrationProgress;
}

export function MigrationActiveCard({ progress }: MigrationActiveCardProps) {
  const percent = Math.min(100, Math.max(0, Math.round(progress.percent)));
  const isComplete = percent >= 100;
  const isClientMode = progress.mode === "client";

  const sourceMeta = PROVIDERS_CONFIG[progress.providerId] || {
    label: (progress.provider || progress.providerId || "CLOUD").toUpperCase(),
    dotClass: "bg-slate-700",
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes <= 0) return "0 MB";
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <RefreshCw className={`h-4.5 w-4.5 ${isComplete ? "" : "animate-spin"}`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Provider Evacuation & Relocation
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {progress.statusText ||
                "Safely relocating chunks to connected clouds"}
            </p>
          </div>
        </div>

        {/* Mode Badge & Status Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Client vs Server Badge */}
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border ${
              isClientMode
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-indigo-50 text-indigo-700 border-indigo-200"
            }`}
          >
            {isClientMode ? (
              <>
                <Laptop className="h-3 w-3" />
                <span>Client Direct Stream</span>
              </>
            ) : (
              <>
                <Server className="h-3 w-3" />
                <span>Server Background Worker</span>
              </>
            )}
          </span>

          {/* Completion Pill */}
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            {isComplete ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Finalized</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Migrating</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Cloud Flow Visualization */}
      <div className="flex items-center justify-between p-4 bg-slate-50/80 rounded-xl border border-slate-200/70">
        <div className="flex items-center gap-2.5">
          <span className={`w-3 h-3 rounded-full ${sourceMeta.dotClass}`} />
          <div>
            <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">
              Source Provider
            </span>
            <span className="text-xs font-semibold text-slate-900">
              {sourceMeta.label}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center px-4">
          <ArrowRight className="h-4 w-4 text-slate-400" />
          <span className="text-[10px] font-mono text-emerald-600 font-semibold mt-0.5">
            {percent}%
          </span>
        </div>

        <div className="flex items-center gap-2.5 text-right">
          <div>
            <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">
              Destination
            </span>
            <span className="text-xs font-semibold text-slate-900">
              Connected Clouds
            </span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-white border border-slate-200/90 flex items-center justify-center text-slate-500 shadow-2xs">
            <HardDrive className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>

      {/* Real-Time Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-[11px] text-slate-400 font-medium block">
            Chunks Processed
          </span>
          <span className="font-semibold text-slate-900 text-sm mt-0.5 block">
            {progress.completed} of {progress.total}
          </span>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-[11px] text-slate-400 font-medium block">
            Data Transferred
          </span>
          <span className="font-semibold text-slate-900 text-sm mt-0.5 block">
            {formatBytes(progress.transferredBytes)}
            {progress.totalBytes ? ` / ${formatBytes(progress.totalBytes)}` : ""}
          </span>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
          <span className="text-[11px] text-slate-400 font-medium block">
            Current Target
          </span>
          <span className="font-semibold text-slate-900 text-xs mt-0.5 block truncate" title={progress.currentFileName || "Initializing..."}>
            {progress.currentFileName || "Waiting for chunks..."}
          </span>
        </div>
      </div>

      {/* Progress Bar & Counters */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-600 font-medium flex items-center gap-1.5 truncate">
            <Activity className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{progress.statusText || "Transfer in progress..."}</span>
          </span>
          <span className="font-semibold text-slate-900 shrink-0">
            {percent}%
          </span>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Live Terminal Log Console */}
      {progress.logs && progress.logs.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-slate-600" />
              <span>Live Migration Logs</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {progress.logs.length} entries
            </span>
          </div>
          <div className="bg-slate-950 text-slate-200 font-mono text-[11px] p-3.5 rounded-xl max-h-52 overflow-y-auto space-y-1.5 shadow-inner border border-slate-800">
            {progress.logs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="text-slate-500 text-[10px] shrink-0 select-none">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                </span>
                <span
                  className={
                    log.level === "error"
                      ? "text-rose-400 font-semibold"
                      : log.level === "warn"
                        ? "text-amber-300"
                        : log.level === "success"
                          ? "text-emerald-400 font-medium"
                          : "text-slate-300"
                  }
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Zero Data Loss Guarantee */}
      <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
        <span>
          <strong>Data Protection Protocol:</strong> Source cloud will only be
          unlinked once 100% of chunks are verified in their destination.
        </span>
      </div>
    </div>
  );
}

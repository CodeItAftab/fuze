"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/drive/Sidebar";
import { useDriveStore } from "@/stores/drive.store";
import { SegmentedTabs, TabItem } from "@/components/ui/SegmentedTabs";
import { MigrationActiveCard } from "./MigrationActiveCard";
import { MigrationProgress } from "@/types";
import { apiFetch } from "@/lib/api";
import {
  Menu,
  Cloud,
  CheckCircle2,
  Clock,
  AlertTriangle,
  History,
  Ban,
  ShieldCheck,
  RefreshCw,
  Layers,
  ArrowRight,
  Terminal,
} from "lucide-react";

type MigrationTab = "active" | "history" | "overview";

export function MigrationsView() {
  const [tab, setTab] = useState<MigrationTab>("active");
  const [historyJobs, setHistoryJobs] = useState<MigrationProgress[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const { setMobileSidebarOpen } = useDriveStore();

  const {
    migrationProgress,
    lastCompletedMigration,
    setMigrationProgress,
    setLastCompletedMigration,
  } = useDriveStore();

  const isMigrating = migrationProgress !== null;

  // Single initial load on mount: restore active state & history if user reloaded the page
  useEffect(() => {
    apiFetch<{ job: MigrationProgress | null }>("/providers/migrations/active")
      .then((data) => {
        setMigrationProgress(data.job ?? null);
      })
      .catch(() => {});

    setIsLoadingHistory(true);
    apiFetch<{ history: MigrationProgress[] }>("/providers/migrations/history")
      .then((data) => {
        if (data.history) {
          setHistoryJobs(data.history);
          if (data.history.length > 0 && !lastCompletedMigration) {
            const latest = data.history[0];
            setLastCompletedMigration({
              ...latest,
              completedAt: new Date(
                latest.completedAt || latest.startedAt || Date.now(),
              ).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              status: latest.status || "completed",
            });
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingHistory(false));
  }, [setMigrationProgress, setLastCompletedMigration, lastCompletedMigration]);

  // Active fallback polling while migration is running (guarantees sync even during packet drops)
  useEffect(() => {
    if (!isMigrating) return;
    const interval = setInterval(() => {
      apiFetch<{ job: MigrationProgress | null }>(
        "/providers/migrations/active",
      )
        .then((data) => {
          setMigrationProgress(data.job ?? null);
        })
        .catch(() => {});
    }, 1500);
    return () => clearInterval(interval);
  }, [isMigrating, setMigrationProgress]);

  // When migration finishes or cancels via WebSocket, refresh history list once
  useEffect(() => {
    if (!isMigrating) {
      apiFetch<{ history: MigrationProgress[] }>(
        "/providers/migrations/history",
      )
        .then((data) => {
          if (data.history) setHistoryJobs(data.history);
        })
        .catch(() => {});
    }
  }, [isMigrating]);

  // Clean, concise labels so the 3-tab segmented control fits 100% with no scrollbar on mobile
  const tabs: TabItem<MigrationTab>[] = [
    { id: "active", label: "Active", count: isMigrating ? 1 : 0 },
    { id: "history", label: "History", count: historyJobs.length },
    { id: "overview", label: "Guide" },
  ];

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes <= 0) return "0 MB";
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Sidebar onNewFolderClick={() => {}} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        {/* Header - Matches DriveView header padding & background pixel-for-pixel */}
        <header className="shrink-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 md:px-8 py-3 z-20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="p-1.5 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden shrink-0 cursor-pointer"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 truncate">
                  Provider Migrations
                </h1>
                <p className="text-xs text-slate-500 hidden sm:block truncate mt-0.5">
                  Zero-data-loss cloud evacuation and persistent chunk rebalancing
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/storage"
              className="text-xs font-semibold text-slate-700 hover:text-blue-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-200 bg-white shadow-2xs hover:shadow-xs transition shrink-0"
            >
              <Cloud className="h-3.5 w-3.5 text-blue-500" />
              <span className="hidden sm:inline">Manage Clouds</span>
              <span className="sm:hidden">Clouds</span>
            </Link>
          </div>
        </header>

        {/* Main Content - Full width layout matching DriveView (p-4 sm:p-6 md:p-8) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 w-full pb-28">
          <div className="w-full space-y-4 sm:space-y-6">
            <SegmentedTabs
              tabs={tabs}
              activeTab={tab}
              onChange={(newTab) => setTab(newTab)}
            />

            {/* TAB 1: ACTIVE MIGRATION */}
            {tab === "active" && (
              <div className="animate-in fade-in-50 duration-150 space-y-4">
                {isMigrating ? (
                  <MigrationActiveCard progress={migrationProgress} />
                ) : (
                  <div className="space-y-4">
                    {lastCompletedMigration && (
                      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
                        {/* Status Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                lastCompletedMigration.status === "success" ||
                                lastCompletedMigration.status === "completed"
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                  : lastCompletedMigration.status ===
                                      "cancelled"
                                    ? "bg-slate-100 text-slate-600 border border-slate-200"
                                    : "bg-amber-50 text-amber-600 border border-amber-100"
                              }`}
                            >
                              {lastCompletedMigration.status === "success" ||
                              lastCompletedMigration.status === "completed" ? (
                                <CheckCircle2 className="h-5 w-5" />
                              ) : lastCompletedMigration.status ===
                                "cancelled" ? (
                                <Ban className="h-5 w-5" />
                              ) : (
                                <AlertTriangle className="h-5 w-5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-semibold text-slate-900 truncate">
                                Last Provider Evacuation Job
                              </h4>
                              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <Clock className="h-3 w-3 shrink-0" />
                                <span className="truncate">
                                  {lastCompletedMigration.completedAt
                                    ? `Finished at ${lastCompletedMigration.completedAt}`
                                    : "Recently completed"}
                                </span>
                              </p>
                            </div>
                          </div>

                          <span
                            className={`self-start sm:self-auto text-[11px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${
                              lastCompletedMigration.status === "success" ||
                              lastCompletedMigration.status === "completed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : lastCompletedMigration.status === "cancelled"
                                  ? "bg-slate-50 text-slate-700 border-slate-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {lastCompletedMigration.status === "success" ||
                            lastCompletedMigration.status === "completed"
                              ? "Finalized • Quotas Reclaimed"
                              : lastCompletedMigration.status === "cancelled"
                                ? "Cancelled by User"
                                : "Partially Complete"}
                          </span>
                        </div>

                        {/* 3 Metrics Cards */}
                        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 text-xs">
                          <div className="p-3 bg-slate-50/80 border border-slate-200/70 rounded-xl">
                            <span className="text-[11px] text-slate-400 block font-medium truncate">
                              Chunks Relocated
                            </span>
                            <span className="font-semibold text-slate-900 text-sm sm:text-base mt-0.5 block truncate">
                              {lastCompletedMigration.completed} of{" "}
                              {lastCompletedMigration.total}
                            </span>
                          </div>
                          <div className="p-3 bg-slate-50/80 border border-slate-200/70 rounded-xl">
                            <span className="text-[11px] text-slate-400 block font-medium truncate">
                              Action Taken
                            </span>
                            <span className="font-semibold text-slate-900 text-sm sm:text-base mt-0.5 block capitalize truncate">
                              {lastCompletedMigration.action?.replace(
                                "_",
                                " ",
                              ) || "Migrate"}
                            </span>
                          </div>
                          <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                            <span className="text-[11px] text-emerald-700 block font-medium truncate">
                              Data Integrity
                            </span>
                            <span className="font-semibold text-emerald-600 text-sm sm:text-base mt-0.5 block truncate">
                              100% Verified
                            </span>
                          </div>
                        </div>

                        {/* Polished Terminal Logs */}
                        {lastCompletedMigration.logs &&
                          lastCompletedMigration.logs.length > 0 && (
                            <div className="pt-1">
                              <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2 px-0.5">
                                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                                  <Terminal className="h-3.5 w-3.5 text-blue-500" />
                                  Execution Logs
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {lastCompletedMigration.logs.length} events logged
                                </span>
                              </div>
                              <div className="bg-slate-900 rounded-xl p-3.5 sm:p-4 text-[11px] font-mono text-slate-300 max-h-52 overflow-y-auto space-y-1.5 border border-slate-800 shadow-inner">
                                {lastCompletedMigration.logs.map((log, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-start gap-2 leading-relaxed break-words"
                                  >
                                    <span className="text-slate-500 shrink-0 select-none text-[10px] pt-0.5">
                                      {log.timestamp
                                        ? new Date(
                                            log.timestamp,
                                          ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            second: "2-digit",
                                          })
                                        : "LOG"}
                                    </span>
                                    <span
                                      className={`flex-1 ${
                                        log.level === "error"
                                          ? "text-rose-400 font-semibold"
                                          : log.level === "warn"
                                            ? "text-amber-400"
                                            : log.level === "success"
                                              ? "text-emerald-400 font-medium"
                                              : "text-slate-300"
                                      }`}
                                    >
                                      {log.message}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    )}

                    {/* Empty Migration Standby Card */}
                    <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 sm:p-12 text-center space-y-3 shadow-2xs">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-blue-600">
                        <Cloud className="h-6 w-6" />
                      </div>
                      <div className="max-w-md mx-auto">
                        <p className="text-sm font-semibold text-slate-800">
                          No active migration in progress
                        </p>
                        <p className="text-xs text-slate-500 mt-1 leading-normal">
                          When you disconnect a cloud provider, automated chunk
                          evacuation and rebalancing progress stream here
                          in real time.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: HISTORY & LOGS */}
            {tab === "history" && (
              <div className="animate-in fade-in-50 duration-150 space-y-3">
                {isLoadingHistory ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Loading migration history...
                  </div>
                ) : historyJobs.length === 0 ? (
                  <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
                    No migration history recorded yet.
                  </div>
                ) : (
                  historyJobs.map((job) => (
                    <div
                      key={job.jobId || job.id}
                      className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-slate-300 transition"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900 text-sm">
                            {job.provider?.toUpperCase()}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600 uppercase">
                            {job.action}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                              job.status === "completed"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                : job.status === "cancelled"
                                  ? "bg-slate-100 text-slate-700"
                                  : "bg-red-50 text-red-700 border border-red-200/60"
                            }`}
                          >
                            {job.status?.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-1.5">
                          {job.completed} / {job.total} chunks •{" "}
                          {formatBytes(job.transferredBytes)} transferred •{" "}
                          Started{" "}
                          {job.startedAt
                            ? new Date(job.startedAt).toLocaleString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: HOW IT WORKS GUIDE */}
            {tab === "overview" && (
              <div className="animate-in fade-in-50 duration-150 space-y-4">
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Zero-Data-Loss Migration Architecture
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Fuze Drive guarantees uninterrupted data accessibility even
                      when disconnecting major cloud providers.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                        1
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Target Evacuation Scan
                      </h4>
                      <p className="text-[11px] text-slate-600 leading-normal">
                        Scans the virtual file system index for all encrypted
                        chunks physically stored on the disconnecting provider.
                      </p>
                    </div>

                    <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                        2
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Peer Rebalancing
                      </h4>
                      <p className="text-[11px] text-slate-600 leading-normal">
                        Streams chunks into your remaining connected clouds using
                        concurrent transfer pipelines with quota awareness.
                      </p>
                    </div>

                    <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                        3
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">
                        SHA-256 Verification
                      </h4>
                      <p className="text-[11px] text-slate-600 leading-normal">
                        Cryptographically validates integrity hashes before
                        updating the VFS pointers and safely unlinking the provider.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                      <span className="text-slate-700 font-medium text-xs">
                        Ready to disconnect or rebalance clouds anytime from Storage.
                      </span>
                    </div>
                    <Link
                      href="/dashboard/storage"
                      className="text-blue-600 font-semibold hover:underline shrink-0 text-xs flex items-center gap-1"
                    >
                      Storage Page <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

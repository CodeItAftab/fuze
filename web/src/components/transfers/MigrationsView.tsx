"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/drive/Sidebar";
import { useDriveStore } from "@/stores/drive.store";
import { SegmentedTabs, TabItem } from "@/components/ui/SegmentedTabs";
import { MigrationActiveCard } from "./MigrationActiveCard";
import { MigrationProgress } from "@/types";
import {
  RefreshCw,
  Cloud,
  ArrowRight,
  ShieldCheck,
  Split,
  FolderSync,
  Menu,
  CheckCircle2,
  Clock,
  AlertTriangle,
  History,
  Terminal,
} from "lucide-react";

type MigrationTab = "active" | "history" | "overview";

export function MigrationsView() {
  const [tab, setTab] = useState<MigrationTab>("active");
  const [historyJobs, setHistoryJobs] = useState<MigrationProgress[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const {
    migrationProgress,
    lastCompletedMigration,
    setMigrationProgress,
    setLastCompletedMigration,
    providers,
    setMobileSidebarOpen,
  } = useDriveStore();

  const isMigrating = migrationProgress !== null;

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    // 1. Fetch active migration from DB
    fetch(`${apiUrl}/providers/migrations/active`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { job: null }))
      .then((data) => {
        if (data.job) {
          setMigrationProgress(data.job);
        }
      })
      .catch(() => {});

    // 2. Fetch migration history from DB
    setIsLoadingHistory(true);
    fetch(`${apiUrl}/providers/migrations/history`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { history: [] }))
      .then((data) => {
        if (data.history) {
          setHistoryJobs(data.history);
          if (data.history.length > 0 && !lastCompletedMigration) {
            const latest = data.history[0];
            setLastCompletedMigration({
              ...latest,
              completedAt: new Date(latest.completedAt || latest.startedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            });
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingHistory(false));
  }, [setMigrationProgress, setLastCompletedMigration, lastCompletedMigration]);

  const tabs: TabItem<MigrationTab>[] = [
    { id: "active", label: "Active Job", count: isMigrating ? 1 : 0 },
    { id: "history", label: "History & Logs", count: historyJobs.length },
    { id: "overview", label: "How It Works" },
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        <header className="shrink-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 md:px-8 py-3 z-20">
          <div className="flex items-center justify-between gap-3">
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
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <RefreshCw
                    className={`h-4 w-4 ${isMigrating ? "animate-spin" : ""}`}
                  />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight truncate">
                    Provider Migrations
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
                    Zero-data-loss cloud evacuation and persistent chunk rebalancing
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/dashboard/storage"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg shadow-2xs transition cursor-pointer shrink-0"
            >
              <Cloud className="h-3.5 w-3.5 text-blue-600" />
              <span className="hidden sm:inline">Manage Clouds</span>
              <span className="sm:hidden">Clouds</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-24 sm:pb-8 w-full">
          <div className="space-y-5">
            <SegmentedTabs
              tabs={tabs}
              activeTab={tab}
              onChange={setTab}
              className="sm:max-w-md"
            />

            {/* Tab: Active Migration */}
            {tab === "active" && (
              <div className="animate-in fade-in-50 duration-150">
                {isMigrating ? (
                  <MigrationActiveCard progress={migrationProgress} />
                ) : (
                  <div className="space-y-4">
                    {lastCompletedMigration && (
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                lastCompletedMigration.status === "success" || lastCompletedMigration.status === "completed"
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-amber-50 text-amber-600"
                              }`}
                            >
                              {lastCompletedMigration.status === "success" || lastCompletedMigration.status === "completed" ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <AlertTriangle className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-slate-900">
                                Last Provider Evacuation Job
                              </h4>
                              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {lastCompletedMigration.completedAt
                                    ? `Finished at ${lastCompletedMigration.completedAt}`
                                    : "Recently completed"}
                                </span>
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                              lastCompletedMigration.status === "success" || lastCompletedMigration.status === "completed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {lastCompletedMigration.status === "success" || lastCompletedMigration.status === "completed"
                              ? "Finalized • Quotas Reclaimed"
                              : "Partially Complete"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                          <div className="p-3 bg-slate-50 rounded-xl">
                            <span className="text-[11px] text-slate-400 block font-medium">
                              Chunks Relocated
                            </span>
                            <span className="font-semibold text-slate-900 text-sm mt-0.5 block">
                              {lastCompletedMigration.completed} of {lastCompletedMigration.total}
                            </span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl">
                            <span className="text-[11px] text-slate-400 block font-medium">
                              Action Taken
                            </span>
                            <span className="font-semibold text-slate-900 text-sm mt-0.5 block capitalize">
                              {lastCompletedMigration.action?.replace("_", " ") || "Smart Evacuate"}
                            </span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl col-span-2 sm:col-span-1">
                            <span className="text-[11px] text-slate-400 block font-medium">
                              Data Integrity
                            </span>
                            <span className="font-semibold text-emerald-600 text-sm mt-0.5 block">
                              100% Verified
                            </span>
                          </div>
                        </div>

                        {lastCompletedMigration.logs && lastCompletedMigration.logs.length > 0 && (
                          <div className="pt-2">
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 pb-1.5">
                              <Terminal className="h-3 w-3 text-slate-500" />
                              <span>Execution Logs</span>
                            </div>
                            <div className="bg-slate-950 text-slate-300 font-mono text-[10.5px] p-3 rounded-xl max-h-40 overflow-y-auto space-y-1">
                              {lastCompletedMigration.logs.map((log, i) => (
                                <div key={i} className="flex items-start gap-2">
                                  <span className="text-slate-500 select-none">
                                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                                  </span>
                                  <span className={log.level === "error" ? "text-rose-400 font-semibold" : log.level === "success" ? "text-emerald-400" : "text-slate-300"}>
                                    {log.message}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="text-center py-12 sm:py-16 border border-dashed border-slate-200 rounded-2xl p-6 sm:p-8 bg-slate-50/50">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                        <FolderSync className="h-6 w-6" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-800">
                        No active migration in progress
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                        When you disconnect a cloud account from Connected Clouds,
                        Fuze automatically evacuates your file chunks to remaining
                        clouds without data loss.
                      </p>
                      <div className="mt-5">
                        <Link
                          href="/dashboard/storage"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          <span>View Connected Clouds ({providers.length})</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: History & Detailed Logs */}
            {tab === "history" && (
              <div className="animate-in fade-in-50 duration-150 space-y-4">
                {isLoadingHistory ? (
                  <div className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />
                    <span className="text-xs">Loading migration history from database...</span>
                  </div>
                ) : historyJobs.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50/50">
                    <History className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                    <h4 className="text-xs font-semibold text-slate-700">No migration history found</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Completed and previous migration jobs will appear here with full logs.
                    </p>
                  </div>
                ) : (
                  historyJobs.map((job) => (
                    <div
                      key={job.id || job.jobId || Math.random()}
                      className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 uppercase">
                              {job.provider || "Cloud"} ({job.action?.replace("_", " ") || "Evacuation"})
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                job.status === "completed"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : job.status === "running"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              {job.status?.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            Started {job.startedAt ? new Date(job.startedAt).toLocaleString() : "Recently"}
                            {job.completedAt ? ` • Finished ${new Date(job.completedAt).toLocaleTimeString()}` : ""}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-semibold text-slate-800 block">
                            {job.completed} of {job.total} chunks ({job.percent}%)
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {formatBytes(job.transferredBytes)} transferred
                          </span>
                        </div>
                      </div>

                      {job.logs && job.logs.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                            <Terminal className="h-3 w-3 text-slate-500" />
                            <span>Job Logs</span>
                          </span>
                          <div className="bg-slate-950 text-slate-200 font-mono text-[10.5px] p-3 rounded-xl max-h-44 overflow-y-auto space-y-1 border border-slate-800">
                            {job.logs.map((log, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <span className="text-slate-500 select-none">
                                  {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                                </span>
                                <span className={log.level === "error" ? "text-rose-400 font-semibold" : log.level === "warn" ? "text-amber-300" : log.level === "success" ? "text-emerald-400" : "text-slate-300"}>
                                  {log.message}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab: How It Works & Architecture Overview */}
            {tab === "overview" && (
              <div className="animate-in fade-in-50 duration-150 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900">
                    Smart Evacuate (Instant / Recommended)
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Leaves whole files 100% untouched inside your native cloud provider with 0 MB network transfer.
                    Only multi-cloud split chunks are moved to remaining clouds to prevent split files from breaking.
                  </p>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Split className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900">
                    Full Evacuation (Move All Files)
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Transfers all files and chunks from the departing cloud onto your remaining connected clouds,
                    reclaiming all space and leaving 0 files behind in the source provider.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

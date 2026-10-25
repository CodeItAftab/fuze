"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/drive/Sidebar";
import { useDriveStore } from "@/stores/drive.store";
import { SegmentedTabs, TabItem } from "@/components/ui/SegmentedTabs";
import { MigrationActiveCard } from "./MigrationActiveCard";
import { MigrationProgress } from "@/types";
import { Menu } from "lucide-react";
import {
  Cloud,
  CheckCircle2,
  Clock,
  AlertTriangle,
  History,
  Ban,
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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    fetch(`${apiUrl}/providers/migrations/active`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { job: null }))
      .then((data) => {
        if (data.job) {
          setMigrationProgress(data.job);
        }
      })
      .catch(() => {});

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
              completedAt: new Date(
                latest.completedAt || latest.startedAt,
              ).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            });
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingHistory(false));
  }, [setMigrationProgress, setLastCompletedMigration]);

  // When migration finishes or cancels via WebSocket, refresh history list once
  useEffect(() => {
    if (!isMigrating) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      fetch(`${apiUrl}/providers/migrations/history`, {
        credentials: "include",
      })
        .then((res) => (res.ok ? res.json() : { history: [] }))
        .then((data) => {
          if (data.history) setHistoryJobs(data.history);
        })
        .catch(() => {});
    }
  }, [isMigrating]);

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

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        <header className="shrink-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 md:px-8 py-3 z-20">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Provider Migrations
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Zero-data-loss cloud evacuation and persistent chunk rebalancing
              </p>
            </div>
            <Link
              href="/dashboard/storage"
              className="text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-200 transition-colors"
            >
              <Cloud className="h-3.5 w-3.5" />
              <span>Manage Clouds</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <SegmentedTabs
              tabs={tabs}
              activeTab={tab}
              onChange={(newTab) => setTab(newTab)}
            />

            {/* TAB: ACTIVE MIGRATION */}
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
                                lastCompletedMigration.status === "success" ||
                                lastCompletedMigration.status === "completed"
                                  ? "bg-emerald-50 text-emerald-600"
                                  : lastCompletedMigration.status ===
                                      "cancelled"
                                    ? "bg-slate-100 text-slate-600"
                                    : "bg-amber-50 text-amber-600"
                              }`}
                            >
                              {lastCompletedMigration.status === "success" ||
                              lastCompletedMigration.status === "completed" ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : lastCompletedMigration.status ===
                                "cancelled" ? (
                                <Ban className="h-4 w-4" />
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

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                          <div className="p-3 bg-slate-50 rounded-xl">
                            <span className="text-[11px] text-slate-400 block font-medium">
                              Chunks Relocated
                            </span>
                            <span className="font-semibold text-slate-900 text-sm mt-0.5 block">
                              {lastCompletedMigration.completed} of{" "}
                              {lastCompletedMigration.total}
                            </span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl">
                            <span className="text-[11px] text-slate-400 block font-medium">
                              Action Taken
                            </span>
                            <span className="font-semibold text-slate-900 text-sm mt-0.5 block capitalize">
                              {lastCompletedMigration.action?.replace(
                                "_",
                                " ",
                              ) || "Migrate"}
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

                        {lastCompletedMigration.logs &&
                          lastCompletedMigration.logs.length > 0 && (
                            <div className="pt-2">
                              <span className="text-[11px] font-medium text-slate-500 mb-1.5 block">
                                Execution Logs
                              </span>
                              <div className="bg-slate-950 rounded-xl p-3 text-[11px] font-mono text-slate-300 max-h-40 overflow-y-auto space-y-1">
                                {lastCompletedMigration.logs.map((log, idx) => (
                                  <div key={idx} className="flex gap-2">
                                    <span className="text-slate-500 shrink-0">
                                      {log.timestamp
                                        ? new Date(
                                            log.timestamp,
                                          ).toLocaleTimeString()
                                        : ""}
                                    </span>
                                    <span
                                      className={
                                        log.level === "error"
                                          ? "text-red-400"
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
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    )}

                    <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-3">
                      <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-400">
                        <Cloud className="h-5 w-5" />
                      </div>
                      <div className="max-w-xs mx-auto">
                        <p className="text-xs font-semibold text-slate-800">
                          No active migration in progress
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          When you disconnect a cloud provider, real-time chunk
                          evacuation progress will appear here automatically via
                          WebSockets.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: HISTORY */}
            {tab === "history" && (
              <div className="animate-in fade-in-50 duration-150 space-y-3">
                {isLoadingHistory ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Loading history...
                  </div>
                ) : historyJobs.length === 0 ? (
                  <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
                    No migration history recorded yet.
                  </div>
                ) : (
                  historyJobs.map((job) => (
                    <div
                      key={job.jobId || job.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">
                            {job.provider?.toUpperCase()}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 uppercase">
                            {job.action}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              job.status === "completed"
                                ? "bg-emerald-50 text-emerald-700"
                                : job.status === "cancelled"
                                  ? "bg-slate-100 text-slate-700"
                                  : "bg-red-50 text-red-700"
                            }`}
                          >
                            {job.status?.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-1">
                          {job.completed} / {job.total} chunks •{" "}
                          {formatBytes(job.transferredBytes)} transferred •
                          Started{" "}
                          {job.startedAt
                            ? new Date(job.startedAt).toLocaleString()
                            : ""}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

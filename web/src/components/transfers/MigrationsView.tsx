"use client";

import { useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/drive/Sidebar";
import { useDriveStore } from "@/stores/drive.store";
import { SegmentedTabs, TabItem } from "@/components/ui/SegmentedTabs";
import { MigrationActiveCard } from "./MigrationActiveCard";
import {
  RefreshCw,
  Cloud,
  ArrowRight,
  ShieldCheck,
  Split,
  FolderSync,
  Menu,
} from "lucide-react";

type MigrationTab = "active" | "overview";

export function MigrationsView() {
  const [tab, setTab] = useState<MigrationTab>("active");
  const { migrationProgress, providers, setMobileSidebarOpen } =
    useDriveStore();

  const isMigrating = migrationProgress !== null;

  const tabs: TabItem<MigrationTab>[] = [
    { id: "active", label: "Active Job", count: isMigrating ? 1 : 0 },
    { id: "overview", label: "How It Works" },
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
                    Zero-data-loss cloud evacuation and chunk rebalancing
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

          <div className="space-y-5">
            <SegmentedTabs
              tabs={tabs}
              activeTab={tab}
              onChange={setTab}
              className="sm:max-w-xs"
            />

            {/* Tab: Active Migration */}
            {tab === "active" && (
              <div className="animate-in fade-in-50 duration-150">
                {isMigrating ? (
                  <MigrationActiveCard progress={migrationProgress} />
                ) : (
                  <div className="text-center py-16 sm:py-20 border border-dashed border-slate-200 rounded-2xl p-6 sm:p-8 bg-slate-50/50">
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
                )}
              </div>
            )}

            {/* Tab: How It Works & Architecture Overview */}
            {tab === "overview" && (
              <div className="animate-in fade-in-50 duration-150 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900">
                    Rule 1: Whole File Priority
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Whenever possible, files are preserved as whole files on the
                    fastest cloud. When disconnecting, you can choose to leave
                    whole files intact in that cloud account.
                  </p>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Split className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900">
                    Rule 2: Dynamic Chunk Rebalancing
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Multi-cloud split files are transferred chunk by chunk. If a
                    single remaining cloud cannot fit a chunk, Fuze
                    automatically slices it to fit available spaces.
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

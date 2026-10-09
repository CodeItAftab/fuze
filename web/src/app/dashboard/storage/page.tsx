"use client";

import { useEffect, useState } from "react";
import { useDriveStore, ProviderSummary } from "@/stores/drive.store";
import { Sidebar } from "@/components/drive/Sidebar";
import { DisconnectModal } from "@/components/drive/DisconnectModal";
import { RefreshCw, Plus, Trash2, Cloud, Menu } from "lucide-react";

export default function StorageProvidersPage() {
  const {
    providers,
    storageSummary,
    refreshProviders,
    setMobileSidebarOpen,
  } = useDriveStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [disconnectingProvider, setDisconnectingProvider] =
    useState<ProviderSummary | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    void refreshProviders();
  }, [refreshProviders]);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      await fetch(`${apiUrl}/providers/sync`, {
        method: "POST",
        credentials: "include",
      });
      await refreshProviders();
    } finally {
      setIsSyncing(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return "0 B";
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    const kb = bytes / 1024;
    if (kb >= 1) return `${kb.toFixed(1)} KB`;
    return `${bytes} B`;
  };

  const poolPercent =
    storageSummary.totalPoolBytes > 0
      ? Math.min(
          100,
          Math.round(
            (storageSummary.usedPoolBytes / storageSummary.totalPoolBytes) *
              100,
          ),
        )
      : 0;

  const availableClouds = [
    {
      id: "google",
      name: "Google Drive",
      freeTier: "+15 GB Free",
      color: "border-emerald-200 bg-emerald-50/40 text-emerald-700",
      connected: providers.some((p) => p.provider === "google_drive"),
    },
    {
      id: "onedrive",
      name: "Microsoft OneDrive",
      freeTier: "+5 GB Free",
      color: "border-blue-200 bg-blue-50/40 text-blue-700",
      connected: providers.some((p) => p.provider === "one_drive"),
    },
    {
      id: "dropbox",
      name: "Dropbox",
      freeTier: "+2 GB Free",
      color: "border-sky-200 bg-sky-50/40 text-sky-700",
      connected: providers.some((p) => p.provider === "dropbox"),
    },
    {
      id: "box",
      name: "Box",
      freeTier: "+10 GB Free",
      color: "border-indigo-200 bg-indigo-50/40 text-indigo-700",
      connected: providers.some((p) => p.provider === "box"),
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Sidebar onNewFolderClick={() => {}} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 w-full max-w-7xl">
          {/* Header with Integrated Mobile Menu & Sync Button */}
          <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8">
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                aria-label="Open sidebar menu"
                className="lg:hidden p-1.5 -ml-1 text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition cursor-pointer shrink-0"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight whitespace-nowrap">
                Storage Providers
              </h1>
            </div>

            <button
              onClick={handleSyncAll}
              disabled={isSyncing}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-blue-600" : "text-slate-500"}`}
              />
              <span>{isSyncing ? "Syncing..." : "Sync Quotas"}</span>
            </button>
          </div>

          {/* Unified Pool Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Aggregated Storage Pool
                </span>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">
                  {formatBytes(storageSummary.totalPoolBytes)}
                </div>
              </div>

              <span className="self-start sm:self-auto text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                {providers.length}{" "}
                {providers.length === 1
                  ? "Cloud Account Connected"
                  : "Cloud Accounts Connected"}
              </span>
            </div>

            {/* Visual Storage Bar */}
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-blue-600 transition-all duration-500 rounded-full"
                style={{ width: `${poolPercent}%` }}
              />
            </div>

            {/* Storage Metric Row (Clean Responsive 3-Column Stats) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-medium">
                  Used Space
                </span>
                <span className="font-bold text-slate-800 text-xs sm:text-sm">
                  {formatBytes(storageSummary.usedPoolBytes)} ({poolPercent}%)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-medium">
                  Free Available
                </span>
                <span className="font-bold text-emerald-600 text-xs sm:text-sm">
                  {formatBytes(storageSummary.freePoolBytes)}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-slate-400 block text-[10px] font-medium">
                  Connected Providers
                </span>
                <span className="font-bold text-slate-700 text-xs sm:text-sm">
                  {providers.length} Active
                </span>
              </div>
            </div>
          </div>

          {/* Connected Cloud Accounts List */}
          <div className="mb-8 sm:mb-10">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5">
              Connected Cloud Accounts ({providers.length})
            </h2>

            {providers.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                No storage providers connected yet. Connect an account below to pool storage.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {providers.map((p) => {
                  const usedPct =
                    p.quotaTotal > 0
                      ? Math.min(
                          100,
                          Math.round((p.quotaUsed / p.quotaTotal) * 100),
                        )
                      : 0;
                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                            <Cloud className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-slate-900 capitalize">
                              {p.provider.replace("_", " ")}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {p.accountEmail || "Primary Account"}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setDisconnectingProvider(p)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
                          title="Disconnect Provider"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Quota metric */}
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-600 mb-1.5 font-medium">
                          <span>{formatBytes(p.quotaUsed)} used</span>
                          <span>{formatBytes(p.quotaTotal)} total</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all"
                            style={{ width: `${usedPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Connect Additional Cloud Storage */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5">
              Add More Free Storage
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
              {availableClouds.map((cloud) => (
                <div
                  key={cloud.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-bold text-slate-900">
                        {cloud.name}
                      </span>
                      {cloud.connected ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
                          Connected
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {cloud.freeTier}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                      {cloud.connected
                        ? `Connect another ${cloud.name} account to add more pooled storage.`
                        : "Connect your account to immediately expand your pooled VFS capacity."}
                    </p>
                  </div>

                  <a
                    href={`${apiUrl}/providers/${cloud.id}/connect`}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition text-center cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>
                      {cloud.connected
                        ? `Add Another ${cloud.name.split(" ")[0]}`
                        : `Connect ${cloud.name.split(" ")[0]}`}
                    </span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {disconnectingProvider && (
        <DisconnectModal
          provider={disconnectingProvider}
          onClose={() => setDisconnectingProvider(null)}
          onSuccess={() => void refreshProviders()}
        />
      )}
    </div>
  );
}

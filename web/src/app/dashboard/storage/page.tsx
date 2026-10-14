"use client";

import { useEffect, useState } from "react";
import { useDriveStore, ProviderSummary } from "@/stores/drive.store";
import { useAuthStore } from "@/stores/auth.store";
import { Sidebar } from "@/components/drive/Sidebar";
import { VerificationBanner } from "@/components/drive/VerificationBanner";
import { DisconnectModal } from "@/components/drive/DisconnectModal";
import { RefreshCw, Plus, Trash2, Cloud, Menu, Lock, Check, AlertCircle, AlertTriangle } from "lucide-react";

export default function StorageProvidersPage() {
  const {
    providers,
    storageSummary,
    refreshProviders,
    setMobileSidebarOpen,
  } = useDriveStore();
  const { user } = useAuthStore();
  const isVerified = user?.emailVerified === true;
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [disconnectingProvider, setDisconnectingProvider] =
    useState<ProviderSummary | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    void refreshProviders();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      const connected = params.get("connected");
      if (err) {
        setErrorMessage(err);
      }
      if (connected) {
        setSuccessMessage(
          `Successfully connected ${connected.replace("_", " ").toUpperCase()}!`,
        );
      }
      if (err || connected) {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, [refreshProviders]);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`${apiUrl}/providers/sync`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      await refreshProviders();
      const newlyRevoked = data.results?.filter((r: any) => r.isRevoked);
      if (newlyRevoked && newlyRevoked.length > 0) {
        setErrorMessage(
          `Connection check detected ${newlyRevoked.length} revoked or expired account(s): ${newlyRevoked.map((r: any) => r.provider.toUpperCase()).join(", ")}. Please reconnect them.`,
        );
      } else {
        setSuccessMessage("All connected cloud storage accounts are healthy and quotas synchronized.");
      }
    } catch {
      setErrorMessage("Failed to check provider health and quotas.");
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

  const revokedProviders = providers.filter((p) => p.isRevoked);

  const availableClouds = [
    {
      id: "google",
      name: "Google Drive",
      freeTier: "+15 GB Free",
      color: "border-emerald-200 bg-emerald-50/40 text-emerald-700",
      connectedProvider: providers.find((p) => p.provider === "google_drive"),
    },
    {
      id: "onedrive",
      name: "Microsoft OneDrive",
      freeTier: "+5 GB Free",
      color: "border-blue-200 bg-blue-50/40 text-blue-700",
      connectedProvider: providers.find((p) => p.provider === "one_drive"),
    },
    {
      id: "dropbox",
      name: "Dropbox",
      freeTier: "+2 GB Free",
      color: "border-sky-200 bg-sky-50/40 text-sky-700",
      connectedProvider: providers.find((p) => p.provider === "dropbox"),
    },
    {
      id: "box",
      name: "Box",
      freeTier: "+10 GB Free",
      color: "border-indigo-200 bg-indigo-50/40 text-indigo-700",
      connectedProvider: providers.find((p) => p.provider === "box"),
    },
    {
      id: "pcloud",
      name: "pCloud",
      freeTier: "+10 GB Free",
      color: "border-cyan-200 bg-cyan-50/40 text-cyan-700",
      connectedProvider: providers.find((p) => p.provider === "pcloud"),
    },
  ];

  const providerToSlug = (provider: string) => {
    if (provider === "google_drive") return "google";
    if (provider === "one_drive") return "onedrive";
    return provider; // "dropbox", "box", "pcloud"
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Sidebar onNewFolderClick={() => {}} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        <VerificationBanner />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-24 sm:pb-8 w-full max-w-7xl">
          {/* Header with Integrated Mobile Menu & Sync Button */}
          <div className="flex items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-100 mb-5 sm:mb-6">
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                aria-label="Open sidebar menu"
                className="lg:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer shrink-0"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight">
                Connected Clouds
              </h1>
            </div>

            <button
              onClick={handleSyncAll}
              disabled={isSyncing}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-lg text-xs font-medium text-slate-700 shadow-2xs transition cursor-pointer flex items-center gap-1.5 shrink-0"
              title="Verify provider connections and synchronize quotas"
            >
              <RefreshCw
                className={`h-3 w-3 ${isSyncing ? "animate-spin text-blue-600" : "text-slate-400"}`}
              />
              <span>{isSyncing ? "Checking Health..." : "Check Status & Sync"}</span>
            </button>
          </div>

          {/* Persistent Revocation Warning Banner */}
          {revokedProviders.length > 0 && (
            <div className="mb-5 p-4 rounded-xl bg-amber-50/95 border border-amber-300 text-amber-900 text-xs shadow-2xs animate-in fade-in">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-amber-100 border border-amber-200 text-amber-700 shrink-0 mt-0.5">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-amber-950 text-xs sm:text-sm mb-1">
                    Action Required: {revokedProviders.length} Cloud Connection{revokedProviders.length > 1 ? "s" : ""} Expired or Revoked
                  </div>
                  <p className="text-[11px] sm:text-xs text-amber-800 leading-relaxed mb-2.5">
                    {revokedProviders
                      .map(
                        (rp) =>
                          `${rp.provider.replace("_", " ").toUpperCase()}${
                            rp.accountEmail ? ` (${rp.accountEmail})` : ""
                          }`,
                      )
                      .join(", ")}{" "}
                    authentication tokens have expired or were revoked. You must reconnect using the <strong>same account</strong> so your existing files remain accessible.
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {revokedProviders.map((rp) => (
                      <a
                        key={rp.id}
                        href={`${apiUrl}/providers/${providerToSlug(rp.provider)}/reconnect`}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Reconnect {rp.provider.replace("_", " ")}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Alert Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/80 text-amber-800 text-xs flex items-center justify-between shadow-2xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-amber-600 hover:text-amber-800 p-1 rounded-md hover:bg-amber-100 transition cursor-pointer"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          )}

          {/* Success Alert Banner */}
          {successMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200/80 text-emerald-800 text-xs flex items-center justify-between shadow-2xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-emerald-600 hover:text-emerald-800 p-1 rounded-md hover:bg-emerald-100 transition cursor-pointer"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          )}

          {/* Unified Pool Summary Card */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Aggregated Storage Pool
                </span>
                <div className="text-2xl sm:text-3xl font-semibold text-slate-900 mt-0.5">
                  {formatBytes(storageSummary.totalPoolBytes)}
                </div>
              </div>

              <span className="self-start sm:self-auto text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                {providers.length}{" "}
                {providers.length === 1
                  ? "Account Connected"
                  : "Accounts Connected"}
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
                  const isRevoked = p.isRevoked === true;

                  return (
                    <div
                      key={p.id}
                      className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-2xs transition flex flex-col justify-between ${
                        isRevoked
                          ? "border-amber-300 bg-amber-50/20 ring-1 ring-amber-300/40"
                          : "border-slate-200/90 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${
                              isRevoked
                                ? "bg-amber-100 border-amber-200 text-amber-700"
                                : "bg-slate-50 border-slate-100 text-blue-600"
                            }`}
                          >
                            {isRevoked ? (
                              <AlertTriangle className="h-5 w-5" />
                            ) : (
                              <Cloud className="h-5 w-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-slate-900 capitalize">
                                {p.provider.replace("_", " ")}
                              </span>
                              {isRevoked && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  Revoked
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {p.accountEmail || "Primary Account"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <a
                            href={`${apiUrl}/providers/${providerToSlug(p.provider)}/reconnect`}
                            className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                              isRevoked
                                ? "text-amber-700 hover:text-amber-900 hover:bg-amber-100"
                                : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                            }`}
                            title="Reconnect Account (refresh tokens)"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => setDisconnectingProvider(p)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
                            title="Disconnect Provider"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {isRevoked && (
                        <div className="mb-3 p-2 rounded-lg bg-amber-100/70 border border-amber-200/80 text-[11px] text-amber-800 flex items-center justify-between gap-2">
                          <span className="truncate">Connection revoked. Reconnect original account.</span>
                          <a
                            href={`${apiUrl}/providers/${providerToSlug(p.provider)}/reconnect`}
                            className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[10px] shrink-0 transition"
                          >
                            Reconnect
                          </a>
                        </div>
                      )}

                      {/* Quota metric */}
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-600 mb-1.5 font-medium">
                          <span>{formatBytes(p.quotaUsed)} used</span>
                          <span>{formatBytes(p.quotaTotal)} total</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isRevoked ? "bg-amber-500" : "bg-blue-600"
                            }`}
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
              {availableClouds.map((cloud) => {
                const isConnected = !!cloud.connectedProvider;
                const isRevoked = cloud.connectedProvider?.isRevoked === true;

                return (
                  <div
                    key={cloud.id}
                    className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition flex flex-col justify-between ${
                      isRevoked ? "border-amber-300 bg-amber-50/20" : "border-slate-200/90"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-xs font-bold text-slate-900">
                          {cloud.name}
                        </span>
                        {isRevoked ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="h-3 w-3" />
                            Revoked
                          </span>
                        ) : isConnected ? (
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
                        {isRevoked
                          ? "Access token was revoked. Reconnect using the same account to restore access to stored chunks."
                          : isConnected
                          ? "Account connected and actively contributing to your unified storage pool."
                          : "Connect your account to immediately expand your pooled VFS capacity."}
                      </p>
                    </div>

                    {isRevoked ? (
                      <a
                        href={`${apiUrl}/providers/${cloud.id}/reconnect`}
                        className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition text-center cursor-pointer shadow-xs"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Reconnect {cloud.name.split(" ")[0]}</span>
                      </a>
                    ) : isConnected ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 py-2 px-3 rounded-xl bg-slate-100 text-slate-500 font-medium text-xs flex items-center justify-center gap-1.5 cursor-default select-none border border-slate-200/60">
                          <Check className="h-3.5 w-3.5 text-blue-600" />
                          <span className="font-semibold text-slate-700">Connected</span>
                        </div>
                        <a
                          href={`${apiUrl}/providers/${cloud.id}/reconnect`}
                          className="py-2 px-3 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer text-center"
                          title="Re-authenticate or update expired tokens"
                        >
                          Reconnect
                        </a>
                      </div>
                    ) : isVerified ? (
                      <a
                        href={`${apiUrl}/providers/${cloud.id}/connect`}
                        className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition text-center cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Connect {cloud.name.split(" ")[0]}</span>
                      </a>
                    ) : (
                      <div className="w-full py-2 px-3 rounded-xl bg-slate-100 text-slate-400 font-semibold text-xs flex items-center justify-center gap-1.5 text-center cursor-not-allowed select-none">
                        <Lock className="h-3.5 w-3.5" />
                        <span>Verify Email to Connect</span>
                      </div>
                    )}
                  </div>
                );
              })}
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

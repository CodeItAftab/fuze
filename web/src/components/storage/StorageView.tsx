"use client";

import { useEffect, useState } from "react";
import { useDriveStore, ProviderSummary } from "@/stores/drive.store";
import { useAuthStore } from "@/stores/auth.store";
import { Sidebar } from "@/components/drive/Sidebar";
import { VerificationBanner } from "@/components/drive/VerificationBanner";
import { DisconnectModal } from "@/components/drive/DisconnectModal";
import { StoragePoolCard } from "@/components/storage/StoragePoolCard";
import { ConnectedProviderCard } from "@/components/storage/ConnectedProviderCard";
import { AvailableCloudCard, AvailableCloud } from "@/components/storage/AvailableCloudCard";
import { RevocationWarningBanner } from "@/components/storage/RevocationWarningBanner";
import { RefreshCw, Menu, Check, AlertCircle } from "lucide-react";

export function StorageView() {
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
      if (err) setErrorMessage(err);
      if (connected) {
        setSuccessMessage(
          `Successfully connected ${connected.replace("_", " ").toUpperCase()}!`,
        );
      }
      if (err || connected) {
        window.history.replaceState({}, "", window.location.pathname);
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
      const newlyRevoked = data.results?.filter((r: { isRevoked: boolean; provider: string }) => r.isRevoked);
      if (newlyRevoked && newlyRevoked.length > 0) {
        setErrorMessage(
          `Connection check detected ${newlyRevoked.length} revoked or expired account(s): ${newlyRevoked.map((r: { provider: string }) => r.provider.toUpperCase()).join(", ")}. Please reconnect them.`,
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

  const providerToSlug = (provider: string) => {
    if (provider === "google_drive") return "google";
    if (provider === "one_drive") return "onedrive";
    return provider;
  };

  const revokedProviders = providers.filter((p) => p.isRevoked);

  const availableClouds: AvailableCloud[] = [
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

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Sidebar onNewFolderClick={() => {}} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        <VerificationBanner />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-24 sm:pb-8 w-full max-w-7xl">
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

          <RevocationWarningBanner
            revokedProviders={revokedProviders}
            apiUrl={apiUrl}
            providerToSlug={providerToSlug}
          />

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/80 text-amber-800 text-xs flex items-center justify-between shadow-2xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-amber-600 hover:text-amber-800 p-1 rounded-md hover:bg-amber-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200/80 text-emerald-800 text-xs flex items-center justify-between shadow-2xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-emerald-600 hover:text-emerald-800 p-1 rounded-md hover:bg-emerald-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          <StoragePoolCard
            storageSummary={storageSummary}
            connectedCount={providers.length}
            formatBytes={formatBytes}
          />

          <div className="mb-6">
            <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
              Connected Accounts ({providers.length})
            </h2>

            {providers.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500 bg-white">
                No storage providers connected yet. Connect your accounts below to aggregate your free cloud storage.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {providers.map((prov) => (
                  <ConnectedProviderCard
                    key={prov.id}
                    provider={prov}
                    apiUrl={apiUrl}
                    formatBytes={formatBytes}
                    providerToSlug={providerToSlug}
                    onDisconnect={(p: ProviderSummary) => setDisconnectingProvider(p)}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
              Available Cloud Providers
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {availableClouds.map((cloud) => (
                <AvailableCloudCard
                  key={cloud.id}
                  cloud={cloud}
                  isVerified={isVerified}
                  apiUrl={apiUrl}
                />
              ))}
            </div>
          </div>
        </main>
      </div>

      {disconnectingProvider && (
        <DisconnectModal
          provider={disconnectingProvider}
          onClose={() => setDisconnectingProvider(null)}
          onSuccess={() => {
            setDisconnectingProvider(null);
            void refreshProviders();
          }}
        />
      )}
    </div>
  );
}

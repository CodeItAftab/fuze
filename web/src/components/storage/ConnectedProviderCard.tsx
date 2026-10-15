import { ProviderSummary } from "@/stores/drive.store";
import { Cloud, Trash2, RefreshCw, AlertTriangle } from "lucide-react";

interface ConnectedProviderCardProps {
  provider: ProviderSummary;
  apiUrl: string;
  providerToSlug: (p: string) => string;
  formatBytes: (bytes: number) => string;
  onDisconnect: (p: ProviderSummary) => void;
}

export function ConnectedProviderCard({
  provider,
  apiUrl,
  providerToSlug,
  formatBytes,
  onDisconnect,
}: ConnectedProviderCardProps) {
  const isRevoked = provider.isRevoked === true;
  const usedPct =
    provider.quotaTotal > 0
      ? Math.min(
          100,
          Math.round((provider.quotaUsed / provider.quotaTotal) * 100),
        )
      : 0;

  return (
    <div
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
                {provider.provider.replace("_", " ")}
              </span>
              {isRevoked && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  Revoked
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {provider.accountEmail || "Primary Account"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <a
            href={`${apiUrl}/providers/${providerToSlug(provider.provider)}/reconnect`}
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
            onClick={() => onDisconnect(provider)}
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
            href={`${apiUrl}/providers/${providerToSlug(provider.provider)}/reconnect`}
            className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[10px] shrink-0 transition"
          >
            Reconnect
          </a>
        </div>
      )}

      <div>
        <div className="flex justify-between text-[11px] text-slate-600 mb-1.5 font-medium">
          <span>{formatBytes(provider.quotaUsed)} used</span>
          <span>{formatBytes(provider.quotaTotal)} total</span>
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
}

import { ProviderSummary } from "@/stores/drive.store";
import { Plus, Check, RefreshCw, Lock, AlertTriangle } from "lucide-react";

export interface AvailableCloud {
  id: string;
  name: string;
  freeTier: string;
  color: string;
  connectedProvider?: ProviderSummary;
}

interface AvailableCloudCardProps {
  cloud: AvailableCloud;
  apiUrl: string;
  isVerified: boolean;
}

export function AvailableCloudCard({
  cloud,
  apiUrl,
  isVerified,
}: AvailableCloudCardProps) {
  const isConnected = !!cloud.connectedProvider;
  const isRevoked = cloud.connectedProvider?.isRevoked === true;

  return (
    <div
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
        <div className="w-full py-2 px-3 rounded-xl bg-slate-100 text-slate-500 font-medium text-xs flex items-center justify-center gap-1.5 cursor-default select-none border border-slate-200/60">
          <Check className="h-3.5 w-3.5 text-blue-600" />
          <span className="font-semibold text-slate-700">Connected</span>
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
}

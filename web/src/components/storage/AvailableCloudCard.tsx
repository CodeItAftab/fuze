"use client";

import { ProviderSummary } from "@/stores/drive.store";
import { Plus, Check, RefreshCw, AlertTriangle, Key } from "lucide-react";
import { ProviderIcon, parseProvider } from "@/components/drive/ProviderBadge";

export interface AvailableCloud {
  id: string;
  name: string;
  freeTier: string;
  color: string;
  authType: "oauth" | "credentials";
  connectedProvider?: ProviderSummary;
  inactivityWarning?: string;
  credentialFields?: Array<{
    name: string;
    label: string;
    placeholder: string;
    type?: string;
    defaultValue?: string;
    helpText?: string;
  }>;
}

interface AvailableCloudCardProps {
  cloud: AvailableCloud;
  apiUrl: string;
  isVerified: boolean;
  onConnectCredentials?: (cloud: AvailableCloud) => void;
}

export function AvailableCloudCard({
  cloud,
  apiUrl,
  isVerified,
  onConnectCredentials,
}: AvailableCloudCardProps) {
  const isConnected = !!cloud.connectedProvider;
  const isRevoked = cloud.connectedProvider?.isRevoked === true;
  const parsed = parseProvider(cloud.name);

  return (
    <div
      className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition flex flex-col justify-between ${
        isRevoked ? "border-amber-300 bg-amber-50/20" : "border-slate-200/90"
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <ProviderIcon type={parsed.type} className="h-5 w-5 object-contain shrink-0" />
            <span className="text-xs font-bold text-slate-900 truncate">
              {cloud.name}
            </span>
          </div>
          {isRevoked ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 animate-pulse shrink-0">
              <AlertTriangle className="h-3 w-3" />
              Revoked
            </span>
          ) : isConnected ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 shrink-0">
              Connected
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              {cloud.freeTier}
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed mb-2">
          {isRevoked
            ? "Access token was revoked. Reconnect using the same account to restore access to stored chunks."
            : isConnected
            ? "Account connected and actively contributing to your unified storage pool."
            : "Connect your account to immediately expand your pooled VFS capacity."}
        </p>

        {cloud.inactivityWarning && (
          <p className="text-[10px] text-amber-600 bg-amber-50/80 rounded-md px-2 py-1 mb-3 border border-amber-200/60">
            ⚠️ {cloud.inactivityWarning}
          </p>
        )}
      </div>

      {isRevoked ? (
        cloud.authType === "credentials" ? (
          <button
            onClick={() => onConnectCredentials?.(cloud)}
            className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition text-center cursor-pointer shadow-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Update {cloud.name.split(" ")[0]} Credentials</span>
          </button>
        ) : (
          <a
            href={`${apiUrl}/providers/${cloud.id}/reconnect`}
            className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition text-center cursor-pointer shadow-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reconnect {cloud.name.split(" ")[0]}</span>
          </a>
        )
      ) : isConnected ? (
        <div className="w-full py-2 px-3 rounded-xl bg-slate-100 text-slate-500 font-medium text-xs flex items-center justify-center gap-1.5 cursor-default select-none border border-slate-200/60">
          <Check className="h-3.5 w-3.5 text-blue-600" />
          <span>Connected</span>
        </div>
      ) : isVerified ? (
        cloud.authType === "credentials" ? (
          <button
            onClick={() => onConnectCredentials?.(cloud)}
            className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition text-center cursor-pointer shadow-xs"
          >
            <Key className="h-3.5 w-3.5" />
            <span>Connect {cloud.name.split(" ")[0]}</span>
          </button>
        ) : (
          <a
            href={`${apiUrl}/providers/${cloud.id}/connect`}
            className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition text-center cursor-pointer shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Connect {cloud.name.split(" ")[0]}</span>
          </a>
        )
      ) : (
        <div
          title="Verify your email address before connecting cloud providers"
          className="w-full py-2 px-3 rounded-xl bg-slate-100 text-slate-400 font-medium text-xs flex items-center justify-center gap-1.5 cursor-not-allowed select-none border border-slate-200/60"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Connect (Verify Email)</span>
        </div>
      )}
    </div>
  );
}

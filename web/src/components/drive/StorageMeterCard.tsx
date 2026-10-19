"use client";

import { useDriveStore } from "@/stores/drive.store";
import { PROVIDERS_CONFIG } from "@/config/providers.config";
import { formatBytes } from "@/utils/formatters";

export function StorageMeterCard() {
  const { storageSummary, providers } = useDriveStore();
  const totalPool = storageSummary.totalPoolBytes;
  const usedPool = storageSummary.usedPoolBytes;
  const freePool = storageSummary.freePoolBytes;

  return (
    <div className="p-3 bg-white border border-slate-200/90 rounded-xl shadow-2xs select-none">
      {/* Title & Total Numbers */}
      <div className="flex justify-between items-center font-semibold text-slate-700 mb-1.5 text-xs">
        <span>Storage Pool</span>
        <span className="text-blue-600 font-medium">
          {totalPool > 0
            ? `${formatBytes(usedPool)} / ${formatBytes(totalPool)}`
            : providers.length > 0
              ? "0 B / 0 B"
              : "0 / 0 GB"}
        </span>
      </div>

      {/* Segmented Multi-Color Progress Bar */}
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex mb-2">
        {providers.length > 0 && usedPool > 0 ? (
          providers.map((p) => {
            if (p.quotaUsed <= 0) return null;
            const pct = Math.max(
              3,
              Number(((p.quotaUsed / Math.max(totalPool, 1)) * 100).toFixed(1)),
            );
            const config = PROVIDERS_CONFIG[p.provider];
            const colorClass = config?.bgClass || "bg-indigo-600";

            return (
              <div
                key={p.id}
                className={`${colorClass} h-full transition-all duration-300`}
                style={{ width: `${pct}%` }}
                title={`${config?.label || p.provider}: ${formatBytes(p.quotaUsed)}`}
              />
            );
          })
        ) : providers.length > 0 ? (
          <div
            className="bg-emerald-500/20 h-full w-full"
            title="Storage Ready"
          />
        ) : (
          <div
            className="bg-slate-200 h-full w-full"
            title="No accounts linked"
          />
        )}
      </div>

      {/* Provider Legend Breakdown Dots */}
      {providers.length > 0 && (
        <div className="flex flex-wrap gap-x-2.5 gap-y-1 mb-2 pt-0.5">
          {providers.map((p) => {
            const config = PROVIDERS_CONFIG[p.provider] || {
              dotClass: "bg-indigo-600",
              label: p.provider,
            };

            return (
              <div
                key={p.id}
                className="flex items-center gap-1 text-[9px] text-slate-500"
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full shrink-0 ${config.dotClass}`}
                />
                <span>{config.label}</span>
                <span className="text-slate-400 font-mono">
                  ({formatBytes(p.quotaUsed)})
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Account Count & Free Pool */}
      <div className="text-[10px] text-slate-500 flex justify-between items-center border-t border-slate-100 pt-1.5">
        <span>
          {providers.length} {providers.length === 1 ? "account" : "accounts"}{" "}
          linked
        </span>
        <span className="text-emerald-600 font-medium">
          {freePool > 0
            ? `${formatBytes(freePool)} free`
            : providers.length > 0
              ? "100% free"
              : "Connect clouds"}
        </span>
      </div>
    </div>
  );
}

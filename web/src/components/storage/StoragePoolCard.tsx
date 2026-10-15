import { StorageSummary } from "@/stores/drive.store";

interface StoragePoolCardProps {
  storageSummary: StorageSummary;
  connectedCount: number;
  formatBytes: (bytes: number) => string;
}

export function StoragePoolCard({
  storageSummary,
  connectedCount,
  formatBytes,
}: StoragePoolCardProps) {
  const poolPercent =
    storageSummary.totalPoolBytes > 0
      ? Math.min(
          100,
          Math.round(
            (storageSummary.usedPoolBytes / storageSummary.totalPoolBytes) * 100,
          ),
        )
      : 0;

  return (
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
          {connectedCount}{" "}
          {connectedCount === 1 ? "Account Connected" : "Accounts Connected"}
        </span>
      </div>

      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-blue-600 transition-all duration-500 rounded-full"
          style={{ width: `${poolPercent}%` }}
        />
      </div>

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
            {connectedCount} Active
          </span>
        </div>
      </div>
    </div>
  );
}

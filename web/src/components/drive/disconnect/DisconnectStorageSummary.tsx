"use client";

import { formatBytes } from "@/utils/formatters";
import { HardDrive, Split } from "lucide-react";

interface DisconnectStorageSummaryProps {
  totalBytes: number;
  wholeFilesCount: number;
  sharedChunksCount: number;
}

export function DisconnectStorageSummary({
  totalBytes,
  wholeFilesCount,
  sharedChunksCount,
}: DisconnectStorageSummaryProps) {
  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
      <div className="flex justify-between items-center text-xs font-medium text-slate-700">
        <span>Total Data Stored:</span>
        <span className="text-slate-900 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
          {formatBytes(totalBytes)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-600">
        <div className="flex items-center gap-1.5">
          <HardDrive className="h-3.5 w-3.5 text-blue-600 shrink-0" />
          <span>
            <strong>{wholeFilesCount}</strong> Whole File(s)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Split className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
          <span>
            <strong>{sharedChunksCount}</strong> Shared Chunk(s)
          </span>
        </div>
      </div>
    </div>
  );
}

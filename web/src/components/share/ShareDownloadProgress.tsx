import { ProgressCallbackData } from "@/lib/download-engine";

interface ShareDownloadProgressProps {
  progress: ProgressCallbackData | null;
  formatBytes: (bytes: number) => string;
}

export function ShareDownloadProgress({
  progress,
  formatBytes,
}: ShareDownloadProgressProps) {
  if (!progress) return null;

  const percent = Math.round(progress.percent || 0);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700/80 w-full max-w-sm text-xs font-sans animate-in fade-in slide-in-from-bottom-2 duration-150">
      <div className="flex items-center justify-between mb-2 font-medium">
        <span>{progress.statusText || "Assembling chunks from cloud..."}</span>
        <span className="font-mono text-blue-400 font-bold">{percent}%</span>
      </div>
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-150"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span>
          {formatBytes(progress.loaded)} of {formatBytes(progress.total)}
        </span>
      </div>
    </div>
  );
}

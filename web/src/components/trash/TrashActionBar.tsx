import { X, RotateCcw, Trash2, Loader2 } from "lucide-react";

interface TrashActionBarProps {
  selectedCount: number;
  totalSelectedSize: number;
  totalTrashCount: number;
  isProcessing: boolean;
  formatBytes: (bytes: number) => string;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onBatchRestore: () => void;
  onBatchPermanentDelete: () => void;
}

export function TrashActionBar({
  selectedCount,
  totalSelectedSize,
  totalTrashCount,
  isProcessing,
  formatBytes,
  onClearSelection,
  onSelectAll,
  onBatchRestore,
  onBatchPermanentDelete,
}: TrashActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="sticky top-0 z-30 mb-5 bg-white border border-blue-200/90 rounded-2xl px-3.5 sm:px-4 py-2.5 shadow-md shadow-blue-500/5 flex flex-wrap items-center justify-between gap-2.5 animate-in fade-in slide-in-from-top-2 duration-150 ring-1 ring-blue-500/10"
    >
      <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
        <button
          type="button"
          onClick={onClearSelection}
          className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
          title="Clear selection (Esc)"
          aria-label="Clear selection"
        >
          <X className="h-4 w-4" />
        </button>
        <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200/60">
          {selectedCount} selected
        </span>
        {totalSelectedSize > 0 && (
          <span className="text-xs text-slate-500 hidden sm:inline">
            ({formatBytes(totalSelectedSize)})
          </span>
        )}
        {selectedCount < totalTrashCount && (
          <button
            type="button"
            onClick={onSelectAll}
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer ml-1"
          >
            Select all {totalTrashCount}
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          disabled={isProcessing}
          onClick={onBatchRestore}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer border border-blue-200/80 disabled:opacity-50"
          title="Restore selected items to Drive"
        >
          {isProcessing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RotateCcw className="h-3.5 w-3.5" />
          )}
          <span>Restore ({selectedCount})</span>
        </button>

        <button
          type="button"
          disabled={isProcessing}
          onClick={onBatchPermanentDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition cursor-pointer border border-rose-200/80 disabled:opacity-50"
          title="Permanently delete selected items"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete Permanently</span>
        </button>
      </div>
    </div>
  );
}

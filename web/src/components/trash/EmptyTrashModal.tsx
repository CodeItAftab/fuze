import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";

interface EmptyTrashModalProps {
  isOpen: boolean;
  itemCount: number;
  totalSizeFormatted: string;
  isProcessing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function EmptyTrashModal({
  isOpen,
  itemCount,
  totalSizeFormatted,
  isProcessing,
  onClose,
  onConfirm,
}: EmptyTrashModalProps) {
  if (!isOpen) return null;

  return (
    <div
      onClick={() => !isProcessing && onClose()}
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 p-6 text-xs font-sans animate-in fade-in zoom-in-95 duration-100"
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5 text-rose-600 font-bold text-sm">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>Empty Trash?</span>
          </div>
          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-slate-600 leading-relaxed mb-6 text-xs">
          Are you sure you want to permanently delete all{" "}
          <strong className="text-slate-900 font-semibold">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </strong>
          {totalSizeFormatted && ` (${totalSizeFormatted})`}? All underlying cloud
          storage chunks will be permanently purged and cloud storage quota will be
          reclaimed.{" "}
          <strong className="text-rose-600 font-semibold">
            This action cannot be undone.
          </strong>
        </p>

        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-xl font-medium transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={onConfirm}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold transition cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span>Empty Trash</span>
          </button>
        </div>
      </div>
    </div>
  );
}

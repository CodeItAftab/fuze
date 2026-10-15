import { VfsItem } from "@/stores/drive.store";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";

interface PermanentDeleteModalProps {
  isOpen: boolean;
  item: VfsItem | null;
  selectedCount?: number;
  totalSizeFormatted?: string;
  isProcessing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function PermanentDeleteModal({
  isOpen,
  item,
  selectedCount,
  totalSizeFormatted,
  isProcessing,
  onClose,
  onConfirm,
}: PermanentDeleteModalProps) {
  if (!isOpen) return null;

  const isBatch = !item && (selectedCount ?? 0) > 0;

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
            <span>
              {isBatch
                ? "Permanently Delete Selected Items?"
                : "Permanently Delete Item?"}
            </span>
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
          Permanently delete{" "}
          {isBatch ? (
            <>
              <strong className="text-slate-900 font-semibold">
                {selectedCount} {selectedCount === 1 ? "item" : "items"}
              </strong>
              {totalSizeFormatted && ` (${totalSizeFormatted})`}
            </>
          ) : (
            <>
              <strong className="text-slate-900 font-semibold break-all">
                &ldquo;{item?.name}&rdquo;
              </strong>
              {item?.type === "file" &&
                item.size > 0 &&
                totalSizeFormatted &&
                ` (${totalSizeFormatted})`}
              {item?.type === "folder" && " and all its contents"}
            </>
          )}
          ? Cloud chunks will be permanently erased and storage will be reclaimed.{" "}
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
            <span>Delete Permanently</span>
          </button>
        </div>
      </div>
    </div>
  );
}

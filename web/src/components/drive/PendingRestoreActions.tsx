"use client";

import { RotateCcw, Trash2, X, Loader2 } from "lucide-react";

interface PendingRestoreActionsProps {
  isProcessing: boolean;
  onRestore: () => void;
  onDiscard: () => void;
  onDismiss: () => void;
}

export function PendingRestoreActions({
  isProcessing,
  onRestore,
  onDiscard,
  onDismiss,
}: PendingRestoreActionsProps) {
  return (
    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
      <button
        onClick={onRestore}
        disabled={isProcessing}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-xs transition cursor-pointer"
      >
        {isProcessing ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <RotateCcw className="h-3 w-3" />
        )}
        <span>Restore Files</span>
      </button>

      <button
        onClick={onDiscard}
        disabled={isProcessing}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-lg transition cursor-pointer"
      >
        <Trash2 className="h-3 w-3 text-slate-400" />
        <span>Start Fresh</span>
      </button>

      <button
        onClick={onDismiss}
        className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition cursor-pointer ml-1"
        title="Dismiss banner"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

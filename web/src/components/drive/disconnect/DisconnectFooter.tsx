"use client";

import { DisconnectAction } from "@/types";
import { ArrowRight, Loader2 } from "lucide-react";

interface DisconnectFooterProps {
  selectedAction: DisconnectAction;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DisconnectFooter({
  selectedAction,
  isSubmitting,
  onCancel,
  onConfirm,
}: DisconnectFooterProps) {
  const actionDetails = {
    migrate: {
      label: "Move All Files & Disconnect",
      btnClass: "bg-blue-600 hover:bg-blue-700",
    },
    smart_unlink: {
      label: "Smart Evacuate & Disconnect",
      btnClass: "bg-emerald-600 hover:bg-emerald-700",
    },
    delete: {
      label: "Delete All Files & Disconnect",
      btnClass: "bg-rose-600 hover:bg-rose-700",
    },
  }[selectedAction];

  return (
    <div className="pt-4 mt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 shrink-0">
      <button
        type="button"
        disabled={isSubmitting}
        onClick={onCancel}
        className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-40 text-center"
      >
        Cancel
      </button>
      <button
        type="button"
        disabled={isSubmitting}
        onClick={onConfirm}
        className={`w-full sm:w-auto px-5 py-2.5 text-xs font-semibold rounded-xl text-white shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98] ${actionDetails.btnClass}`}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Disconnecting...</span>
          </>
        ) : (
          <>
            <span>{actionDetails.label}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </>
        )}
      </button>
    </div>
  );
}

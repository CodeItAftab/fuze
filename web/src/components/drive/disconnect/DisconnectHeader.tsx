"use client";

import { AlertTriangle, X } from "lucide-react";

interface DisconnectHeaderProps {
  providerDisplayName: string;
  accountEmail: string | null;
  isSubmitting: boolean;
  onClose: () => void;
}

export function DisconnectHeader({
  providerDisplayName,
  accountEmail,
  isSubmitting,
  onClose,
}: DisconnectHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-slate-100 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-5 w-5 text-rose-600" />
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-slate-900 text-sm">
            Disconnect {providerDisplayName}
          </h3>
          {accountEmail && (
            <p className="text-[11px] text-slate-500 font-normal truncate">
              {accountEmail}
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition shrink-0 cursor-pointer disabled:opacity-30"
        aria-label="Close modal"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

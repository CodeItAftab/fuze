"use client";

import { useEffect } from "react";
import { useToastStore, toast } from "@/stores/toast.store";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";

const icons = {
  success: (
    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
  ),
  error: <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />,
  info: <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />,
};

const borderClasses = {
  success: "border-emerald-200 bg-white/95 text-emerald-950",
  error: "border-rose-200 bg-white/95 text-rose-950",
  info: "border-blue-200 bg-white/95 text-blue-950",
  warning: "border-amber-200 bg-white/95 text-amber-950",
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="fixed top-3 sm:top-4 right-3 sm:right-4 left-3 sm:left-auto z-50 flex flex-col gap-2 sm:max-w-sm w-auto sm:w-full pointer-events-none">
      {toasts.map((t) => (
        <ToastItemCard key={t.id} toast={t} />
      ))}
    </div>
  );
}

function ToastItemCard({
  toast: item,
}: {
  toast: import("@/types").ToastItem;
}) {
  useEffect(() => {
    if (!item.duration) return;
    const timer = setTimeout(() => toast.dismiss(item.id), item.duration);
    return () => clearTimeout(timer);
  }, [item.id, item.duration]);

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex items-start gap-2.5 p-3 sm:p-3.5 rounded-xl border shadow-xl shadow-slate-900/10 backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-3 duration-200 ${borderClasses[item.type]}`}
    >
      {icons[item.type]}
      <div className="flex-1 min-w-0 pr-1">
        <h4 className="text-xs font-semibold leading-tight tracking-tight text-slate-900">
          {item.title}
        </h4>
        {item.message && (
          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug break-words">
            {item.message}
          </p>
        )}
      </div>
      <button
        onClick={() => toast.dismiss(item.id)}
        className="p-1 -mr-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition shrink-0"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

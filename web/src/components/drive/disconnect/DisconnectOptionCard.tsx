"use client";

import { CheckCircle2, Circle, Info } from "lucide-react";

interface DisconnectOptionCardProps {
  title: string;
  badge?: React.ReactNode;
  description: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  theme: "blue" | "emerald" | "rose";
  isSelected: boolean;
  isDisabled?: boolean;
  disabledReason?: string;
  onSelect: () => void;
}

export function DisconnectOptionCard({
  title,
  badge,
  description,
  icon: Icon,
  theme,
  isSelected,
  isDisabled,
  disabledReason,
  onSelect,
}: DisconnectOptionCardProps) {
  const themeStyles = {
    blue: {
      selected: "bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20",
      iconActive: "bg-blue-600 text-white",
      iconInactive: "bg-slate-100 text-slate-600",
      checkColor: "text-blue-600 fill-blue-50",
    },
    emerald: {
      selected:
        "bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20",
      iconActive: "bg-emerald-600 text-white",
      iconInactive: "bg-emerald-50 text-emerald-600 border border-emerald-100",
      checkColor: "text-emerald-600 fill-emerald-50",
    },
    rose: {
      selected: "bg-rose-50/70 border-rose-500 ring-2 ring-rose-500/20",
      iconActive: "bg-rose-600 text-white",
      iconInactive: "bg-rose-50 text-rose-600 border border-rose-100",
      checkColor: "text-rose-600 fill-rose-50",
    },
  }[theme];

  return (
    <div
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      onClick={() => !isDisabled && onSelect()}
      className={`w-full text-left p-3.5 rounded-xl border transition-all select-none ${
        isDisabled
          ? "bg-slate-50/60 border-slate-200/70 opacity-60 cursor-not-allowed"
          : isSelected
            ? `${themeStyles.selected} shadow-xs cursor-pointer active:scale-[0.99]`
            : "bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300 cursor-pointer active:scale-[0.99]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
              isSelected ? themeStyles.iconActive : themeStyles.iconInactive
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-xs font-semibold text-slate-900">{title}</h4>
              {badge}
            </div>
            <div className="text-[11px] text-slate-500 leading-relaxed">
              {description}
            </div>
            {isDisabled && disabledReason && (
              <div className="flex items-center gap-1.5 text-[10.5px] text-amber-700 font-medium pt-0.5">
                <Info className="h-3.5 w-3.5 shrink-0" />
                <span>{disabledReason}</span>
              </div>
            )}
          </div>
        </div>
        <div className="shrink-0 mt-0.5">
          {isSelected ? (
            <CheckCircle2 className={`h-4.5 w-4.5 ${themeStyles.checkColor}`} />
          ) : (
            <Circle className="h-4.5 w-4.5 text-slate-300" />
          )}
        </div>
      </div>
    </div>
  );
}

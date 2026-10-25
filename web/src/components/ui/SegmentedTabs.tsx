"use client";

import React from "react";

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface SegmentedTabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  className?: string;
  fullWidthOnMobile?: boolean;
}

export function SegmentedTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className = "",
}: SegmentedTabsProps<T>) {
  return (
    <div
      className={`bg-slate-200/70 p-1 rounded-xl select-none grid gap-1 text-xs w-full ${className}`}
      style={{
        gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`py-2 px-1.5 sm:px-3 rounded-lg font-medium text-center truncate border transition-all duration-150 cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${
              isActive
                ? "bg-white text-blue-600 border-slate-200/80 shadow-2xs font-semibold"
                : "text-slate-600 border-transparent hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span className="truncate">{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`font-mono text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded-full shrink-0 ${
                  isActive
                    ? "bg-blue-50 text-blue-600 font-bold"
                    : "bg-slate-300/70 text-slate-600 font-medium"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

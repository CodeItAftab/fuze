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
  fullWidthOnMobile = true,
}: SegmentedTabsProps<T>) {
  return (
    <div
      className={`bg-slate-100 p-1 rounded-xl select-none ${
        fullWidthOnMobile ? "w-full sm:w-auto" : "w-auto"
      } grid gap-1 text-xs ${className}`}
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
            className={`py-1.5 px-2 rounded-lg font-medium text-center truncate border transition-colors duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
              isActive
                ? "bg-white text-blue-600 border-slate-200/70 shadow-2xs"
                : "text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-200/40"
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`font-mono text-[11px] ${
                  isActive ? "text-blue-500 font-bold" : "text-slate-400"
                }`}
              >
                ({tab.count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

"use client";

import React from "react";

interface CircularProgressRingProps {
  progress: number; // 0 to 100
  size?: number; // diameter in px (default 52)
  strokeWidth?: number; // ring thickness in px (default 3.5)
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  badge?: string | number;
  badgeColorClass?: string;
  colorClass?: string; // tailwind color (default text-blue-600)
  onClick?: () => void;
}

export function CircularProgressRing({
  progress,
  size = 52,
  strokeWidth = 3.5,
  icon,
  label,
  sublabel,
  badge,
  badgeColorClass = "bg-blue-600 text-white",
  colorClass = "text-blue-600",
  onClick,
}: CircularProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(progress)));
  const center = size / 2;
  const radius = center - strokeWidth - 1;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative group flex items-center justify-center">
      <button
        type="button"
        onClick={onClick}
        aria-label={`${label}: ${clamped}%`}
        className="relative flex items-center justify-center rounded-full bg-white/95 backdrop-blur-md shadow-lg shadow-slate-900/10 border border-slate-200/90 hover:border-slate-300 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        style={{ width: size, height: size }}
      >
        {/* SVG Progress Ring */}
        <svg
          width={size}
          height={size}
          className="absolute inset-0 -rotate-90 pointer-events-none"
        >
          {/* Background track circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            className="stroke-slate-100 fill-none"
            strokeWidth={strokeWidth}
          />
          {/* Animated active progress circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            className={`fill-none stroke-current ${colorClass} transition-all duration-300 ease-out`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Icon */}
        <div className={`relative z-10 flex items-center justify-center ${colorClass}`}>
          {icon}
        </div>

        {/* Optional Badge (e.g. number of items remaining or percent) */}
        {badge !== undefined && (
          <span
            className={`absolute -top-1 -right-1 flex h-4.5 min-w-4.5 px-1 items-center justify-center ${badgeColorClass} text-[10px] font-bold rounded-full shadow-xs ring-2 ring-white`}
          >
            {badge}
          </span>
        )}
      </button>

      {/* Floating Hover Tooltip (Pops to the left to avoid screen boundary clipping) */}
      <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-900/95 backdrop-blur-sm text-white text-xs py-2 px-3 rounded-xl shadow-2xl whitespace-nowrap border border-slate-800">
          <div className="font-semibold flex items-center gap-1.5">
            <span>{label}</span>
            <span className="text-emerald-400 font-mono text-[11px]">
              {clamped}%
            </span>
          </div>
          {sublabel && (
            <div className="text-[10.5px] text-slate-300 font-normal mt-0.5">
              {sublabel}
            </div>
          )}
        </div>
        <div className="w-2 h-2 bg-slate-900 rotate-45 -ml-1 border-r border-t border-slate-800" />
      </div>
    </div>
  );
}

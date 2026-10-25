"use client";

import React from "react";

export type ProviderType =
  | "google_drive"
  | "one_drive"
  | "dropbox"
  | "pcloud"
  | "box"
  | "multi_cloud"
  | "unknown";

export interface ParsedProvider {
  type: ProviderType;
  name: string;
  count?: number;
  description: string;
}

export function parseProvider(badge: string | null | undefined): ParsedProvider {
  if (!badge) {
    return {
      type: "unknown",
      name: "Cloud",
      description: "Stored in unified cloud mesh",
    };
  }

  // Strip internal "(Whole)" jargon cleanly
  const cleaned = badge.replace(/\s*\(Whole\)/gi, "").trim();

  // Multi-Cloud pattern: "Multi-Cloud (3 Providers)" or "Multi-Cloud (2)" or "Multi-Cloud"
  const multiMatch = cleaned.match(/Multi-Cloud(?:\s*\(([0-9]+)(?:\s*Providers?)?\))?/i);
  if (multiMatch || cleaned.toLowerCase().includes("multi")) {
    const count = multiMatch?.[1] ? parseInt(multiMatch[1], 10) : undefined;
    return {
      type: "multi_cloud",
      name: count ? `Multi-Cloud · ${count}` : "Multi-Cloud",
      count,
      description: count
        ? `Distributed across ${count} connected cloud providers`
        : "Distributed across multiple connected cloud providers",
    };
  }

  const lower = cleaned.toLowerCase();
  if (lower.includes("google") || lower === "google_drive") {
    return {
      type: "google_drive",
      name: "Google Drive",
      description: "Stored on Google Drive",
    };
  }
  if (
    lower.includes("onedrive") ||
    lower.includes("one_drive") ||
    lower.includes("one drive")
  ) {
    return {
      type: "one_drive",
      name: "OneDrive",
      description: "Stored on Microsoft OneDrive",
    };
  }
  if (lower.includes("dropbox")) {
    return {
      type: "dropbox",
      name: "Dropbox",
      description: "Stored on Dropbox",
    };
  }
  if (lower.includes("pcloud")) {
    return {
      type: "pcloud",
      name: "pCloud",
      description: "Stored on pCloud",
    };
  }
  if (lower.includes("box")) {
    return {
      type: "box",
      name: "Box",
      description: "Stored on Box",
    };
  }

  return {
    type: "unknown",
    name: cleaned || "Cloud",
    description: `Stored on ${cleaned}`,
  };
}

/**
 * Real official brand logos loaded from downloaded vector SVGs in /public/providers/
 */
export function ProviderIcon({
  type,
  className = "w-4 h-4",
}: {
  type: ProviderType;
  className?: string;
}) {
  const iconMap: Record<ProviderType, string> = {
    google_drive: "/providers/google-drive.svg",
    one_drive: "/providers/onedrive.svg",
    dropbox: "/providers/dropbox.svg",
    box: "/providers/box.svg",
    pcloud: "/providers/pcloud.svg",
    multi_cloud: "/providers/multi-cloud.svg",
    unknown: "/providers/multi-cloud.svg",
  };

  const src = iconMap[type] || "/providers/multi-cloud.svg";

  return (
    <img
      src={src}
      alt={type}
      className={`shrink-0 object-contain select-none pointer-events-none ${className}`}
      loading="eager"
      decoding="async"
    />
  );
}

/**
 * Minimalist Provider Indicator:
 * Real official brand logo rendered in a neat chip with tooltip (name text omitted to eliminate redundancy).
 */
export function ProviderLogo({
  badge,
  className = "",
  size = "md",
  showName = false,
}: {
  badge: string | null | undefined;
  className?: string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
}) {
  const parsed = parseProvider(badge);
  const iconSize =
    size === "sm" ? "w-3.5 h-3.5" : size === "lg" ? "w-5 h-5" : "w-4 h-4";

  return (
    <div
      title={parsed.description}
      className={`inline-flex items-center gap-1.5 p-1 rounded-md bg-slate-50 border border-slate-200/90 hover:bg-slate-100/90 transition-colors select-none shrink-0 shadow-2xs ${className}`}
    >
      <ProviderIcon type={parsed.type} className={iconSize} />
      {showName && (
        <span className="text-[11px] font-semibold text-slate-700 truncate max-w-28 tracking-tight pr-1">
          {parsed.name}
        </span>
      )}
    </div>
  );
}

function getProviderTheme(type: ProviderType) {
  switch (type) {
    case "google_drive":
      return "bg-amber-50/90 text-amber-900 border-amber-200/90 hover:bg-amber-100/70";
    case "one_drive":
      return "bg-sky-50/90 text-sky-900 border-sky-200/90 hover:bg-sky-100/70";
    case "dropbox":
      return "bg-indigo-50/90 text-indigo-900 border-indigo-200/90 hover:bg-indigo-100/70";
    case "box":
      return "bg-blue-50/90 text-blue-900 border-blue-200/90 hover:bg-blue-100/70";
    case "pcloud":
      return "bg-cyan-50/90 text-cyan-900 border-cyan-200/90 hover:bg-cyan-100/70";
    case "multi_cloud":
      return "bg-gradient-to-r from-violet-50 to-indigo-50 text-indigo-950 border-indigo-200/90 shadow-2xs hover:from-violet-100 hover:to-indigo-100";
    default:
      return "bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100";
  }
}

interface ProviderBadgeProps {
  badge: string | null | undefined;
  className?: string;
  size?: "sm" | "md";
  showIcon?: boolean;
}

export function ProviderBadge({
  badge,
  className = "",
  size = "md",
  showIcon = true,
}: ProviderBadgeProps) {
  const parsed = parseProvider(badge);
  const theme = getProviderTheme(parsed.type);

  const sizeClasses =
    size === "sm"
      ? "text-[9px] px-1.5 py-0.5 gap-1 rounded"
      : "text-[10px] px-2 py-0.5 gap-1.5 rounded-md";

  const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";

  return (
    <span
      title={parsed.description}
      className={`inline-flex items-center font-semibold border transition-colors select-none truncate max-w-36 ${theme} ${sizeClasses} ${className}`}
    >
      {showIcon && <ProviderIcon type={parsed.type} className={iconSize} />}
      <span className="truncate tracking-tight">{parsed.name}</span>
    </span>
  );
}

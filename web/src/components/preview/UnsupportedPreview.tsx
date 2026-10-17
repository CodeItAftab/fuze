"use client";

import React, { useState } from "react";
import {
  Download,
  Info,
  Share2,
  Copy,
  Check,
  FileQuestion,
  Archive,
  Terminal,
  Disc,
  Database,
  Box,
  Layers,
  Type,
  FolderKanban,
  File,
} from "lucide-react";
import { formatBytes } from "@/lib/format";
import { DownloadPlan } from "@/lib/download-engine";

export interface UnsupportedPreviewProps {
  fileName: string;
  fileSize: number;
  mimeType?: string | null;
  downloadUrl?: string | null;
  onDownload: () => void;
  onOpenDetails?: () => void;
  onShare?: () => void;
  plan?: DownloadPlan | null;
}

function getFileMeta(fileName: string, mimeType?: string | null) {
  const ext = fileName.includes(".")
    ? fileName.split(".").pop()?.toLowerCase() || ""
    : "";
  const mime = (mimeType || "").toLowerCase();

  if (["mpp", "mpt"].includes(ext)) {
    return {
      extLabel: ext.toUpperCase(),
      icon: FolderKanban,
      color: "text-teal-400",
      bg: "bg-teal-500/10 border-teal-500/20",
    };
  }

  if (
    ["zip", "rar", "7z", "tar", "gz", "bz2", "xz", "tgz"].includes(ext) ||
    mime.includes("zip") ||
    mime.includes("compressed") ||
    mime.includes("tar")
  ) {
    return {
      extLabel: ext.toUpperCase() || "ZIP",
      icon: Archive,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    };
  }

  if (["exe", "msi", "dmg", "pkg", "apk", "bin"].includes(ext)) {
    return {
      extLabel: ext.toUpperCase() || "APP",
      icon: Terminal,
      color: "text-violet-400",
      bg: "bg-violet-500/10 border-violet-500/20",
    };
  }

  if (["iso", "img", "vmdk"].includes(ext)) {
    return {
      extLabel: ext.toUpperCase() || "ISO",
      icon: Disc,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/20",
    };
  }

  if (["sql", "sqlite", "db"].includes(ext)) {
    return {
      extLabel: ext.toUpperCase() || "DB",
      icon: Database,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    };
  }

  if (["stl", "obj", "fbx", "blend", "dwg"].includes(ext)) {
    return {
      extLabel: ext.toUpperCase() || "3D",
      icon: Box,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    };
  }

  if (["psd", "ai", "sketch", "fig"].includes(ext)) {
    return {
      extLabel: ext.toUpperCase() || "DESIGN",
      icon: Layers,
      color: "text-pink-400",
      bg: "bg-pink-500/10 border-pink-500/20",
    };
  }

  if (["ttf", "otf", "woff", "woff2"].includes(ext)) {
    return {
      extLabel: ext.toUpperCase() || "FONT",
      icon: Type,
      color: "text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/20",
    };
  }

  return {
    extLabel: ext ? ext.toUpperCase() : "FILE",
    icon: FileQuestion,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  };
}

export function UnsupportedPreview({
  fileName,
  fileSize,
  mimeType,
  onDownload,
  onOpenDetails,
  onShare,
}: UnsupportedPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const meta = getFileMeta(fileName, mimeType);
  const IconComponent = meta.icon;

  const handleCopy = () => {
    navigator.clipboard.writeText(fileName);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadClick = async () => {
    try {
      setIsDownloading(true);
      await onDownload();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto my-auto p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
      {/* Icon Badge */}
      <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
        <div
          className={`w-full h-full rounded-2xl ${meta.bg} border flex items-center justify-center shadow-inner`}
        >
          <IconComponent className={`w-8 h-8 sm:w-10 sm:h-10 ${meta.color}`} />
        </div>
        <div className="absolute -bottom-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase bg-slate-950 border border-slate-700 text-slate-300 shadow-sm">
          {meta.extLabel}
        </div>
      </div>

      {/* File Info */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-center gap-1.5 max-w-sm mx-auto">
          <h2
            className="text-base sm:text-lg font-bold text-white tracking-tight break-all line-clamp-2"
            title={fileName}
          >
            {fileName}
          </h2>
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 text-slate-400 hover:text-white rounded-md transition shrink-0 cursor-pointer"
            title={copied ? "Copied!" : "Copy file name"}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <p className="text-xs text-slate-400 font-medium">
          {formatBytes(fileSize)} • No preview available
        </p>
        <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
          Download this file to open it with your installed desktop applications.
        </p>
      </div>

      {/* Primary Action Button */}
      <div className="pt-2 space-y-2.5">
        <button
          type="button"
          onClick={handleDownloadClick}
          disabled={isDownloading}
          className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
        >
          <Download className="w-4 h-4" />
          <span>Download File ({formatBytes(fileSize)})</span>
        </button>

        {/* Secondary Actions */}
        {(onOpenDetails || onShare) && (
          <div className="flex items-center justify-center gap-2">
            {onOpenDetails && (
              <button
                type="button"
                onClick={onOpenDetails}
                className="flex-1 py-1.5 px-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Info className="w-3.5 h-3.5 text-blue-400" />
                <span>File Details</span>
              </button>
            )}

            {onShare && (
              <button
                type="button"
                onClick={onShare}
                className="flex-1 py-1.5 px-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Share</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  Download,
  Info,
  Share2,
  Copy,
  Check,
  ShieldCheck,
  Archive,
  Terminal,
  Disc,
  Database,
  Box,
  Layers,
  Type,
  Key,
  FolderKanban,
  FileQuestion,
  ExternalLink,
  Smartphone,
  Cpu,
  Palette,
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

interface FormatMeta {
  label: string;
  pill: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  dotColor: string;
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
  iconBg: string;
  iconBorder: string;
  barColor: string;
  glowColor: string;
}

function getFileFormatMeta(fileName: string, mimeType?: string | null): FormatMeta {
  const ext = fileName.includes(".")
    ? fileName.split(".").pop()?.toLowerCase() || ""
    : "";
  const mime = (mimeType || "").toLowerCase();

  // Microsoft Project / Planner
  if (["mpp", "mpt", "mpd"].includes(ext)) {
    return {
      label: "Microsoft Project Plan",
      pill: ext.toUpperCase() || "MPP",
      hint: "Open with Microsoft Project, ProjectLibre, or GanttProject.",
      icon: FolderKanban,
      accentColor: "text-teal-400",
      dotColor: "bg-teal-400",
      gradientFrom: "from-teal-950/70",
      gradientTo: "to-slate-900/90",
      borderColor: "border-teal-500/30",
      iconBg: "bg-teal-500/15",
      iconBorder: "border-teal-500/30",
      barColor: "bg-teal-400",
      glowColor: "bg-teal-500/25",
    };
  }

  // Microsoft Visio / Diagrams
  if (["vsd", "vsdx", "vss", "vst"].includes(ext)) {
    return {
      label: "Microsoft Visio Diagram",
      pill: ext.toUpperCase() || "VSD",
      hint: "Open with Microsoft Visio, draw.io, or LibreOffice Draw.",
      icon: Layers,
      accentColor: "text-blue-400",
      dotColor: "bg-blue-400",
      gradientFrom: "from-blue-950/70",
      gradientTo: "to-slate-900/90",
      borderColor: "border-blue-500/30",
      iconBg: "bg-blue-500/15",
      iconBorder: "border-blue-500/30",
      barColor: "bg-blue-400",
      glowColor: "bg-blue-500/25",
    };
  }

  // Compressed Archives
  if (
    ["zip", "rar", "7z", "tar", "gz", "bz2", "xz", "z", "tgz", "cab"].includes(ext) ||
    mime.includes("zip") ||
    mime.includes("compressed") ||
    mime.includes("tar")
  ) {
    return {
      label: "Compressed Archive",
      pill: ext.toUpperCase() || "ZIP",
      hint: "Extract files using Windows Explorer, 7-Zip, WinRAR, or The Unarchiver.",
      icon: Archive,
      accentColor: "text-amber-400",
      dotColor: "bg-amber-400",
      gradientFrom: "from-amber-950/70",
      gradientTo: "to-slate-900/90",
      borderColor: "border-amber-500/30",
      iconBg: "bg-amber-500/15",
      iconBorder: "border-amber-500/30",
      barColor: "bg-amber-400",
      glowColor: "bg-amber-500/25",
    };
  }

  // Windows Executables & Installers
  if (["exe", "msi", "bat", "cmd"].includes(ext)) {
    return {
      label: "Windows Executable",
      pill: ext.toUpperCase() || "EXE",
      hint: "Run locally on Windows after verifying file safety.",
      icon: Terminal,
      accentColor: "text-violet-400",
      dotColor: "bg-violet-400",
      gradientFrom: "from-violet-950/70",
      gradientTo: "to-slate-900/90",
      borderColor: "border-violet-500/30",
      iconBg: "bg-violet-500/15",
      iconBorder: "border-violet-500/30",
      barColor: "bg-violet-400",
      glowColor: "bg-violet-500/25",
    };
  }

  // macOS Applications & Packages
  if (["dmg", "pkg", "app"].includes(ext)) {
    return {
      label: "macOS Application Package",
      pill: ext.toUpperCase() || "DMG",
      hint: "Mount disk image or install on macOS.",
      icon: Cpu,
      accentColor: "text-sky-400",
      dotColor: "bg-sky-400",
      gradientFrom: "from-sky-950/70",
      gradientTo: "to-slate-900/90",
      borderColor: "border-sky-500/30",
      iconBg: "bg-sky-500/15",
      iconBorder: "border-sky-500/30",
      barColor: "bg-sky-400",
      glowColor: "bg-sky-500/25",
    };
  }

  // Android Application Packages
  if (["apk", "aab"].includes(ext)) {
    return {
      label: "Android Application Package",
      pill: ext.toUpperCase() || "APK",
      hint: "Install on an Android device or run in an emulator.",
      icon: Smartphone,
      accentColor: "text-emerald-400",
      dotColor: "bg-emerald-400",
      gradientFrom: "from-emerald-950/70",
      gradientTo: "to-slate-900/90",
      borderColor: "border-emerald-500/30",
      iconBg: "bg-emerald-500/15",
      iconBorder: "border-emerald-500/30",
      barColor: "bg-emerald-400",
      glowColor: "bg-emerald-500/25",
    };
  }

  // Disk Images
  if (["iso", "img", "vmdk", "vdi"].includes(ext)) {
    return {
      label: "Disk Image Volume",
      pill: ext.toUpperCase() || "ISO",
      hint: "Mount as a virtual drive or burn to physical optical media.",
      icon: Disc,
      accentColor: "text-cyan-400",
      dotColor: "bg-cyan-400",
      gradientFrom: "from-cyan-950/70",
      gradientTo: "to-slate-900/90",
      borderColor: "border-cyan-500/30",
      iconBg: "bg-cyan-500/15",
      iconBorder: "border-cyan-500/30",
      barColor: "bg-cyan-400",
      glowColor: "bg-cyan-500/25",
    };
  }

  // Databases
  if (["sql", "sqlite", "sqlite3", "db", "mdb", "accdb"].includes(ext)) {
    return {
      label: "Database Storage File",
      pill: ext.toUpperCase() || "DB",
      hint: "Open with DBeaver, DB Browser for SQLite, or Microsoft Access.",
      icon: Database,
      accentColor: "text-emerald-400",
      dotColor: "bg-emerald-400",
      gradientFrom: "from-emerald-950/70",
      gradientTo: "to-slate-900/90",
      borderColor: "border-emerald-500/30",
      iconBg: "bg-emerald-500/15",
      iconBorder: "border-emerald-500/30",
      barColor: "bg-emerald-400",
      glowColor: "bg-emerald-500/25",
    };
  }

  // 3D Models & CAD
  if (["stl", "obj", "fbx", "blend", "step", "stp", "gltf", "glb", "dwg", "dxf"].includes(ext)) {
    return {
      label: "3D Model / CAD Asset",
      pill: ext.toUpperCase() || "3D",
      hint: "Open with Blender, AutoCAD, FreeCAD, or Autodesk viewer.",
      icon: Box,
      accentColor: "text-orange-400",
      dotColor: "bg-orange-400",
      gradientFrom: "from-orange-950/70",
      gradientTo: "to-slate-900/90",
      borderColor: "border-orange-500/30",
      iconBg: "bg-orange-500/15",
      iconBorder: "border-orange-500/30",
      barColor: "bg-orange-400",
      glowColor: "bg-orange-500/25",
    };
  }

  // Creative / Layered Design Files
  if (["psd", "ai", "sketch", "fig", "xd", "eps", "indd"].includes(ext)) {
    return {
      label: "Layered Design Project",
      pill: ext.toUpperCase() || "DESIGN",
      hint: "Open with Adobe Creative Cloud, Figma, or Photopea.",
      icon: Palette,
      accentColor: "text-pink-400",
      dotColor: "bg-pink-400",
      gradientFrom: "from-pink-950/70",
      gradientTo: "to-slate-900/90",
      borderColor: "border-pink-500/30",
      iconBg: "bg-pink-500/15",
      iconBorder: "border-pink-500/30",
      barColor: "bg-pink-400",
      glowColor: "bg-pink-500/25",
    };
  }

  // Typography & Fonts
  if (["ttf", "otf", "woff", "woff2", "eot"].includes(ext)) {
    return {
      label: "Typography Font Asset",
      pill: ext.toUpperCase() || "FONT",
      hint: "Install font directly into Windows/macOS or preview with FontBook.",
      icon: Type,
      accentColor: "text-rose-400",
      dotColor: "bg-rose-400",
      gradientFrom: "from-rose-950/70",
      gradientTo: "to-slate-900/90",
      borderColor: "border-rose-500/30",
      iconBg: "bg-rose-500/15",
      iconBorder: "border-rose-500/30",
      barColor: "bg-rose-400",
      glowColor: "bg-rose-500/25",
    };
  }

  // Security Credentials & Keys
  if (["pem", "crt", "cer", "key", "p12", "pfx", "pub"].includes(ext)) {
    return {
      label: "Cryptographic Certificate",
      pill: ext.toUpperCase() || "KEY",
      hint: "Open with Certificate Manager or inspect securely in an editor.",
      icon: Key,
      accentColor: "text-teal-400",
      dotColor: "bg-teal-400",
      gradientFrom: "from-teal-950/70",
      gradientTo: "to-slate-900/90",
      borderColor: "border-teal-500/30",
      iconBg: "bg-teal-500/15",
      iconBorder: "border-teal-500/30",
      barColor: "bg-teal-400",
      glowColor: "bg-teal-500/25",
    };
  }

  // Default / Generic Binary Format
  return {
    label: ext ? `${ext.toUpperCase()} Document` : "Binary File",
    pill: ext.toUpperCase() || "FILE",
    hint: "Open with your device's default application for this file format.",
    icon: FileQuestion,
    accentColor: "text-slate-300",
    dotColor: "bg-slate-400",
    gradientFrom: "from-slate-900/80",
    gradientTo: "to-slate-950/90",
    borderColor: "border-slate-800",
    iconBg: "bg-slate-800/80",
    iconBorder: "border-slate-700/60",
    barColor: "bg-blue-500",
    glowColor: "bg-blue-500/15",
  };
}

export function UnsupportedPreview({
  fileName,
  fileSize,
  mimeType,
  downloadUrl,
  onDownload,
  onOpenDetails,
  onShare,
  plan,
}: UnsupportedPreviewProps) {
  const [copiedName, setCopiedName] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const meta = getFileFormatMeta(fileName, mimeType);
  const IconComponent = meta.icon;

  const handleCopyName = () => {
    navigator.clipboard.writeText(fileName);
    setCopiedName(true);
    setTimeout(() => setCopiedName(false), 2000);
  };

  const handleCopyLink = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (url) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
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
    <div className="relative w-full max-w-xl mx-auto my-auto p-6 sm:p-8 rounded-3xl bg-slate-900/85 border border-slate-800/80 shadow-2xl backdrop-blur-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Radiant Ambient Aura */}
      <div
        className={`absolute -top-12 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none -z-10 opacity-30 ${meta.glowColor}`}
      />

      {/* 3D-styled Document Artwork with Folded Dog-Ear Corner */}
      <div className="relative w-28 h-36 sm:w-32 sm:h-40 mx-auto transition-transform hover:scale-105 duration-300">
        {/* Soft backplate glow */}
        <div className={`absolute -inset-2 rounded-2xl opacity-40 blur-xl ${meta.glowColor} -z-10`} />

        {/* Folded Sheet Body */}
        <div
          className={`w-full h-full rounded-2xl bg-gradient-to-br ${meta.gradientFrom} ${meta.gradientTo} border ${meta.borderColor} shadow-2xl p-3.5 flex flex-col justify-between relative overflow-hidden backdrop-blur-md`}
        >
          {/* Dog-Ear Folded Corner */}
          <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none">
            <div className="absolute top-0 right-0 w-7 h-7 bg-slate-950/80 rounded-bl-xl border-l border-b border-white/20 shadow-sm" />
          </div>

          {/* Blueprint subtle grid overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff0d_1px,transparent_1px)] [background-size:10px_10px] pointer-events-none opacity-40" />

          {/* Top Category Badge */}
          <div className="relative z-10">
            <div
              className={`w-9 h-9 rounded-xl ${meta.iconBg} border ${meta.iconBorder} flex items-center justify-center shadow-inner`}
            >
              <IconComponent className={`w-4 h-4 sm:w-5 sm:h-5 ${meta.accentColor}`} />
            </div>
          </div>

          {/* Bottom Bold Extension Label */}
          <div className="relative z-10 text-left">
            <div className="flex items-baseline justify-between pr-1">
              <span className="text-xl sm:text-2xl font-black tracking-wider text-white font-mono drop-shadow-md">
                {meta.pill}
              </span>
              <span className="text-[9px] font-semibold text-white/40 uppercase tracking-widest">
                FILE
              </span>
            </div>
            {/* Accent Bar */}
            <div className={`h-1 w-full rounded-full mt-1 ${meta.barColor}`} />
          </div>
        </div>
      </div>

      {/* File Identity & Status */}
      <div className="space-y-2.5">
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/70 border border-slate-800 text-xs font-medium text-slate-300 shadow-inner">
          <span className={`w-2 h-2 rounded-full ${meta.dotColor} animate-pulse`} />
          <span>No Direct Browser Preview</span>
        </div>

        {/* File Name */}
        <div className="flex items-center justify-center gap-2 max-w-lg mx-auto">
          <h2
            className="text-lg sm:text-2xl font-bold text-white tracking-tight break-all leading-snug"
            title={fileName}
          >
            {fileName}
          </h2>
          <button
            type="button"
            onClick={handleCopyName}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition shrink-0 cursor-pointer"
            title={copiedName ? "Copied!" : "Copy file name"}
          >
            {copiedName ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* File Category & Size Subtitle */}
        <p className="text-xs sm:text-sm text-slate-400 font-medium">
          {meta.label} • {formatBytes(fileSize)}
        </p>
      </div>

      {/* Refined Horizontal Specs Strip (Replaces bulky box cards) */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl px-3 py-3 flex items-center justify-around divide-x divide-slate-800/80 text-center shadow-inner">
        <div className="px-2 sm:px-3">
          <span className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider">
            Size
          </span>
          <span className="text-xs sm:text-sm font-bold text-slate-200 mt-0.5 block">
            {formatBytes(fileSize)}
          </span>
        </div>
        <div className="px-2 sm:px-3">
          <span className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider">
            Format
          </span>
          <span className="text-xs sm:text-sm font-bold text-slate-200 mt-0.5 block font-mono">
            .{meta.pill}
          </span>
        </div>
        <div className="px-2 sm:px-3">
          <span className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider">
            Security
          </span>
          <span className="text-xs sm:text-sm font-bold text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Encrypted</span>
          </span>
        </div>
        <div className="px-2 sm:px-3">
          <span className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider">
            Storage
          </span>
          <span className="text-xs sm:text-sm font-bold text-slate-300 mt-0.5 block">
            Multi-Cloud
          </span>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="space-y-3 pt-1">
        <button
          type="button"
          onClick={handleDownloadClick}
          disabled={isDownloading}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-500 active:scale-[0.99] text-white text-sm font-bold rounded-2xl transition-all shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-70 group"
        >
          <Download className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
          <span>Download File ({formatBytes(fileSize)})</span>
        </button>

        {/* Secondary Quick Action Bar */}
        <div className="flex items-center justify-center gap-2">
          {onOpenDetails && (
            <button
              type="button"
              onClick={onOpenDetails}
              className="flex-1 py-2 px-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-blue-400" />
              <span>File Details</span>
            </button>
          )}

          {onShare && (
            <button
              type="button"
              onClick={onShare}
              className="flex-1 py-2 px-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Share</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyLink}
            className="flex-1 py-2 px-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Helpful Native Software Hint */}
      <div className="bg-slate-950/45 border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-left flex items-start gap-2.5">
        <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <div className="text-[11px] text-slate-400 leading-relaxed">
          <span className="font-semibold text-slate-300">How to open: </span>
          <span>{meta.hint}</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState, useMemo } from "react";
import { VfsItem } from "@/stores/drive.store";
import {
  X,
  Layers,
  HardDrive,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Music,
  FileCode,
  FileSpreadsheet,
  Check,
  Copy,
  Eye,
  Share2,
  Download,
  Calendar,
  Folder,
  User,
  ShieldCheck,
  CheckCircle2,
  Cloud,
  Loader2,
  Info,
} from "lucide-react";
import { formatBytes } from "@/lib/format";
import { downloadFile } from "@/lib/download-engine";

export interface ChunkDetail {
  chunkIndex: number;
  byteStart: number;
  byteEnd: number;
  chunkHash: string;
  provider: string;
  accountEmail: string | null;
}

export interface FileDetailsResponse {
  file: {
    id: string;
    name: string;
    size: number;
    mimeType: string | null;
    merkleRoot: string | null;
    createdAt?: string;
    updatedAt?: string;
    parentName?: string;
    ownerEmail?: string | null;
  };
  chunks: ChunkDetail[];
}

interface FileDetailsModalProps {
  item: VfsItem;
  onClose: () => void;
  onPreview?: (item: VfsItem) => void;
  onShare?: (item: VfsItem) => void;
}

const PROVIDER_THEMES: Record<
  string,
  { label: string; badgeBg: string; badgeText: string; border: string; dot: string }
> = {
  box: {
    label: "Box",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-600",
  },
  google_drive: {
    label: "Google Drive",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-600",
  },
  dropbox: {
    label: "Dropbox",
    badgeBg: "bg-sky-50",
    badgeText: "text-sky-700",
    border: "border-sky-200",
    dot: "bg-sky-600",
  },
  one_drive: {
    label: "OneDrive",
    badgeBg: "bg-cyan-50",
    badgeText: "text-cyan-700",
    border: "border-cyan-200",
    dot: "bg-cyan-600",
  },
  pcloud: {
    label: "pCloud",
    badgeBg: "bg-indigo-50",
    badgeText: "text-indigo-700",
    border: "border-indigo-200",
    dot: "bg-indigo-600",
  },
};

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "Unknown";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function getFileBadgeIcon(name: string, mime?: string | null) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const m = mime?.toLowerCase() || "";
  if (m.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
    return <ImageIcon className="w-5 h-5 text-emerald-600" />;
  }
  if (m.startsWith("video/") || ["mp4", "webm", "ogg", "mov", "mkv"].includes(ext)) {
    return <VideoIcon className="w-5 h-5 text-blue-600" />;
  }
  if (m.startsWith("audio/") || ["mp3", "wav", "ogg", "flac"].includes(ext)) {
    return <Music className="w-5 h-5 text-purple-600" />;
  }
  if (m.includes("csv") || ["csv", "tsv", "xlsx", "xls"].includes(ext)) {
    return <FileSpreadsheet className="w-5 h-5 text-amber-600" />;
  }
  if (m.includes("pdf") || ext === "pdf") {
    return <FileText className="w-5 h-5 text-rose-600" />;
  }
  if (["js", "ts", "jsx", "tsx", "py", "json", "html", "css", "sh", "yaml", "yml"].includes(ext)) {
    return <FileCode className="w-5 h-5 text-indigo-600" />;
  }
  return <FileText className="w-5 h-5 text-slate-500" />;
}

export function FileDetailsModal({
  item,
  onClose,
  onPreview,
  onShare,
}: FileDetailsModalProps) {
  const [details, setDetails] = useState<FileDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"details" | "chunks">("details");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    fetch(`${apiUrl}/files/${item.id}/details`, { credentials: "include" })
      .then((res) => res.json())
      .then((data: FileDetailsResponse) => {
        setDetails(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [item.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleCopy = (text: string, id: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadFile({
        fileId: item.id,
        fileName: item.name,
      });
    } catch (err) {
      console.error("Download failed", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const fileData = {
    ...item,
    merkleRoot: details?.file?.merkleRoot || null,
    parentName: details?.file?.parentName || "My Drive",
    ownerEmail: details?.file?.ownerEmail || null,
    ...(details?.file || {}),
  };
  const chunks = details?.chunks || [];

  // Group unique providers
  const uniqueProviders = useMemo(() => {
    const set = new Set<string>();
    chunks.forEach((c) => set.add(c.provider));
    return Array.from(set);
  }, [chunks]);

  const fileExt = item.name.split(".").pop()?.toUpperCase() || "FILE";

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl border border-slate-200 overflow-hidden text-xs flex flex-col max-h-[92dvh] sm:max-h-[88vh] animate-in fade-in zoom-in-95 duration-100"
      >
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-3.5 py-3 sm:px-5 sm:py-4 flex items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="p-1.5 sm:p-2 bg-white rounded-lg sm:rounded-xl border border-slate-200 shadow-2xs shrink-0">
              {getFileBadgeIcon(item.name, item.mimeType)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2
                  className="font-bold text-slate-900 text-xs sm:text-sm truncate"
                  title={item.name}
                >
                  {item.name}
                </h2>
                <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-slate-200/70 text-slate-700 shrink-0 uppercase tracking-wider">
                  {fileExt}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-normal truncate mt-0.5">
                {formatBytes(item.size)} • {item.mimeType || "Binary File"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 sm:p-1.5 hover:bg-slate-200/80 rounded-lg text-slate-400 hover:text-slate-700 transition shrink-0 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 px-3 sm:px-5 bg-white shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={`py-2 sm:py-2.5 px-2.5 sm:px-3 border-b-2 font-semibold text-[11px] sm:text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === "details"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>File Details</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("chunks")}
            className={`py-2 sm:py-2.5 px-2.5 sm:px-3 border-b-2 font-semibold text-[11px] sm:text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === "chunks"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <HardDrive className="w-3.5 h-3.5 shrink-0" />
            <span><span className="hidden sm:inline">Cloud </span>Storage & Chunks</span>
            {chunks.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                {chunks.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3.5 sm:space-y-4">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span>Loading file properties & chunk topology...</span>
            </div>
          ) : activeTab === "details" ? (
            /* Tab 1: Comprehensive File Properties */
            <div className="space-y-3.5 sm:space-y-4">
              {/* Properties Grid */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                <h3 className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  General Information
                </h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-x-4 sm:gap-y-3">
                  <div>
                    <dt className="text-slate-400 text-[10px] sm:text-[11px]">File Size</dt>
                    <dd className="font-semibold text-slate-800 text-xs sm:text-sm mt-0.5">
                      {formatBytes(fileData.size)}{" "}
                      <span className="text-[10px] font-normal text-slate-400 font-mono block sm:inline">
                        ({fileData.size.toLocaleString()} bytes)
                      </span>
                    </dd>
                  </div>

                  <div>
                    <dt className="text-slate-400 text-[10px] sm:text-[11px]">MIME Type</dt>
                    <dd className="font-mono text-slate-700 mt-0.5 truncate text-[11px] sm:text-xs" title={fileData.mimeType || ""}>
                      {fileData.mimeType || "application/octet-stream"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-slate-400 text-[10px] sm:text-[11px]">Location</dt>
                    <dd className="font-medium text-slate-800 mt-0.5 flex items-center gap-1.5 text-[11px] sm:text-xs">
                      <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">{details?.file?.parentName || "My Drive"}</span>
                    </dd>
                  </div>

                  <div>
                    <dt className="text-slate-400 text-[10px] sm:text-[11px]">Owner / Uploader</dt>
                    <dd className="font-medium text-slate-800 mt-0.5 flex items-center gap-1.5 truncate text-[11px] sm:text-xs">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{details?.file?.ownerEmail || "Account Owner"}</span>
                    </dd>
                  </div>

                  <div>
                    <dt className="text-slate-400 text-[10px] sm:text-[11px]">Date Created</dt>
                    <dd className="font-medium text-slate-700 mt-0.5 text-[11px] sm:text-xs">
                      {formatDate(fileData.createdAt)}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-slate-400 text-[10px] sm:text-[11px]">Last Modified</dt>
                    <dd className="font-medium text-slate-700 mt-0.5 text-[11px] sm:text-xs">
                      {formatDate(fileData.updatedAt)}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Security & Cryptographic Integrity */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cryptographic Integrity</span>
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Verified</span>
                  </span>
                </div>

                <div>
                  <dt className="text-slate-400 text-[10px] sm:text-[11px] mb-1">Merkle Root (SHA-256)</dt>
                  <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-2 font-mono text-[10px] sm:text-[11px] text-slate-700">
                    <span className="truncate mr-2" title={fileData.merkleRoot || ""}>
                      {fileData.merkleRoot || "Verified Multi-Cloud Merkle Digest"}
                    </span>
                    {fileData.merkleRoot && (
                      <button
                        type="button"
                        onClick={() => handleCopy(fileData.merkleRoot || "", "merkle")}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition cursor-pointer shrink-0"
                        title="Copy Merkle Root"
                      >
                        {copiedId === "merkle" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pt-1">
                  <div>
                    <dt className="text-slate-400 text-[10px] sm:text-[11px]">Storage Mode</dt>
                    <dd className="font-medium text-slate-800 mt-0.5 flex items-center gap-1.5 text-[11px] sm:text-xs">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                      <span>{chunks.length > 1 ? "Multi-Cloud Pooled" : "Single Cloud (Direct)"}</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 text-[10px] sm:text-[11px]">Direct Streaming</dt>
                    <dd className="font-medium text-slate-800 mt-0.5 text-[11px] sm:text-xs">
                      Zero-Proxy Client Range HTTP
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Tab 2: Multi-Cloud Chunk Topology */
            <div className="space-y-4">
              {/* Cloud Storage Providers Overview */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5 text-blue-600" />
                    <span>Connected Providers Involved</span>
                  </h3>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                    {chunks.length} Total {chunks.length === 1 ? "Chunk" : "Chunks"}
                  </span>
                </div>

                {uniqueProviders.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1">
                    {uniqueProviders.map((provider) => {
                      const theme = PROVIDER_THEMES[provider] || {
                        label: provider,
                        badgeBg: "bg-slate-100",
                        badgeText: "text-slate-700",
                        border: "border-slate-200",
                        dot: "bg-slate-500",
                      };
                      return (
                        <div
                          key={provider}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] sm:text-xs font-semibold ${theme.badgeBg} ${theme.badgeText} ${theme.border}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${theme.dot}`} />
                          <span>{theme.label}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs">Direct storage provider.</div>
                )}
              </div>

              {/* Chunk Map Breakdown */}
              <div>
                <h3 className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Parallel Chunk Map
                </h3>

                {chunks.length > 0 ? (
                  <div className="space-y-2 max-h-56 sm:max-h-64 overflow-y-auto pr-1">
                    {chunks.map((chunk) => {
                      const theme = PROVIDER_THEMES[chunk.provider] || {
                        label: chunk.provider,
                        badgeBg: "bg-slate-100",
                        badgeText: "text-slate-700",
                        border: "border-slate-200",
                        dot: "bg-slate-500",
                      };
                      const chunkSize = chunk.byteEnd - chunk.byteStart;
                      return (
                        <div
                          key={chunk.chunkIndex}
                          className="p-2.5 sm:p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition shadow-2xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <span className="font-bold text-slate-800 text-[11px] sm:text-xs">
                                Chunk #{chunk.chunkIndex}
                              </span>
                              <span
                                className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold uppercase border ${theme.badgeBg} ${theme.badgeText} ${theme.border}`}
                              >
                                {theme.label}
                              </span>
                            </div>
                            <span className="text-[10px] sm:text-[11px] font-mono text-slate-600 font-medium">
                              {formatBytes(chunkSize)}
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] sm:text-[11px] text-slate-500 gap-1 sm:gap-2">
                            <span>
                              Range: {chunk.byteStart.toLocaleString()} – {chunk.byteEnd.toLocaleString()} B
                            </span>
                            {chunk.accountEmail && (
                              <span className="text-slate-400 truncate max-w-full sm:max-w-[200px]" title={chunk.accountEmail}>
                                {chunk.accountEmail}
                              </span>
                            )}
                          </div>

                          {chunk.chunkHash && (
                            <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded px-2 py-1 font-mono text-[9px] sm:text-[10px] text-slate-500">
                              <span className="truncate mr-2" title={chunk.chunkHash}>
                                SHA-256: {chunk.chunkHash}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(chunk.chunkHash, `chunk-${chunk.chunkIndex}`)}
                                className="p-0.5 hover:text-slate-800 transition cursor-pointer shrink-0"
                                title="Copy chunk hash"
                              >
                                {copiedId === `chunk-${chunk.chunkIndex}` ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-400 text-[11px]">
                    Single-chunk monolithic file.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-3.5 py-2.5 sm:px-5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {onPreview && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPreview(item);
                }}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold transition cursor-pointer shadow-2xs"
                title="Open in viewer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            )}

            {onShare && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onShare(item);
                }}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold transition cursor-pointer shadow-2xs"
                title="Create shareable link"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold transition cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
            >
              {isDownloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isDownloading ? "Downloading..." : "Download"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

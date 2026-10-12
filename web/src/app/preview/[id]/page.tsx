"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FuzeLogo } from "@/components/brand/FuzeLogo";
import { ShareModal } from "@/components/drive/ShareModal";
import {
  ArrowLeft,
  Download,
  Loader2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Music,
  FileCode,
  FileSpreadsheet,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Copy,
  Check,
  Table,
  Eye,
  Maximize2,
  Minimize2,
  Search,
  Grid,
  Info,
  X,
  Share2,
  HardDrive,
  Calendar,
  Layers,
  ExternalLink,
} from "lucide-react";
import { formatBytes } from "@/lib/format";
import {
  fetchFilePlan,
  downloadAndAssembleChunks,
  triggerBlobDownload,
  DownloadPlan,
} from "@/lib/download-engine";

export default function FilePreviewPage() {
  const router = useRouter();
  const params = useParams();
  const fileId = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<DownloadPlan | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  // Streaming media sources (instant playback without pre-download)
  const [streamSrc, setStreamSrc] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);

  // Viewer controls
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [copied, setCopied] = useState(false);
  const [wrapText, setWrapText] = useState(true);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [viewMode, setViewMode] = useState<"rendered" | "raw">("rendered");
  const [tableSearch, setTableSearch] = useState("");
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDetails, setShowDetails] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const ext = useMemo(() => {
    return plan?.file.name.split(".").pop()?.toLowerCase() || "";
  }, [plan?.file.name]);

  const mime = plan?.file.mimeType?.toLowerCase() || "";

  const isImage = useMemo(
    () =>
      mime.startsWith("image/") ||
      ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico", "avif"].includes(ext),
    [mime, ext],
  );

  const isVideo = useMemo(
    () =>
      mime.startsWith("video/") ||
      ["mp4", "webm", "ogg", "mov", "m4v", "mkv"].includes(ext),
    [mime, ext],
  );

  const isAudio = useMemo(
    () =>
      mime.startsWith("audio/") ||
      ["mp3", "wav", "ogg", "m4a", "flac", "aac"].includes(ext),
    [mime, ext],
  );

  const isPdf = useMemo(
    () => mime.includes("pdf") || ext === "pdf",
    [mime, ext],
  );

  const isMarkdown = useMemo(
    () => ["md", "markdown"].includes(ext),
    [ext],
  );

  const isCsv = useMemo(
    () => ["csv", "tsv"].includes(ext) || mime.includes("csv"),
    [ext, mime],
  );

  const isTextOrCode = useMemo(
    () =>
      mime.startsWith("text/") ||
      [
        "txt",
        "json",
        "js",
        "ts",
        "tsx",
        "jsx",
        "py",
        "html",
        "css",
        "scss",
        "md",
        "markdown",
        "xml",
        "csv",
        "tsv",
        "log",
        "sql",
        "sh",
        "bash",
        "yaml",
        "yml",
        "env",
      ].includes(ext),
    [mime, ext],
  );

  const isSideways = rotation % 180 !== 0;

  // Fetch plan & initialize instant stream
  useEffect(() => {
    if (!fileId) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetchFilePlan({ fileId })
      .then(async (data) => {
        if (!isMounted) return;
        setPlan(data);

        const targetStream = data.streamUrl || data.downloadUrl || null;
        setStreamSrc(targetStream);

        const currentExt = (data.file.name.split(".").pop() || "").toLowerCase();
        const currentMime = (data.file.mimeType || "").toLowerCase();
        const textLike =
          currentMime.startsWith("text/") ||
          [
            "txt",
            "json",
            "js",
            "ts",
            "tsx",
            "jsx",
            "py",
            "html",
            "css",
            "scss",
            "md",
            "markdown",
            "xml",
            "csv",
            "tsv",
            "log",
            "sql",
            "sh",
            "bash",
            "yaml",
            "yml",
          ].includes(currentExt);

        if (textLike && targetStream) {
          try {
            const res = await fetch(targetStream, { credentials: "include" });
            if (res.ok) {
              const text = await res.text();
              if (isMounted) setTextContent(text);
            }
          } catch (e) {
            console.warn("Failed fetching text preview content:", e);
          }
        }

        if (isMounted) {
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load file preview");
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fileId]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isFullscreen) {
          void document.exitFullscreen?.().catch(() => {});
          setIsFullscreen(false);
        } else if (shareOpen) {
          setShareOpen(false);
        } else {
          router.back();
        }
      }
      if (e.key === "f" && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName || "")) {
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, shareOpen, router]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      void containerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      void document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleDownload = () => {
    if (blob && plan) {
      triggerBlobDownload(blob, plan.file.name);
    } else if (plan?.downloadUrl) {
      window.open(plan.downloadUrl, "_blank");
    } else if (plan?.streamUrl) {
      window.open(plan.streamUrl.replace("inline=true", "inline=false"), "_blank");
    } else if (plan) {
      void downloadAndAssembleChunks(plan).then(({ blob: b }) => {
        setBlob(b);
        triggerBlobDownload(b, plan.file.name);
      });
    }
  };

  const handleCopy = () => {
    if (textContent !== null) {
      void navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  // CSV parsing & search filtering
  const csvData = useMemo(() => {
    if (!isCsv || textContent === null) return null;
    const lines = textContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const delimiter = ext === "tsv" ? "\t" : ",";
    const allRows = lines.map((line) => {
      const cells: string[] = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === delimiter && !inQuotes) {
          cells.push(cur.trim());
          cur = "";
        } else cur += char;
      }
      cells.push(cur.trim());
      return cells;
    });

    const headers = allRows[0] || [];
    let rows = allRows.slice(1);

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      rows = rows.filter((r) => r.some((c) => c.toLowerCase().includes(q)));
    }

    return {
      headers,
      rows: rows.slice(0, 500),
      totalMatches: rows.length,
      totalLines: allRows.length - 1,
    };
  }, [isCsv, textContent, ext, tableSearch]);

  // Markdown renderer
  const renderedMarkdown = useMemo(() => {
    if (!isMarkdown || textContent === null) return null;
    return textContent.split(/\r?\n/).map((line, idx) => {
      if (line.startsWith("# ")) {
        return (
          <h1 key={idx} className="text-xl font-bold text-slate-900 mt-6 mb-3 pb-2 border-b border-slate-200">
            {line.slice(2)}
          </h1>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h2 key={idx} className="text-base font-semibold text-slate-800 mt-5 mb-2">
            {line.slice(3)}
          </h2>
        );
      }
      if (line.startsWith("> ")) {
        return (
          <blockquote key={idx} className="border-l-4 border-blue-500 pl-4 py-1 my-3 bg-slate-50 text-slate-600 italic rounded-r-lg">
            {line.slice(2)}
          </blockquote>
        );
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={idx} className="ml-5 list-disc text-slate-700 my-1">
            {line.slice(2)}
          </li>
        );
      }
      if (line.startsWith("```")) {
        return (
          <div key={idx} className="text-[11px] font-mono text-blue-600 bg-slate-100 p-1 rounded-md my-1">
            {line}
          </div>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-2.5" />;
      }
      return (
        <p key={idx} className="text-slate-700 my-1.5 leading-relaxed">
          {line}
        </p>
      );
    });
  }, [isMarkdown, textContent]);

  const renderBadgeIcon = () => {
    if (isImage) return <ImageIcon className="w-5 h-5 text-emerald-600" />;
    if (isVideo) return <VideoIcon className="w-5 h-5 text-blue-600" />;
    if (isAudio) return <Music className="w-5 h-5 text-purple-600" />;
    if (isCsv) return <FileSpreadsheet className="w-5 h-5 text-amber-600" />;
    if (isPdf) return <FileText className="w-5 h-5 text-rose-600" />;
    if (isTextOrCode) return <FileCode className="w-5 h-5 text-blue-600" />;
    return <FileText className="w-5 h-5 text-slate-500" />;
  };

  return (
    <div
      ref={containerRef}
      className="h-screen flex flex-col bg-[#f8fafc] text-slate-800 font-sans select-none overflow-hidden"
    >
      {/* Box / Drive Clean Header */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 shadow-2xs">
        {/* Left: Navigation & File Title */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 mr-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer shrink-0"
            title="Back to Drive"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <Link
            href="/dashboard"
            className="hidden sm:inline-flex items-center shrink-0 transition-opacity hover:opacity-80"
            title="Fuze Dashboard"
          >
            <FuzeLogo variant="icon" height={22} />
          </Link>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600 shrink-0">
            {renderBadgeIcon()}
          </div>

          <div className="min-w-0 flex-1">
            <h1
              className="font-semibold text-xs sm:text-sm text-slate-900 truncate tracking-tight"
              title={plan?.file.name}
            >
              {plan?.file.name || "Loading file..."}
            </h1>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 sm:text-slate-500 font-normal leading-tight truncate">
              <span className="hidden xs:inline truncate">All Files</span>
              <span className="hidden xs:inline">•</span>
              {plan && <span className="shrink-0">{formatBytes(plan.file.size)}</span>}
            </div>
          </div>
        </div>

        {/* Right Header Toolbar Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Image Controls (Desktop) */}
          {isImage && (
            <div className="hidden sm:flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
                className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition cursor-pointer shadow-2xs"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                className="text-[11px] font-mono px-2 text-slate-700 min-w-10 text-center cursor-pointer"
                title="Reset Zoom"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
                className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition cursor-pointer shadow-2xs"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition cursor-pointer border-l border-slate-200 ml-1 shadow-2xs"
                title="Rotate 90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Video Speed Selector */}
          {isVideo && (
            <div className="hidden sm:flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
              {[1, 1.25, 1.5, 2].map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => handlePlaybackRateChange(speed)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono transition cursor-pointer ${
                    playbackRate === speed
                      ? "bg-white text-blue-600 shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          )}

          {/* CSV Filter & Toggle */}
          {isCsv && (
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="relative hidden md:block">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter rows..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="pl-8 pr-3 py-1 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 w-36 transition"
                />
              </div>
              <button
                type="button"
                onClick={() => setViewMode(viewMode === "rendered" ? "raw" : "rendered")}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-white text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                title={viewMode === "rendered" ? "Raw Text" : "Table View"}
              >
                <Table className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">
                  {viewMode === "rendered" ? "Raw Text" : "Table View"}
                </span>
              </button>
            </div>
          )}

          {/* Markdown Switcher */}
          {isMarkdown && (
            <button
              type="button"
              onClick={() => setViewMode(viewMode === "rendered" ? "raw" : "rendered")}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-white text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">{viewMode === "rendered" ? "Source" : "Preview"}</span>
            </button>
          )}

          {/* Code Wrap & Copy */}
          {isTextOrCode && textContent !== null && (
            <div className="flex items-center bg-slate-100 rounded-xl p-0.5 sm:p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setWrapText(!wrapText)}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer hidden sm:block ${
                  wrapText ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
                }`}
                title="Toggle line wrapping"
              >
                Wrap
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                title="Copy text"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          {/* Fullscreen Toggle (Desktop Only) */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="hidden sm:flex p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition cursor-pointer shadow-2xs"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Details Drawer Toggle */}
          {plan && (
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className={`p-1.5 sm:p-2 rounded-xl border transition cursor-pointer flex items-center justify-center ${
                showDetails
                  ? "bg-blue-50 border-blue-200 text-blue-600"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
              title="Toggle Details Panel"
            >
              <Info className="w-4 h-4" />
            </button>
          )}

          {/* Download Action Button */}
          {plan && (
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 p-1.5 sm:px-3.5 sm:py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs active:scale-95"
              title="Download File"
            >
              <Download className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
          )}

          {/* Share Action Button */}
          {plan && (
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="flex items-center gap-1.5 p-1.5 sm:px-4 sm:py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs active:scale-95"
              title="Share File"
            >
              <Share2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container with Stage and Optional Details Panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Central Media Canvas */}
        <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden p-4 sm:p-6 bg-[#f8fafc]">
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <div className="text-xs font-semibold text-slate-700">Connecting to cloud storage...</div>
              <span className="text-[11px] text-slate-400">Negotiating direct media stream</span>
            </div>
          )}

          {error && (
            <div className="p-8 bg-white border border-rose-200 rounded-2xl text-center max-w-md space-y-4 shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Preview Unavailable</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">{error}</p>
              </div>
              {error.toLowerCase().includes("reconnect") ? (
                <div className="pt-2">
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/providers/box/connect`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs"
                  >
                    Reconnect Box Account
                  </a>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download file instead
                </button>
              )}
            </div>
          )}

          {!isLoading && !error && plan && streamSrc && (
            <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
              {/* 1. Progressive Image Stream with Safe Rotation */}
              {isImage && (
                <div className="w-full h-full flex items-center justify-center overflow-hidden p-2 sm:p-4">
                  <img
                    src={streamSrc}
                    alt={plan.file.name}
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      maxHeight: isSideways ? "min(85vw, 650px)" : "calc(85vh - 70px)",
                      maxWidth: isSideways ? "calc(85vh - 70px)" : "min(95vw, 1100px)",
                    }}
                    className="object-contain rounded-xl shadow-lg border border-slate-200/80 bg-white transition-transform duration-200 select-none cursor-grab active:cursor-grabbing"
                    draggable={false}
                  />

                  {/* Mobile Floating Image Controls Dock */}
                  <div className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center bg-slate-900/90 text-white rounded-full px-3 py-1.5 shadow-2xl backdrop-blur-md border border-white/10">
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
                      className="p-1.5 hover:bg-white/20 rounded-full text-slate-200 hover:text-white transition cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoom(1)}
                      className="text-xs font-mono px-2 text-slate-100 min-w-10 text-center cursor-pointer font-bold"
                      title="Reset Zoom"
                    >
                      {Math.round(zoom * 100)}%
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
                      className="p-1.5 hover:bg-white/20 rounded-full text-slate-200 hover:text-white transition cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-white/20 mx-1" />
                    <button
                      type="button"
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      className="p-1.5 hover:bg-white/20 rounded-full text-slate-200 hover:text-white transition cursor-pointer"
                      title="Rotate 90°"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* 2. Direct Video Stream with Range Requests */}
              {isVideo && (
                <div className="w-full max-w-4xl aspect-video min-h-[320px] max-h-[80vh] flex items-center justify-center bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 relative">
                  <video
                    ref={videoRef}
                    src={streamSrc}
                    controls
                    autoPlay
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-contain"
                    onError={() => {
                      if (plan?.streamUrl && streamSrc !== plan.streamUrl) {
                        setStreamSrc(plan.streamUrl);
                      }
                    }}
                  />
                </div>
              )}

              {/* 3. Audio Player */}
              {isAudio && (
                <div className="w-full max-w-md p-8 sm:p-10 bg-white border border-slate-200 rounded-3xl shadow-xl flex flex-col items-center gap-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shadow-xs">
                    <Music className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{plan.file.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 font-mono">{formatBytes(plan.file.size)}</p>
                  </div>
                  <audio src={streamSrc} controls autoPlay className="w-full mt-2" />
                </div>
              )}

              {/* 4. PDF Reader Frame */}
              {isPdf && (
                <div className="w-full max-w-5xl h-[84vh] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                  <iframe src={streamSrc} title={plan.file.name} className="w-full h-full border-none" />
                </div>
              )}

              {/* 5. CSV Interactive Data Table */}
              {isCsv && viewMode === "rendered" && csvData && (
                <div className="w-full max-w-5xl h-[84vh] bg-white rounded-2xl border border-slate-200 shadow-xl overflow-auto select-text text-xs">
                  <table className="w-full border-collapse text-left font-mono text-[11px]">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                      <tr>
                        {csvData.headers.map((h, i) => (
                          <th key={i} className="p-3 font-semibold text-slate-700 border-r border-slate-200 last:border-none">
                            {h || `Col ${i + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {csvData.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50/80 transition">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-2.5 text-slate-700 border-r border-slate-100 last:border-none truncate max-w-xs">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 6. Rendered Markdown */}
              {isMarkdown && viewMode === "rendered" && renderedMarkdown && (
                <div className="w-full max-w-4xl h-[84vh] bg-white rounded-2xl border border-slate-200 shadow-xl overflow-auto p-8 text-xs sm:text-sm select-text">
                  {renderedMarkdown}
                </div>
              )}

              {/* 7. Code & Raw Text */}
              {isTextOrCode && (viewMode === "raw" || (!isMarkdown && !isCsv)) && textContent !== null && (
                <div className="w-full max-w-4xl h-[84vh] bg-white rounded-2xl border border-slate-200 shadow-xl overflow-auto p-6 font-mono text-xs select-text">
                  <div className="flex">
                    {showLineNumbers && (
                      <div className="select-none pr-4 text-right text-slate-400 font-mono text-[11px] border-r border-slate-200 mr-4">
                        {textContent.split(/\r?\n/).map((_, i) => (
                          <div key={i}>{i + 1}</div>
                        ))}
                      </div>
                    )}
                    <pre
                      className={`flex-1 text-slate-800 text-[11px] leading-relaxed font-mono ${
                        wrapText ? "whitespace-pre-wrap break-all" : "whitespace-pre overflow-x-auto"
                      }`}
                    >
                      {textContent}
                    </pre>
                  </div>
                </div>
              )}

              {/* 8. Fallback for binary / unsupported files */}
              {!isImage &&
                !isVideo &&
                !isAudio &&
                !isPdf &&
                !isTextOrCode && (
                  <div className="p-8 sm:p-10 bg-white border border-slate-200 rounded-3xl text-center max-w-md space-y-4 shadow-xl">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{plan.file.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        No direct browser preview for this file format ({formatBytes(plan.file.size)}).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-xs inline-flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download File
                    </button>
                  </div>
                )}
            </div>
          )}
        </main>

        {/* Right Collapsible "Details" Panel */}
        {showDetails && plan && (
          <>
            {/* Mobile Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 sm:hidden animate-in fade-in duration-150"
              onClick={() => setShowDetails(false)}
            />
            <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-[320px] sm:relative sm:z-20 sm:w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 shadow-2xl sm:shadow-xs animate-in slide-in-from-right-full sm:slide-in-from-right-4 duration-200">
              <div className="h-14 px-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Details
                </h2>
                <button
                  type="button"
                  onClick={() => setShowDetails(false)}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
                  title="Close Details"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs font-sans">
                <div>
                  <h3 className="font-semibold text-slate-900 text-xs mb-3">
                    File Properties
                  </h3>
                  <dl className="space-y-3.5">
                    <div>
                      <dt className="text-slate-400 text-[11px]">Name</dt>
                      <dd className="font-medium text-slate-800 mt-0.5 break-all">
                        {plan.file.name}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-slate-400 text-[11px]">Size</dt>
                      <dd className="font-medium text-slate-800 mt-0.5">
                        {formatBytes(plan.file.size)}{" "}
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({plan.file.size.toLocaleString()} bytes)
                        </span>
                      </dd>
                    </div>

                    <div>
                      <dt className="text-slate-400 text-[11px]">Format / MIME</dt>
                      <dd className="font-medium text-slate-800 mt-0.5">
                        {plan.file.mimeType || "application/octet-stream"}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-slate-400 text-[11px]">Storage Mode</dt>
                      <dd className="font-medium text-slate-800 mt-0.5 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span>{plan.strategy === "chunked" ? "Multi-Cloud Pooled" : "Single Cloud (Whole)"}</span>
                      </dd>
                    </div>

                    {plan.chunks && plan.chunks.length > 0 && (
                      <div>
                        <dt className="text-slate-400 text-[11px]">Parallel Chunks</dt>
                        <dd className="font-medium text-slate-800 mt-0.5 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>
                            {plan.chunks.length} {plan.chunks.length === 1 ? "Chunk" : "Chunks"} (Zero-Proxy Direct Streaming)
                          </span>
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File</span>
                  </button>
                </div>
              </div>
            </aside>
          </>
        )}
      </div>

      {/* Share Modal */}
      {shareOpen && plan && (
        <ShareModal
          item={
            {
              id: plan.file.id,
              name: plan.file.name,
              size: plan.file.size,
              mimeType: plan.file.mimeType,
              type: "file",
              updatedAt: (plan.file as any).updatedAt || plan.file.createdAt || new Date().toISOString(),
              parentId: null,
            } as any
          }
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}

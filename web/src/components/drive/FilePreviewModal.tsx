"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Table,
  Code,
  Eye,
  FileCode,
  Music,
  Video as VideoIcon,
  Image as ImageIcon,
  FileSpreadsheet,
  ExternalLink,
} from "lucide-react";
import { formatBytes } from "@/lib/format";
import {
  fetchFilePlan,
  downloadAndAssembleChunks,
  triggerBlobDownload,
  ProgressCallbackData,
} from "@/lib/download-engine";
import { VfsItem } from "@/stores/drive.store";

interface FilePreviewModalProps {
  item: VfsItem | { id: string; name: string; size: number; mimeType?: string };
  shareToken?: string;
  password?: string;
  onClose: () => void;
}

export function FilePreviewModal({
  item,
  shareToken,
  password,
  onClose,
}: FilePreviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<ProgressCallbackData>({
    percent: 0,
    loaded: 0,
    total: item.size || 0,
    statusText: "Initializing...",
  });
  const [error, setError] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);

  // Viewer controls
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [wrapText, setWrapText] = useState(true);
  const [viewMode, setViewMode] = useState<"rendered" | "raw">("rendered");

  const abortControllerRef = useRef<AbortController | null>(null);

  const ext = useMemo(() => {
    return item.name.split(".").pop()?.toLowerCase() || "";
  }, [item.name]);

  const mime = item.mimeType?.toLowerCase() || "";

  const isImage = useMemo(
    () =>
      mime.startsWith("image/") ||
      ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"].includes(ext),
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
      ["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(ext),
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
        "c",
        "cpp",
        "rs",
        "go",
        "java",
        "env",
        "dockerfile",
      ].includes(ext),
    [mime, ext],
  );

  // Load file content via download engine
  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    let isMounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const plan = await fetchFilePlan({
          fileId: item.id || undefined,
          shareToken,
          password,
        });

        if (controller.signal.aborted) return;

        const targetStream = plan.streamUrl || plan.downloadUrl;

        // If it's an Image, Video, Audio, or PDF: stream immediately without waiting for full download!
        if ((isImage || isVideo || isAudio || isPdf) && targetStream) {
          if (isMounted) {
            setObjectUrl(targetStream);
            setLoading(false);
          }
          return;
        }

        // If Text or Code: quickly fetch the text stream directly
        if (isTextOrCode && targetStream) {
          try {
            const res = await fetch(targetStream, {
              credentials: "include",
              signal: controller.signal,
            });
            if (res.ok) {
              const text = await res.text();
              if (isMounted) {
                setTextContent(text);
                setLoading(false);
              }
              return;
            }
          } catch (e) {
            if (controller.signal.aborted) return;
          }
        }

        // Fallback for multi-chunk binary or files requiring in-memory assembly
        const { blob: downloadedBlob, objectUrl: createdUrl } =
          await downloadAndAssembleChunks(plan, {
            signal: controller.signal,
            shareToken,
            password,
            onProgress: (p) => {
              if (isMounted) setProgress(p);
            },
          });

        if (controller.signal.aborted) {
          URL.revokeObjectURL(createdUrl);
          return;
        }

        if (isMounted) {
          setBlob(downloadedBlob);
          setObjectUrl(createdUrl);

          if (isTextOrCode) {
            const text = await downloadedBlob.text();
            setTextContent(text);
          }
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!controller.signal.aborted && isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load preview");
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [item.id, shareToken, password, isTextOrCode]);

  // Cleanup objectUrl on unmount
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleDownload = () => {
    if (blob) {
      triggerBlobDownload(blob, item.name);
    }
  };

  const handleCopy = () => {
    if (textContent !== null) {
      void navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // CSV parsing for Table View
  const csvData = useMemo(() => {
    if (!isCsv || textContent === null) return null;
    const lines = textContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const delimiter = ext === "tsv" ? "\t" : ",";
    const rows = lines.slice(0, 200).map((line) => {
      // Simple CSV cell splitter
      const cells: string[] = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          cells.push(cur.trim());
          cur = "";
        } else {
          cur += char;
        }
      }
      cells.push(cur.trim());
      return cells;
    });
    return {
      headers: rows[0] || [],
      rows: rows.slice(1),
      totalLines: lines.length,
    };
  }, [isCsv, textContent, ext]);

  // Markdown simple renderer
  const renderedMarkdown = useMemo(() => {
    if (!isMarkdown || textContent === null) return null;
    // Safe lightweight markdown formatter
    const lines = textContent.split(/\r?\n/);
    return lines.map((line, idx) => {
      if (line.startsWith("# ")) {
        return (
          <h1 key={idx} className="text-xl font-bold text-white mt-4 mb-2 pb-1 border-b border-slate-700">
            {line.slice(2)}
          </h1>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h2 key={idx} className="text-lg font-bold text-white mt-3 mb-1.5 pb-1 border-b border-slate-800">
            {line.slice(3)}
          </h2>
        );
      }
      if (line.startsWith("### ")) {
        return (
          <h3 key={idx} className="text-sm font-semibold text-blue-400 mt-2 mb-1">
            {line.slice(4)}
          </h3>
        );
      }
      if (line.startsWith("> ")) {
        return (
          <blockquote key={idx} className="pl-3 border-l-2 border-blue-500 text-slate-300 italic my-1.5">
            {line.slice(2)}
          </blockquote>
        );
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={idx} className="ml-4 list-disc text-slate-300 my-0.5">
            {line.slice(2)}
          </li>
        );
      }
      if (line.startsWith("```")) {
        return (
          <div key={idx} className="text-[11px] font-mono text-cyan-400 opacity-60">
            {line}
          </div>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-slate-300 my-1 leading-relaxed">
          {line}
        </p>
      );
    });
  }, [isMarkdown, textContent]);

  const renderIcon = () => {
    if (isImage) return <ImageIcon className="w-5 h-5 text-emerald-400" />;
    if (isVideo) return <VideoIcon className="w-5 h-5 text-indigo-400" />;
    if (isAudio) return <Music className="w-5 h-5 text-purple-400" />;
    if (isCsv) return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    if (isTextOrCode) return <FileCode className="w-5 h-5 text-blue-400" />;
    return <FileText className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-150 select-none font-sans"
    >
      {/* Top Controls Bar */}
      <div className="h-14 px-4 sm:px-6 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between text-white shrink-0 gap-3">
        {/* Left: File metadata */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-slate-800/80 rounded-xl shrink-0">
            {renderIcon()}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-xs sm:text-sm truncate max-w-xs sm:max-w-md text-white" title={item.name}>
              {item.name}
            </h3>
            <span className="text-[11px] text-slate-400 block font-mono">
              {formatBytes(item.size)}
            </span>
          </div>
        </div>

        {/* Right: Actions & Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Image tools */}
          {isImage && objectUrl && !loading && (
            <div className="flex items-center bg-slate-800/80 rounded-xl p-1 border border-slate-700/60 mr-1 sm:mr-2">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
                className="p-1.5 hover:bg-slate-700 rounded-lg transition text-slate-300 hover:text-white cursor-pointer"
                title="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono px-2 text-slate-400 min-w-10 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
                className="p-1.5 hover:bg-slate-700 rounded-lg transition text-slate-300 hover:text-white cursor-pointer"
                title="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1.5 hover:bg-slate-700 rounded-lg transition text-slate-300 hover:text-white cursor-pointer border-l border-slate-700/80 ml-1"
                title="Rotate 90 degrees"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Code/Text tools */}
          {isTextOrCode && textContent !== null && !loading && (
            <div className="flex items-center gap-1 bg-slate-800/80 rounded-xl p-1 border border-slate-700/60 mr-1 sm:mr-2">
              {isMarkdown && (
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === "rendered" ? "raw" : "rendered")}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
                    viewMode === "rendered" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span className="hidden sm:inline">{viewMode === "rendered" ? "Rendered" : "Raw"}</span>
                </button>
              )}

              {isCsv && (
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === "rendered" ? "raw" : "rendered")}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
                    viewMode === "rendered" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <Table className="w-3 h-3" />
                  <span className="hidden sm:inline">{viewMode === "rendered" ? "Table" : "Raw"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setWrapText(!wrapText)}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer hidden md:flex items-center gap-1 ${
                  wrapText ? "bg-slate-700 text-white" : "text-slate-400 hover:bg-slate-700"
                }`}
                title="Toggle word wrap"
              >
                Wrap
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1"
                title="Copy contents"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={loading || !blob}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>

          {/* Open in new tab */}
          {item.id && (
            <button
              type="button"
              onClick={() => window.open(`/preview/${item.id}`, "_blank")}
              className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition cursor-pointer ml-1"
            aria-label="Close preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-3 sm:p-6 relative">
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 text-white max-w-sm text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <div className="text-xs font-medium text-slate-200">
              {progress.statusText || "Retrieving chunks from cloud storage..."}
            </div>
            <div className="w-56 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-200"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {formatBytes(progress.loaded)} of {formatBytes(progress.total)} ({progress.percent}%)
            </span>
          </div>
        )}

        {error && (
          <div className="p-6 bg-slate-900 border border-rose-500/40 rounded-2xl text-center max-w-md space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
            <h4 className="text-sm font-semibold text-white">Preview unavailable</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
            {error.toLowerCase().includes("reconnect") ? (
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/providers/box/connect`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Reconnect Box Account
              </a>
            ) : (
              <button
                type="button"
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Download file instead
              </button>
            )}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Image Viewer */}
            {isImage && objectUrl && (
              <div className="flex items-center justify-center max-h-full max-w-full overflow-hidden p-2">
                <img
                  src={objectUrl}
                  alt={item.name}
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    maxHeight: rotation % 180 !== 0 ? "min(68vw, 650px)" : "calc(82vh - 80px)",
                    maxWidth: rotation % 180 !== 0 ? "calc(82vh - 80px)" : "min(78vw, 950px)",
                  }}
                  className="object-contain rounded-xl shadow-2xl transition-transform duration-200 select-none"
                  draggable={false}
                />
              </div>
            )}

            {/* Video Player */}
            {isVideo && objectUrl && (
              <div className="w-full max-w-4xl aspect-video min-h-[320px] max-h-[82vh] flex items-center justify-center bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
                <video
                  src={objectUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain rounded-2xl"
                >
                  Your browser does not support HTML5 video preview.
                </video>
              </div>
            )}

            {/* Audio Player */}
            {isAudio && objectUrl && (
              <div className="w-full max-w-md p-8 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl flex flex-col items-center gap-6 text-white text-center">
                <div className="w-20 h-20 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-inner">
                  <Music className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm truncate max-w-xs">{item.name}</h4>
                  <span className="text-xs text-slate-400 font-mono">{formatBytes(item.size)}</span>
                </div>
                <audio src={objectUrl} controls autoPlay className="w-full" />
              </div>
            )}

            {/* PDF Viewer */}
            {isPdf && objectUrl && (
              <iframe
                src={objectUrl}
                title={item.name}
                className="w-full max-w-4xl h-[82vh] rounded-2xl bg-white shadow-2xl border border-slate-800"
              />
            )}

            {/* Markdown Rendered View */}
            {isMarkdown && viewMode === "rendered" && renderedMarkdown && (
              <div className="w-full max-w-3xl h-[82vh] bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl overflow-auto p-6 sm:p-8 select-text text-xs">
                {renderedMarkdown}
              </div>
            )}

            {/* CSV Spreadsheet Table View */}
            {isCsv && viewMode === "rendered" && csvData && (
              <div className="w-full max-w-5xl h-[82vh] bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-auto select-text text-xs">
                <div className="p-3 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Displaying {csvData.rows.length} rows</span>
                  {csvData.totalLines > 200 && (
                    <span className="text-amber-400">(Preview limited to first 200 rows)</span>
                  )}
                </div>
                <table className="w-full border-collapse text-left font-mono text-[11px]">
                  <thead>
                    <tr className="bg-slate-800/60 sticky top-0 border-b border-slate-700">
                      {csvData.headers.map((h, i) => (
                        <th key={i} className="p-2.5 font-semibold text-slate-300 border-r border-slate-800 last:border-none">
                          {h || `Col ${i + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-2.5 text-slate-300 border-r border-slate-800/60 last:border-none truncate max-w-xs">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Plain Text & Code View */}
            {isTextOrCode && (viewMode === "raw" || (!isMarkdown && !isCsv)) && textContent !== null && (
              <div className="w-full max-w-4xl h-[82vh] bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl overflow-auto p-4 sm:p-6 font-mono text-xs select-text">
                <div className="flex">
                  {showLineNumbers && (
                    <div className="select-none pr-4 text-right text-slate-600 font-mono text-[11px] border-r border-slate-800/80 mr-4">
                      {textContent.split(/\r?\n/).map((_, i) => (
                        <div key={i}>{i + 1}</div>
                      ))}
                    </div>
                  )}
                  <pre
                    className={`flex-1 text-slate-200 text-[11px] leading-relaxed font-mono ${
                      wrapText ? "whitespace-pre-wrap break-all" : "whitespace-pre overflow-x-auto"
                    }`}
                  >
                    {textContent}
                  </pre>
                </div>
              </div>
            )}

            {/* Unsupported Fallback */}
            {!isImage && !isVideo && !isAudio && !isPdf && !isTextOrCode && (
              <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center max-w-md space-y-4 shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">{item.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    No browser preview available for this file type ({formatBytes(item.size)})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-xs inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download File
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

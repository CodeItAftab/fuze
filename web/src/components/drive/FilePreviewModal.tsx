"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  X,
  Download,
  Loader2,
  AlertCircle,
  ExternalLink,
  FileText,
  Music,
  Video as VideoIcon,
  Image as ImageIcon,
  FileCode,
  FileSpreadsheet,
} from "lucide-react";
import { formatBytes } from "@/lib/format";
import {
  fetchFilePlan,
  downloadAndAssembleChunks,
  triggerBlobDownload,
  ProgressCallbackData,
} from "@/lib/download-engine";
import { VfsItem } from "@/stores/drive.store";
import { ImagePreview } from "@/components/preview/ImagePreview";
import { VideoPreview } from "@/components/preview/VideoPreview";
import { AudioPreview } from "@/components/preview/AudioPreview";
import { CodePreview } from "@/components/preview/CodePreview";
import { SpreadsheetPreview } from "@/components/preview/SpreadsheetPreview";
import { PdfPreview } from "@/components/preview/PdfPreview";
import { DocxPreview } from "@/components/preview/DocxPreview";

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

  const isDocx = useMemo(
    () => ext === "docx" || mime.includes("wordprocessingml"),
    [ext, mime],
  );

  const isExcel = useMemo(
    () =>
      ["xlsx", "xls", "xlsm", "xlsb"].includes(ext) ||
      mime.includes("spreadsheetml") ||
      mime.includes("ms-excel"),
    [ext, mime],
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

        // Direct streams for audio/video/image
        if ((isImage || isVideo || isAudio) && targetStream) {
          if (isMounted) {
            setObjectUrl(targetStream);
            setLoading(false);
          }
          return;
        }

        // For PDF, fetch blob or use targetStream
        if (isPdf && targetStream) {
          try {
            const res = await fetch(targetStream, {
              credentials: "include",
              signal: controller.signal,
            });
            if (res.ok) {
              const b = await res.blob();
              if (isMounted) {
                setBlob(b);
                setObjectUrl(targetStream);
                setLoading(false);
              }
              return;
            }
          } catch {
            if (controller.signal.aborted) return;
          }
        }

        // For DOCX or Excel, fetch blob from stream
        if ((isDocx || isExcel) && targetStream) {
          try {
            const res = await fetch(targetStream, {
              credentials: "include",
              signal: controller.signal,
            });
            if (res.ok) {
              const b = await res.blob();
              if (isMounted) {
                setBlob(b);
                setObjectUrl(targetStream);
                setLoading(false);
              }
              return;
            }
          } catch {
            if (controller.signal.aborted) return;
          }
        }

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
          } catch {
            if (controller.signal.aborted) return;
          }
        }

        // Chunked assembly fallback (multi-cloud storage chunks)
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

          if (isTextOrCode || isCsv) {
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
  }, [
    item.id,
    shareToken,
    password,
    isTextOrCode,
    isImage,
    isVideo,
    isAudio,
    isPdf,
    isDocx,
    isExcel,
    isCsv,
  ]);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

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

  const renderIcon = () => {
    if (isImage) return <ImageIcon className="w-5 h-5 text-emerald-400" />;
    if (isVideo) return <VideoIcon className="w-5 h-5 text-indigo-400" />;
    if (isAudio) return <Music className="w-5 h-5 text-purple-400" />;
    if (isCsv || isExcel)
      return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    if (isDocx) return <FileText className="w-5 h-5 text-blue-400" />;
    if (isPdf) return <FileText className="w-5 h-5 text-rose-400" />;
    if (isTextOrCode) return <FileCode className="w-5 h-5 text-blue-400" />;
    return <FileText className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-150 select-none font-sans"
    >
      <div className="h-14 px-4 sm:px-6 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between text-white shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-slate-800/80 rounded-xl shrink-0">
            {renderIcon()}
          </div>
          <div className="min-w-0">
            <h3
              className="font-semibold text-xs sm:text-sm truncate max-w-xs sm:max-w-md text-white"
              title={item.name}
            >
              {item.name}
            </h3>
            <span className="text-[11px] text-slate-400 block font-mono">
              {formatBytes(item.size)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownload}
            disabled={loading || !blob}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>

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

      <div
        className={`flex-1 overflow-hidden flex relative ${
          isPdf || isDocx
            ? "items-stretch justify-center p-0"
            : "items-center justify-center p-3 sm:p-6 overflow-auto"
        }`}
      >
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
              {formatBytes(progress.loaded)} of {formatBytes(progress.total)} (
              {progress.percent}%)
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
            {isImage && objectUrl && (
              <ImagePreview src={objectUrl} fileName={item.name} />
            )}

            {isVideo && objectUrl && (
              <VideoPreview
                src={objectUrl}
                mimeType={item.mimeType || undefined}
              />
            )}

            {isAudio && objectUrl && (
              <AudioPreview
                src={objectUrl}
                fileName={item.name}
                mimeType={item.mimeType || undefined}
              />
            )}

            {isPdf && (objectUrl || blob) && (
              <PdfPreview
                src={objectUrl || ""}
                blob={blob}
                fileName={item.name}
              />
            )}

            {isDocx && (objectUrl || blob) && (
              <DocxPreview
                src={objectUrl || undefined}
                blob={blob}
                fileName={item.name}
              />
            )}

            {(isCsv || isExcel) && (textContent !== null || blob || objectUrl) && (
              <SpreadsheetPreview
                content={textContent}
                blob={blob}
                src={objectUrl || undefined}
                fileName={item.name}
                isTsv={ext === "tsv"}
              />
            )}

            {isTextOrCode && !isCsv && textContent !== null && (
              <CodePreview
                content={textContent}
                fileName={item.name}
                extension={ext}
              />
            )}

            {!isImage &&
              !isVideo &&
              !isAudio &&
              !isPdf &&
              !isDocx &&
              !isExcel &&
              !isTextOrCode && (
                <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center max-w-md space-y-4 shadow-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      {item.name}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      No browser preview available for this file type (
                      {formatBytes(item.size)})
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

"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FuzeLogo } from "@/components/brand/FuzeLogo";
import { ShareModal } from "@/components/drive/ShareModal";
import { ImagePreview } from "@/components/preview/ImagePreview";
import { VideoPreview } from "@/components/preview/VideoPreview";
import { AudioPreview } from "@/components/preview/AudioPreview";
import { CodePreview } from "@/components/preview/CodePreview";
import { SpreadsheetPreview } from "@/components/preview/SpreadsheetPreview";
import { PdfPreview } from "@/components/preview/PdfPreview";
import { DocxPreview } from "@/components/preview/DocxPreview";
import { FileDetailsDrawer } from "@/components/preview/FileDetailsDrawer";
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
  Maximize2,
  Minimize2,
  Info,
  Share2,
} from "lucide-react";
import { formatBytes } from "@/lib/format";
import {
  fetchFilePlan,
  downloadAndAssembleChunks,
  triggerBlobDownload,
  DownloadPlan,
} from "@/lib/download-engine";

export function FilePreviewClient() {
  const router = useRouter();
  const params = useParams();
  const fileId = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<DownloadPlan | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const [streamSrc, setStreamSrc] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);

  const [showDetails, setShowDetails] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fileName = plan?.file?.name || "";
  const ext = fileName.includes(".")
    ? fileName.split(".").pop()?.toLowerCase() || ""
    : "";
  const mime = plan?.file?.mimeType?.toLowerCase() || "";

  const isImage =
    mime.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"].includes(ext);
  const isVideo =
    mime.startsWith("video/") ||
    ["mp4", "webm", "ogg", "mov", "mkv", "m4v"].includes(ext);
  const isAudio =
    mime.startsWith("audio/") ||
    ["mp3", "wav", "ogg", "m4a", "flac", "aac"].includes(ext);
  const isPdf = mime.includes("pdf") || ext === "pdf";
  const isDocx = ext === "docx" || mime.includes("wordprocessingml");
  const isExcel =
    ["xlsx", "xls", "xlsm", "xlsb"].includes(ext) ||
    mime.includes("spreadsheetml") ||
    mime.includes("ms-excel");
  const isCsv = ["csv", "tsv"].includes(ext) || mime.includes("csv");
  const isTextOrCode =
    mime.startsWith("text/") ||
    [
      "txt", "json", "js", "ts", "tsx", "jsx", "py", "html", "css", "scss",
      "md", "markdown", "xml", "log", "sql", "sh", "bash", "yaml", "yml",
      "c", "cpp", "rs", "go", "java", "env", "dockerfile",
    ].includes(ext);

  const renderIcon = () => {
    if (isImage) return <ImageIcon className="w-5 h-5 text-emerald-400" />;
    if (isVideo) return <VideoIcon className="w-5 h-5 text-indigo-400" />;
    if (isAudio) return <Music className="w-5 h-5 text-purple-400" />;
    if (isCsv || isExcel) return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    if (isDocx) return <FileText className="w-5 h-5 text-blue-400" />;
    if (isPdf) return <FileText className="w-5 h-5 text-rose-400" />;
    if (isTextOrCode) return <FileCode className="w-5 h-5 text-blue-400" />;
    return <FileText className="w-5 h-5 text-slate-400" />;
  };

  useEffect(() => {
    if (!fileId) return;
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetchFilePlan({ fileId })
      .then(async (data) => {
        if (!isMounted) return;
        setPlan(data);

        let previewUrl = data.streamUrl || data.downloadUrl;

        // When chunked across multiple clouds or for DOCX/Excel/PDF, assemble chunks
        const isDocOrSheet = isDocx || isExcel;
        if (!previewUrl || isDocOrSheet || data.strategy === "chunked") {
          try {
            const assembled = await downloadAndAssembleChunks(data);
            if (!isMounted) return;
            setBlob(assembled.blob);
            previewUrl = assembled.objectUrl;
          } catch (assembleErr: unknown) {
            console.error("Chunk assembly fallback:", assembleErr);
            if (!previewUrl) {
              throw new Error("Unable to decrypt and reassemble file chunks.");
            }
          }
        }

        if (previewUrl && isMounted) {
          setStreamSrc(previewUrl);
        }

        const shouldFetchText =
          data.file.mimeType?.startsWith("text/") ||
          [
            "txt", "json", "js", "ts", "tsx", "jsx", "py", "html", "css", "scss",
            "md", "csv", "tsv", "log", "sql", "sh", "yaml", "yml",
          ].includes(data.file.name.split(".").pop()?.toLowerCase() || "");

        if (shouldFetchText && previewUrl) {
          try {
            const res = await fetch(previewUrl);
            if (res.ok && isMounted) {
              const text = await res.text();
              setTextContent(text);
            }
          } catch (e) {
            console.warn("Failed fetching text preview content:", e);
          }
        }

        if (isMounted) setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load file preview");
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fileId, isDocx, isExcel]);

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

  return (
    <div
      ref={containerRef}
      className="h-screen flex flex-col bg-slate-950 text-white font-sans select-none overflow-hidden"
    >
      {/* Unified Sleek Dark Header */}
      <header className="h-14 bg-slate-900/90 border-b border-slate-800/80 px-3 sm:px-6 flex items-center justify-between shrink-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
            title="Back to Drive (Esc)"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="h-5 w-px bg-slate-800 mx-0.5 sm:mx-1 hidden sm:block" />

          <Link href="/dashboard" className="hidden sm:flex items-center gap-2 group">
            <FuzeLogo variant="icon" height={22} />
          </Link>

          {plan && (
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 ml-1 sm:ml-2">
              <div className="p-1.5 bg-slate-800/80 rounded-lg shrink-0">
                {renderIcon()}
              </div>
              <div className="min-w-0 flex-1">
                <h1
                  className="font-semibold text-xs sm:text-sm text-white truncate"
                  title={plan.file.name}
                >
                  {plan.file.name}
                </h1>
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-normal block leading-tight truncate">
                  {formatBytes(plan.file.size)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="hidden sm:flex p-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {plan && (
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className={`p-2 rounded-xl border transition cursor-pointer flex items-center justify-center ${
                showDetails
                  ? "bg-blue-600/20 border-blue-500/50 text-blue-400"
                  : "bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-700/80 hover:text-white"
              }`}
              title="Toggle Details Panel"
            >
              <Info className="w-4 h-4" />
            </button>
          )}

          {plan && (
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-white border border-slate-700/60 rounded-xl text-xs font-semibold transition cursor-pointer"
              title="Download File"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
          )}

          {plan && (
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs active:scale-95"
              title="Share File"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Viewport */}
      <div className="flex-1 flex overflow-hidden relative">
        <main className="flex-1 flex flex-col items-stretch justify-start relative overflow-hidden bg-slate-950">
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 text-slate-400 my-auto">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <div className="text-xs font-semibold text-slate-200">Connecting to cloud storage...</div>
              <span className="text-[11px] text-slate-400">Negotiating direct media stream</span>
            </div>
          )}

          {error && (
            <div className="p-8 bg-slate-900 border border-rose-500/30 rounded-2xl text-center max-w-md space-y-4 shadow-md m-auto">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Preview Unavailable</h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">{error}</p>
              </div>
              <button
                type="button"
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download file instead
              </button>
            </div>
          )}

          {!isLoading && !error && plan && streamSrc && (
            <div className="w-full h-full flex items-stretch justify-center relative overflow-hidden">
              {isImage && (
                <ImagePreview src={streamSrc} fileName={plan.file.name} />
              )}

              {isVideo && (
                <VideoPreview src={streamSrc} mimeType={plan.file.mimeType} />
              )}

              {isAudio && (
                <AudioPreview src={streamSrc} fileName={plan.file.name} mimeType={plan.file.mimeType} />
              )}

              {isPdf && (
                <PdfPreview src={streamSrc} blob={blob} fileName={plan.file.name} />
              )}

              {isDocx && (
                <DocxPreview src={streamSrc} blob={blob} fileName={plan.file.name} />
              )}

              {(isCsv || isExcel) && (
                <SpreadsheetPreview
                  content={textContent}
                  blob={blob}
                  src={streamSrc}
                  fileName={plan.file.name}
                  isTsv={ext === "tsv"}
                />
              )}

              {isTextOrCode && !isCsv && textContent !== null && (
                <CodePreview
                  content={textContent}
                  fileName={plan.file.name}
                  extension={ext}
                />
              )}

              {!isImage && !isVideo && !isAudio && !isPdf && !isDocx && !isExcel && !isTextOrCode && (
                <div className="p-8 sm:p-10 bg-slate-900 border border-slate-800 rounded-3xl text-center max-w-md space-y-4 shadow-xl">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">{plan.file.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      No direct browser preview for this file format ({formatBytes(plan.file.size)}).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-xs inline-flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download File
                  </button>
                </div>
              )}
            </div>
          )}
        </main>

        {plan && (
          <FileDetailsDrawer
            isOpen={showDetails}
            plan={plan}
            formatBytes={formatBytes}
            onClose={() => setShowDetails(false)}
            onDownload={handleDownload}
          />
        )}
      </div>

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

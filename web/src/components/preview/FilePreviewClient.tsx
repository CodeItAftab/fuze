"use client";

import React, { useEffect, useState, useRef } from "react";
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
  const isCsv = ["csv", "tsv"].includes(ext) || mime.includes("csv");
  const isTextOrCode =
    mime.startsWith("text/") ||
    [
      "txt", "json", "js", "ts", "tsx", "jsx", "py", "html", "css",
      "md", "markdown", "xml", "csv", "tsv", "log", "sql", "sh", "yaml", "yml",
    ].includes(ext);

  const renderIcon = () => {
    if (isImage) return <ImageIcon className="w-5 h-5 text-emerald-600" />;
    if (isVideo) return <VideoIcon className="w-5 h-5 text-blue-600" />;
    if (isAudio) return <Music className="w-5 h-5 text-purple-600" />;
    if (isCsv) return <FileSpreadsheet className="w-5 h-5 text-amber-600" />;
    if (isPdf) return <FileText className="w-5 h-5 text-rose-600" />;
    if (isTextOrCode) return <FileCode className="w-5 h-5 text-blue-600" />;
    return <FileText className="w-5 h-5 text-slate-500" />;
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

        if (!previewUrl && data.strategy === "chunked") {
          try {
            const assembled = await downloadAndAssembleChunks(data);
            if (!isMounted) return;
            setBlob(assembled.blob);
            previewUrl = URL.createObjectURL(assembled.blob);
          } catch (assembleErr: unknown) {
            console.error("Chunk assembly failed:", assembleErr);
            throw new Error("Unable to decrypt and reassemble file chunks.");
          }
        }

        if (previewUrl && isMounted) {
          setStreamSrc(previewUrl);
        }

        const shouldFetchText =
          data.file.mimeType?.startsWith("text/") ||
          ["txt", "json", "js", "ts", "tsx", "jsx", "py", "html", "css", "md", "csv", "tsv", "log", "sql", "sh", "yaml", "yml"].includes(
            data.file.name.split(".").pop()?.toLowerCase() || "",
          );

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
  }, [fileId]);

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
      className="h-screen flex flex-col bg-[#f8fafc] text-slate-800 font-sans select-none overflow-hidden"
    >
      <header className="h-14 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between shrink-0 z-30 shadow-2xs">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-slate-900 transition cursor-pointer"
            title="Back to Drive (Esc)"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="h-5 w-px bg-slate-200 mx-0.5 sm:mx-1 hidden sm:block" />

          <Link href="/dashboard" className="hidden sm:flex items-center gap-2 group">
            <FuzeLogo variant="icon" height={22} />
          </Link>

          {plan && (
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 ml-1 sm:ml-2">
              <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600 shrink-0">
                {renderIcon()}
              </div>
              <div className="min-w-0 flex-1">
                <h1
                  className="font-semibold text-xs sm:text-sm text-slate-900 truncate"
                  title={plan.file.name}
                >
                  {plan.file.name}
                </h1>
                <span className="text-[10px] sm:text-[11px] text-slate-500 font-normal block leading-tight truncate">
                  {formatBytes(plan.file.size)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="hidden sm:flex p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition cursor-pointer shadow-2xs"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

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

      <div className="flex-1 flex overflow-hidden relative">
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
              <button
                type="button"
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download file instead
              </button>
            </div>
          )}

          {!isLoading && !error && plan && streamSrc && (
            <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
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
                <PdfPreview src={streamSrc} fileName={plan.file.name} />
              )}

              {isCsv && textContent !== null && (
                <SpreadsheetPreview
                  content={textContent}
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

              {!isImage && !isVideo && !isAudio && !isPdf && !isTextOrCode && (
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

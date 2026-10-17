"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FuzeLogo } from "@/components/brand/FuzeLogo";
import { ImagePreview } from "@/components/preview/ImagePreview";
import { VideoPreview } from "@/components/preview/VideoPreview";
import { AudioPreview } from "@/components/preview/AudioPreview";
import { CodePreview } from "@/components/preview/CodePreview";
import { MarkdownPreview } from "@/components/preview/MarkdownPreview";
import { SpreadsheetPreview } from "@/components/preview/SpreadsheetPreview";
import { PdfPreview } from "@/components/preview/PdfPreview";
import { DocxPreview } from "@/components/preview/DocxPreview";
import { FileDetailsDrawer } from "@/components/preview/FileDetailsDrawer";
import { SharePasswordPrompt } from "@/components/share/SharePasswordPrompt";
import { ShareDownloadProgress } from "@/components/share/ShareDownloadProgress";
import {
  Download,
  Loader2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Music,
  FileCode,
  FileSpreadsheet,
  BookOpen,
  Info,
} from "lucide-react";
import { formatBytes } from "@/lib/format";
import {
  fetchFilePlan,
  downloadAndAssembleChunks,
  triggerBlobDownload,
  DownloadPlan,
  ProgressCallbackData,
} from "@/lib/download-engine";

export function ShareClient() {
  const params = useParams();
  const token = params?.token as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<DownloadPlan | null>(null);

  const [isPasswordRequired, setIsPasswordRequired] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);

  const [downloadProgress, setDownloadProgress] = useState<ProgressCallbackData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);

  const [streamSrc, setStreamSrc] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

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
  const isDocx =
    ["docx", "doc", "dotx", "dot"].includes(ext) ||
    mime.includes("wordprocessingml") ||
    mime.includes("msword");
  const isExcel =
    ["xlsx", "xls", "xlsm", "xlsb"].includes(ext) ||
    mime.includes("spreadsheetml") ||
    mime.includes("ms-excel");
  const isCsv = ["csv", "tsv"].includes(ext) || mime.includes("csv");
  const isMarkdown = ["md", "markdown"].includes(ext);
  const isTextOrCode =
    (mime.startsWith("text/") ||
      [
        "txt", "json", "js", "ts", "tsx", "jsx", "py", "html", "css", "scss",
        "xml", "log", "sql", "sh", "bash", "yaml", "yml",
        "c", "cpp", "rs", "go", "java", "env", "dockerfile",
      ].includes(ext)) &&
    !isMarkdown;

  const renderIcon = () => {
    if (isImage) return <ImageIcon className="w-5 h-5 text-emerald-400" />;
    if (isVideo) return <VideoIcon className="w-5 h-5 text-indigo-400" />;
    if (isAudio) return <Music className="w-5 h-5 text-purple-400" />;
    if (isCsv || isExcel) return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    if (isDocx) return <FileText className="w-5 h-5 text-blue-400" />;
    if (isPdf) return <FileText className="w-5 h-5 text-rose-400" />;
    if (isMarkdown) return <BookOpen className="w-5 h-5 text-blue-400" />;
    if (isTextOrCode) return <FileCode className="w-5 h-5 text-blue-400" />;
    return <FileText className="w-5 h-5 text-slate-400" />;
  };

  const setupPreview = async (filePlan: DownloadPlan, password?: string) => {
    let src = filePlan.streamUrl || filePlan.downloadUrl;

    const fileExt = filePlan.file.name.split(".").pop()?.toLowerCase() || "";
    const fileMime = filePlan.file.mimeType?.toLowerCase() || "";
    const docDocx =
      ["docx", "doc", "dotx", "dot"].includes(fileExt) ||
      fileMime.includes("wordprocessingml") ||
      fileMime.includes("msword");
    const docExcel =
      ["xlsx", "xls", "xlsm", "xlsb"].includes(fileExt) ||
      fileMime.includes("spreadsheetml") ||
      fileMime.includes("ms-excel");

    if ((!src && filePlan.strategy === "chunked") || docDocx || docExcel) {
      try {
        setIsDownloading(true);
        const assembled = await downloadAndAssembleChunks(filePlan, {
          password,
          onProgress: (p) => setDownloadProgress(p),
        });
        setBlob(assembled.blob);
        src = URL.createObjectURL(assembled.blob);
        setIsDownloading(false);
        setDownloadProgress(null);
      } catch (e: unknown) {
        setIsDownloading(false);
        setDownloadProgress(null);
        console.error("Preview chunk assembly failed:", e);
      }
    }

    if (src) setStreamSrc(src);

    const isText =
      filePlan.file.mimeType?.startsWith("text/") ||
      ["txt", "json", "js", "ts", "tsx", "jsx", "py", "html", "css", "md", "markdown", "csv", "tsv", "log", "sql", "sh", "yaml", "yml"].includes(
        fileExt,
      );

    if (isText && src) {
      try {
        const res = await fetch(src);
        if (res.ok) {
          const text = await res.text();
          setTextContent(text);
        }
      } catch (e) {
        console.warn("Could not fetch text content:", e);
      }
    }
  };

  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetchFilePlan({ shareToken: token })
      .then(async (data) => {
        if (!isMounted) return;
        if (data.isPasswordProtected) {
          setIsPasswordRequired(true);
          setIsLoading(false);
          return;
        }

        setPlan(data);
        setIsLoading(false);
        await setupPreview(data);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load shared file");
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;

    setIsVerifyingPassword(true);
    setPasswordError(null);

    try {
      const data = await fetchFilePlan({
        shareToken: token,
        password: passwordInput.trim(),
      });

      if (data.isPasswordProtected) {
        setPasswordError("Incorrect password. Please try again.");
        setIsVerifyingPassword(false);
        return;
      }

      setPlan(data);
      setIsPasswordRequired(false);
      setIsVerifyingPassword(false);
      await setupPreview(data, passwordInput.trim());
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : "Verification failed");
      setIsVerifyingPassword(false);
    }
  };

  const handleDownload = async () => {
    if (blob && plan) {
      triggerBlobDownload(blob, plan.file.name);
      return;
    }

    if (plan?.downloadUrl) {
      window.open(plan.downloadUrl, "_blank");
      return;
    }

    if (plan?.streamUrl) {
      window.open(plan.streamUrl.replace("inline=true", "inline=false"), "_blank");
      return;
    }

    if (!plan) return;

    setIsDownloading(true);
    try {
      const { blob: assembledBlob } = await downloadAndAssembleChunks(plan, {
        password: passwordInput || undefined,
        onProgress: (p) => setDownloadProgress(p),
      });
      setBlob(assembledBlob);
      triggerBlobDownload(assembledBlob, plan.file.name);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Download failed. Please try again.");
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white font-sans select-none overflow-hidden">
      {/* Sleek Dark Header */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-3 sm:px-6 flex items-center justify-between shrink-0 z-30 shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
          <Link href="/" className="flex items-center gap-2 group transition-opacity hover:opacity-90 shrink-0">
            <FuzeLogo variant="icon" height={22} className="sm:hidden" />
            <FuzeLogo variant="full" height={24} className="hidden sm:inline-block" />
          </Link>

          <div className="h-5 w-px bg-slate-800 mx-0.5 sm:mx-1 hidden sm:block" />

          {plan && !isPasswordRequired && (
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 ml-1 sm:ml-2">
              <div className="p-1.5 bg-slate-800/80 rounded-lg shrink-0">
                {renderIcon()}
              </div>
              <div className="min-w-0 flex-1">
                <h1
                  className="font-semibold text-xs sm:text-sm text-white truncate max-w-[120px] xs:max-w-[160px] sm:max-w-xs md:max-w-md"
                  title={plan.file.name}
                >
                  {plan.file.name}
                </h1>
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-normal block leading-tight truncate">
                  <span className="hidden xs:inline">Public Share • </span>{formatBytes(plan.file.size)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {plan && !isPasswordRequired && (
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

          {plan && !isPasswordRequired && (
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs disabled:opacity-60"
            >
              {isDownloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{isDownloading ? "Downloading..." : "Download"}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Full-Bleed Viewport */}
      <div className="flex-1 flex overflow-hidden relative">
        <main className="flex-1 flex items-center justify-center relative overflow-hidden bg-slate-950 p-0">
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <div className="text-xs font-semibold text-slate-300">Connecting to shared cloud storage...</div>
            </div>
          )}

          {error && (
            <div className="p-8 bg-slate-900 border border-rose-500/30 rounded-3xl text-center max-w-sm space-y-4 shadow-2xl m-4">
              <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Unable to Open Link</h3>
                <p className="text-xs text-slate-400 mt-1">{error}</p>
              </div>
              <Link
                href="/"
                className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Go to Fuze Drive
              </Link>
            </div>
          )}

          {isPasswordRequired && (
            <SharePasswordPrompt
              passwordInput={passwordInput}
              isVerifying={isVerifyingPassword}
              passwordError={passwordError}
              onPasswordChange={setPasswordInput}
              onSubmit={handlePasswordSubmit}
            />
          )}

          {!isLoading && !error && !isPasswordRequired && plan && streamSrc && (
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

              {isMarkdown && textContent !== null && (
                <MarkdownPreview content={textContent} fileName={plan.file.name} />
              )}

              {isTextOrCode && textContent !== null && (
                <CodePreview
                  content={textContent}
                  fileName={plan.file.name}
                  extension={ext}
                />
              )}

              {!isImage && !isVideo && !isAudio && !isPdf && !isDocx && !isExcel && !isCsv && !isMarkdown && !isTextOrCode && (
                <div className="p-8 sm:p-10 bg-slate-900 border border-slate-800 rounded-3xl text-center max-w-md space-y-4 shadow-2xl m-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">{plan.file.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      No direct browser preview available ({formatBytes(plan.file.size)}).
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

        {plan && !isPasswordRequired && (
          <FileDetailsDrawer
            isOpen={showDetails}
            plan={plan}
            formatBytes={formatBytes}
            onClose={() => setShowDetails(false)}
            onDownload={handleDownload}
          />
        )}
      </div>

      <ShareDownloadProgress progress={downloadProgress} formatBytes={formatBytes} />
    </div>
  );
}


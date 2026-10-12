"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FuzeLogo } from "@/components/brand/FuzeLogo";
import {
  Download,
  Lock,
  Loader2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Music,
  FileCode,
  FileSpreadsheet,
  Cloud,
  Eye,
  Table,
  Copy,
  Check,
  RotateCw,
  ZoomIn,
  ZoomOut,
  ShieldCheck,
  Info,
  X,
  Share2,
  HardDrive,
  Calendar,
  Layers,
} from "lucide-react";
import { formatBytes } from "@/lib/format";
import {
  fetchFilePlan,
  downloadAndAssembleChunks,
  triggerBlobDownload,
  DownloadPlan,
  ProgressCallbackData,
} from "@/lib/download-engine";

export default function SharePage() {
  const params = useParams();
  const token = params?.token as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<DownloadPlan | null>(null);

  // Password state
  const [isPasswordRequired, setIsPasswordRequired] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);

  // Download / Preview state
  const [downloadProgress, setDownloadProgress] = useState<ProgressCallbackData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [streamSrc, setStreamSrc] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);

  // Viewer controls
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"rendered" | "raw">("rendered");
  const [showDetails, setShowDetails] = useState(true);

  // Load initial share metadata
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
          setPlan(data);
          setIsLoading(false);
          return;
        }

        setPlan(data);
        setIsLoading(false);

        // Instant stream preview
        await setupPreview(data);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load share link");
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const setupPreview = async (downloadPlan: DownloadPlan, verifiedPassword?: string) => {
    const src = downloadPlan.streamUrl || downloadPlan.downloadUrl || null;
    setStreamSrc(src);

    const ext = (downloadPlan.file.name.split(".").pop() || "").toLowerCase();
    const mime = (downloadPlan.file.mimeType || "").toLowerCase();
    const isText =
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
        "md",
        "markdown",
        "xml",
        "csv",
        "tsv",
        "log",
        "sql",
        "sh",
        "yaml",
        "yml",
      ].includes(ext);

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
      setPasswordError(
        err instanceof Error ? err.message : "Verification failed",
      );
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
      const { blob: downloadedBlob } = await downloadAndAssembleChunks(plan, {
        shareToken: token,
        password: passwordInput || undefined,
        onProgress: (p) => setDownloadProgress(p),
      });

      setBlob(downloadedBlob);
      triggerBlobDownload(downloadedBlob, plan.file.name);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Download failed");
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

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
      ["mp4", "webm", "ogg", "mov", "m4v"].includes(ext),
    [mime, ext],
  );

  const isAudio = useMemo(
    () =>
      mime.startsWith("audio/") ||
      ["mp3", "wav", "ogg", "m4a", "flac"].includes(ext),
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
        "md",
        "markdown",
        "xml",
        "csv",
        "tsv",
        "log",
        "sql",
        "sh",
        "yaml",
        "yml",
      ].includes(ext),
    [mime, ext],
  );

  const isSideways = rotation % 180 !== 0;

  const renderIcon = () => {
    if (isImage) return <ImageIcon className="w-5 h-5 text-emerald-600" />;
    if (isVideo) return <VideoIcon className="w-5 h-5 text-blue-600" />;
    if (isAudio) return <Music className="w-5 h-5 text-purple-600" />;
    if (isCsv) return <FileSpreadsheet className="w-5 h-5 text-amber-600" />;
    if (isPdf) return <FileText className="w-5 h-5 text-rose-600" />;
    if (isTextOrCode) return <FileCode className="w-5 h-5 text-blue-600" />;
    return <FileText className="w-5 h-5 text-slate-500" />;
  };

  const csvData = useMemo(() => {
    if (!isCsv || textContent === null) return null;
    const lines = textContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const delimiter = ext === "tsv" ? "\t" : ",";
    const rows = lines.slice(0, 300).map((line) => {
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
    return { headers: rows[0] || [], rows: rows.slice(1) };
  }, [isCsv, textContent, ext]);

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc] text-slate-800 font-sans select-none overflow-hidden">
      {/* Top Header (Box / Google Drive Clean Style) */}
      <header className="h-14 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between shrink-0 z-30 shadow-2xs">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
          <Link href="/" className="flex items-center gap-2 group transition-opacity hover:opacity-90 shrink-0">
            <FuzeLogo variant="icon" height={22} className="sm:hidden" />
            <FuzeLogo variant="full" height={24} className="hidden sm:inline-block" />
          </Link>

          <div className="h-5 w-px bg-slate-200 mx-0.5 sm:mx-1 hidden sm:block" />

          {plan && !isPasswordRequired && (
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
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
                <span className="text-[10px] sm:text-[11px] text-slate-400 sm:text-slate-500 font-normal block leading-tight truncate">
                  <span className="hidden xs:inline">Public Share • </span>{formatBytes(plan.file.size)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Desktop Image Toolbar */}
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
                title="Reset zoom"
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

          {/* Toggle Details Panel Button */}
          {plan && !isPasswordRequired && (
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className={`p-1.5 sm:p-2 rounded-xl border transition cursor-pointer flex items-center justify-center ${
                showDetails
                  ? "bg-blue-50 border-blue-200 text-blue-600"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
              title="File Details"
            >
              <Info className="w-4 h-4" />
            </button>
          )}

          {/* Download Button */}
          {plan && !isPasswordRequired && (
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-1.5 p-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs disabled:opacity-50"
              title="Download File"
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 animate-spin" />
              ) : (
                <Download className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              )}
              <span className="hidden sm:inline">Download</span>
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
              <span className="text-xs font-medium">Opening shared document...</span>
            </div>
          )}

          {error && (
            <div className="p-8 bg-white border border-rose-200 rounded-2xl text-center max-w-md space-y-3 shadow-md">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <h3 className="font-semibold text-slate-900 text-sm">Link Unavailable</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Password Protection Card */}
          {isPasswordRequired && plan && (
            <div className="w-full max-w-md p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl shadow-xl space-y-6 animate-in zoom-in-95 duration-150">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Password Protected
                </h2>
                <p className="text-xs text-slate-500">
                  This shared file requires a password to view and download.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-2xs shrink-0">
                  {renderIcon()}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-slate-900 block truncate" title={plan.file.name}>
                    {plan.file.name}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 block">
                    {formatBytes(plan.file.size)}
                  </span>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <input
                    type="password"
                    placeholder="Enter password..."
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    autoFocus
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-xs text-slate-900 placeholder-slate-400 font-mono transition outline-none"
                  />
                  {passwordError && (
                    <p className="text-rose-600 text-[11px] mt-1.5 font-medium">
                      {passwordError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isVerifyingPassword || !passwordInput.trim()}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  {isVerifyingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Unlock File</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Active Preview Display (Safe Rotation & High-Speed Stream) */}
          {!isLoading && !error && !isPasswordRequired && plan && streamSrc && (
            <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
              {/* 1. Image Viewer (Never covers buttons, constrained properly) */}
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
                      title="Reset zoom"
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

              {/* 2. Video Player */}
              {isVideo && (
                <div className="w-full max-w-4xl aspect-video min-h-[320px] max-h-[80vh] flex items-center justify-center bg-black rounded-2xl overflow-hidden shadow-xl border border-slate-200">
                  <video
                    src={streamSrc}
                    controls
                    autoPlay
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* 3. Audio Player */}
              {isAudio && (
                <div className="w-full max-w-md p-8 bg-white border border-slate-200 rounded-3xl shadow-xl flex flex-col items-center gap-5 text-center">
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

              {/* 4. PDF Reader */}
              {isPdf && (
                <div className="w-full max-w-5xl h-[82vh] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                  <iframe src={streamSrc} title={plan.file.name} className="w-full h-full border-none" />
                </div>
              )}

              {/* 5. CSV Table */}
              {isCsv && viewMode === "rendered" && csvData && (
                <div className="w-full max-w-5xl h-[82vh] bg-white rounded-2xl border border-slate-200 shadow-xl overflow-auto select-text text-xs">
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

              {/* 6. Code & Text */}
              {isTextOrCode && textContent !== null && (
                <div className="w-full max-w-4xl h-[82vh] bg-white rounded-2xl border border-slate-200 shadow-xl overflow-auto p-6 font-mono text-xs select-text">
                  <pre className="text-slate-800 whitespace-pre-wrap leading-relaxed font-mono">
                    {textContent}
                  </pre>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Right Collapsible "Details" Panel */}
        {showDetails && plan && !isPasswordRequired && (
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
                      <dd className="font-mono font-medium text-slate-800 mt-0.5">
                        {formatBytes(plan.file.size)} ({plan.file.size.toLocaleString()} bytes)
                      </dd>
                    </div>

                    <div>
                      <dt className="text-slate-400 text-[11px]">Format / MIME</dt>
                      <dd className="font-mono text-slate-800 mt-0.5">
                        {plan.file.mimeType || "application/octet-stream"}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-slate-400 text-[11px]">Storage Architecture</dt>
                      <dd className="font-medium text-slate-800 mt-0.5 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span>{plan.strategy === "chunked" ? "Multi-Cloud Pooled" : "Single Cloud (Whole)"}</span>
                      </dd>
                    </div>

                    {plan.chunks && plan.chunks.length > 0 && (
                      <div>
                        <dt className="text-slate-400 text-[11px]">Parallel Chunks</dt>
                        <dd className="font-mono text-slate-800 mt-0.5">
                          {plan.chunks.length} Chunks (Zero-Proxy Direct Assembly)
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
    </div>
  );
}

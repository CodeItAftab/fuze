"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Printer,
  Download,
  Sidebar,
  Loader2,
  AlertCircle,
  Maximize2,
  Minimize2,
  Layers,
  FileText,
} from "lucide-react";

// Configure worker locally using the bundled public file
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

interface PdfPreviewProps {
  src: string;
  fileName: string;
  blob?: Blob | null;
}

export function PdfPreview({ src, fileName, blob }: PdfPreviewProps) {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [inputPage, setInputPage] = useState<string>("1");
  const [scale, setScale] = useState<number>(1.2);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"single" | "continuous">("single");

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const continuousContainerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);

  // Load PDF Document
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    const loadPdf = async () => {
      try {
        let loadingTask;
        if (blob) {
          const arrayBuffer = await blob.arrayBuffer();
          loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        } else {
          loadingTask = pdfjsLib.getDocument({
            url: src,
            withCredentials: true,
          });
        }

        const doc = await loadingTask.promise;
        if (isCancelled) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setInputPage("1");
        setLoading(false);
      } catch (err: unknown) {
        if (isCancelled) return;
        const msg = err instanceof Error ? err.message : "Failed to load PDF";
        setError(msg);
        setLoading(false);
      }
    };

    void loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [src, blob]);

  // Render Single Page to Canvas with HiDPI support
  const renderPage = useCallback(
    async (pageNum: number) => {
      if (!pdfDoc || !canvasRef.current || viewMode !== "single") return;

      try {
        // Cancel ongoing render if any
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const page = await pdfDoc.getPage(pageNum);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d", { alpha: false });
        if (!context) return;

        const viewport = page.getViewport({ scale, rotation });
        const outputScale = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";

        const transform =
          outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

        const renderContext = {
          canvasContext: context,
          viewport,
          transform,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error("Error rendering PDF page:", err);
        }
      }
    },
    [pdfDoc, scale, rotation, viewMode],
  );

  useEffect(() => {
    if (viewMode === "single") {
      void renderPage(currentPage);
    }
  }, [renderPage, currentPage, viewMode]);

  // Handle continuous render
  useEffect(() => {
    if (!pdfDoc || viewMode !== "continuous" || !continuousContainerRef.current)
      return;

    let isAborted = false;
    const container = continuousContainerRef.current;
    container.innerHTML = "";

    const renderAllPages = async () => {
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        if (isAborted) break;

        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale, rotation });
        const outputScale = window.devicePixelRatio || 1;

        const pageWrapper = document.createElement("div");
        pageWrapper.className =
          "relative mb-6 shadow-xl rounded-lg bg-white overflow-hidden";

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) continue;

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform =
          outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

        pageWrapper.appendChild(canvas);
        container.appendChild(pageWrapper);

        await page.render({
          canvasContext: context,
          viewport,
          transform,
        }).promise;
      }
    };

    void renderAllPages();

    return () => {
      isAborted = true;
    };
  }, [pdfDoc, scale, rotation, viewMode]);

  // Page Controls
  const goToPrev = () => {
    if (currentPage > 1) {
      const next = currentPage - 1;
      setCurrentPage(next);
      setInputPage(String(next));
    }
  };

  const goToNext = () => {
    if (currentPage < numPages) {
      const next = currentPage + 1;
      setCurrentPage(next);
      setInputPage(String(next));
    }
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(inputPage, 10);
    if (!isNaN(val) && val >= 1 && val <= numPages) {
      setCurrentPage(val);
    } else {
      setInputPage(String(currentPage));
    }
  };

  // Zoom
  const zoomIn = () => setScale((s) => Math.min(Math.round((s + 0.2) * 10) / 10, 3.5));
  const zoomOut = () => setScale((s) => Math.max(Math.round((s - 0.2) * 10) / 10, 0.4));
  const rotateDoc = () => setRotation((r) => (r + 90) % 360);

  // Fit Width / Fit Page
  const fitWidth = () => {
    if (!containerRef.current || !pdfDoc) return;
    const containerWidth = containerRef.current.clientWidth - (showThumbnails ? 220 : 60);
    pdfDoc.getPage(currentPage).then((page) => {
      const defaultViewport = page.getViewport({ scale: 1, rotation });
      const newScale = Math.max(0.4, (containerWidth / defaultViewport.width) * 0.95);
      setScale(Math.round(newScale * 10) / 10);
    });
  };

  const fitPage = () => {
    if (!containerRef.current || !pdfDoc) return;
    const containerHeight = containerRef.current.clientHeight - 80;
    pdfDoc.getPage(currentPage).then((page) => {
      const defaultViewport = page.getViewport({ scale: 1, rotation });
      const newScale = Math.max(0.4, (containerHeight / defaultViewport.height) * 0.95);
      setScale(Math.round(newScale * 10) / 10);
    });
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName || ""))
        return;

      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        goToPrev();
      } else if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        goToNext();
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomIn();
      } else if (e.key === "-") {
        e.preventDefault();
        zoomOut();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        rotateDoc();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const handlePrint = () => {
    window.print();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      void containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      void document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col bg-slate-900 text-slate-100 select-none overflow-hidden relative font-sans"
    >
      {/* Top Floating Control Bar */}
      <header className="h-12 px-3 sm:px-4 bg-slate-950/90 border-b border-slate-800 backdrop-blur-md flex items-center justify-between z-20 shrink-0 text-xs gap-2">
        {/* Left: Sidebar Toggle & Page Nav */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setShowThumbnails((v) => !v)}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              showThumbnails
                ? "bg-blue-600/20 border-blue-500/50 text-blue-400"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
            title="Toggle Page Thumbnails"
          >
            <Sidebar className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

          {/* Page Selector */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goToPrev}
              disabled={currentPage <= 1 || loading}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded-lg text-slate-300 hover:text-white transition cursor-pointer border border-slate-800"
              title="Previous Page (Left Arrow)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1">
              <input
                type="text"
                value={inputPage}
                onChange={(e) => setInputPage(e.target.value)}
                onBlur={() => setInputPage(String(currentPage))}
                disabled={loading}
                className="w-10 text-center py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-blue-500"
              />
              <span className="text-slate-400 font-mono text-[11px]">
                / {numPages || 1}
              </span>
            </form>

            <button
              type="button"
              onClick={goToNext}
              disabled={currentPage >= numPages || loading}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded-lg text-slate-300 hover:text-white transition cursor-pointer border border-slate-800"
              title="Next Page (Right Arrow)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center: Zoom & View Mode Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={zoomOut}
            disabled={scale <= 0.4 || loading}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded-lg text-slate-300 hover:text-white transition cursor-pointer border border-slate-800"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="text-[11px] font-mono text-slate-300 min-w-12 text-center hidden sm:inline">
            {Math.round(scale * 100)}%
          </span>

          <button
            type="button"
            onClick={zoomIn}
            disabled={scale >= 3.5 || loading}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded-lg text-slate-300 hover:text-white transition cursor-pointer border border-slate-800"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1 hidden md:block" />

          {/* Preset Buttons */}
          <button
            type="button"
            onClick={fitWidth}
            disabled={loading}
            className="hidden md:inline-flex px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-slate-300 hover:text-white transition cursor-pointer"
            title="Fit to Width"
          >
            Fit Width
          </button>

          <button
            type="button"
            onClick={fitPage}
            disabled={loading}
            className="hidden md:inline-flex px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-slate-300 hover:text-white transition cursor-pointer"
            title="Fit to Page"
          >
            Fit Page
          </button>
        </div>

        {/* Right: Rotation, Print, Mode Toggle */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={rotateDoc}
            disabled={loading}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition cursor-pointer border border-slate-800"
            title="Rotate 90° (R)"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() =>
              setViewMode((m) => (m === "single" ? "continuous" : "single"))
            }
            className={`hidden sm:flex p-1.5 rounded-lg border transition cursor-pointer ${
              viewMode === "continuous"
                ? "bg-blue-600/20 border-blue-500/50 text-blue-400"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
            title={
              viewMode === "continuous"
                ? "Switch to Single Page View"
                : "Switch to Continuous Vertical Scroll"
            }
          >
            <Layers className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="hidden sm:flex p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition cursor-pointer border border-slate-800"
            title="Print PDF"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="hidden lg:flex p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition cursor-pointer border border-slate-800"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Thumbnails Sidebar */}
        {showThumbnails && numPages > 0 && (
          <aside className="w-48 bg-slate-950/95 border-r border-slate-800/80 flex flex-col shrink-0 z-10 animate-in slide-in-from-left duration-200">
            <div className="p-3 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Pages ({numPages})</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {Array.from({ length: numPages }, (_, i) => i + 1).map((pNum) => (
                <button
                  key={pNum}
                  type="button"
                  onClick={() => {
                    setCurrentPage(pNum);
                    setInputPage(String(pNum));
                  }}
                  className={`w-full flex flex-col items-center p-2 rounded-xl border transition cursor-pointer ${
                    currentPage === pNum
                      ? "bg-blue-600/10 border-blue-500 text-blue-400 shadow-md"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800/60"
                  }`}
                >
                  <div className="w-full h-24 bg-white/5 rounded-md flex items-center justify-center mb-1.5 text-slate-500">
                    <FileText className="w-6 h-6 opacity-60" />
                  </div>
                  <span className="text-[11px] font-mono font-medium">
                    Page {pNum}
                  </span>
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Viewport Canvas Area */}
        <main className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8 relative bg-slate-900/90">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <div className="text-xs font-medium text-slate-300">
                Rendering vector pages...
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                {fileName}
              </span>
            </div>
          )}

          {error && (
            <div className="p-8 bg-slate-950 border border-rose-500/30 rounded-2xl max-w-md text-center space-y-3 shadow-2xl">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <h4 className="text-sm font-bold text-white">
                Unable to display PDF
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
              <a
                href={src}
                download={fileName}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-md mt-2"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF File
              </a>
            </div>
          )}

          {/* Single Page Canvas */}
          {!loading && !error && viewMode === "single" && (
            <div className="flex items-center justify-center transition-all duration-200">
              <canvas
                ref={canvasRef}
                className="shadow-2xl rounded-lg bg-white select-none transition-transform"
              />
            </div>
          )}

          {/* Continuous Scroll Container */}
          {!loading && !error && viewMode === "continuous" && (
            <div
              ref={continuousContainerRef}
              className="flex flex-col items-center justify-start w-full h-full overflow-y-auto py-6"
            />
          )}
        </main>
      </div>
    </div>
  );
}

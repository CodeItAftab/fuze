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
          "relative mb-6 shadow-2xl rounded-lg bg-white overflow-hidden";

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
  const zoomIn = () =>
    setScale((s) => Math.min(Math.round((s + 0.2) * 10) / 10, 3.5));
  const zoomOut = () =>
    setScale((s) => Math.max(Math.round((s - 0.2) * 10) / 10, 0.4));
  const rotateDoc = () => setRotation((r) => (r + 90) % 360);

  // Fit Width
  const fitWidth = () => {
    if (!containerRef.current || !pdfDoc) return;
    const containerWidth =
      containerRef.current.clientWidth - (showThumbnails ? 220 : 60);
    pdfDoc.getPage(currentPage).then((page) => {
      const defaultViewport = page.getViewport({ scale: 1, rotation });
      const newScale = Math.max(
        0.4,
        (containerWidth / defaultViewport.width) * 0.95,
      );
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

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col bg-slate-950 text-slate-100 select-none overflow-hidden relative font-sans"
    >
      {/* Floating Bottom Control Bar (Google Drive / Acrobat style, NO double top navbar!) */}
      {!loading && !error && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700/60 shadow-2xl text-white text-xs">
          {/* Thumbnails Sidebar Toggle */}
          <button
            type="button"
            onClick={() => setShowThumbnails((v) => !v)}
            className={`p-1.5 rounded-full transition cursor-pointer ${
              showThumbnails
                ? "bg-blue-600 text-white"
                : "hover:bg-white/10 text-slate-300"
            }`}
            title="Toggle Page Thumbnails"
          >
            <Sidebar className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-700 mx-0.5" />

          {/* Page Selector */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goToPrev}
              disabled={currentPage <= 1}
              className="p-1.5 hover:bg-white/10 disabled:opacity-30 rounded-full transition cursor-pointer"
              title="Previous Page (Left Arrow)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <form
              onSubmit={handlePageInputSubmit}
              className="flex items-center gap-1"
            >
              <input
                type="text"
                value={inputPage}
                onChange={(e) => setInputPage(e.target.value)}
                onBlur={() => setInputPage(String(currentPage))}
                className="w-9 text-center py-0.5 bg-slate-800 border border-slate-700 rounded-md text-white font-mono text-xs focus:outline-none focus:border-blue-500"
              />
              <span className="text-slate-400 font-mono text-[11px]">
                / {numPages || 1}
              </span>
            </form>

            <button
              type="button"
              onClick={goToNext}
              disabled={currentPage >= numPages}
              className="p-1.5 hover:bg-white/10 disabled:opacity-30 rounded-full transition cursor-pointer"
              title="Next Page (Right Arrow)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-4 bg-slate-700 mx-0.5" />

          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={zoomOut}
              disabled={scale <= 0.4}
              className="p-1.5 hover:bg-white/10 disabled:opacity-30 rounded-full transition cursor-pointer"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <span className="text-[11px] font-mono text-slate-300 min-w-10 text-center">
              {Math.round(scale * 100)}%
            </span>

            <button
              type="button"
              onClick={zoomIn}
              disabled={scale >= 3.5}
              className="p-1.5 hover:bg-white/10 disabled:opacity-30 rounded-full transition cursor-pointer"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-4 bg-slate-700 mx-0.5 hidden sm:block" />

          {/* Fit Width */}
          <button
            type="button"
            onClick={fitWidth}
            className="hidden sm:inline-flex px-2 py-1 hover:bg-white/10 rounded-md text-[11px] text-slate-300 transition cursor-pointer"
            title="Fit to Width"
          >
            Fit Width
          </button>

          {/* Rotate */}
          <button
            type="button"
            onClick={rotateDoc}
            className="p-1.5 hover:bg-white/10 rounded-full text-slate-300 transition cursor-pointer"
            title="Rotate 90° (R)"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Single / Continuous View Mode */}
          <button
            type="button"
            onClick={() =>
              setViewMode((m) => (m === "single" ? "continuous" : "single"))
            }
            className={`hidden sm:flex p-1.5 rounded-full transition cursor-pointer ${
              viewMode === "continuous"
                ? "bg-blue-600 text-white"
                : "hover:bg-white/10 text-slate-300"
            }`}
            title={
              viewMode === "continuous"
                ? "Switch to Single Page View"
                : "Switch to Continuous Vertical Scroll"
            }
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Print */}
          <button
            type="button"
            onClick={handlePrint}
            className="hidden md:flex p-1.5 hover:bg-white/10 rounded-full text-slate-300 transition cursor-pointer"
            title="Print PDF"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Thumbnails Sidebar */}
        {showThumbnails && numPages > 0 && (
          <aside className="w-48 bg-slate-900/95 border-r border-slate-800 flex flex-col shrink-0 z-20 animate-in slide-in-from-left duration-200">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-semibold">
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
                      ? "bg-blue-600/15 border-blue-500 text-blue-400 shadow-md"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800/60"
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
        <main className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8 relative bg-slate-950">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <div className="text-xs font-medium text-slate-300">
                Rendering PDF vector pages...
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                {fileName}
              </span>
            </div>
          )}

          {error && (
            <div className="p-8 bg-slate-900 border border-rose-500/30 rounded-2xl max-w-md text-center space-y-3 shadow-2xl">
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
              className="flex flex-col items-center justify-start w-full h-full overflow-y-auto py-6 pb-24"
            />
          )}
        </main>
      </div>
    </div>
  );
}

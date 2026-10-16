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
  ChevronDown,
  ChevronUp,
  X,
  Maximize2,
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

const pdfPrintStyles = `
  @media print {
    @page {
      size: auto;
      margin: 0mm;
    }
    header, nav, aside, .no-print, .print-hidden, button {
      display: none !important;
    }
    body, html {
      background: white !important;
      overflow: visible !important;
      height: auto !important;
    }
    main, .pdf-scroll-main {
      overflow: visible !important;
      height: auto !important;
      padding: 0 !important;
      margin: 0 !important;
      background: white !important;
    }
    .pdf-page-card {
      box-shadow: none !important;
      border: none !important;
      border-radius: 0 !important;
      margin: 0 !important;
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
  }
`;

/**
 * Dedicated sub-component that renders an actual miniature visual preview canvas of a PDF page.
 */
function PdfThumbnailItem({
  pdfDoc,
  pageNumber,
  isActive,
  onClick,
}: {
  pdfDoc: PDFDocumentProxy;
  pageNumber: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let renderTask: any = null;

    pdfDoc.getPage(pageNumber).then((page) => {
      if (cancelled || !canvasRef.current) return;
      // Scale 0.18 produces a ~110px wide sharp thumbnail preview
      const viewport = page.getViewport({ scale: 0.22 });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      renderTask = page.render({
        canvasContext: ctx,
        viewport,
      });

      renderTask.promise
        .then(() => {
          if (!cancelled) setRendered(true);
        })
        .catch(() => {});
    });

    return () => {
      cancelled = true;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch {}
      }
    };
  }, [pdfDoc, pageNumber]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full flex flex-col items-center p-2 rounded-xl transition cursor-pointer text-left relative ${
        isActive
          ? "bg-blue-600/15 border-2 border-blue-500 shadow-md shadow-blue-500/10"
          : "bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60"
      }`}
    >
      <div className="w-full flex items-center justify-center bg-white rounded-none overflow-hidden shadow-inner border border-slate-200/50 relative min-h-[140px]">
        <canvas ref={canvasRef} className="max-w-full h-auto block" />
        {!rendered && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800/60 animate-pulse text-slate-400">
            <span className="text-[10px] font-mono">Loading...</span>
          </div>
        )}
      </div>
      <div className="mt-1.5 flex items-center justify-between w-full px-1">
        <span
          className={`text-[11px] font-mono font-medium ${
            isActive
              ? "text-blue-400 font-bold"
              : "text-slate-400 group-hover:text-slate-200"
          }`}
        >
          Page {pageNumber}
        </span>
      </div>
    </button>
  );
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
  const [viewMode, setViewMode] = useState<"single" | "continuous">("continuous");
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const continuousContainerRef = useRef<HTMLDivElement>(null);
  const scrollMainRef = useRef<HTMLDivElement>(null);
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
        if (!isCancelled) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load PDF file",
          );
          setLoading(false);
        }
      }
    };

    void loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [src, blob]);

  // Render a specific page (Single page view mode)
  const renderPage = useCallback(
    async (pageNum: number) => {
      if (!pdfDoc || !canvasRef.current || viewMode !== "single") return;

      try {
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale, rotation });
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) return;

        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform =
          outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

        const renderContext = {
          canvasContext: context,
          viewport,
          transform,
        };

        const task = page.render(renderContext);
        renderTaskRef.current = task;
        await task.promise;
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error("Single page render error:", err);
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

  // Handle continuous render with square corners and crisp edges
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

        // Clean rectangular paper page wrapper with sharp corners
        const pageWrapper = document.createElement("div");
        pageWrapper.className =
          "pdf-page-card relative mb-7 shadow-xl rounded-none bg-white overflow-hidden border border-slate-200/50 transition-shadow";
        pageWrapper.setAttribute("data-page-number", String(i));

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) continue;

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        canvas.style.display = "block";

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

  // Track active page in continuous view mode via scroll listener
  useEffect(() => {
    if (viewMode !== "continuous" || !scrollMainRef.current || !pdfDoc) return;

    let rafId: number | null = null;
    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (!scrollMainRef.current || !continuousContainerRef.current) return;
        const pageCards =
          continuousContainerRef.current.querySelectorAll(".pdf-page-card");
        const containerTop = scrollMainRef.current.getBoundingClientRect().top;

        let closestPage = 1;
        let minDiff = Infinity;

        pageCards.forEach((card) => {
          const rect = card.getBoundingClientRect();
          const diff = Math.abs(rect.top - containerTop - 40);
          if (diff < minDiff) {
            minDiff = diff;
            const p = parseInt(card.getAttribute("data-page-number") || "1", 10);
            closestPage = p;
          }
        });

        setCurrentPage(closestPage);
        setInputPage(String(closestPage));
      });
    };

    const mainEl = scrollMainRef.current;
    mainEl.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      mainEl.removeEventListener("scroll", handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [viewMode, pdfDoc]);

  // Page Controls
  const goToPrev = () => {
    if (currentPage > 1) {
      scrollToPage(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (currentPage < numPages) {
      scrollToPage(currentPage + 1);
    }
  };

  const scrollToPage = (pNum: number) => {
    setCurrentPage(pNum);
    setInputPage(String(pNum));

    if (viewMode === "continuous" && continuousContainerRef.current) {
      const targetCard = continuousContainerRef.current.querySelector(
        `[data-page-number="${pNum}"]`,
      );
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(inputPage, 10);
    if (!isNaN(val) && val >= 1 && val <= numPages) {
      scrollToPage(val);
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
  const resetZoom = () => setScale(1.2);

  // Fit Width
  const fitWidth = () => {
    if (!containerRef.current || !pdfDoc) return;
    const containerWidth =
      containerRef.current.clientWidth - (showThumbnails ? 240 : 64);
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
      if (e.target instanceof HTMLInputElement) return;

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

  // Native Vector PDF Print: Prints ALL pages with zero website header/chrome
  const handlePrint = () => {
    let printUrl = src;
    let createdBlobUrl = false;

    if (blob) {
      printUrl = URL.createObjectURL(blob);
      createdBlobUrl = true;
    }

    if (printUrl) {
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.style.visibility = "hidden";
      iframe.src = printUrl;

      document.body.appendChild(iframe);

      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          window.print();
        }
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
          } catch {}
          if (createdBlobUrl) URL.revokeObjectURL(printUrl);
        }, 60000);
      };
    } else {
      window.print();
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col bg-slate-950 text-slate-100 select-none overflow-hidden relative font-sans"
    >
      <style dangerouslySetInnerHTML={{ __html: pdfPrintStyles }} />

      {/* Modern Glassmorphic Floating Toolbar */}
      {!loading && !error && (
        <div className="no-print print-hidden absolute bottom-6 left-1/2 -translate-x-1/2 z-30 transition-all duration-200">
          {isToolbarCollapsed ? (
            <button
              type="button"
              onClick={() => setIsToolbarCollapsed(false)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 shadow-2xl text-slate-300 hover:text-white text-xs cursor-pointer transition hover:bg-slate-800"
              title="Expand PDF Toolbar"
            >
              <FileText className="w-3.5 h-3.5 text-rose-400" />
              <span className="font-mono text-[11px]">
                {currentPage} / {numPages}
              </span>
              <span className="text-slate-500">•</span>
              <span className="font-mono text-[11px]">
                {Math.round(scale * 100)}%
              </span>
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            </button>
          ) : (
            <div className="flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 shadow-[0_16px_36px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)] text-white text-xs">
              {/* Thumbnails Sidebar Toggle */}
              <button
                type="button"
                onClick={() => setShowThumbnails((v) => !v)}
                className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  showThumbnails
                    ? "bg-blue-600 text-white shadow-sm"
                    : "hover:bg-slate-800 text-slate-300 hover:text-white"
                }`}
                title="Toggle Page Previews Sidebar"
              >
                <Sidebar className="w-4 h-4" />
                <span className="text-[11px] hidden sm:inline font-medium">
                  Pages
                </span>
              </button>

              <div className="w-px h-4 bg-slate-700/60 mx-0.5" />

              {/* Page Navigation Jumper */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={goToPrev}
                  disabled={currentPage <= 1}
                  className="p-1 hover:bg-slate-800 disabled:opacity-30 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                  title="Previous Page (Left Arrow)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <form
                  onSubmit={handlePageInputSubmit}
                  className="flex items-center gap-1 px-1"
                >
                  <input
                    type="text"
                    value={inputPage}
                    onChange={(e) => setInputPage(e.target.value)}
                    onBlur={() => setInputPage(String(currentPage))}
                    className="w-8 text-center py-0.5 bg-slate-800/80 border border-slate-700/80 rounded font-mono text-[11px] text-white focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-slate-400 font-mono text-[11px]">
                    / {numPages || 1}
                  </span>
                </form>

                <button
                  type="button"
                  onClick={goToNext}
                  disabled={currentPage >= numPages}
                  className="p-1 hover:bg-slate-800 disabled:opacity-30 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                  title="Next Page (Right Arrow)"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="w-px h-4 bg-slate-700/60 mx-0.5" />

              {/* Zoom Controls */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={zoomOut}
                  disabled={scale <= 0.4}
                  className="p-1.5 hover:bg-slate-800 disabled:opacity-30 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={resetZoom}
                  className="text-[11px] font-mono text-slate-300 hover:text-blue-400 px-1 py-0.5 rounded min-w-10 text-center transition cursor-pointer"
                  title="Reset to 100%"
                >
                  {Math.round(scale * 100)}%
                </button>

                <button
                  type="button"
                  onClick={zoomIn}
                  disabled={scale >= 3.5}
                  className="p-1.5 hover:bg-slate-800 disabled:opacity-30 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Fit Width */}
              <button
                type="button"
                onClick={fitWidth}
                className="hidden sm:inline-flex items-center gap-1 px-2 py-1 hover:bg-slate-800 rounded-lg text-[11px] text-slate-300 hover:text-white transition cursor-pointer"
                title="Fit to Width"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Fit</span>
              </button>

              {/* Rotate */}
              <button
                type="button"
                onClick={rotateDoc}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                title="Rotate 90° (R)"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              {/* Single / Continuous View Mode Toggle */}
              <button
                type="button"
                onClick={() =>
                  setViewMode((m) => (m === "single" ? "continuous" : "single"))
                }
                className={`hidden sm:flex p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === "continuous"
                    ? "bg-slate-800 text-blue-400"
                    : "hover:bg-slate-800 text-slate-300 hover:text-white"
                }`}
                title={
                  viewMode === "continuous"
                    ? "Continuous Scroll (Active)"
                    : "Single Page Mode (Active)"
                }
              >
                <Layers className="w-3.5 h-3.5" />
              </button>

              <div className="w-px h-4 bg-slate-700/60 mx-0.5" />

              {/* Print Vector PDF */}
              <button
                type="button"
                onClick={handlePrint}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                title="Print Vector PDF (All Pages)"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>

              {/* Collapse toolbar */}
              <button
                type="button"
                onClick={() => setIsToolbarCollapsed(true)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition cursor-pointer"
                title="Minimize Toolbar"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Thumbnails Sidebar with REAL Page Previews */}
        {showThumbnails && numPages > 0 && pdfDoc && (
          <aside className="no-print print-hidden w-52 bg-slate-900/95 border-r border-slate-800 flex flex-col shrink-0 z-20 animate-in slide-in-from-left duration-200 shadow-2xl">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 font-semibold">
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-rose-400" />
                <span>Pages ({numPages})</span>
              </div>
              <button
                type="button"
                onClick={() => setShowThumbnails(false)}
                className="p-1 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition cursor-pointer"
                title="Close Side Panel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {Array.from({ length: numPages }, (_, i) => i + 1).map((pNum) => (
                <PdfThumbnailItem
                  key={pNum}
                  pdfDoc={pdfDoc}
                  pageNumber={pNum}
                  isActive={currentPage === pNum}
                  onClick={() => scrollToPage(pNum)}
                />
              ))}
            </div>
          </aside>
        )}

        {/* Viewport Canvas Area with generous bottom clearance */}
        <main
          ref={scrollMainRef}
          className="pdf-scroll-main flex-1 overflow-y-auto overflow-x-auto flex flex-col items-center justify-start pt-8 pb-44 px-4 sm:px-8 relative bg-slate-950 scroll-smooth will-change-scroll"
        >
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 text-slate-400 my-auto">
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
            <div className="p-8 bg-slate-900 border border-rose-500/30 rounded-2xl max-w-md text-center space-y-3 shadow-2xl my-auto">
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

          {/* Single Page Canvas with square paper corners */}
          {!loading && !error && viewMode === "single" && (
            <div className="flex flex-col items-center justify-start transition-all duration-200">
              <canvas
                ref={canvasRef}
                className="shadow-2xl rounded-none bg-white select-none transition-transform border border-slate-200/50"
              />
            </div>
          )}

          {/* Continuous Scroll Container with square paper corners */}
          {!loading && !error && viewMode === "continuous" && (
            <div
              ref={continuousContainerRef}
              className="flex flex-col items-center justify-start w-full py-2"
            />
          )}
        </main>
      </div>
    </div>
  );
}

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
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800/40 animate-pulse text-slate-400">
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

  // Auto-fit document on small screens (mobile/tablet)
  const computeResponsiveFit = useCallback(() => {
    if (!scrollMainRef.current || !pdfDoc) return;
    const containerWidth = scrollMainRef.current.clientWidth;
    if (!containerWidth) return;

    if (containerWidth < 768) {
      pdfDoc.getPage(1).then((page) => {
        const viewport = page.getViewport({ scale: 1, rotation });
        const fitScale = Math.min(
          Math.max(Math.round(((containerWidth - 24) / viewport.width) * 10) / 10, 0.4),
          1.2,
        );
        setScale(fitScale);
      });
    }
  }, [pdfDoc, rotation]);

  useEffect(() => {
    computeResponsiveFit();
    window.addEventListener("resize", computeResponsiveFit);
    return () => window.removeEventListener("resize", computeResponsiveFit);
  }, [computeResponsiveFit]);

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

          // Initial mobile fit check
          if (typeof window !== "undefined" && window.innerWidth < 768) {
            doc.getPage(1).then((firstPage) => {
              const vp = firstPage.getViewport({ scale: 1 });
              const targetScale = Math.min(
                Math.max(Math.round(((window.innerWidth - 32) / vp.width) * 10) / 10, 0.4),
                1.1,
              );
              setScale(targetScale);
            });
          }

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

  // Handle continuous render with square corners and responsive max-width
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
          "pdf-page-card relative mb-5 sm:mb-7 shadow-xl rounded-none bg-white overflow-hidden border border-slate-200/50 transition-shadow shrink-0";
        pageWrapper.setAttribute("data-page-number", String(i));

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) continue;

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        canvas.style.display = "block";
        canvas.style.maxWidth = "none";


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

    // Auto close drawer on mobile upon selection
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setShowThumbnails(false);
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

  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  // Zoom
  const zoomIn = () =>
    setScale((s) => Math.min(Math.round((s + 0.2) * 10) / 10, 3.5));
  const zoomOut = () =>
    setScale((s) => Math.max(Math.round((s - 0.2) * 10) / 10, 0.35));
  const rotateDoc = () => setRotation((r) => (r + 90) % 360);
  const resetZoom = () => setScale(1.0);

  // Fit Width (Toggles between Fit to Width and 100% original size)
  const fitWidth = () => {
    if (!containerRef.current || !pdfDoc) return;
    const containerWidth =
      containerRef.current.clientWidth - (showThumbnails && window.innerWidth >= 768 ? 240 : 32);
    pdfDoc.getPage(currentPage).then((page) => {
      const defaultViewport = page.getViewport({ scale: 1, rotation });
      const targetScale =
        Math.round(Math.max(0.35, (containerWidth / defaultViewport.width) * 0.95) * 10) / 10;
      // If already fitted, toggle back to 1.0 (100% original size)
      if (Math.abs(scale - targetScale) < 0.05 && Math.abs(scale - 1.0) >= 0.05) {
        setScale(1.0);
      } else {
        setScale(targetScale);
      }
    });
  };

  // Smooth mouse drag panning when zoomed in
  const handlePanMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1.2 || e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, select")) return;

    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: scrollMainRef.current?.scrollLeft || 0,
      scrollTop: scrollMainRef.current?.scrollTop || 0,
    };
  };

  const handlePanMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !scrollMainRef.current) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    scrollMainRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
    scrollMainRef.current.scrollTop = panStartRef.current.scrollTop - dy;
  };

  const handlePanMouseUp = () => {
    setIsPanning(false);
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

      {/* Modern Glassmorphic Floating Toolbar - Fully Responsive */}
      {!loading && !error && (
        <div className="no-print print-hidden absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 transition-all duration-200 max-w-[calc(100vw-1.5rem)]">
          {isToolbarCollapsed ? (
            <button
              type="button"
              onClick={() => setIsToolbarCollapsed(false)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 shadow-2xl text-slate-300 hover:text-white text-xs cursor-pointer transition hover:bg-slate-800"
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
            <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 shadow-[0_16px_36px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)] text-white text-xs">
              {/* Thumbnails Sidebar Toggle (Desktop Only) */}
              <button
                type="button"
                onClick={() => setShowThumbnails((v) => !v)}
                className={`hidden md:inline-flex p-1.5 rounded-lg transition cursor-pointer items-center gap-1 ${
                  showThumbnails
                    ? "bg-blue-600 text-white shadow-sm"
                    : "hover:bg-slate-800 text-slate-300 hover:text-white"
                }`}
                title="Toggle Page Previews Sidebar"
              >
                <Sidebar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-[11px] font-medium">Pages</span>
              </button>

              <div className="hidden md:block w-px h-4 bg-slate-700/60 mx-0.5" />

              {/* Page Navigation Jumper */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={goToPrev}
                  disabled={currentPage <= 1}
                  className="p-1 hover:bg-slate-800 disabled:opacity-30 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                  title="Previous Page (Left Arrow)"
                >
                  <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>

                <form
                  onSubmit={handlePageInputSubmit}
                  className="flex items-center gap-0.5 sm:gap-1 px-0.5 sm:px-1"
                >
                  <input
                    type="text"
                    value={inputPage}
                    onChange={(e) => setInputPage(e.target.value)}
                    onBlur={() => setInputPage(String(currentPage))}
                    className="w-7 sm:w-8 text-center py-0.5 bg-slate-800/80 border border-slate-700/80 rounded font-mono text-[11px] text-white focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-slate-400 font-mono text-[11px]">
                    /{numPages || 1}
                  </span>
                </form>

                <button
                  type="button"
                  onClick={goToNext}
                  disabled={currentPage >= numPages}
                  className="p-1 hover:bg-slate-800 disabled:opacity-30 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                  title="Next Page (Right Arrow)"
                >
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>

              <div className="w-px h-4 bg-slate-700/60 mx-0.5" />

              {/* Zoom Controls */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={zoomOut}
                  disabled={scale <= 0.35}
                  className="p-1.5 hover:bg-slate-800 disabled:opacity-30 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={resetZoom}
                  className="text-[11px] font-mono text-slate-300 hover:text-blue-400 px-1 py-0.5 rounded min-w-9 sm:min-w-10 text-center transition cursor-pointer"
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

              {/* Fit Width (Hidden on extra small screens) */}
              <button
                type="button"
                onClick={fitWidth}
                className="hidden sm:inline-flex items-center gap-1 px-1.5 sm:px-2 py-1 hover:bg-slate-800 rounded-lg text-[11px] text-slate-300 hover:text-white transition cursor-pointer"
                title="Fit to Width"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Fit</span>
              </button>

              {/* Rotate (Hidden on extra small screens) */}
              <button
                type="button"
                onClick={rotateDoc}
                className="hidden sm:inline-flex p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                title="Rotate 90° (R)"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              {/* Single / Continuous View Mode Toggle (Desktop Only) */}
              <button
                type="button"
                onClick={() =>
                  setViewMode((m) => (m === "single" ? "continuous" : "single"))
                }
                className={`hidden md:flex p-1.5 rounded-lg transition cursor-pointer ${
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

              <div className="hidden sm:block w-px h-4 bg-slate-700/60 mx-0.5" />

              {/* Print Vector PDF (Hidden on small mobile) */}
              <button
                type="button"
                onClick={handlePrint}
                className="hidden sm:inline-flex p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                title="Print Vector PDF (All Pages)"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>

              {/* Collapse toolbar */}
              <button
                type="button"
                onClick={() => setIsToolbarCollapsed(true)}
                className="hidden sm:inline-flex p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition cursor-pointer"
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
        {/* Thumbnails Sidebar with REAL Page Previews (Desktop Only with sleek custom scrollbar) */}
        {showThumbnails && numPages > 0 && pdfDoc && (
          <aside className="no-print print-hidden hidden md:flex relative inset-y-0 left-0 z-20 w-52 bg-slate-900/95 border-r border-slate-800 flex-col shrink-0 animate-in slide-in-from-left duration-200 shadow-2xl">
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
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
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

        {/* Viewport Canvas Area with responsive horizontal and bottom clearance */}
        <main
          ref={scrollMainRef}
          onMouseDown={handlePanMouseDown}
          onMouseMove={handlePanMouseMove}
          onMouseUp={handlePanMouseUp}
          onMouseLeave={handlePanMouseUp}
          className={`pdf-scroll-main flex-1 overflow-y-auto overflow-x-auto flex items-start pt-4 sm:pt-8 pb-20 sm:pb-24 px-2 sm:px-4 md:px-8 relative bg-slate-950 will-change-scroll custom-scrollbar ${
            scale > 1.2 ? (isPanning ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
          }`}
        >
          <div className="min-w-full flex flex-col items-center justify-start m-auto py-1 sm:py-2">
            {loading && (
              <div className="flex flex-col items-center justify-center gap-3 text-slate-400 my-auto py-12">
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
              <div className="p-6 sm:p-8 bg-slate-900 border border-rose-500/30 rounded-2xl max-w-md text-center space-y-3 shadow-2xl my-auto m-4">
                <AlertCircle className="w-9 h-9 text-rose-500 mx-auto" />
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
              <div className="flex flex-col items-center justify-start transition-all duration-200 shrink-0">
                <canvas
                  ref={canvasRef}
                  className="shadow-2xl rounded-none bg-white select-none transition-transform border border-slate-200/50 shrink-0"
                />
              </div>
            )}

            {/* Continuous Scroll Container with square paper corners */}
            {!loading && !error && viewMode === "continuous" && (
              <div
                ref={continuousContainerRef}
                className="flex flex-col items-center justify-start py-1 sm:py-2 shrink-0"
              />
            )}
          </div>
        </main>

      </div>
    </div>
  );
}

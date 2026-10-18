"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { renderAsync } from "docx-preview";
import mammoth from "mammoth";
import {
  ZoomIn,
  ZoomOut,
  Printer,
  Download,
  Loader2,
  AlertCircle,
  RotateCcw,
  FileText,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Sidebar,
  X,
} from "lucide-react";

interface DocxPreviewProps {
  src?: string;
  blob?: Blob | null;
  fileName: string;
}

const docxCustomStyles = `
  /* Clean, crisp paper pages with square corners */
  .fuze-docx-view .docx-wrapper {
    background: transparent !important;
    padding: 0 !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    gap: 20px !important;
  }
  @media (min-width: 640px) {
    .fuze-docx-view .docx-wrapper {
      gap: 28px !important;
    }
  }
  .fuze-docx-view .docx-wrapper > section.docx {
    background: #ffffff !important;
    color: #0f172a !important;
    box-shadow: 0 4px 24px -2px rgba(0, 0, 0, 0.45), 0 2px 8px -1px rgba(0, 0, 0, 0.25) !important;
    border-radius: 0 !important; /* Square paper corners */
    margin-bottom: 0 !important;
    position: relative !important;
    box-sizing: border-box !important;
  }
  .fuze-docx-view .docx-wrapper > section.docx img {
    max-width: 100% !important;
    height: auto !important;
  }
  /* Center images and drawings in centered paragraphs */
  .fuze-docx-view .docx-wrapper > section.docx p[style*="text-align: center"],
  .fuze-docx-view .docx-wrapper > section.docx p[style*="text-align:center"],
  .fuze-docx-view .docx-wrapper > section.docx p.docx-align-center,
  .fuze-docx-view .docx-wrapper > section.docx .docx-align-center {
    text-align: center !important;
  }
  .fuze-docx-view .docx-wrapper > section.docx p[style*="text-align: center"] img,
  .fuze-docx-view .docx-wrapper > section.docx p[style*="text-align:center"] img,
  .fuze-docx-view .docx-wrapper > section.docx p[style*="text-align: center"] > div,
  .fuze-docx-view .docx-wrapper > section.docx p[style*="text-align:center"] > div,
  .fuze-docx-view .docx-wrapper > section.docx p[style*="text-align: center"] span > div,
  .fuze-docx-view .docx-wrapper > section.docx p[style*="text-align:center"] span > div {
    display: inline-block !important;
    margin-left: auto !important;
    margin-right: auto !important;
    text-align: center !important;
  }

  /* Full multi-page print rules */
  @media print {
    @page {
      size: auto;
      margin: 15mm;
    }
    header, nav, aside, .no-print, .print-hidden, button {
      display: none !important;
    }
    body, html {
      background: white !important;
      color: black !important;
      overflow: visible !important;
      height: auto !important;
    }
    main, .fuze-docx-view, .docx-mount-point {
      overflow: visible !important;
      height: auto !important;
      padding: 0 !important;
      margin: 0 !important;
      position: static !important;
      transform: none !important;
      background: white !important;
    }
    .fuze-docx-view .docx-wrapper {
      background: white !important;
      padding: 0 !important;
      margin: 0 !important;
      display: block !important;
      gap: 0 !important;
    }
    .fuze-docx-view .docx-wrapper > section.docx {
      box-shadow: none !important;
      border-radius: 0 !important;
      margin: 0 !important;
      padding: 10mm !important;
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      width: 100% !important;
      max-width: 100% !important;
      min-height: auto !important;
    }
  }
`;

/**
 * Intelligent text extractor for legacy binary Word 97-2003 (.doc) files.
 */
function extractBinaryDocText(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let text = "";
  let currentRun = "";

  for (let i = 0; i < bytes.length - 1; i += 2) {
    const code = bytes[i] | (bytes[i + 1] << 8);
    if ((code >= 32 && code <= 126) || code === 10 || code === 13 || (code >= 160 && code <= 8191)) {
      currentRun += String.fromCharCode(code);
    } else {
      if (currentRun.trim().length > 3) {
        text += currentRun.trim() + "\n\n";
      }
      currentRun = "";
    }
  }

  if (text.length < 80) {
    let asciiRun = "";
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      if ((b >= 32 && b <= 126) || b === 10 || b === 13) {
        asciiRun += String.fromCharCode(b);
      } else {
        if (asciiRun.trim().length > 4) {
          text += asciiRun.trim() + "\n\n";
        }
        asciiRun = "";
      }
    }
  }

  return text.trim();
}

/**
 * Sub-component that renders an actual miniature visual preview of a Word document page.
 */
function DocxPageThumbnail({
  sectionHtml,
  pageNumber,
  isActive,
  onClick,
}: {
  sectionHtml: string;
  pageNumber: number;
  isActive: boolean;
  onClick: () => void;
}) {
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
      <div className="w-[124px] h-[165px] bg-white rounded-none overflow-hidden relative shadow-md border border-slate-200/60 pointer-events-none select-none">
        <div
          style={{
            transform: "scale(0.155)",
            transformOrigin: "top left",
            width: "800px",
            height: "1064px",
            overflow: "hidden",
          }}
          className="docx-thumbnail-content p-4 text-[13px] font-serif leading-snug text-slate-800"
          dangerouslySetInnerHTML={{ __html: sectionHtml }}
        />
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

export function DocxPreview({ src, blob, fileName }: DocxPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fallbackContainerRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [docHeight, setDocHeight] = useState<number | null>(null);
  const [pageCount, setPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageHtmls, setPageHtmls] = useState<string[]>([]);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [fallbackHtml, setFallbackHtml] = useState<string | null>(null);
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsToolbarCollapsed(true);
    }
  }, []);

  // Auto-fit document on small screens (mobile/tablet)
  const computeResponsiveFit = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const containerWidth = scrollContainerRef.current.clientWidth;
    if (!containerWidth) return;

    if (containerWidth < 768) {
      const targetDocWidth = 800; // standard A4 pt/px width in docx-preview
      const fitScale = Math.min(
        Math.max(Math.round(((containerWidth - 24) / targetDocWidth) * 100) / 100, 0.35),
        1.0,
      );
      setScale(fitScale);
    } else {
      setScale(1);
    }
  }, []);

  useEffect(() => {
    computeResponsiveFit();
    window.addEventListener("resize", computeResponsiveFit);
    return () => window.removeEventListener("resize", computeResponsiveFit);
  }, [computeResponsiveFit]);

  // Throttled RAF scroll observer for high-performance smooth scrolling
  useEffect(() => {
    if (!containerRef.current || loading || error || fallbackHtml) return;

    const sections = containerRef.current.querySelectorAll("section.docx");
    if (!sections.length) return;

    setPageCount(sections.length);

    let rafId: number | null = null;
    let lastReportedPage = 1;

    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (!scrollContainerRef.current) return;
        const containerTop = scrollContainerRef.current.getBoundingClientRect().top;

        let activeIndex = 0;
        let minDistance = Infinity;

        sections.forEach((sec, idx) => {
          const rect = sec.getBoundingClientRect();
          const dist = Math.abs(rect.top - containerTop - 40);
          if (dist < minDistance) {
            minDistance = dist;
            activeIndex = idx;
          }
        });

        const newPage = activeIndex + 1;
        if (newPage !== lastReportedPage) {
          lastReportedPage = newPage;
          setCurrentPage(newPage);
        }
      });
    };

    const scrollEl = scrollContainerRef.current;
    if (scrollEl) {
      scrollEl.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      if (scrollEl) scrollEl.removeEventListener("scroll", handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [loading, error, fallbackHtml]);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);
    setFallbackHtml(null);
    setPageHtmls([]);

    const loadDocx = async () => {
      try {
        let arrayBuffer: ArrayBuffer;
        if (blob) {
          arrayBuffer = await blob.arrayBuffer();
        } else if (src) {
          const res = await fetch(src, { credentials: "include" });
          if (!res.ok) throw new Error(`HTTP ${res.status} fetching document`);
          arrayBuffer = await res.arrayBuffer();
        } else {
          throw new Error("No document data source provided");
        }

        if (isCancelled) return;

        // Check if file is a zip-based .docx (starts with 'PK' 0x50 0x4B)
        const bytes = new Uint8Array(arrayBuffer.slice(0, 4));
        const isZipFormat = bytes[0] === 0x50 && bytes[1] === 0x4b;

        if (isZipFormat && containerRef.current) {
          containerRef.current.innerHTML = "";
          try {
            await renderAsync(arrayBuffer, containerRef.current, undefined, {
              className: "docx",
              inWrapper: true,
              ignoreWidth: false,
              ignoreHeight: false,
              ignoreFonts: false,
              breakPages: true,
              ignoreLastRenderedPageBreak: false,
              experimental: false,
              trimXmlDeclaration: true,
              useBase64URL: true,
              renderHeaders: true,
              renderFooters: true,
              renderFootnotes: true,
              renderEndnotes: true,
            });

            if (!isCancelled) {
              // Post-processing pass: center images and drawings inside centered paragraphs
              const paragraphs = containerRef.current.querySelectorAll("p");
              paragraphs.forEach((p) => {
                const align = p.style.textAlign || window.getComputedStyle(p).textAlign;
                if (align === "center") {
                  p.style.textAlign = "center";
                  p.querySelectorAll<HTMLElement>("div, img, svg").forEach((el) => {
                    el.style.marginLeft = "auto";
                    el.style.marginRight = "auto";
                    if (el.tagName.toLowerCase() === "img") {
                      el.style.display = "inline-block";
                    }
                  });
                }
              });

              const sections = containerRef.current.querySelectorAll("section.docx");
              const count = sections.length || 1;
              setPageCount(count);

              // Extract actual HTML from each page for high-fidelity sidebar previews
              const htmls: string[] = [];
              sections.forEach((sec) => htmls.push(sec.innerHTML));
              setPageHtmls(htmls);

              const unscaledH = containerRef.current.offsetHeight || containerRef.current.scrollHeight;
              if (unscaledH > 0) {
                setDocHeight(unscaledH);
              }

              computeResponsiveFit();
              setLoading(false);
              return;
            }
          } catch (renderErr) {
            console.warn(
              "docx-preview renderer encountered an issue, trying semantic fallback:",
              renderErr,
            );
          }
        }

        if (isCancelled) return;

        // Try mammoth if it's zip format or as secondary fallback
        if (isZipFormat) {
          try {
            const result = await mammoth.convertToHtml(
              { arrayBuffer },
              {
                convertImage: mammoth.images.imgElement((image) => {
                  return image.read("base64").then((imageBuffer) => {
                    return {
                      src: `data:${image.contentType};base64,${imageBuffer}`,
                    };
                  });
                }),
              },
            );

            if (!isCancelled && result.value) {
              setFallbackHtml(result.value);
              setLoading(false);
              return;
            }
          } catch (mErr) {
            console.warn("Mammoth conversion failed:", mErr);
          }
        }

        if (isCancelled) return;

        // Fallback for legacy binary .doc files (Word 97-2003 OLE format)
        const extractedText = extractBinaryDocText(arrayBuffer);
        if (extractedText && extractedText.length > 20) {
          const htmlParagraphs = extractedText
            .split(/\n\n+/)
            .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
            .join("");
          setFallbackHtml(htmlParagraphs);
          setLoading(false);
          return;
        }

        throw new Error(
          "This Word document uses an unsupported format or is corrupted.",
        );
      } catch (err: unknown) {
        if (!isCancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to render Word document",
          );
          setLoading(false);
        }
      }
    };

    void loadDocx();

    return () => {
      isCancelled = true;
    };
  }, [src, blob, computeResponsiveFit]);

  // Dynamically track rendered unscaled document height to eliminate blank trailing space when scaled
  useEffect(() => {
    if (loading || error) return;
    const target = fallbackHtml ? fallbackContainerRef.current : containerRef.current;
    if (!target) return;

    const updateHeight = () => {
      const h = target.offsetHeight || target.scrollHeight;
      if (h > 0) {
        setDocHeight((prev) => (prev && Math.abs(prev - h) < 2 ? prev : h));
      }
    };

    updateHeight();

    const ro = new ResizeObserver(() => {
      updateHeight();
    });

    ro.observe(target);
    return () => ro.disconnect();
  }, [loading, error, fallbackHtml]);

  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const zoomIn = () => setScale((s) => Math.min(Math.round((s + 0.15) * 100) / 100, 2.5));
  const zoomOut = () => setScale((s) => Math.max(Math.round((s - 0.15) * 100) / 100, 0.35));
  const resetZoom = () => setScale(1);

  const fitWidth = useCallback(() => {
    if (!containerRef.current || !scrollContainerRef.current) return;
    const firstSection = containerRef.current.querySelector(
      "section.docx",
    ) as HTMLElement | null;
    if (firstSection) {
      const containerWidth =
        scrollContainerRef.current.clientWidth - (showThumbnails && window.innerWidth >= 768 ? 240 : 32);
      const sectionWidth = firstSection.offsetWidth || 800;
      if (sectionWidth > 0 && containerWidth > 0) {
        const calculatedScale =
          Math.round((containerWidth / sectionWidth) * 100) / 100;
        const targetFit = Math.min(Math.max(calculatedScale, 0.35), 2.0);
        // If already fitted, toggle back to 100% original size
        if (Math.abs(scale - targetFit) < 0.05 && Math.abs(scale - 1) >= 0.05) {
          setScale(1);
        } else {
          setScale(targetFit);
        }
      }
    } else {
      setScale((s) => (Math.abs(s - 1) < 0.05 ? 1.25 : 1));
    }
  }, [showThumbnails, scale]);

  // Smooth mouse drag panning when zoomed in
  const handlePanMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1.05 || e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, select")) return;

    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: scrollContainerRef.current?.scrollLeft || 0,
      scrollTop: scrollContainerRef.current?.scrollTop || 0,
    };
  };

  const handlePanMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !scrollContainerRef.current) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    scrollContainerRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
    scrollContainerRef.current.scrollTop = panStartRef.current.scrollTop - dy;
  };

  const handlePanMouseUp = () => {
    setIsPanning(false);
  };

  const scrollToPage = (pageNum: number) => {
    if (!containerRef.current) return;
    const sections = containerRef.current.querySelectorAll("section.docx");
    const targetSection = sections[pageNum - 1];
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
      setCurrentPage(pageNum);
      // On mobile, auto-close the drawer when a page is selected
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        setShowThumbnails(false);
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 select-none overflow-hidden relative font-sans">
      {/* Embedded CSS for clean paper layout and full print pagination */}
      <style dangerouslySetInnerHTML={{ __html: docxCustomStyles }} />

      {/* Modern Glassmorphic Floating Toolbar - Fully Responsive */}
      {!loading && !error && (
        <div className="no-print print-hidden absolute bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 left-1/2 -translate-x-1/2 z-30 transition-all duration-200 max-w-[calc(100vw-1.5rem)]">
          {isToolbarCollapsed ? (
            <button
              type="button"
              onClick={() => setIsToolbarCollapsed(false)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 shadow-2xl text-slate-300 hover:text-white text-xs cursor-pointer transition hover:bg-slate-800"
              title="Expand Word Controls"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-mono text-[11px]">
                {currentPage} / {pageCount}
              </span>
              <span className="text-slate-500">•</span>
              <span className="font-mono text-[11px]">
                {Math.round(scale * 100)}%
              </span>
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            </button>
          ) : (
            <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 shadow-[0_16px_36px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)] text-white text-xs">
              {/* Sidebar Thumbnails Toggle Button (Desktop Only) */}
              {pageHtmls.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowThumbnails((v) => !v)}
                  className={`hidden md:inline-flex p-1.5 rounded-lg transition cursor-pointer items-center gap-1 ${
                    showThumbnails
                      ? "bg-blue-600 text-white shadow-sm"
                      : "hover:bg-slate-800 text-slate-300 hover:text-white"
                  }`}
                  title="Toggle Pages Preview Sidebar"
                >
                  <Sidebar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="text-[11px] font-medium">Pages</span>
                </button>
              )}

              {pageHtmls.length > 0 && (
                <div className="hidden md:block w-px h-4 bg-slate-700/60 mx-0.5" />
              )}

              {/* Page Navigation Jumper */}
              {pageCount > 1 && (
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => scrollToPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                    className="p-1 hover:bg-slate-800 disabled:opacity-30 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <span className="text-[11px] font-mono text-slate-300 min-w-9 sm:min-w-10 text-center px-0.5 sm:px-1">
                    {currentPage}/{pageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => scrollToPage(Math.min(pageCount, currentPage + 1))}
                    disabled={currentPage >= pageCount}
                    className="p-1 hover:bg-slate-800 disabled:opacity-30 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                    title="Next Page"
                  >
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              )}

              {pageCount > 1 && (
                <div className="w-px h-4 bg-slate-700/60 mx-0.5" />
              )}

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
                  disabled={scale >= 2.2}
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
                title="Fit Width"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Fit</span>
              </button>

              <div className="hidden sm:block w-px h-4 bg-slate-700/60 mx-0.5" />

              {/* Print All Pages (Hidden on small mobile) */}
              <button
                type="button"
                onClick={() => window.print()}
                className="hidden sm:inline-flex p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                title="Print All Pages"
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
        {/* Thumbnails Sidebar: Desktop Only with sleek custom scrollbar */}
        {showThumbnails && pageHtmls.length > 0 && (
          <aside className="no-print print-hidden hidden md:flex relative inset-y-0 left-0 z-20 w-52 bg-slate-900/95 border-r border-slate-800 flex-col shrink-0 animate-in slide-in-from-left duration-200 shadow-2xl">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 font-semibold">
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Pages ({pageCount})</span>
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
              {pageHtmls.map((html, idx) => (
                <DocxPageThumbnail
                  key={idx}
                  sectionHtml={html}
                  pageNumber={idx + 1}
                  isActive={currentPage === idx + 1}
                  onClick={() => scrollToPage(idx + 1)}
                />
              ))}
            </div>
          </aside>
        )}

        {/* Main Document Scroll Viewport with responsive horizontal and bottom padding */}
        <main
          ref={scrollContainerRef}
          onMouseDown={handlePanMouseDown}
          onMouseMove={handlePanMouseMove}
          onMouseUp={handlePanMouseUp}
          onMouseLeave={handlePanMouseUp}
          className={`flex-1 overflow-y-auto overflow-x-auto flex items-start pt-4 sm:pt-8 pb-20 sm:pb-24 px-2 sm:px-4 md:px-8 bg-slate-950 relative will-change-scroll custom-scrollbar ${
            scale > 1.05 ? (isPanning ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
          }`}
        >
          <div
            className="min-w-full flex flex-col items-center justify-start m-auto transition-all duration-100"
            style={{
              minWidth: scale > 1 ? `${Math.round(scale * 100)}%` : "100%",
            }}
          >
            {loading && (
              <div className="flex flex-col items-center justify-center gap-3 text-slate-400 my-auto py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <div className="text-xs font-medium text-slate-300">
                  Rendering Word document...
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  {fileName}
                </span>
              </div>
            )}

            {error && (
              <div className="p-6 sm:p-8 bg-slate-900 border border-rose-500/30 rounded-2xl max-w-md text-center space-y-3 shadow-2xl my-auto m-4">
                <AlertCircle className="w-9 h-9 text-rose-500 mx-auto" />
                <h4 className="text-sm font-bold text-white">Preview unavailable</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
                {src && (
                  <a
                    href={src}
                    download={fileName}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-md mt-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Document
                  </a>
                )}
              </div>
            )}

            {/* Primary View: Native docx-preview rendering container with square paper edges */}
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "top center",
                marginBottom: docHeight ? `${Math.round(docHeight * (scale - 1))}px` : undefined,
                transition: isPanning ? "none" : "transform 0.12s ease-out",
              }}
              className={`fuze-docx-view flex flex-col items-center select-text ${
                loading || error || fallbackHtml ? "hidden" : "block"
              }`}
            >
              <div ref={containerRef} className="docx-mount-point" />
            </div>

            {/* Fallback View: Crisp paper article with square corners */}
            {!loading && !error && fallbackHtml && (
              <div
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: "top center",
                  marginBottom: docHeight ? `${Math.round(docHeight * (scale - 1))}px` : undefined,
                  transition: isPanning ? "none" : "transform 0.12s ease-out",
                }}
                className="w-full max-w-4xl"
              >
                <article
                  ref={fallbackContainerRef}
                  className="bg-white text-slate-900 rounded-none border border-slate-200/80 shadow-2xl p-4 sm:p-10 md:p-16 min-h-[950px] leading-relaxed font-serif text-[15px] select-text"
                >
                  <div
                    dangerouslySetInnerHTML={{ __html: fallbackHtml }}
                    className="docx-content space-y-4 [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:text-slate-900 [&>h1]:mb-3 [&>h1]:mt-6 [&>h1]:border-b [&>h1]:border-slate-200 [&>h1]:pb-2
                               [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-slate-800 [&>h2]:mb-2 [&>h2]:mt-5
                               [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:text-slate-800 [&>h3]:mb-2 [&>h3]:mt-4
                               [&>p]:text-slate-700 [&>p]:leading-7 [&>p]:mb-3
                               [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-1.5 [&>ul]:text-slate-700
                               [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:space-y-1.5 [&>ol]:text-slate-700
                               [&>table]:w-full [&>table]:border-collapse [&>table]:border [&>table]:border-slate-300 [&>table]:my-4
                               [&_td]:border [&_td]:border-slate-300 [&_td]:p-2.5 [&_td]:text-xs [&_td]:font-sans
                               [&_th]:border [&_th]:border-slate-300 [&_th]:p-2.5 [&_th]:bg-slate-100 [&_th]:text-xs [&_th]:font-semibold [&_th]:font-sans
                               [&_img]:max-h-56 [&_img]:max-w-[280px] [&_img]:h-auto [&_img]:object-contain [&_img]:my-4 [&_img]:mx-auto [&_img]:block
                               [&_a]:text-blue-600 [&_a]:underline"
                  />
                </article>
              </div>
            )}
          </div>
        </main>

      </div>
    </div>
  );
}

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
} from "lucide-react";

interface DocxPreviewProps {
  src?: string;
  blob?: Blob | null;
  fileName: string;
}

const docxCustomStyles = `
  .fuze-docx-view .docx-wrapper {
    background: transparent !important;
    padding: 0 !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    gap: 28px !important;
  }
  .fuze-docx-view .docx-wrapper > section.docx {
    background: #ffffff !important;
    color: #0f172a !important;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.45), 0 8px 10px -6px rgba(0, 0, 0, 0.35) !important;
    border-radius: 4px !important;
    margin-bottom: 0 !important;
    position: relative !important;
    box-sizing: border-box !important;
  }
  .fuze-docx-view .docx-wrapper > section.docx img {
    max-width: 100% !important;
    height: auto !important;
  }
  @media print {
    body {
      background: white !important;
    }
    .fuze-docx-view .docx-wrapper {
      background: white !important;
      padding: 0 !important;
      gap: 0 !important;
    }
    .fuze-docx-view .docx-wrapper > section.docx {
      box-shadow: none !important;
      margin: 0 !important;
      page-break-after: always !important;
      border-radius: 0 !important;
    }
  }
`;

export function DocxPreview({ src, blob, fileName }: DocxPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [fallbackHtml, setFallbackHtml] = useState<string | null>(null);

  // IntersectionObserver to track which page is currently in view
  useEffect(() => {
    if (!containerRef.current || loading || error || fallbackHtml) return;

    const sections = containerRef.current.querySelectorAll("section.docx");
    if (!sections.length) return;

    setPageCount(sections.length);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Array.from(sections).indexOf(entry.target as Element);
            if (index !== -1) {
              setCurrentPage(index + 1);
            }
          }
        }
      },
      {
        root: scrollContainerRef.current,
        threshold: 0.25,
      },
    );

    sections.forEach((sec) => observer.observe(sec));

    return () => {
      observer.disconnect();
    };
  }, [loading, error, fallbackHtml]);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);
    setFallbackHtml(null);

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

        // Step 1: Attempt high-fidelity rendering via docx-preview
        if (containerRef.current) {
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
              const sections = containerRef.current.querySelectorAll("section.docx");
              setPageCount(sections.length || 1);
              setLoading(false);
              return;
            }
          } catch (renderErr) {
            console.warn(
              "docx-preview renderer encountered an issue, falling back to mammoth:",
              renderErr,
            );
          }
        }

        if (isCancelled) return;

        // Step 2: Fallback to mammoth if docx-preview fails
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

        if (!isCancelled) {
          setFallbackHtml(result.value);
          setLoading(false);
        }
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
  }, [src, blob]);

  const zoomIn = () => setScale((s) => Math.min(Math.round((s + 0.15) * 100) / 100, 2.2));
  const zoomOut = () => setScale((s) => Math.max(Math.round((s - 0.15) * 100) / 100, 0.5));
  const resetZoom = () => setScale(1);

  const fitWidth = useCallback(() => {
    if (!containerRef.current || !scrollContainerRef.current) return;
    const firstSection = containerRef.current.querySelector(
      "section.docx",
    ) as HTMLElement | null;
    if (firstSection) {
      const containerWidth = scrollContainerRef.current.clientWidth - 64;
      const sectionWidth = firstSection.offsetWidth;
      if (sectionWidth > 0 && containerWidth > 0) {
        const calculatedScale =
          Math.round((containerWidth / sectionWidth) * 100) / 100;
        setScale(Math.min(Math.max(calculatedScale, 0.5), 2.0));
      }
    } else {
      setScale(1);
    }
  }, []);

  const scrollToPage = (pageNum: number) => {
    if (!containerRef.current) return;
    const sections = containerRef.current.querySelectorAll("section.docx");
    const targetSection = sections[pageNum - 1];
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
      setCurrentPage(pageNum);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 select-none overflow-hidden relative font-sans">
      {/* Embedded CSS for docx-preview styling */}
      <style dangerouslySetInnerHTML={{ __html: docxCustomStyles }} />

      {/* Floating Bottom Control Bar */}
      {!loading && !error && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700/60 shadow-2xl text-white text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px] pr-2 border-r border-slate-700">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>Word Document</span>
            {pageCount > 1 && (
              <span className="text-slate-400 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-full ml-1">
                {pageCount} Pages
              </span>
            )}
          </div>

          {/* Page Navigation Jumper (for multi-page docs) */}
          {pageCount > 1 && (
            <div className="flex items-center gap-1 border-r border-slate-700 pr-2">
              <button
                type="button"
                onClick={() => scrollToPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="p-1 hover:bg-white/10 disabled:opacity-30 rounded-full transition cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono text-slate-300 min-w-12 text-center">
                {currentPage} / {pageCount}
              </span>
              <button
                type="button"
                onClick={() => scrollToPage(Math.min(pageCount, currentPage + 1))}
                disabled={currentPage >= pageCount}
                className="p-1 hover:bg-white/10 disabled:opacity-30 rounded-full transition cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Zoom Controls */}
          <button
            type="button"
            onClick={zoomOut}
            disabled={scale <= 0.5}
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
            disabled={scale >= 2.2}
            className="p-1.5 hover:bg-white/10 disabled:opacity-30 rounded-full transition cursor-pointer"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {scale !== 1 && (
            <button
              type="button"
              onClick={resetZoom}
              className="p-1.5 hover:bg-white/10 rounded-full text-slate-300 transition cursor-pointer"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Fit Width */}
          <button
            type="button"
            onClick={fitWidth}
            className="hidden sm:inline-flex items-center gap-1 px-2 py-1 hover:bg-white/10 rounded-md text-[11px] text-slate-300 transition cursor-pointer"
            title="Fit to Width"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Fit</span>
          </button>

          <div className="w-px h-4 bg-slate-700 mx-0.5" />

          {/* Print */}
          <button
            type="button"
            onClick={() => window.print()}
            className="p-1.5 hover:bg-white/10 rounded-full text-slate-300 transition cursor-pointer"
            title="Print Document"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Document Scroll Viewport */}
      <main
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-auto flex justify-center items-start pt-8 pb-32 px-4 sm:px-8 bg-slate-950 relative scroll-smooth"
      >
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 text-slate-400 my-auto">
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
          <div className="p-8 bg-slate-900 border border-rose-500/30 rounded-2xl max-w-md text-center space-y-3 shadow-2xl my-auto">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
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

        {/* Primary View: Native docx-preview rendering container */}
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            transition: "transform 0.15s ease-out",
          }}
          className={`fuze-docx-view flex flex-col items-center select-text ${
            loading || error || fallbackHtml ? "hidden" : "block"
          }`}
        >
          <div ref={containerRef} className="docx-mount-point" />
        </div>

        {/* Fallback View: Mammoth semantic rendering (if docx-preview had errors) */}
        {!loading && !error && fallbackHtml && (
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top center",
              transition: "transform 0.15s ease-out",
            }}
            className="w-full max-w-4xl"
          >
            <article className="bg-white text-slate-900 rounded-xl shadow-2xl p-8 sm:p-14 md:p-16 min-h-[950px] leading-relaxed font-serif text-[15px] select-text">
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
                           [&_img]:max-h-56 [&_img]:max-w-[280px] [&_img]:h-auto [&_img]:object-contain [&_img]:rounded-lg [&_img]:my-4 [&_img]:mx-auto [&_img]:block
                           [&_a]:text-blue-600 [&_a]:underline"
              />
            </article>
          </div>
        )}
      </main>
    </div>
  );
}

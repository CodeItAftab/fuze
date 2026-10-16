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
    gap: 28px !important;
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
 * Extracts UTF-16LE and ASCII text streams when zip OpenXML fails.
 */
function extractBinaryDocText(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let text = "";
  let currentRun = "";

  // Scan UTF-16LE characters (Word 97-2003 primary document text stream)
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

  // Fallback to ASCII scan if UTF-16LE extracted very little
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

export function DocxPreview({ src, blob, fileName }: DocxPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [fallbackHtml, setFallbackHtml] = useState<string | null>(null);
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);

  // Throttled RAF scroll observer to prevent lag and high-frequency React re-renders
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
              const sections = containerRef.current.querySelectorAll("section.docx");
              setPageCount(sections.length || 1);
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
      {/* Embedded CSS for clean paper layout and full print pagination */}
      <style dangerouslySetInnerHTML={{ __html: docxCustomStyles }} />

      {/* Floating Bottom Control Bar */}
      {!loading && !error && (
        <div className="no-print print-hidden absolute bottom-6 left-1/2 -translate-x-1/2 z-30 transition-all duration-200">
          {isToolbarCollapsed ? (
            <button
              type="button"
              onClick={() => setIsToolbarCollapsed(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/95 backdrop-blur-md border border-slate-700/70 shadow-2xl text-slate-300 hover:text-white text-xs cursor-pointer transition"
              title="Expand Document Controls"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-mono text-[11px]">Controls</span>
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 sm:py-2 rounded-full bg-slate-900/95 backdrop-blur-md border border-slate-700/70 shadow-2xl text-white text-xs">
              <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px] pr-2 border-r border-slate-700">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Word</span>
                {pageCount > 1 && (
                  <span className="text-slate-400 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded ml-1 font-mono">
                    {pageCount}p
                  </span>
                )}
              </div>

              {/* Page Navigation Jumper */}
              {pageCount > 1 && (
                <div className="flex items-center gap-0.5 border-r border-slate-700 pr-1.5">
                  <button
                    type="button"
                    onClick={() => scrollToPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                    className="p-1 hover:bg-white/10 disabled:opacity-30 rounded-full transition cursor-pointer"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono text-slate-300 min-w-10 text-center">
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
                className="p-1 hover:bg-white/10 disabled:opacity-30 rounded-full transition cursor-pointer"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <span className="text-[11px] font-mono text-slate-300 min-w-9 text-center">
                {Math.round(scale * 100)}%
              </span>

              <button
                type="button"
                onClick={zoomIn}
                disabled={scale >= 2.2}
                className="p-1 hover:bg-white/10 disabled:opacity-30 rounded-full transition cursor-pointer"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              {scale !== 1 && (
                <button
                  type="button"
                  onClick={resetZoom}
                  className="p-1 hover:bg-white/10 rounded-full text-slate-300 transition cursor-pointer"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Fit Width */}
              <button
                type="button"
                onClick={fitWidth}
                className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 hover:bg-white/10 rounded text-[11px] text-slate-300 transition cursor-pointer"
                title="Fit Width"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Fit</span>
              </button>

              <div className="w-px h-3.5 bg-slate-700 mx-0.5" />

              {/* Print All Pages */}
              <button
                type="button"
                onClick={() => window.print()}
                className="p-1 hover:bg-white/10 rounded-full text-slate-300 hover:text-white transition cursor-pointer"
                title="Print All Pages"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>

              {/* Collapse button */}
              <button
                type="button"
                onClick={() => setIsToolbarCollapsed(true)}
                className="p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-slate-200 transition cursor-pointer"
                title="Collapse toolbar"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Document Scroll Viewport with ample bottom clearance */}
      <main
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-auto flex justify-center items-start pt-8 pb-44 px-4 sm:px-8 bg-slate-950 relative scroll-smooth will-change-scroll"
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

        {/* Primary View: Native docx-preview rendering container with square paper edges */}
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            transition: "transform 0.12s ease-out",
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
              transition: "transform 0.12s ease-out",
            }}
            className="w-full max-w-4xl"
          >
            <article className="bg-white text-slate-900 rounded-none border border-slate-200/80 shadow-2xl p-8 sm:p-14 md:p-16 min-h-[950px] leading-relaxed font-serif text-[15px] select-text">
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
      </main>
    </div>
  );
}

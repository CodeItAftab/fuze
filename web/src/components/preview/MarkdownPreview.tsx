"use client";

import React, { useState, useMemo, useEffect } from "react";
import { marked } from "marked";
import {
  Copy,
  Check,
  Printer,
  Eye,
  Code,
  BookOpen,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface MarkdownPreviewProps {
  content: string;
  fileName: string;
}

export function MarkdownPreview({ content, fileName }: MarkdownPreviewProps) {
  const [viewMode, setViewMode] = useState<"preview" | "raw">("preview");
  const [copied, setCopied] = useState(false);
  const [scale, setScale] = useState(1);
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

  // Normalize input string: strip BOM (0xFEFF / 0xFFFE) and null bytes
  const cleanContent = useMemo(() => {
    if (!content) return "";
    let s = content;
    if (s.charCodeAt(0) === 0xfeff || s.charCodeAt(0) === 0xfffe) {
      s = s.slice(1);
    }
    if (s.includes("\u0000")) {
      s = s.replace(/\u0000/g, "");
    }
    return s.trim();
  }, [content]);

  // Parse markdown into clean HTML
  const parsedHtml = useMemo(() => {
    try {
      return marked.parse(cleanContent, {
        gfm: true,
        breaks: true,
      }) as string;
    } catch (err) {
      console.error("Markdown parse error:", err);
      return `<p>${cleanContent}</p>`;
    }
  }, [cleanContent]);

  // Word count and reading time
  const stats = useMemo(() => {
    const words = cleanContent.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return { words, minutes };
  }, [cleanContent]);

  const handleCopy = () => {
    void navigator.clipboard.writeText(cleanContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const zoomIn = () => setScale((s) => Math.min(Math.round((s + 0.15) * 100) / 100, 2.0));
  const zoomOut = () => setScale((s) => Math.max(Math.round((s - 0.15) * 100) / 100, 0.6));
  const resetZoom = () => setScale(1);

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 select-none overflow-hidden relative font-sans">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page { margin: 15mm; size: auto; }
          header, nav, aside, .no-print, .print-hidden, button { display: none !important; }
          body, html { background: white !important; color: black !important; overflow: visible !important; height: auto !important; }
          main, .md-print-container {
            overflow: visible !important; height: auto !important; padding: 0 !important; margin: 0 !important; background: white !important;
          }
          .md-article {
            background: white !important; color: black !important; box-shadow: none !important; border: none !important; padding: 0 !important;
          }
          .md-article * {
            color: black !important;
            border-color: #e2e8f0 !important;
          }
        }
      `,
        }}
      />

      {/* Floating Bottom Control Bar - Fully Responsive & Collapsible */}
      <div className="no-print print-hidden absolute bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 left-1/2 -translate-x-1/2 z-30 transition-all duration-200 max-w-[calc(100vw-1.5rem)]">
        {isToolbarCollapsed ? (
          <button
            type="button"
            onClick={() => setIsToolbarCollapsed(false)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 shadow-2xl text-slate-300 hover:text-white text-xs cursor-pointer transition hover:bg-slate-800"
            title="Expand Controls"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-mono text-[11px] font-semibold">MD</span>
            <span className="text-slate-500">•</span>
            <span className="font-mono text-[11px]">{stats.words} words</span>
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          </button>
        ) : (
          <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 shadow-[0_16px_36px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)] text-white text-xs">
            {/* Format Pill */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 font-mono text-[11px] font-semibold shrink-0">
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">MD</span>
            </div>

            <span className="text-[11px] font-mono text-slate-400 px-1 hidden md:inline shrink-0">
              {stats.words} {stats.words === 1 ? "word" : "words"}
            </span>

            <div className="hidden xs:block w-px h-4 bg-slate-700/60 mx-0.5" />

            {/* View Mode Toggle: Preview vs Raw */}
            <div className="flex items-center bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/60 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("preview")}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                  viewMode === "preview"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Preview Mode"
              >
                <Eye className="w-3 h-3" />
                <span className="hidden xs:inline">Preview</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("raw")}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                  viewMode === "raw"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Raw Markdown"
              >
                <Code className="w-3 h-3" />
                <span className="hidden xs:inline">Raw</span>
              </button>
            </div>

            {/* Zoom Controls (Preview mode only, desktop/tablet only) */}
            {viewMode === "preview" && (
              <div className="hidden sm:flex items-center gap-0.5 border-l border-slate-700/60 pl-1.5 shrink-0">
                <button
                  type="button"
                  onClick={zoomOut}
                  disabled={scale <= 0.6}
                  className="p-1.5 hover:bg-slate-800 disabled:opacity-30 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
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
                  disabled={scale >= 2.0}
                  className="p-1.5 hover:bg-slate-800 disabled:opacity-30 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>

                {scale !== 1 && (
                  <button
                    type="button"
                    onClick={resetZoom}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <div className="w-px h-4 bg-slate-700/60 mx-0.5" />

            {/* Copy Button - Always visible, never cut off */}
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition text-xs font-semibold cursor-pointer shadow-xs active:scale-95 shrink-0"
              title="Copy Markdown content"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {/* Print Button (Hidden on small mobile) */}
            <button
              type="button"
              onClick={() => window.print()}
              className="hidden sm:inline-flex p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition cursor-pointer shrink-0"
              title="Print Markdown Document"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>

            {/* Minimize Toolbar Chevron */}
            <button
              type="button"
              onClick={() => setIsToolbarCollapsed(true)}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer ml-0.5 shrink-0"
              title="Minimize toolbar"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Viewport Content Area */}
      <main className="md-print-container flex-1 overflow-y-auto overflow-x-auto flex justify-center items-start pt-6 sm:pt-10 pb-20 sm:pb-24 px-3 sm:px-6 md:px-8 bg-slate-950 relative custom-scrollbar">
        {viewMode === "preview" ? (
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top center",
              transition: "transform 0.12s ease-out",
            }}
            className="w-full max-w-4xl"
          >
            {/* Sleek Dark Markdown Paper */}
            <article className="md-article bg-slate-900/90 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl p-6 sm:p-10 md:p-12 mb-28 sm:mb-36 leading-relaxed text-[15px] select-text">
              <div
                dangerouslySetInnerHTML={{ __html: parsedHtml }}
                className="markdown-body space-y-4 font-sans text-slate-200
                           [&>h1]:text-2xl [&>h1]:sm:text-3xl [&>h1]:font-extrabold [&>h1]:text-white [&>h1]:border-b [&>h1]:border-slate-800 [&>h1]:pb-3 [&>h1]:mb-4 [&>h1]:mt-2 [&>h1]:tracking-tight
                           [&>h2]:text-xl [&>h2]:sm:text-2xl [&>h2]:font-bold [&>h2]:text-slate-100 [&>h2]:border-b [&>h2]:border-slate-800/60 [&>h2]:pb-2 [&>h2]:mb-3 [&>h2]:mt-6
                           [&>h3]:text-lg [&>h3]:sm:text-xl [&>h3]:font-semibold [&>h3]:text-slate-200 [&>h3]:mb-2 [&>h3]:mt-5
                           [&>h4]:text-base [&>h4]:font-semibold [&>h4]:text-slate-200 [&>h4]:mb-2 [&>h4]:mt-4
                           [&>p]:leading-7 [&>p]:text-slate-300 [&>p]:mb-4
                           [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-1.5 [&>ul]:text-slate-300
                           [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:space-y-1.5 [&>ol]:text-slate-300
                           [&>blockquote]:border-l-4 [&>blockquote]:border-blue-500 [&>blockquote]:bg-blue-500/10 [&>blockquote]:pl-4 [&>blockquote]:py-2 [&>blockquote]:italic [&>blockquote]:text-slate-300 [&>blockquote]:my-4 [&>blockquote]:rounded-r-lg
                           [&>table]:w-full [&>table]:border-collapse [&>table]:border [&>table]:border-slate-800 [&>table]:my-5 [&>table]:rounded-xl [&>table]:overflow-hidden
                           [&_td]:border [&_td]:border-slate-800 [&_td]:p-3 [&_td]:text-xs [&_td]:text-slate-300
                           [&_th]:border [&_th]:border-slate-800 [&_th]:p-3 [&_th]:bg-slate-800/90 [&_th]:text-xs [&_th]:font-semibold [&_th]:text-white [&_th]:text-left
                           [&>pre]:bg-slate-950 [&>pre]:text-slate-100 [&>pre]:p-4 [&>pre]:rounded-xl [&>pre]:border [&>pre]:border-slate-800 [&>pre]:overflow-x-auto [&>pre]:font-mono [&>pre]:text-xs [&>pre]:my-4
                           [&_code]:bg-slate-800/80 [&_code]:text-rose-400 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_code]:border [&_code]:border-slate-700/50
                           [&>pre_code]:bg-transparent [&>pre_code]:text-slate-100 [&>pre_code]:p-0 [&>pre_code]:border-none
                           [&_hr]:my-8 [&_hr]:border-slate-800
                           [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:shadow-lg [&_img]:my-4 [&_img]:mx-auto [&_img]:block
                           [&_a]:text-blue-400 [&_a]:underline hover:[&_a]:text-blue-300 transition-colors"
              />
            </article>
          </div>
        ) : (
          <div className="w-full max-w-4xl bg-slate-900/90 border border-slate-800 rounded-2xl p-6 mb-28 sm:mb-36 shadow-2xl font-mono text-xs text-slate-200 select-text overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {cleanContent}
          </div>
        )}
      </main>
    </div>
  );
}

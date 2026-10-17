"use client";

import React, { useState, useMemo } from "react";
import { marked } from "marked";
import {
  FileText,
  Copy,
  Check,
  Printer,
  Eye,
  Code,
  BookOpen,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";

interface MarkdownPreviewProps {
  content: string;
  fileName: string;
}

export function MarkdownPreview({ content, fileName }: MarkdownPreviewProps) {
  const [viewMode, setViewMode] = useState<"preview" | "raw">("preview");
  const [copied, setCopied] = useState(false);
  const [scale, setScale] = useState(1);

  // Parse markdown into clean HTML
  const parsedHtml = useMemo(() => {
    try {
      return marked.parse(content, {
        gfm: true,
        breaks: true,
      }) as string;
    } catch (err) {
      console.error("Markdown parse error:", err);
      return `<p>${content}</p>`;
    }
  }, [content]);

  // Word count and reading time
  const stats = useMemo(() => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return { words, minutes };
  }, [content]);

  const handleCopy = () => {
    void navigator.clipboard.writeText(content);
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
          body, html { background: white !important; overflow: visible !important; height: auto !important; }
          main, .md-print-container {
            overflow: visible !important; height: auto !important; padding: 0 !important; margin: 0 !important; background: white !important;
          }
          .md-article {
            box-shadow: none !important; border: none !important; padding: 0 !important;
          }
        }
      `,
        }}
      />

      {/* Floating Bottom Control Bar */}
      <div className="no-print print-hidden absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-slate-900/95 backdrop-blur-md border border-slate-700/70 shadow-2xl text-white text-xs max-w-[calc(100vw-1.5rem)]">
        <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px] pr-2 border-r border-slate-700">
          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
          <span>Markdown</span>
          <span className="text-slate-400 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded ml-1 font-mono">
            {stats.words} words
          </span>
        </div>

        {/* View Mode Toggle: Preview vs Raw */}
        <div className="flex items-center bg-slate-800/80 p-0.5 rounded-full border border-slate-700">
          <button
            type="button"
            onClick={() => setViewMode("preview")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition cursor-pointer ${
              viewMode === "preview"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Preview</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("raw")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition cursor-pointer ${
              viewMode === "raw"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Code className="w-3 h-3" />
            <span>Raw</span>
          </button>
        </div>

        {/* Zoom Controls (Preview mode only) */}
        {viewMode === "preview" && (
          <div className="flex items-center gap-1 border-l border-slate-700 pl-1.5">
            <button
              type="button"
              onClick={zoomOut}
              disabled={scale <= 0.6}
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
              disabled={scale >= 2.0}
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
          </div>
        )}

        <div className="w-px h-3.5 bg-slate-700 mx-0.5" />

        {/* Copy raw button */}
        <button
          type="button"
          onClick={handleCopy}
          className="p-1 hover:bg-white/10 rounded-full text-slate-300 hover:text-white transition cursor-pointer"
          title="Copy Markdown Content"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Print button */}
        <button
          type="button"
          onClick={() => window.print()}
          className="p-1 hover:bg-white/10 rounded-full text-slate-300 hover:text-white transition cursor-pointer"
          title="Print Markdown Document"
        >
          <Printer className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main View Area with generous bottom clearance */}
      <main className="md-print-container flex-1 overflow-y-auto overflow-x-auto flex justify-center items-start pt-4 sm:pt-8 pb-20 sm:pb-24 px-2 sm:px-4 md:px-8 bg-slate-950 relative scroll-smooth">
        {viewMode === "preview" ? (
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top center",
              transition: "transform 0.12s ease-out",
            }}
            className="w-full max-w-4xl"
          >
            {/* Crisp paper article with square corners */}
            <article className="md-article bg-white text-slate-900 rounded-none border border-slate-200/80 shadow-2xl p-4 sm:p-10 md:p-16 min-h-[950px] leading-relaxed text-[15px] select-text">
              <div
                dangerouslySetInnerHTML={{ __html: parsedHtml }}
                className="markdown-body space-y-4 font-sans text-slate-800
                           [&>h1]:text-3xl [&>h1]:font-extrabold [&>h1]:text-slate-900 [&>h1]:border-b [&>h1]:border-slate-200 [&>h1]:pb-2.5 [&>h1]:mt-8 [&>h1]:mb-4
                           [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-slate-900 [&>h2]:border-b [&>h2]:border-slate-100 [&>h2]:pb-2 [&>h2]:mt-6 [&>h2]:mb-3
                           [&>h3]:text-xl [&>h3]:font-bold [&>h3]:text-slate-800 [&>h3]:mt-5 [&>h3]:mb-2
                           [&>h4]:text-lg [&>h4]:font-semibold [&>h4]:text-slate-800 [&>h4]:mt-4 [&>h4]:mb-2
                           [&>p]:leading-7 [&>p]:text-slate-700 [&>p]:mb-3
                           [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-1.5 [&>ul]:text-slate-700
                           [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:space-y-1.5 [&>ol]:text-slate-700
                           [&>blockquote]:border-l-4 [&>blockquote]:border-blue-500 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-slate-600 [&>blockquote]:my-4
                           [&>table]:w-full [&>table]:border-collapse [&>table]:border [&>table]:border-slate-300 [&>table]:my-5
                           [&_td]:border [&_td]:border-slate-300 [&_td]:p-2.5 [&_td]:text-xs [&_td]:text-slate-700
                           [&_th]:border [&_th]:border-slate-300 [&_th]:p-2.5 [&_th]:bg-slate-100 [&_th]:text-xs [&_th]:font-semibold [&_th]:text-slate-900
                           [&>pre]:bg-slate-900 [&>pre]:text-slate-100 [&>pre]:p-4 [&>pre]:rounded-lg [&>pre]:overflow-x-auto [&>pre]:font-mono [&>pre]:text-xs [&>pre]:my-4
                           [&_code]:bg-slate-100 [&_code]:text-rose-600 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono
                           [&>pre_code]:bg-transparent [&>pre_code]:text-slate-100 [&>pre_code]:p-0
                           [&_hr]:my-8 [&_hr]:border-slate-200
                           [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_img]:my-4 [&_img]:mx-auto
                           [&_a]:text-blue-600 [&_a]:underline hover:[&_a]:text-blue-500"
              />
            </article>
          </div>
        ) : (
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl font-mono text-xs text-slate-200 select-text overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {content}
          </div>
        )}
      </main>
    </div>
  );
}

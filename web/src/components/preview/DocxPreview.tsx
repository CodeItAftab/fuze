"use client";

import React, { useEffect, useState } from "react";
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
} from "lucide-react";

interface DocxPreviewProps {
  src?: string;
  blob?: Blob | null;
  fileName: string;
}

export function DocxPreview({ src, blob, fileName }: DocxPreviewProps) {
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    const parseDocx = async () => {
      try {
        let arrayBuffer: ArrayBuffer;
        if (blob) {
          arrayBuffer = await blob.arrayBuffer();
        } else if (src) {
          const res = await fetch(src, { credentials: "include" });
          if (!res.ok) throw new Error(`HTTP ${res.status} fetching document`);
          arrayBuffer = await res.arrayBuffer();
        } else {
          throw new Error("No document data source");
        }

        if (isCancelled) return;

        // Convert .docx to clean semantic HTML with embedded images
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
          setHtmlContent(result.value);
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

    void parseDocx();

    return () => {
      isCancelled = true;
    };
  }, [src, blob]);

  const zoomIn = () => setScale((s) => Math.min(Math.round((s + 0.15) * 100) / 100, 2.2));
  const zoomOut = () => setScale((s) => Math.max(Math.round((s - 0.15) * 100) / 100, 0.6));
  const resetZoom = () => setScale(1);

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 select-none overflow-hidden relative font-sans">
      {/* Floating Bottom Control Bar */}
      {!loading && !error && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700/60 shadow-2xl text-white text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] pr-2 border-r border-slate-700">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>Word Document</span>
          </div>

          <button
            type="button"
            onClick={zoomOut}
            disabled={scale <= 0.6}
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

          <div className="w-px h-4 bg-slate-700 mx-0.5" />

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

      {/* Main Document View Area */}
      <main className="flex-1 overflow-y-auto overflow-x-auto flex justify-center items-start pt-8 pb-32 px-4 sm:px-8 bg-slate-950 relative">
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 text-slate-400 my-auto">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <div className="text-xs font-medium text-slate-300">
              Formatting document...
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

        {!loading && !error && htmlContent && (
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top center",
              transition: "transform 0.15s ease-out",
            }}
            className="w-full max-w-4xl"
          >
            {/* Clean, authentic document page layout */}
            <article className="bg-white text-slate-900 rounded-xl shadow-2xl p-8 sm:p-14 md:p-16 min-h-[950px] leading-relaxed font-serif text-[15px] select-text">
              <div
                dangerouslySetInnerHTML={{ __html: htmlContent }}
                className="docx-content space-y-4 [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:text-slate-900 [&>h1]:mb-3 [&>h1]:mt-6 [&>h1]:border-b [&>h1]:border-slate-200 [&>h1]:pb-2
                           [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-slate-800 [&>h2]:mb-2 [&>h2]:mt-5
                           [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:text-slate-800 [&>h3]:mb-2 [&>h3]:mt-4
                           [&>p]:text-slate-700 [&>p]:leading-7 [&>p]:mb-3
                           [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-1.5 [&>ul]:text-slate-700
                           [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:space-y-1.5 [&>ol]:text-slate-700
                           [&>table]:w-full [&>table]:border-collapse [&>table]:border [&>table]:border-slate-300 [&>table]:my-4
                           [&_td]:border [&_td]:border-slate-300 [&_td]:p-2.5 [&_td]:text-xs [&_td]:font-sans
                           [&_th]:border [&_th]:border-slate-300 [&_th]:p-2.5 [&_th]:bg-slate-100 [&_th]:text-xs [&_th]:font-semibold [&_th]:font-sans
                           [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-4 [&_img]:mx-auto
                           [&_a]:text-blue-600 [&_a]:underline"
              />
            </article>
          </div>
        )}
      </main>
    </div>
  );
}

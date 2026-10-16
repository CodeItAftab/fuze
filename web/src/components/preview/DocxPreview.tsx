"use client";

import React, { useEffect, useRef, useState } from "react";
import { renderAsync } from "docx-preview";
import {
  ZoomIn,
  ZoomOut,
  Printer,
  Download,
  Loader2,
  AlertCircle,
  FileText,
  RotateCcw,
} from "lucide-react";

interface DocxPreviewProps {
  src?: string;
  blob?: Blob | null;
  fileName: string;
}

export function DocxPreview({ src, blob, fileName }: DocxPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    const renderDocx = async () => {
      try {
        let docData: Blob;
        if (blob) {
          docData = blob;
        } else if (src) {
          const res = await fetch(src, { credentials: "include" });
          if (!res.ok) throw new Error(`HTTP ${res.status} fetching document`);
          docData = await res.blob();
        } else {
          throw new Error("No document source provided");
        }

        if (isCancelled || !containerRef.current) return;

        containerRef.current.innerHTML = "";

        await renderAsync(docData, containerRef.current, undefined, {
          className: "docx-document",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
        });

        if (!isCancelled) {
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

    void renderDocx();

    return () => {
      isCancelled = true;
    };
  }, [src, blob]);

  const zoomIn = () => setScale((s) => Math.min(s + 0.15, 2.5));
  const zoomOut = () => setScale((s) => Math.max(s - 0.15, 0.5));
  const resetZoom = () => setScale(1);

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 text-slate-100 select-none overflow-hidden relative font-sans">
      {/* Toolbar */}
      <header className="h-12 px-4 bg-slate-950/90 border-b border-slate-800 backdrop-blur-md flex items-center justify-between z-20 shrink-0 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <FileText className="w-4 h-4 text-blue-400" />
          <span className="font-semibold truncate max-w-xs">{fileName}</span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            DOCX
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={zoomOut}
            disabled={scale <= 0.5 || loading}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded-lg text-slate-300 hover:text-white transition cursor-pointer border border-slate-800"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="text-[11px] font-mono text-slate-300 min-w-12 text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            type="button"
            onClick={zoomIn}
            disabled={scale >= 2.5 || loading}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded-lg text-slate-300 hover:text-white transition cursor-pointer border border-slate-800"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {scale !== 1 && (
            <button
              type="button"
              onClick={resetZoom}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition cursor-pointer border border-slate-800"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <div className="h-4 w-px bg-slate-800 mx-1" />

          <button
            type="button"
            onClick={() => window.print()}
            disabled={loading}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition cursor-pointer border border-slate-800"
            title="Print Document"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center bg-slate-900/90 relative">
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 text-slate-400 absolute inset-0">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <div className="text-xs font-medium text-slate-300">
              Formatting Word document...
            </div>
          </div>
        )}

        {error && (
          <div className="p-8 bg-slate-950 border border-rose-500/30 rounded-2xl max-w-md text-center space-y-3 shadow-2xl m-auto">
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

        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            transition: "transform 0.15s ease-out",
          }}
          className={`docx-preview-wrapper ${loading ? "opacity-0" : "opacity-100 transition-opacity duration-300"}`}
        >
          <div
            ref={containerRef}
            className="bg-white text-slate-900 rounded-lg shadow-2xl p-8 sm:p-12 min-h-[800px] max-w-[900px] prose prose-slate"
          />
        </div>
      </main>
    </div>
  );
}

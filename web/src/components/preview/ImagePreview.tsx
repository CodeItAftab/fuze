import { useState } from "react";
import { ZoomIn, ZoomOut, RotateCw } from "lucide-react";

interface ImagePreviewProps {
  src: string;
  fileName: string;
}

export function ImagePreview({ src, fileName }: ImagePreviewProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden p-4">
      {/* Zoom / Rotate Controls Bar */}
      <div className="absolute bottom-6 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white shadow-lg border border-slate-700/60">
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 0.5}
          className="p-1.5 hover:bg-white/10 rounded-full transition disabled:opacity-40 cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="text-xs font-mono font-medium px-1 min-w-10 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          disabled={zoom >= 3}
          className="p-1.5 hover:bg-white/10 rounded-full transition disabled:opacity-40 cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <div className="w-px h-4 bg-slate-700 mx-1" />
        <button
          onClick={handleRotate}
          className="p-1.5 hover:bg-white/10 rounded-full transition cursor-pointer"
          title="Rotate 90°"
        >
          <RotateCw className="h-4 w-4" />
        </button>
        {(zoom !== 1 || rotation !== 0) && (
          <button
            onClick={handleReset}
            className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 px-2 py-0.5 rounded-md hover:bg-white/10 transition cursor-pointer ml-1"
          >
            Reset
          </button>
        )}
      </div>

      <div className="max-w-full max-h-full flex items-center justify-center transition-transform duration-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={fileName}
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transition: "transform 0.2s ease-out",
          }}
          className="max-h-[75vh] max-w-[85vw] object-contain rounded-lg shadow-md select-none"
        />
      </div>
    </div>
  );
}

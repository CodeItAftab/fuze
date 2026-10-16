"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Maximize2,
  RefreshCw,
  Move,
} from "lucide-react";

interface ImagePreviewProps {
  src: string;
  fileName: string;
}

export function ImagePreview({ src, fileName }: ImagePreviewProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  // Pan offsets
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((z) => Math.min(Math.round((z + 0.25) * 100) / 100, 4));
  const handleZoomOut = () => setZoom((z) => Math.max(Math.round((z - 0.25) * 100) / 100, 0.25));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleRotateLeft = () => setRotation((r) => (r - 90 + 360) % 360);
  const handleFlipH = () => setFlipH((f) => !f);
  const handleFlipV = () => setFlipV((f) => !f);

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setPosition({ x: 0, y: 0 });
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Pan drag handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`relative w-full h-full flex flex-col items-center justify-center overflow-hidden p-4 select-none ${
        zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
      }`}
    >
      {/* Zoom / Rotate Floating Toolbar */}
      <div className="absolute bottom-6 z-20 flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md text-white shadow-2xl border border-slate-800">
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={zoom <= 0.25}
          className="p-1.5 hover:bg-white/10 rounded-full transition disabled:opacity-40 cursor-pointer"
          title="Zoom Out (-)"
        >
          <ZoomOut className="h-4 w-4" />
        </button>

        <span className="text-xs font-mono font-medium px-1.5 min-w-12 text-center">
          {Math.round(zoom * 100)}%
        </span>

        <button
          type="button"
          onClick={handleZoomIn}
          disabled={zoom >= 4}
          className="p-1.5 hover:bg-white/10 rounded-full transition disabled:opacity-40 cursor-pointer"
          title="Zoom In (+)"
        >
          <ZoomIn className="h-4 w-4" />
        </button>

        <div className="w-px h-4 bg-slate-700 mx-1" />

        <button
          type="button"
          onClick={handleRotateLeft}
          className="p-1.5 hover:bg-white/10 rounded-full transition cursor-pointer"
          title="Rotate 90° Left"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={handleRotate}
          className="p-1.5 hover:bg-white/10 rounded-full transition cursor-pointer"
          title="Rotate 90° Right"
        >
          <RotateCw className="h-4 w-4" />
        </button>

        <div className="w-px h-4 bg-slate-700 mx-1 hidden sm:block" />

        <button
          type="button"
          onClick={handleFlipH}
          className={`hidden sm:flex p-1.5 hover:bg-white/10 rounded-full transition cursor-pointer ${
            flipH ? "text-blue-400 bg-white/10" : ""
          }`}
          title="Flip Horizontal"
        >
          <FlipHorizontal className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={handleFlipV}
          className={`hidden sm:flex p-1.5 hover:bg-white/10 rounded-full transition cursor-pointer ${
            flipV ? "text-blue-400 bg-white/10" : ""
          }`}
          title="Flip Vertical"
        >
          <FlipVertical className="h-4 w-4" />
        </button>

        {(zoom !== 1 || rotation !== 0 || flipH || flipV || position.x !== 0 || position.y !== 0) && (
          <>
            <div className="w-px h-4 bg-slate-700 mx-1" />
            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 px-2 py-0.5 rounded-md hover:bg-white/10 transition cursor-pointer"
              title="Reset View"
            >
              Reset
            </button>
          </>
        )}
      </div>

      {/* Main Image Container */}
      <div
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg) scaleX(${
            flipH ? -1 : 1
          }) scaleY(${flipV ? -1 : 1})`,
          transition: isDragging ? "none" : "transform 0.15s ease-out",
        }}
        className="max-w-full max-h-full flex items-center justify-center will-change-transform"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={fileName}
          draggable={false}
          className="max-h-[75vh] max-w-[85vw] object-contain rounded-xl shadow-2xl select-none"
        />
      </div>
    </div>
  );
}

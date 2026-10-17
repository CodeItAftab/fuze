"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  RotateCcw,
  RefreshCw,
} from "lucide-react";

interface ImagePreviewProps {
  src: string;
  fileName: string;
}

export function ImagePreview({ src, fileName }: ImagePreviewProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Pan offsets
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Touch tracking for pinch-to-zoom on mobile
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef(1);

  const clampZoom = (z: number) => {
    return Math.min(Math.max(Math.round(z * 100) / 100, 0.5), 4);
  };

  /**
   * Clamps panning offsets so the image cannot be dragged out of viewport view.
   */
  const clampPosition = useCallback(
    (pos: { x: number; y: number }, currentZoom: number) => {
      if (!containerRef.current || !imgRef.current) return { x: 0, y: 0 };
      if (currentZoom <= 1.02) return { x: 0, y: 0 };

      const containerW = containerRef.current.clientWidth;
      const containerH = containerRef.current.clientHeight;
      const imgW = imgRef.current.offsetWidth || 400;
      const imgH = imgRef.current.offsetHeight || 300;

      const isPerpendicular = rotation === 90 || rotation === 270;
      const effectiveImgW = isPerpendicular ? imgH : imgW;
      const effectiveImgH = isPerpendicular ? imgW : imgH;

      const scaledW = effectiveImgW * currentZoom;
      const scaledH = effectiveImgH * currentZoom;

      const maxOffsetX = Math.max(0, (scaledW - containerW) / 2 + 50);
      const maxOffsetY = Math.max(0, (scaledH - containerH) / 2 + 50);

      return {
        x: Math.min(Math.max(pos.x, -maxOffsetX), maxOffsetX),
        y: Math.min(Math.max(pos.y, -maxOffsetY), maxOffsetY),
      };
    },
    [rotation]
  );

  const handleZoomIn = () => {
    setZoom((z) => {
      const next = clampZoom(z * 1.25);
      setPosition((pos) => clampPosition(pos, next));
      return next;
    });
  };

  const handleZoomOut = () => {
    setZoom((z) => {
      const next = clampZoom(z / 1.25);
      if (next <= 1.02) {
        setPosition({ x: 0, y: 0 });
      } else {
        setPosition((pos) => clampPosition(pos, next));
      }
      return next;
    });
  };

  const handleRotate = () => {
    setRotation((r) => {
      const nextR = (r + 90) % 360;
      setPosition({ x: 0, y: 0 });
      return nextR;
    });
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  // Double-click to toggle fit vs 200% zoom
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (zoom > 1.05) {
      handleReset();
    } else {
      setZoom(2);
      setPosition({ x: 0, y: 0 });
    }
  };

  // Smooth mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom((prev) => {
      const next = clampZoom(prev * factor);
      if (next <= 1.02) {
        setPosition({ x: 0, y: 0 });
      } else {
        setPosition((pos) => clampPosition(pos, next));
      }
      return next;
    });
  };

  // Mouse pan drag handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1.02) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const nextPos = {
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    };
    setPosition(clampPosition(nextPos, zoom));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch gestures for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && zoom > 1.02) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      };
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      touchStartZoomRef.current = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging && zoom > 1.02) {
      const nextPos = {
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y,
      };
      setPosition(clampPosition(nextPos, zoom));
    } else if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scaleDelta = dist / touchStartDistRef.current;
      const nextZoom = clampZoom(touchStartZoomRef.current * scaleDelta);
      setZoom(nextZoom);
      setPosition((pos) => clampPosition(pos, nextZoom));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartDistRef.current = null;
  };

  const isTransformed = zoom !== 1 || rotation !== 0 || position.x !== 0 || position.y !== 0;

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full h-full flex flex-col items-center justify-center overflow-hidden select-none bg-slate-950 ${
        zoom > 1.02 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
      }`}
    >
      {/* Floating Bottom Toolbar - Sleek Ergonomic Pill */}
      <div className="absolute bottom-6 z-20 flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-xl text-white shadow-[0_16px_36px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.08)] border border-slate-700/60 text-xs">
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={zoom <= 0.5}
          className="p-1.5 hover:bg-slate-800 rounded-full transition disabled:opacity-30 cursor-pointer text-slate-300 hover:text-white"
          title="Zoom Out (-)"
        >
          <ZoomOut className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer min-w-12 text-center"
          title="Reset to Fit"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          type="button"
          onClick={handleZoomIn}
          disabled={zoom >= 4}
          className="p-1.5 hover:bg-slate-800 rounded-full transition disabled:opacity-30 cursor-pointer text-slate-300 hover:text-white"
          title="Zoom In (+)"
        >
          <ZoomIn className="h-4 w-4" />
        </button>

        <div className="w-px h-4 bg-slate-700/60 mx-0.5" />

        <button
          type="button"
          onClick={handleRotate}
          className="p-1.5 hover:bg-slate-800 rounded-full transition cursor-pointer text-slate-300 hover:text-white"
          title="Rotate 90° Clockwise"
        >
          <RotateCw className="h-4 w-4" />
        </button>

        {isTransformed && (
          <>
            <div className="w-px h-4 bg-slate-700/60 mx-0.5" />
            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] font-medium text-blue-400 hover:text-blue-300 px-2 py-1 rounded-full hover:bg-slate-800 transition cursor-pointer"
              title="Reset View"
            >
              Fit
            </button>
          </>
        )}
      </div>

      {/* Main Image Canvas Viewport with dedicated bottom clearance to prevent collision */}
      <div
        className="w-full h-full flex items-center justify-center pt-4 pb-24 sm:pb-28 px-4 overflow-hidden pointer-events-none"
      >
        <div
          onDoubleClick={handleDoubleClick}
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${zoom}) rotate(${rotation}deg)`,
            transition: isDragging ? "none" : "transform 0.15s cubic-bezier(0.2, 0, 0, 1)",
          }}
          className="max-w-full max-h-full flex items-center justify-center will-change-transform pointer-events-auto"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={src}
            alt={fileName}
            draggable={false}
            className="max-h-[calc(100vh-160px)] max-w-[90vw] object-contain rounded-none shadow-xl select-none"
          />
        </div>
      </div>
    </div>
  );
}



"use client";

import React from "react";

interface VideoPreviewProps {
  src: string;
  mimeType?: string;
}

export function VideoPreview({ src, mimeType }: VideoPreviewProps) {
  return (
    <div className="w-full h-full flex items-center justify-center p-4 sm:p-8 bg-black/90 select-none">
      <video
        src={src}
        controls
        controlsList="nodownload"
        crossOrigin="use-credentials"
        onContextMenu={(e) => e.preventDefault()}
        playsInline
        className="max-h-[82vh] max-w-[90vw] rounded-2xl shadow-2xl bg-black outline-none"
      >
        <source src={src} type={mimeType || "video/mp4"} />
        Your browser does not support HTML5 video playback.
      </video>
    </div>
  );
}

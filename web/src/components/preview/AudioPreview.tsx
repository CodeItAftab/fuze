"use client";

import React from "react";
import { Music } from "lucide-react";

interface AudioPreviewProps {
  src: string;
  fileName: string;
  mimeType?: string;
}

export function AudioPreview({ src, fileName, mimeType }: AudioPreviewProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center select-none font-sans">
      <div className="h-32 w-32 rounded-3xl bg-linear-to-tr from-purple-600 via-indigo-600 to-blue-600 text-white flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/25">
        <Music className="h-16 w-16" />
      </div>

      <h3 className="text-base sm:text-lg font-bold text-white max-w-md truncate mb-1">
        {fileName}
      </h3>
      <p className="text-xs text-slate-400 mb-6 font-mono">
        {mimeType || "audio/mpeg"}
      </p>

      <audio
        src={src}
        controls
        controlsList="nodownload"
        crossOrigin="use-credentials"
        onContextMenu={(e) => e.preventDefault()}
        className="w-full max-w-md shadow-2xl rounded-full outline-none"
      >
        Your browser does not support audio playback.
      </audio>
    </div>
  );
}

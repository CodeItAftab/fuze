"use client";

import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

interface VideoPreviewProps {
  src: string;
  fileName?: string;
  mimeType?: string;
  onRetry?: () => void;
}

function resolveVideoMime(fileName?: string, mimeType?: string): string {
  if (mimeType && mimeType.startsWith("video/") && mimeType !== "video/mp4") {
    return mimeType;
  }
  const ext = fileName?.split(".").pop()?.toLowerCase() || "";
  switch (ext) {
    case "webm":
      return "video/webm";
    case "ogg":
    case "ogv":
      return "video/ogg";
    case "mov":
      return "video/quicktime";
    case "mkv":
      return "video/x-matroska";
    default:
      return "video/mp4";
  }
}

export function VideoPreview({
  src,
  fileName,
  mimeType,
  onRetry,
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const effectiveMime = resolveVideoMime(fileName, mimeType);

  useEffect(() => {
    setHasError(false);
    setErrorMessage(null);
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [src]);

  const handleError = () => {
    const mediaError = videoRef.current?.error;
    let msg = "Failed to load video stream.";
    if (mediaError) {
      switch (mediaError.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          msg = "Video playback aborted by user.";
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          msg = "Network connection interrupted while streaming.";
          break;
        case MediaError.MEDIA_ERR_DECODE:
          msg = "Video format could not be decoded by the browser.";
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          msg = "Video format or source location not supported.";
          break;
      }
    }
    setErrorMessage(msg);
    setHasError(true);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-8 bg-black/90 select-none">
      {hasError ? (
        <div className="flex flex-col items-center justify-center gap-3 p-6 bg-slate-900 border border-slate-800 rounded-2xl max-w-md text-center text-white">
          <AlertCircle className="w-10 h-10 text-amber-400" />
          <h4 className="text-sm font-semibold">Video Streaming Interrupted</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            {errorMessage || "The browser could not complete the video stream directly from cloud storage."}
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={() => {
                setHasError(false);
                onRetry();
              }}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reload Video
            </button>
          )}
        </div>
      ) : (
        <video
          ref={videoRef}
          controls
          controlsList="nodownload"
          playsInline
          preload="metadata"
          onContextMenu={(e) => e.preventDefault()}
          onError={handleError}
          className="max-h-[82vh] max-w-[90vw] rounded-xl shadow-2xl bg-black outline-none"
        >
          <source src={src} type={effectiveMime} />
          Your browser does not support HTML5 video playback.
        </video>
      )}
    </div>
  );
}

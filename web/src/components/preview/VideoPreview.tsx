import { useState, useRef } from "react";

interface VideoPreviewProps {
  src: string;
  mimeType?: string;
}

export function VideoPreview({ src, mimeType }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playbackRate, setPlaybackRate] = useState(1);

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
      {/* Speed Selector Badge */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/60 text-xs text-white">
        <span className="text-[10px] text-slate-400 font-medium">Speed:</span>
        {[1, 1.25, 1.5, 2].map((r) => (
          <button
            key={r}
            onClick={() => handleRateChange(r)}
            className={`px-1.5 py-0.5 rounded text-[11px] font-mono cursor-pointer transition ${
              playbackRate === r
                ? "bg-blue-600 text-white font-bold"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            {r}x
          </button>
        ))}
      </div>

      <video
        ref={videoRef}
        controls
        playsInline
        className="max-h-[75vh] max-w-[85vw] rounded-xl shadow-2xl bg-black"
      >
        <source src={src} type={mimeType || "video/mp4"} />
        Your browser does not support HTML5 video playback.
      </video>
    </div>
  );
}

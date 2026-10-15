import { Music } from "lucide-react";

interface AudioPreviewProps {
  src: string;
  fileName: string;
  mimeType?: string;
}

export function AudioPreview({ src, fileName, mimeType }: AudioPreviewProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
      <div className="h-28 w-28 rounded-3xl bg-linear-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20">
        <Music className="h-14 w-14" />
      </div>

      <h3 className="text-base sm:text-lg font-bold text-slate-900 max-w-md truncate mb-2">
        {fileName}
      </h3>
      <p className="text-xs text-slate-400 mb-6 font-mono">
        {mimeType || "audio/mpeg"}
      </p>

      <audio controls className="w-full max-w-md shadow-md rounded-full">
        <source src={src} type={mimeType || "audio/mpeg"} />
        Your browser does not support audio playback.
      </audio>
    </div>
  );
}

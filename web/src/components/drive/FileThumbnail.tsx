import { useState } from "react";
import { VfsItem } from "@/stores/drive.store";
import {
  FileText,
  Play,
  Music,
  Archive,
  Image as ImageIcon,
} from "lucide-react";

export const FOLDER_COLOR_PALETTES = [
  { icon: "text-amber-500 fill-amber-100" },
  { icon: "text-blue-500 fill-blue-100" },
  { icon: "text-slate-400 fill-slate-100" },
  { icon: "text-emerald-500 fill-emerald-100" },
  { icon: "text-indigo-500 fill-indigo-100" },
  { icon: "text-rose-500 fill-rose-100" },
];

export function getFolderPalette(idOrName: string) {
  let hash = 0;
  for (let i = 0; i < idOrName.length; i++) {
    hash = (hash << 5) - hash + idOrName.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % FOLDER_COLOR_PALETTES.length;
  return FOLDER_COLOR_PALETTES[index];
}

export function getProviderBadgeStyle(badge: string | null | undefined) {
  if (!badge) {
    return "bg-slate-50 text-slate-700 border border-slate-200/80";
  }
  if (badge.includes("Google Drive")) {
    return "bg-amber-50 text-amber-700 border border-amber-200/80";
  }
  if (badge.includes("Multi-Cloud")) {
    return "bg-blue-50 text-blue-700 border border-blue-200/80";
  }
  if (badge.includes("Dropbox")) {
    return "bg-indigo-50 text-indigo-700 border border-indigo-200/80";
  }
  if (badge.includes("pCloud")) {
    return "bg-cyan-50 text-cyan-700 border border-cyan-200/80";
  }
  if (badge.includes("OneDrive")) {
    return "bg-sky-50 text-sky-700 border border-sky-200/80";
  }
  if (badge.includes("Box")) {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200/80";
  }
  return "bg-slate-50 text-slate-700 border border-slate-200/80";
}

interface FileThumbnailProps {
  file: VfsItem;
  badge?: string;
}

export function FileThumbnail({ file }: FileThumbnailProps) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const name = file.name.toLowerCase();
  const ext = (file.name.split(".").pop() || "file").toUpperCase();
  const mime = (file.mimeType || "").toLowerCase();

  const isImage =
    mime.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp|gif|svg|avif|bmp)$/i.test(name);
  const isVideo =
    mime.startsWith("video/") ||
    /\.(mp4|mkv|webm|mov|m4v)$/i.test(name);
  const isPdf = mime.includes("pdf") || name.endsWith(".pdf");
  const isSpreadsheet = /\.(xlsx|xls|csv|tsv)$/i.test(name);
  const isDoc = /\.(docx|doc|txt|rtf|odt)$/i.test(name);
  const isCode = /\.(ts|tsx|js|jsx|json|py|html|css|sql|sh|yaml|yml)$/i.test(name);
  const isAudio = mime.startsWith("audio/") || /\.(mp3|wav|ogg|flac|m4a)$/i.test(name);
  const isArchive = /\.(zip|tar|gz|rar|7z)$/i.test(name);

  const [imgError, setImgError] = useState(false);
  const [vidError, setVidError] = useState(false);
  const [docError, setDocError] = useState(false);
  const isDocument =
    isPdf || isDoc || isSpreadsheet || /\.(pptx|ppt|key|odp|rtf)$/i.test(name);

  const CornerBadges = () => (
    <>
      <span className="absolute bottom-2 right-2 text-[9px] font-bold uppercase bg-slate-900/75 text-white px-1.5 py-0.5 rounded backdrop-blur-xs select-none shadow-xs pointer-events-none">
        {ext}
      </span>
    </>
  );

  if (isImage && !imgError) {
    return (
      <div className="w-full h-full bg-slate-50 rounded-lg flex items-center justify-center relative overflow-hidden group/thumb">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${apiUrl}/files/${file.id}/thumbnail?size=large`}
          alt={file.name}
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <CornerBadges />
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden group-hover:bg-slate-800 transition">
        {!vidError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${apiUrl}/files/${file.id}/thumbnail?size=large`}
            alt={file.name}
            loading="lazy"
            decoding="async"
            onError={() => setVidError(true)}
            className="w-full h-full object-cover opacity-85 transition-transform duration-300 group-hover:scale-105"
          />
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
          <div className="w-10 h-10 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-md transition-transform group-hover:scale-110">
            <Play className="w-4 h-4 fill-slate-900 ml-0.5" />
          </div>
        </div>
        <CornerBadges />
      </div>
    );
  }

  if (isDocument && !docError) {
    return (
      <div className="w-full h-full bg-slate-50/50 rounded-lg flex items-center justify-center relative overflow-hidden group-hover:bg-slate-50 transition p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${apiUrl}/files/${file.id}/thumbnail?size=large`}
          alt={file.name}
          loading="lazy"
          decoding="async"
          onError={() => setDocError(true)}
          className="max-w-full max-h-full object-contain rounded-xs shadow-xs border border-slate-200/60 bg-white transition-transform duration-300 group-hover:scale-105"
        />
        <CornerBadges />
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="w-full h-full bg-rose-50/50 rounded-lg flex items-center justify-center relative overflow-hidden p-3 group-hover:bg-rose-50/80 transition">
        <div className="w-24 h-28 bg-white rounded-lg shadow-2xs border border-rose-200/80 flex flex-col items-center justify-between p-2.5 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xs">
          <div className="w-full flex items-center justify-between">
            <span className="text-[9px] font-bold text-rose-600 tracking-wider">PDF</span>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
          <div className="w-full space-y-1.5 my-auto px-1 opacity-70">
            <div className="h-1 bg-rose-300 rounded-full w-full" />
            <div className="h-1 bg-rose-200 rounded-full w-4/5" />
            <div className="h-1 bg-rose-200 rounded-full w-3/5" />
          </div>
          <div className="w-full pt-1 border-t border-rose-100 flex items-center justify-center">
            <span className="text-[8px] font-bold text-rose-700 uppercase">Document</span>
          </div>
        </div>
        <CornerBadges />
      </div>
    );
  }

  if (isSpreadsheet) {
    return (
      <div className="w-full h-full bg-emerald-50/50 rounded-lg flex items-center justify-center relative overflow-hidden p-3 group-hover:bg-emerald-50/80 transition">
        <div className="w-24 h-28 bg-white rounded-lg shadow-2xs border border-emerald-200/80 flex flex-col items-center justify-between p-2.5 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xs">
          <div className="w-full flex items-center justify-between">
            <span className="text-[9px] font-bold text-emerald-600 tracking-wider">XLS</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="w-full grid grid-cols-3 gap-0.5 my-auto bg-emerald-100/60 p-1 rounded border border-emerald-200/60">
            <div className="h-1.5 bg-emerald-200/80 rounded-xs" />
            <div className="h-1.5 bg-emerald-200/80 rounded-xs" />
            <div className="h-1.5 bg-emerald-200/80 rounded-xs" />
            <div className="h-1.5 bg-white rounded-xs" />
            <div className="h-1.5 bg-white rounded-xs" />
            <div className="h-1.5 bg-white rounded-xs" />
          </div>
          <div className="w-full pt-1 border-t border-emerald-100 flex items-center justify-center">
            <span className="text-[8px] font-bold text-emerald-700 uppercase">Spreadsheet</span>
          </div>
        </div>
        <CornerBadges />
      </div>
    );
  }

  if (isDoc) {
    return (
      <div className="w-full h-full bg-blue-50/50 rounded-lg flex items-center justify-center relative overflow-hidden p-3 group-hover:bg-blue-50/80 transition">
        <div className="w-24 h-28 bg-white rounded-lg shadow-2xs border border-blue-200/80 flex flex-col items-center justify-between p-2.5 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xs">
          <div className="w-full flex items-center justify-between">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-[8px] font-bold bg-blue-600 text-white px-1.5 py-0.2 rounded uppercase">{ext}</span>
          </div>
          <div className="w-full space-y-1.5 my-auto px-1 opacity-70">
            <div className="h-1 bg-blue-300 rounded-full w-full" />
            <div className="h-1 bg-blue-200 rounded-full w-5/6" />
            <div className="h-1 bg-blue-200 rounded-full w-2/3" />
          </div>
          <div className="w-full pt-1 border-t border-blue-100 flex items-center justify-center">
            <span className="text-[8px] font-bold text-blue-700 uppercase">Word Doc</span>
          </div>
        </div>
        <CornerBadges />
      </div>
    );
  }

  if (isCode) {
    return (
      <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden p-3 group-hover:bg-slate-850 transition">
        <div className="w-24 h-28 bg-slate-950 rounded-lg shadow-2xs border border-slate-800 flex flex-col items-center justify-between p-2.5 transition-transform duration-300 group-hover:scale-105">
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            </div>
            <span className="text-[8px] font-mono font-bold bg-slate-800 text-indigo-300 px-1.5 py-0.2 rounded uppercase">{ext}</span>
          </div>
          <div className="w-full space-y-1 my-auto px-1">
            <div className="h-1 bg-indigo-500/70 rounded-full w-1/2" />
            <div className="h-1 bg-slate-700 rounded-full w-3/4 ml-1.5" />
            <div className="h-1 bg-emerald-500/70 rounded-full w-2/3 ml-1.5" />
            <div className="h-1 bg-indigo-500/70 rounded-full w-1/3" />
          </div>
          <div className="w-full pt-1 border-t border-slate-800 flex items-center justify-center">
            <span className="text-[8px] font-mono text-slate-500 uppercase">Source Code</span>
          </div>
        </div>
        <CornerBadges />
      </div>
    );
  }

  if (isAudio) {
    return (
      <div className="w-full h-full bg-purple-50/50 rounded-lg flex items-center justify-center relative overflow-hidden p-3 group-hover:bg-purple-50/80 transition">
        <div className="w-24 h-28 bg-white rounded-lg shadow-2xs border border-purple-200/80 flex flex-col items-center justify-between p-2.5 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xs">
          <div className="w-full flex items-center justify-between">
            <Music className="w-4 h-4 text-purple-600" />
            <span className="text-[8px] font-bold bg-purple-600 text-white px-1.5 py-0.2 rounded uppercase">{ext}</span>
          </div>
          <div className="flex items-end justify-center gap-1 h-7 my-auto">
            <div className="w-1 bg-purple-400 rounded-full h-3" />
            <div className="w-1 bg-purple-500 rounded-full h-5" />
            <div className="w-1 bg-purple-600 rounded-full h-7" />
            <div className="w-1 bg-purple-500 rounded-full h-4" />
            <div className="w-1 bg-purple-400 rounded-full h-2" />
          </div>
          <div className="w-full pt-1 border-t border-purple-100 flex items-center justify-center">
            <span className="text-[8px] font-bold text-purple-700 uppercase">Audio Track</span>
          </div>
        </div>
        <CornerBadges />
      </div>
    );
  }

  if (isArchive) {
    return (
      <div className="w-full h-full bg-amber-50/50 rounded-lg flex items-center justify-center relative overflow-hidden p-3 group-hover:bg-amber-50/80 transition">
        <div className="w-24 h-28 bg-white rounded-lg shadow-2xs border border-amber-200/80 flex flex-col items-center justify-between p-2.5 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xs">
          <div className="w-full flex items-center justify-between">
            <Archive className="w-4 h-4 text-amber-600" />
            <span className="text-[8px] font-bold bg-amber-600 text-white px-1.5 py-0.2 rounded uppercase">{ext}</span>
          </div>
          <div className="flex items-center justify-center my-auto">
            <Archive className="w-7 h-7 text-amber-500" />
          </div>
          <div className="w-full pt-1 border-t border-amber-100 flex items-center justify-center">
            <span className="text-[8px] font-bold text-amber-700 uppercase">Archive</span>
          </div>
        </div>
        <CornerBadges />
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-slate-100/70 rounded-lg flex items-center justify-center relative overflow-hidden p-3 group-hover:bg-slate-100 transition">
      <div className="w-24 h-28 bg-white rounded-lg shadow-2xs border border-slate-200/90 flex flex-col items-center justify-between p-2.5 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xs">
        <div className="w-full flex items-center justify-between">
          <FileText className="w-4 h-4 text-slate-500" />
          <span className="text-[8px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded uppercase">{ext}</span>
        </div>
        <div className="flex items-center justify-center my-auto">
          <FileText className="w-7 h-7 text-slate-400" />
        </div>
        <div className="w-full pt-1 border-t border-slate-100 flex items-center justify-center">
          <span className="text-[8px] font-bold text-slate-500 uppercase">{ext}</span>
        </div>
      </div>
      <CornerBadges />
    </div>
  );
}

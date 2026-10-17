import { useState } from "react";
import { VfsItem } from "@/stores/drive.store";
import {
  FileText,
  Play,
  Music,
  Archive,
  Image as ImageIcon,
  Terminal,
  FolderKanban,
  Database,
  Box,
  Type,
  Presentation,
  FileBox,
  Disc,
  Key,
  Palette,
  Film,
  FileSpreadsheet,
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

  const [imgError, setImgError] = useState(false);
  const [vidError, setVidError] = useState(false);
  const [docError, setDocError] = useState(false);

  const isImage =
    mime.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp|gif|svg|avif|bmp|ico|tiff|raw|cr2|nef)$/i.test(name);
  const isVideo =
    mime.startsWith("video/") ||
    /\.(mp4|mkv|webm|mov|m4v|avi|wmv|flv|3gp)$/i.test(name);
  const isPdf = mime.includes("pdf") || name.endsWith(".pdf");
  const isSpreadsheet = /\.(xlsx|xls|xlsm|xlsb|csv|tsv|ods|numbers)$/i.test(name);
  const isDoc = /\.(docx|doc|docm|dotx|dot|rtf|odt|pages|txt)$/i.test(name);
  const isCode =
    /\.(ts|tsx|js|jsx|json|jsonc|py|html|css|scss|sass|less|sql|sh|bash|zsh|yaml|yml|c|h|cpp|hpp|cc|cxx|rs|go|java|kt|kts|cs|php|rb|swift|scala|lua|r|dart|env|dockerfile|gitignore|toml|ini|graphql|gql|xml|log|vbs|ps1)$/i.test(
      name,
    );
  const isMarkdown = /\.(md|markdown|rst)$/i.test(name);
  const isAudio =
    mime.startsWith("audio/") ||
    /\.(mp3|wav|ogg|flac|m4a|aac|wma|aiff|alac|mid|midi)$/i.test(name);
  const isArchive = /\.(zip|tar|gz|rar|7z|bz2|xz|tgz|cab|z|lz|lzma)$/i.test(name);
  const isExecutable = /\.(exe|msi|dmg|pkg|app|apk|bin|run|bat|cmd|com|scr)$/i.test(name);
  const isProject = /\.(mpp|mpt|mpd|vsd|vsdx|vss|vst|drawio)$/i.test(name);
  const isDatabase = /\.(db|sqlite|sqlite3|mdb|accdb|dbf|fdb)$/i.test(name);
  const isPresentation = /\.(pptx|ppt|key|odp|pps|ppsx)$/i.test(name);
  const is3D = /\.(stl|obj|fbx|blend|step|stp|dwg|dxf|gltf|glb|dae|3ds|iges)$/i.test(name);
  const isDesign = /\.(psd|ai|sketch|fig|xd|eps|indd|cdr)$/i.test(name);
  const isFont = /\.(ttf|otf|woff|woff2|eot)$/i.test(name);
  const isDiskImage = /\.(iso|img|vmdk|vdi|cue)$/i.test(name);
  const isCert = /\.(pem|crt|cer|key|p12|pfx|pub)$/i.test(name);

  const isDocument = isPdf || isDoc || isSpreadsheet || isPresentation;

  const CornerBadges = () => (
    <>
      <span className="absolute bottom-2 right-2 text-[9px] font-bold uppercase bg-slate-900/75 text-white px-1.5 py-0.5 rounded backdrop-blur-xs select-none shadow-xs pointer-events-none">
        {ext}
      </span>
    </>
  );

  // 1. Native Image Thumbnail
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

  // 2. Native Video Thumbnail / Player
  if (isVideo && !vidError) {
    return (
      <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden group-hover:bg-slate-850 transition">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${apiUrl}/files/${file.id}/thumbnail?size=large`}
          alt={file.name}
          loading="lazy"
          decoding="async"
          onError={() => setVidError(true)}
          className="w-full h-full object-cover opacity-85 transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
          <div className="w-10 h-10 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-md transition-transform group-hover:scale-110">
            <Play className="w-4 h-4 fill-slate-900 ml-0.5" />
          </div>
        </div>
        <CornerBadges />
      </div>
    );
  }

  // 3. Native Document Thumbnail (When cloud provider returned a raster preview)
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

  // 4. STANDARDIZED VECTOR PREVIEWS FOR ALL FILES WITHOUT THUMBNAILS:

  // A. Source Code (C, Python, JS, TS, Rust, Go, Java, SQL, Shell, etc.)
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
            <span className="text-[8px] font-mono font-bold bg-slate-800 text-indigo-300 px-1.5 py-0.2 rounded uppercase">
              {ext}
            </span>
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

  // B. Markdown Documents
  if (isMarkdown) {
    return (
      <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden p-3 group-hover:bg-slate-850 transition">
        <div className="w-24 h-28 bg-slate-950 rounded-lg shadow-2xs border border-slate-800 flex flex-col items-center justify-between p-2.5 transition-transform duration-300 group-hover:scale-105">
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 inline-block" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
            </div>
            <span className="text-[8px] font-mono font-bold bg-slate-800 text-cyan-300 px-1.5 py-0.2 rounded uppercase">
              {ext}
            </span>
          </div>
          <div className="w-full space-y-1.5 my-auto px-1">
            <div className="h-1.5 bg-cyan-400/80 rounded-full w-3/4" />
            <div className="h-1 bg-slate-600 rounded-full w-full" />
            <div className="h-1 bg-slate-600 rounded-full w-5/6" />
            <div className="h-1 bg-slate-700 rounded-full w-2/3" />
          </div>
          <div className="w-full pt-1 border-t border-slate-800 flex items-center justify-center">
            <span className="text-[8px] font-mono text-cyan-400 uppercase">Markdown</span>
          </div>
        </div>
        <CornerBadges />
      </div>
    );
  }

  // C. Executables & Installers (.exe, .msi, .dmg, .apk, etc.)
  if (isExecutable) {
    const label =
      ext === "APK"
        ? "Android App"
        : ext === "DMG" || ext === "PKG"
        ? "macOS App"
        : "Executable";
    return (
      <div className="w-full h-full bg-violet-50/50 rounded-lg flex items-center justify-center relative overflow-hidden p-3 group-hover:bg-violet-50/80 transition">
        <div className="w-24 h-28 bg-slate-950 rounded-lg shadow-2xs border border-violet-900/50 flex flex-col items-center justify-between p-2.5 transition-transform duration-300 group-hover:scale-105">
          <div className="w-full flex items-center justify-between">
            <Terminal className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[8px] font-mono font-bold bg-violet-950 text-violet-300 border border-violet-800/60 px-1.5 py-0.2 rounded uppercase">
              {ext}
            </span>
          </div>
          <div className="w-full space-y-1.5 my-auto px-1">
            <div className="flex items-center gap-1 font-mono text-[9px] text-violet-400 font-bold">
              <span>&gt;_</span>
              <span className="inline-block w-1.5 h-3 bg-violet-400 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="h-1 bg-violet-500/70 rounded-full w-4/5" />
              <div className="h-1 bg-violet-400/40 rounded-full w-3/5" />
            </div>
          </div>
          <div className="w-full pt-1 border-t border-violet-900/50 flex items-center justify-center">
            <span className="text-[8px] font-bold text-violet-400 uppercase tracking-wide">
              {label}
            </span>
          </div>
        </div>
        <CornerBadges />
      </div>
    );
  }

  // D. Project Management & Diagrams (.mpp, .vsd)
  if (isProject) {
    return (
      <div className="w-full h-full bg-teal-50/50 rounded-lg flex items-center justify-center relative overflow-hidden p-3 group-hover:bg-teal-50/80 transition">
        <div className="w-24 h-28 bg-white rounded-lg shadow-2xs border border-teal-200/80 flex flex-col items-center justify-between p-2.5 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xs">
          <div className="w-full flex items-center justify-between">
            <FolderKanban className="w-4 h-4 text-teal-600" />
            <span className="text-[8px] font-bold bg-teal-600 text-white px-1.5 py-0.2 rounded uppercase">
              {ext}
            </span>
          </div>
          <div className="w-full space-y-1.5 my-auto px-1">
            <div className="w-full bg-teal-50 rounded p-1 space-y-1 border border-teal-200/60">
              <div className="h-1 bg-teal-500 rounded-full w-3/4" />
              <div className="h-1 bg-teal-400 rounded-full w-1/2 ml-2" />
              <div className="h-1 bg-teal-600 rounded-full w-2/3 ml-1" />
            </div>
          </div>
          <div className="w-full pt-1 border-t border-teal-100 flex items-center justify-center">
            <span className="text-[8px] font-bold text-teal-700 uppercase">
              {ext.startsWith("V") ? "Diagram" : "Project Plan"}
            </span>
          </div>
        </div>
        <CornerBadges />
      </div>
    );
  }

  // E. Archives (ZIP, RAR, 7Z, TAR, etc.)
  if (isArchive) {
    return (
      <div className="w-full h-full bg-amber-50/50 rounded-lg flex items-center justify-center relative overflow-hidden p-3 group-hover:bg-amber-50/80 transition">
        <div className="w-24 h-28 bg-white rounded-lg shadow-2xs border border-amber-200/80 flex flex-col items-center justify-between p-2.5 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xs">
          <div className="w-full flex items-center justify-between">
            <Archive className="w-4 h-4 text-amber-600" />
            <span className="text-[8px] font-bold bg-amber-600 text-white px-1.5 py-0.2 rounded uppercase">
              {ext}
            </span>
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

  // F. Audio Tracks
  if (isAudio) {
    return (
      <div className="w-full h-full bg-purple-50/50 rounded-lg flex items-center justify-center relative overflow-hidden p-3 group-hover:bg-purple-50/80 transition">
        <div className="w-24 h-28 bg-white rounded-lg shadow-2xs border border-purple-200/80 flex flex-col items-center justify-between p-2.5 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xs">
          <div className="w-full flex items-center justify-between">
            <Music className="w-4 h-4 text-purple-600" />
            <span className="text-[8px] font-bold bg-purple-600 text-white px-1.5 py-0.2 rounded uppercase">
              {ext}
            </span>
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

  // G. Spreadsheets (XLSX, XLS, CSV, TSV)
  if (isSpreadsheet) {
    return (
      <div className="w-full h-full bg-emerald-50/50 rounded-lg flex items-center justify-center relative overflow-hidden p-3 group-hover:bg-emerald-50/80 transition">
        <div className="w-24 h-28 bg-white rounded-lg shadow-2xs border border-emerald-200/80 flex flex-col items-center justify-between p-2.5 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xs">
          <div className="w-full flex items-center justify-between">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="text-[8px] font-bold bg-emerald-600 text-white px-1.5 py-0.2 rounded uppercase">
              {ext}
            </span>
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

  // H. Documents (DOCX, DOC, TXT, RTF)
  if (isDoc) {
    return (
      <div className="w-full h-full bg-blue-50/50 rounded-lg flex items-center justify-center relative overflow-hidden p-3 group-hover:bg-blue-50/80 transition">
        <div className="w-24 h-28 bg-white rounded-lg shadow-2xs border border-blue-200/80 flex flex-col items-center justify-between p-2.5 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xs">
          <div className="w-full flex items-center justify-between">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-[8px] font-bold bg-blue-600 text-white px-1.5 py-0.2 rounded uppercase">
              {ext}
            </span>
          </div>
          <div className="w-full space-y-1.5 my-auto px-1 opacity-70">
            <div className="h-1 bg-blue-300 rounded-full w-full" />
            <div className="h-1 bg-blue-200 rounded-full w-5/6" />
            <div className="h-1 bg-blue-200 rounded-full w-2/3" />
          </div>
          <div className="w-full pt-1 border-t border-blue-100 flex items-center justify-center">
            <span className="text-[8px] font-bold text-blue-700 uppercase">
              {ext === "TXT" ? "Text File" : "Word Doc"}
            </span>
          </div>
        </div>
        <CornerBadges />
      </div>
    );
  }

  // I. PDF Documents
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

  // J. Presentations (PPTX, PPT, KEY)
  if (isPresentation) {
    return (
      <div className="w-full h-full bg-orange-50/50 rounded-lg flex items-center justify-center relative overflow-hidden p-3 group-hover:bg-orange-50/80 transition">
        <div className="w-24 h-28 bg-white rounded-lg shadow-2xs border border-orange-200/80 flex flex-col items-center justify-between p-2.5 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xs">
          <div className="w-full flex items-center justify-between">
            <Presentation className="w-4 h-4 text-orange-600" />
            <span className="text-[8px] font-bold bg-orange-600 text-white px-1.5 py-0.2 rounded uppercase">
              {ext}
            </span>
          </div>
          <div className="w-full my-auto px-1 flex flex-col items-center">
            <div className="w-12 h-8 rounded border border-orange-300 bg-orange-100/50 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent" />
            </div>
          </div>
          <div className="w-full pt-1 border-t border-orange-100 flex items-center justify-center">
            <span className="text-[8px] font-bold text-orange-700 uppercase">Presentation</span>
          </div>
        </div>
        <CornerBadges />
      </div>
    );
  }

  // K. Databases (.db, .sqlite, .mdb)
  if (isDatabase) {
    return (
      <div className="w-full h-full bg-emerald-50/50 rounded-lg flex items-center justify-center relative overflow-hidden p-3 group-hover:bg-emerald-50/80 transition">
        <div className="w-24 h-28 bg-white rounded-lg shadow-2xs border border-emerald-200/80 flex flex-col items-center justify-between p-2.5 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xs">
          <div className="w-full flex items-center justify-between">
            <Database className="w-4 h-4 text-emerald-600" />
            <span className="text-[8px] font-bold bg-emerald-600 text-white px-1.5 py-0.2 rounded uppercase">
              {ext}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center gap-1 my-auto">
            <div className="w-10 h-2.5 rounded-full border border-emerald-500 bg-emerald-100" />
            <div className="w-10 h-2.5 rounded-full border border-emerald-500 bg-emerald-100 -mt-1" />
            <div className="w-10 h-2.5 rounded-full border border-emerald-500 bg-emerald-200 -mt-1" />
          </div>
          <div className="w-full pt-1 border-t border-emerald-100 flex items-center justify-center">
            <span className="text-[8px] font-bold text-emerald-700 uppercase">Database</span>
          </div>
        </div>
        <CornerBadges />
      </div>
    );
  }

  // L. 3D Models & CAD (.stl, .obj, .blend, .dwg)
  if (is3D) {
    return (
      <div className="w-full h-full bg-sky-50/50 rounded-lg flex items-center justify-center relative overflow-hidden p-3 group-hover:bg-sky-50/80 transition">
        <div className="w-24 h-28 bg-white rounded-lg shadow-2xs border border-sky-200/80 flex flex-col items-center justify-between p-2.5 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xs">
          <div className="w-full flex items-center justify-between">
            <Box className="w-4 h-4 text-sky-600" />
            <span className="text-[8px] font-bold bg-sky-600 text-white px-1.5 py-0.2 rounded uppercase">
              {ext}
            </span>
          </div>
          <div className="flex items-center justify-center my-auto">
            <Box className="w-7 h-7 text-sky-500" />
          </div>
          <div className="w-full pt-1 border-t border-sky-100 flex items-center justify-center">
            <span className="text-[8px] font-bold text-sky-700 uppercase">3D / CAD</span>
          </div>
        </div>
        <CornerBadges />
      </div>
    );
  }

  // M. Design & Creative (.psd, .ai, .fig, .sketch)
  if (isDesign) {
    return (
      <div className="w-full h-full bg-pink-50/50 rounded-lg flex items-center justify-center relative overflow-hidden p-3 group-hover:bg-pink-50/80 transition">
        <div className="w-24 h-28 bg-white rounded-lg shadow-2xs border border-pink-200/80 flex flex-col items-center justify-between p-2.5 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xs">
          <div className="w-full flex items-center justify-between">
            <Palette className="w-4 h-4 text-pink-600" />
            <span className="text-[8px] font-bold bg-pink-600 text-white px-1.5 py-0.2 rounded uppercase">
              {ext}
            </span>
          </div>
          <div className="flex items-center justify-center my-auto">
            <Palette className="w-7 h-7 text-pink-500" />
          </div>
          <div className="w-full pt-1 border-t border-pink-100 flex items-center justify-center">
            <span className="text-[8px] font-bold text-pink-700 uppercase">Design</span>
          </div>
        </div>
        <CornerBadges />
      </div>
    );
  }

  // N. Typography & Fonts (.ttf, .otf, .woff)
  if (isFont) {
    return (
      <div className="w-full h-full bg-rose-50/50 rounded-lg flex items-center justify-center relative overflow-hidden p-3 group-hover:bg-rose-50/80 transition">
        <div className="w-24 h-28 bg-white rounded-lg shadow-2xs border border-rose-200/80 flex flex-col items-center justify-between p-2.5 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xs">
          <div className="w-full flex items-center justify-between">
            <Type className="w-4 h-4 text-rose-600" />
            <span className="text-[8px] font-bold bg-rose-600 text-white px-1.5 py-0.2 rounded uppercase">
              {ext}
            </span>
          </div>
          <div className="flex items-center justify-center my-auto">
            <span className="text-xl font-serif font-black text-rose-600 tracking-tight">Aa</span>
          </div>
          <div className="w-full pt-1 border-t border-rose-100 flex items-center justify-center">
            <span className="text-[8px] font-bold text-rose-700 uppercase">Font</span>
          </div>
        </div>
        <CornerBadges />
      </div>
    );
  }

  // O. Disk Images (.iso, .img, .vmdk)
  if (isDiskImage) {
    return (
      <div className="w-full h-full bg-cyan-50/50 rounded-lg flex items-center justify-center relative overflow-hidden p-3 group-hover:bg-cyan-50/80 transition">
        <div className="w-24 h-28 bg-white rounded-lg shadow-2xs border border-cyan-200/80 flex flex-col items-center justify-between p-2.5 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xs">
          <div className="w-full flex items-center justify-between">
            <Disc className="w-4 h-4 text-cyan-600" />
            <span className="text-[8px] font-bold bg-cyan-600 text-white px-1.5 py-0.2 rounded uppercase">
              {ext}
            </span>
          </div>
          <div className="flex items-center justify-center my-auto">
            <Disc className="w-7 h-7 text-cyan-500" />
          </div>
          <div className="w-full pt-1 border-t border-cyan-100 flex items-center justify-center">
            <span className="text-[8px] font-bold text-cyan-700 uppercase">Disk Image</span>
          </div>
        </div>
        <CornerBadges />
      </div>
    );
  }

  // P. Security & Certificates (.pem, .key, .crt)
  if (isCert) {
    return (
      <div className="w-full h-full bg-teal-50/50 rounded-lg flex items-center justify-center relative overflow-hidden p-3 group-hover:bg-teal-50/80 transition">
        <div className="w-24 h-28 bg-white rounded-lg shadow-2xs border border-teal-200/80 flex flex-col items-center justify-between p-2.5 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xs">
          <div className="w-full flex items-center justify-between">
            <Key className="w-4 h-4 text-teal-600" />
            <span className="text-[8px] font-bold bg-teal-600 text-white px-1.5 py-0.2 rounded uppercase">
              {ext}
            </span>
          </div>
          <div className="flex items-center justify-center my-auto">
            <Key className="w-7 h-7 text-teal-500" />
          </div>
          <div className="w-full pt-1 border-t border-teal-100 flex items-center justify-center">
            <span className="text-[8px] font-bold text-teal-700 uppercase">Security Key</span>
          </div>
        </div>
        <CornerBadges />
      </div>
    );
  }

  // Q. Video Fallback (when video thumb image fails to load)
  if (isVideo) {
    return (
      <div className="w-full h-full bg-indigo-50/50 rounded-lg flex items-center justify-center relative overflow-hidden p-3 group-hover:bg-indigo-50/80 transition">
        <div className="w-24 h-28 bg-slate-950 rounded-lg shadow-2xs border border-indigo-900/50 flex flex-col items-center justify-between p-2.5 transition-transform duration-300 group-hover:scale-105">
          <div className="w-full flex items-center justify-between">
            <Film className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[8px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800/60 px-1.5 py-0.2 rounded uppercase">
              {ext}
            </span>
          </div>
          <div className="flex items-center justify-center my-auto">
            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Play className="w-4 h-4 fill-white ml-0.5" />
            </div>
          </div>
          <div className="w-full pt-1 border-t border-indigo-900/50 flex items-center justify-center">
            <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-wide">
              Video
            </span>
          </div>
        </div>
        <CornerBadges />
      </div>
    );
  }

  // R. Image Fallback (when image thumb fails to load or corrupt image)
  if (isImage) {
    return (
      <div className="w-full h-full bg-emerald-50/50 rounded-lg flex items-center justify-center relative overflow-hidden p-3 group-hover:bg-emerald-50/80 transition">
        <div className="w-24 h-28 bg-white rounded-lg shadow-2xs border border-emerald-200/80 flex flex-col items-center justify-between p-2.5 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xs">
          <div className="w-full flex items-center justify-between">
            <ImageIcon className="w-4 h-4 text-emerald-600" />
            <span className="text-[8px] font-bold bg-emerald-600 text-white px-1.5 py-0.2 rounded uppercase">
              {ext}
            </span>
          </div>
          <div className="flex items-center justify-center my-auto">
            <ImageIcon className="w-7 h-7 text-emerald-500" />
          </div>
          <div className="w-full pt-1 border-t border-emerald-100 flex items-center justify-center">
            <span className="text-[8px] font-bold text-emerald-700 uppercase">Image</span>
          </div>
        </div>
        <CornerBadges />
      </div>
    );
  }

  // S. Universal Standardized Fallback for ANY other file in existence
  return (
    <div className="w-full h-full bg-slate-50/70 rounded-lg flex items-center justify-center relative overflow-hidden p-3 group-hover:bg-slate-100/80 transition">
      <div className="w-24 h-28 bg-white rounded-lg shadow-2xs border border-slate-200 flex flex-col items-center justify-between p-2.5 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xs">
        <div className="w-full flex items-center justify-between">
          <FileBox className="w-4 h-4 text-slate-600" />
          <span className="text-[8px] font-bold font-mono bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.2 rounded uppercase">
            {ext}
          </span>
        </div>
        <div className="w-full my-auto px-1 flex flex-col items-center gap-1.5">
          <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shadow-inner">
            <span className="text-[10px] font-black font-mono text-slate-700">
              {ext.slice(0, 3)}
            </span>
          </div>
          <div className="w-full space-y-0.5">
            <div className="h-0.5 bg-slate-200 rounded-full w-4/5 mx-auto" />
            <div className="h-0.5 bg-slate-100 rounded-full w-3/5 mx-auto" />
          </div>
        </div>
        <div className="w-full pt-1 border-t border-slate-100 flex items-center justify-center">
          <span className="text-[8px] font-bold text-slate-600 uppercase tracking-wide">
            {ext} File
          </span>
        </div>
      </div>
      <CornerBadges />
    </div>
  );
}

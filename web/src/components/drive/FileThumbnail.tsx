import { VfsItem } from "@/stores/drive.store";
import {
  ImageThumbnail,
  VideoThumbnail,
  AudioThumbnail,
  CodeThumbnail,
  MarkdownThumbnail,
  PdfThumbnail,
  SpreadsheetThumbnail,
  WordDocumentThumbnail,
  PresentationThumbnail,
  ExecutableThumbnail,
  ProjectPlanThumbnail,
  ArchiveThumbnail,
  DatabaseThumbnail,
  ThreeDThumbnail,
  DesignThumbnail,
  FontThumbnail,
  DiskImageThumbnail,
  CertificateThumbnail,
  GenericThumbnail,
} from "./thumbnails";

export * from "./thumbnails";

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

  if (isImage) {
    return <ImageThumbnail file={file} ext={ext} apiUrl={apiUrl} />;
  }

  if (isVideo) {
    return <VideoThumbnail file={file} ext={ext} apiUrl={apiUrl} />;
  }

  if (isCode) {
    return <CodeThumbnail ext={ext} />;
  }

  if (isMarkdown) {
    return <MarkdownThumbnail ext={ext} />;
  }

  if (isPdf) {
    return <PdfThumbnail ext={ext} />;
  }

  if (isSpreadsheet) {
    return <SpreadsheetThumbnail ext={ext} />;
  }

  if (isDoc) {
    return <WordDocumentThumbnail ext={ext} />;
  }

  if (isPresentation) {
    return <PresentationThumbnail ext={ext} />;
  }

  if (isExecutable) {
    return <ExecutableThumbnail ext={ext} />;
  }

  if (isProject) {
    return <ProjectPlanThumbnail ext={ext} />;
  }

  if (isArchive) {
    return <ArchiveThumbnail ext={ext} />;
  }

  if (isAudio) {
    return <AudioThumbnail ext={ext} />;
  }

  if (isDatabase) {
    return <DatabaseThumbnail ext={ext} />;
  }

  if (is3D) {
    return <ThreeDThumbnail ext={ext} />;
  }

  if (isDesign) {
    return <DesignThumbnail ext={ext} />;
  }

  if (isFont) {
    return <FontThumbnail ext={ext} />;
  }

  if (isDiskImage) {
    return <DiskImageThumbnail ext={ext} />;
  }

  if (isCert) {
    return <CertificateThumbnail ext={ext} />;
  }

  return <GenericThumbnail ext={ext} />;
}

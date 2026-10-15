"use client";

import { VfsItem } from "@/stores/drive.store";
import { formatBytes } from "@/lib/format";
import { FileThumbnail, getProviderBadgeStyle } from "@/components/drive/FileThumbnail";
import {
  CheckSquare,
  Square,
  Star,
  MoreVertical,
  Image as ImageIcon,
  Video,
  Archive,
  FileCode,
  FileText,
} from "lucide-react";

function getFileIcon(file: VfsItem) {
  const mime = file.mimeType || "";
  const name = file.name.toLowerCase();

  if (
    mime.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(name)
  ) {
    return <ImageIcon className="h-4 w-4 text-purple-600 shrink-0" />;
  }
  if (mime.startsWith("video/") || /\.(mp4|mkv|webm|mov|avi)$/i.test(name)) {
    return <Video className="h-4 w-4 text-rose-600 shrink-0" />;
  }
  if (
    name.endsWith(".zip") ||
    name.endsWith(".tar") ||
    name.endsWith(".gz")
  ) {
    return <Archive className="h-4 w-4 text-purple-600 shrink-0" />;
  }
  if (/\.(ts|tsx|js|jsx|json|py|html|css|sql)$/i.test(name)) {
    return <FileCode className="h-4 w-4 text-emerald-600 shrink-0" />;
  }
  return <FileText className="h-4 w-4 text-blue-600 shrink-0" />;
}

interface FileViewCommonProps {
  files: VfsItem[];
  selectedIds: Set<string>;
  getDisplayBadge: (file: VfsItem) => string;
  onPreview: (fileId: string) => void;
  onItemClick: (file: VfsItem, e: React.MouseEvent) => void;
  onToggleSelectCheckbox: (id: string, e: React.MouseEvent) => void;
  onToggleStar: (file: VfsItem) => void;
  onOpenContextMenu: (file: VfsItem, e: React.MouseEvent) => void;
}

export function DriveFileGrid({
  files,
  selectedIds,
  getDisplayBadge,
  onPreview,
  onItemClick,
  onToggleSelectCheckbox,
  onToggleStar,
  onOpenContextMenu,
}: FileViewCommonProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
      {files.map((file) => {
        const badge = getDisplayBadge(file);
        const isSelected = selectedIds.has(file.id);
        return (
          <div
            key={file.id}
            onDoubleClick={() => onPreview(file.id)}
            onClick={(e) => onItemClick(file, e)}
            onContextMenu={(e) => {
              e.preventDefault();
              onOpenContextMenu(file, e);
            }}
            className={`border rounded-xl p-3 transition cursor-pointer group flex flex-col justify-between relative ${
              isSelected
                ? "bg-blue-50/60 border-blue-400 ring-2 ring-blue-500/20 shadow-xs"
                : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs"
            }`}
          >
            <div className="h-36 sm:h-40 bg-slate-50/80 rounded-lg flex items-center justify-center mb-2.5 relative group-hover:bg-blue-50/30 transition overflow-hidden">
              <button
                type="button"
                onClick={(e) => onToggleSelectCheckbox(file.id, e)}
                className={`absolute top-1.5 left-1.5 p-1 rounded-md transition cursor-pointer z-10 ${
                  isSelected
                    ? "text-blue-600 bg-white/95 shadow-2xs"
                    : "text-slate-400 bg-white/90 hover:bg-white hover:text-slate-700 shadow-2xs"
                }`}
                title={isSelected ? "Deselect" : "Select"}
              >
                {isSelected ? (
                  <CheckSquare className="h-3.5 w-3.5 fill-blue-50 text-blue-600" />
                ) : (
                  <Square className="h-3.5 w-3.5" />
                )}
              </button>

              <FileThumbnail file={file} badge={badge} />

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStar(file);
                }}
                className={`absolute top-1.5 right-7 p-1 rounded-md bg-white/90 hover:bg-white transition shadow-2xs cursor-pointer z-10 ${
                  file.starred
                    ? "text-amber-500"
                    : "text-slate-300 hover:text-amber-500"
                }`}
                title={file.starred ? "Unstar" : "Star"}
              >
                <Star
                  className={`h-3 w-3 ${
                    file.starred ? "fill-amber-400 text-amber-500" : ""
                  }`}
                />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenContextMenu(file, e);
                }}
                className="absolute top-1.5 right-1.5 p-1 rounded-md bg-white/90 hover:bg-white text-slate-400 hover:text-slate-700 transition shadow-2xs cursor-pointer z-10"
                aria-label="More actions"
              >
                <MoreVertical className="h-3 w-3" />
              </button>
            </div>

            <div className="min-w-0 pt-0.5">
              <div
                className="font-medium text-slate-800 text-xs truncate leading-snug"
                title={file.name}
              >
                {file.name}
              </div>
              <div className="flex items-center justify-between gap-1.5 mt-1.5 text-[10px] text-slate-400">
                <span
                  className={`px-1.5 py-0.5 rounded-full font-medium text-[9px] truncate max-w-30 ${getProviderBadgeStyle(
                    badge,
                  )}`}
                >
                  {badge}
                </span>
                <span className="shrink-0 font-medium">{formatBytes(file.size)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DriveFileList({
  files,
  selectedIds,
  getDisplayBadge,
  onPreview,
  onItemClick,
  onToggleSelectCheckbox,
  onToggleStar,
  onOpenContextMenu,
}: FileViewCommonProps) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white shadow-2xs">
      {files.map((file) => {
        const badge = getDisplayBadge(file);
        const isSelected = selectedIds.has(file.id);
        return (
          <div
            key={file.id}
            onDoubleClick={() => onPreview(file.id)}
            onClick={(e) => onItemClick(file, e)}
            onContextMenu={(e) => {
              e.preventDefault();
              onOpenContextMenu(file, e);
            }}
            className={`p-3 sm:p-3.5 flex items-center justify-between transition text-xs gap-3 cursor-pointer group ${
              isSelected
                ? "bg-blue-50/60 ring-1 ring-inset ring-blue-500/20"
                : "hover:bg-slate-50/80"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                type="button"
                onClick={(e) => onToggleSelectCheckbox(file.id, e)}
                className={`p-1 rounded-md transition cursor-pointer shrink-0 ${
                  isSelected
                    ? "text-blue-600"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                }`}
                title={isSelected ? "Deselect" : "Select"}
              >
                {isSelected ? (
                  <CheckSquare className="h-4 w-4 fill-blue-50 text-blue-600" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </button>

              <div className="shrink-0">{getFileIcon(file)}</div>
              <div className="min-w-0 flex-1">
                <div
                  className="font-medium text-slate-800 text-xs truncate"
                  title={file.name}
                >
                  {file.name}
                </div>
                <div className="flex sm:hidden items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                  <span
                    className={`px-1.5 py-0.2 rounded-full font-medium text-[9px] ${getProviderBadgeStyle(
                      badge,
                    )}`}
                  >
                    {badge}
                  </span>
                  <span>•</span>
                  <span>{formatBytes(file.size)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStar(file);
                }}
                className={`p-1.5 rounded-md hover:bg-slate-100 transition cursor-pointer ${
                  file.starred
                    ? "text-amber-500"
                    : "text-slate-300 hover:text-amber-500"
                }`}
                title={file.starred ? "Unstar" : "Star"}
              >
                <Star
                  className={`h-3.5 w-3.5 ${
                    file.starred ? "fill-amber-400 text-amber-500" : ""
                  }`}
                />
              </button>

              <span
                className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${getProviderBadgeStyle(
                  badge,
                )}`}
              >
                {badge}
              </span>
              <span className="hidden sm:inline-block text-slate-500 w-16 text-right text-xs">
                {formatBytes(file.size)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenContextMenu(file, e);
                }}
                aria-label="More actions"
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition cursor-pointer"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import React from "react";
import { VfsItem } from "@/stores/drive.store";
import { formatBytes } from "@/lib/format";
import { FileThumbnail } from "@/components/drive/FileThumbnail";
import { ProviderLogo } from "@/components/drive/ProviderBadge";
import {
  Check,
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
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
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
            className={`bg-white border rounded-xl p-2.5 sm:p-3 flex flex-col justify-between transition-all duration-150 cursor-pointer group select-none hover:shadow-xs hover:border-slate-300 ${
              isSelected
                ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30"
                : "border-black/[0.06]"
            }`}
          >
            {/* Top Bar: Icon + File Name + 3-Dots Menu (Google Drive Standard, No Star) */}
            <div className="flex items-center justify-between gap-1.5 mb-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="shrink-0">{getFileIcon(file)}</div>
                <span
                  className="font-medium text-slate-850 text-xs sm:text-[13px] truncate leading-tight group-hover:text-blue-600 transition-colors"
                  title={file.name}
                >
                  {file.name}
                </span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenContextMenu(file, e);
                }}
                className="p-1 -mr-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition shrink-0 cursor-pointer"
                title="Actions"
                aria-label="Actions"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>

            {/* Thumbnail: Clean, soft, rounded well without thick borders */}
            <div className="w-full aspect-[4/3] bg-slate-50/80 rounded-lg border border-slate-200/80 overflow-hidden flex items-center justify-center relative group-hover:bg-slate-100/60 group-hover:border-slate-300 transition">
              {/* Selection Checkmark */}
              {isSelected && (
                <div
                  onClick={(e) => onToggleSelectCheckbox(file.id, e)}
                  className="absolute top-2 left-2 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs z-20 cursor-pointer"
                  title="Selected"
                >
                  <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                </div>
              )}

              {/* Desktop Hover Checkbox */}
              {!isSelected && (
                <button
                  type="button"
                  onClick={(e) => onToggleSelectCheckbox(file.id, e)}
                  className="hidden md:flex opacity-0 group-hover:opacity-100 absolute top-2 left-2 w-6 h-6 rounded-full items-center justify-center bg-slate-900/50 hover:bg-blue-600 text-white shadow-xs transition-all duration-150 cursor-pointer z-20"
                  title="Select"
                  aria-label="Select"
                >
                  <Check className="h-3.5 w-3.5 opacity-80" />
                </button>
              )}

              {/* The Rendered File / Media Thumbnail */}
              <FileThumbnail file={file} badge={badge} />
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
    <div className="border border-black/[0.06] rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]">
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
                ? "bg-blue-50/50 ring-1 ring-inset ring-blue-500/25"
                : "hover:bg-slate-50/80"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Circular Selection Checkbox */}
              <button
                type="button"
                onClick={(e) => onToggleSelectCheckbox(file.id, e)}
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-xs"
                    : "border border-slate-300 text-transparent hover:border-blue-500 hover:text-slate-400 bg-white"
                }`}
                title={isSelected ? "Deselect" : "Select"}
                aria-label={isSelected ? "Deselect" : "Select"}
              >
                <Check
                  className={`h-3 w-3 stroke-[2.5] ${
                    isSelected ? "text-white" : "opacity-0 group-hover:opacity-60"
                  }`}
                />
              </button>

              <div className="shrink-0">{getFileIcon(file)}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="font-medium text-slate-800 text-xs truncate group-hover:text-blue-600 transition-colors"
                    title={file.name}
                  >
                    {file.name}
                  </span>
                  {file.starred && (
                    <Star className="h-3 w-3 fill-amber-400 text-amber-500 shrink-0" />
                  )}
                </div>
                <div className="flex sm:hidden items-center gap-2 text-[10px] text-slate-400 mt-1">
                  <ProviderLogo badge={badge} showName={false} size="sm" />
                  <span>•</span>
                  <span>{formatBytes(file.size)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
              <div className="hidden sm:inline-flex">
                <ProviderLogo badge={badge} showName={false} />
              </div>
              <span className="hidden sm:inline-block text-slate-500 w-18 text-right text-xs font-medium">
                {formatBytes(file.size)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenContextMenu(file, e);
                }}
                aria-label="Actions"
                title="Actions"
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

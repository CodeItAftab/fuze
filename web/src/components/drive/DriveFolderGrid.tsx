"use client";

import React from "react";
import { VfsItem } from "@/stores/drive.store";
import { Folder, MoreVertical, Check } from "lucide-react";
import { getFolderPalette } from "@/components/drive/FileThumbnail";

interface DriveFolderGridProps {
  folders: VfsItem[];
  selectedIds: Set<string>;
  onNavigate: (folderId: string, folderName?: string) => void;
  onItemClick: (folder: VfsItem, e: React.MouseEvent) => void;
  onToggleSelectCheckbox: (id: string, e: React.MouseEvent) => void;
  onToggleStar: (folder: VfsItem) => void;
  onOpenContextMenu: (folder: VfsItem, e: React.MouseEvent) => void;
}

export function DriveFolderGrid({
  folders,
  selectedIds,
  onNavigate,
  onItemClick,
  onToggleSelectCheckbox,
  onToggleStar,
  onOpenContextMenu,
}: DriveFolderGridProps) {
  if (folders.length === 0) return null;

  return (
    <div className="mb-5 sm:mb-6">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
        Folders
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
        {folders.map((folder) => {
          const palette = getFolderPalette(folder.id || folder.name);
          const isSelected = selectedIds.has(folder.id);
          return (
            <div
              key={folder.id}
              onDoubleClick={() => onNavigate(folder.id, folder.name)}
              onClick={(e) => onItemClick(folder, e)}
              onContextMenu={(e) => {
                e.preventDefault();
                onOpenContextMenu(folder, e);
              }}
              className={`bg-white border rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2.5 transition-all duration-150 cursor-pointer group shadow-2xs hover:border-slate-300 hover:shadow-xs select-none h-12 ${
                isSelected
                  ? "bg-blue-50/40 border-blue-400 ring-2 ring-blue-500/20"
                  : "border-black/[0.06]"
              }`}
            >
              {/* Left: Folder Icon Tile or Selection Checkmark */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {isSelected ? (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelectCheckbox(folder.id, e);
                    }}
                    className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0 cursor-pointer"
                    title="Selected (tap to deselect)"
                  >
                    <Check className="h-4 w-4 stroke-[2.5]" />
                  </div>
                ) : (
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                      palette.icon.includes("amber")
                        ? "bg-amber-50 text-amber-500"
                        : palette.icon.includes("blue")
                        ? "bg-blue-50 text-blue-500"
                        : "bg-emerald-50 text-emerald-500"
                    }`}
                  >
                    <Folder className={`h-4 w-4 ${palette.icon}`} />
                  </div>
                )}

                {/* Center: Folder Name (No star mark!) */}
                <span
                  className="font-medium text-slate-850 text-xs sm:text-[13px] truncate leading-tight group-hover:text-blue-600 transition-colors flex-1"
                  title={folder.name}
                >
                  {folder.name}
                </span>
              </div>

              {/* Right: Always-Visible 3-Dots Action Menu */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenContextMenu(folder, e);
                }}
                className="p-1 -mr-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition shrink-0 cursor-pointer"
                aria-label="Folder actions"
                title="Actions"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

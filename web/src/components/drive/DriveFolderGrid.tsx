"use client";

import { VfsItem } from "@/stores/drive.store";
import { Folder, Star, MoreVertical, CheckSquare, Square } from "lucide-react";
import { getFolderPalette } from "@/components/drive/FileThumbnail";

interface DriveFolderGridProps {
  folders: VfsItem[];
  selectedIds: Set<string>;
  onNavigate: (folderId: string) => void;
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
    <div className="mb-6">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
        Folders
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {folders.map((folder) => {
          const palette = getFolderPalette(folder.id || folder.name);
          const isSelected = selectedIds.has(folder.id);
          return (
            <div
              key={folder.id}
              onDoubleClick={() => onNavigate(folder.id)}
              onClick={(e) => onItemClick(folder, e)}
              onContextMenu={(e) => {
                e.preventDefault();
                onOpenContextMenu(folder, e);
              }}
              className={`border rounded-xl px-3.5 py-3 flex items-center justify-between transition cursor-pointer group gap-2.5 ${
                isSelected
                  ? "bg-blue-50/60 border-blue-400 ring-2 ring-blue-500/20 shadow-xs"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={(e) => onToggleSelectCheckbox(folder.id, e)}
                  className={`p-1 rounded-md transition cursor-pointer shrink-0 ${
                    isSelected
                      ? "text-blue-600 bg-blue-50 opacity-100"
                      : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 opacity-60 group-hover:opacity-100"
                  }`}
                  title={isSelected ? "Deselect" : "Select"}
                >
                  {isSelected ? (
                    <CheckSquare className="h-4 w-4 fill-blue-50 text-blue-600" />
                  ) : (
                    <Square className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                  )}
                </button>

                <Folder className={`h-5 w-5 shrink-0 ${palette.icon}`} />
                <div className="min-w-0 flex-1">
                  <div
                    className="font-semibold text-slate-800 text-xs truncate leading-snug"
                    title={folder.name}
                  >
                    {folder.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-normal leading-tight">
                    Folder
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStar(folder);
                  }}
                  className={`p-1.5 rounded-md hover:bg-slate-100 transition cursor-pointer ${
                    folder.starred
                      ? "text-amber-500 opacity-100"
                      : "text-slate-300 hover:text-amber-500 opacity-0 group-hover:opacity-100"
                  }`}
                  title={folder.starred ? "Unstar" : "Star"}
                >
                  <Star
                    className={`h-3.5 w-3.5 ${
                      folder.starred ? "fill-amber-400 text-amber-500" : ""
                    }`}
                  />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenContextMenu(folder, e);
                  }}
                  className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition shrink-0 cursor-pointer opacity-0 group-hover:opacity-100"
                  aria-label="More actions"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

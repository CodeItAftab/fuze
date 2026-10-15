"use client";

import {
  X,
  FolderInput,
  Edit2,
  Info,
  Star,
  Download,
  Trash2,
} from "lucide-react";

interface DriveSelectionBarProps {
  selectedCount: number;
  singleSelected: boolean;
  hasFiles: boolean;
  anyUnstarred: boolean;
  onClear: () => void;
  onMove: () => void;
  onRename: () => void;
  onDetails: () => void;
  onToggleStar: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

export function DriveSelectionBar({
  selectedCount,
  singleSelected,
  hasFiles,
  anyUnstarred,
  onClear,
  onMove,
  onRename,
  onDetails,
  onToggleStar,
  onDownload,
  onDelete,
}: DriveSelectionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="sticky top-0 z-30 mb-5 bg-white border border-blue-200/90 rounded-2xl px-3.5 sm:px-4 py-2.5 shadow-md shadow-blue-500/5 flex flex-wrap items-center justify-between gap-2.5 animate-in fade-in slide-in-from-top-2 duration-150 ring-1 ring-blue-500/10"
    >
      <div className="flex items-center gap-2 sm:gap-2.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
          title="Clear selection (Esc)"
          aria-label="Clear selection"
        >
          <X className="h-4 w-4" />
        </button>
        <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200/60">
          {selectedCount} selected
        </span>
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMove();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition cursor-pointer border border-slate-200 hover:border-blue-200 bg-white"
          title="Move to destination folder"
        >
          <FolderInput className="h-3.5 w-3.5 text-slate-500" />
          <span className="hidden xs:inline">Move</span>
        </button>

        {singleSelected && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRename();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition cursor-pointer border border-slate-200 hover:border-blue-200 bg-white"
            title="Rename selected item"
          >
            <Edit2 className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden xs:inline">Rename</span>
          </button>
        )}

        {singleSelected && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDetails();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition cursor-pointer border border-slate-200 hover:border-blue-200 bg-white"
            title="View file details"
          >
            <Info className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden xs:inline">Details</span>
          </button>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer border border-slate-200 hover:border-amber-200 bg-white"
          title="Toggle star on selected items"
        >
          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
          <span className="hidden xs:inline">
            {anyUnstarred ? "Star" : "Unstar"}
          </span>
        </button>

        {hasFiles && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer border border-slate-200 hover:border-emerald-200 bg-white"
            title="Download selected files"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden xs:inline">Download</span>
          </button>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer border border-rose-200/80 bg-white"
          title="Move selected items to trash"
        >
          <Trash2 className="h-3.5 w-3.5 text-rose-500" />
          <span className="hidden xs:inline">Trash</span>
        </button>
      </div>
    </div>
  );
}

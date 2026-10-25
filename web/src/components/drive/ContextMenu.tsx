"use client";

import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { VfsItem } from "@/stores/drive.store";
import {
  Download,
  Trash2,
  Star,
  Edit2,
  Info,
  Share2,
  FolderInput,
  Eye,
  Check,
} from "lucide-react";

export interface ContextMenuProps {
  x: number;
  y: number;
  item: VfsItem;
  isSelected?: boolean;
  onToggleSelect?: (item: VfsItem) => void;
  onClose: () => void;
  onPreview?: (item: VfsItem) => void;
  onDownload: (item: VfsItem) => Promise<void>;
  onDelete: (item: VfsItem) => Promise<void>;
  onToggleStar: (item: VfsItem) => Promise<void>;
  onRename: (item: VfsItem) => void;
  onDetails: (item: VfsItem) => void;
  onShare?: (item: VfsItem) => void;
  onMove?: (item: VfsItem) => void;
}

export function ContextMenu({
  x,
  y,
  item,
  isSelected,
  onToggleSelect,
  onClose,
  onPreview,
  onDownload,
  onDelete,
  onToggleStar,
  onRename,
  onDetails,
  onShare,
  onMove,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Calculate safe initial coordinates immediately to prevent visual jumping
  const [coords, setCoords] = useState<{ top: number; left: number }>(() => {
    if (typeof window === "undefined") return { top: y, left: x };
    const vpW = window.innerWidth;
    const vpH = window.innerHeight;
    const estW = 208;
    const estH = 320;
    const left = Math.max(12, Math.min(x - 8, vpW - estW - 12));
    const top = Math.max(12, Math.min(y + 4, vpH - estH - 12));
    return { top, left };
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleScrollOrResize = () => onClose();

    window.addEventListener("click", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("click", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [onClose]);

  // Precise measured adjustment without leaping or coming up from below
  useLayoutEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const menuWidth = rect.width || 208;
      const menuHeight = rect.height || 320;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Anchor horizontally near the click/tap, clamped safely
      let left = x - 8;
      if (left + menuWidth > viewportWidth - 12) {
        left = Math.max(12, viewportWidth - menuWidth - 12);
      }
      if (left < 12) left = 12;

      // Smooth vertical positioning: place right below the trigger, clamping gently if at the bottom
      let top = y + 4;
      if (top + menuHeight > viewportHeight - 12) {
        // Gently clamp so bottom touches the safe area, never flipping hundreds of pixels away
        top = Math.max(12, viewportHeight - menuHeight - 12);
      }

      setCoords({ top, left });
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      style={{ top: `${coords.top}px`, left: `${coords.left}px` }}
      className="fixed z-50 w-52 max-h-[calc(100vh-24px)] overflow-y-auto bg-white/95 backdrop-blur-md rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.04)] border border-black/[0.08] p-1 text-xs select-none origin-top-left transition-all duration-150 animate-in fade-in-0 zoom-in-95 ease-out divide-y divide-slate-100"
    >
      <div className="py-0.5 space-y-0.5">
        {onToggleSelect && (
          <button
            onClick={() => {
              onToggleSelect(item);
              onClose();
            }}
            className="w-full px-2.5 py-1.5 flex items-center gap-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 active:bg-slate-200/60 rounded-lg transition cursor-pointer font-medium"
          >
            {isSelected ? (
              <>
                <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Check className="h-2.5 w-2.5 stroke-[2.5]" />
                </div>
                <span className="text-blue-600 font-semibold">Deselect</span>
              </>
            ) : (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                <span>Select</span>
              </>
            )}
          </button>
        )}

        {item.type === "file" && onPreview && (
          <button
            onClick={() => {
              onPreview(item);
              onClose();
            }}
            className="w-full px-2.5 py-1.5 flex items-center gap-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 active:bg-slate-200/60 rounded-lg transition cursor-pointer font-medium"
          >
            <Eye className="h-4 w-4 text-slate-500 shrink-0" />
            <span>Preview</span>
          </button>
        )}

        {item.type === "file" && onShare && (
          <button
            onClick={() => {
              onShare(item);
              onClose();
            }}
            className="w-full px-2.5 py-1.5 flex items-center gap-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 active:bg-slate-200/60 rounded-lg transition cursor-pointer font-medium"
          >
            <Share2 className="h-4 w-4 text-blue-600 shrink-0" />
            <span>Share link</span>
          </button>
        )}

        {item.type === "file" && (
          <button
            onClick={() => {
              void onDownload(item);
              onClose();
            }}
            className="w-full px-2.5 py-1.5 flex items-center gap-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 active:bg-slate-200/60 rounded-lg transition cursor-pointer font-medium"
          >
            <Download className="h-4 w-4 text-slate-500 shrink-0" />
            <span>Download</span>
          </button>
        )}
      </div>

      <div className="py-0.5 space-y-0.5">
        <button
          onClick={() => {
            void onToggleStar(item);
            onClose();
          }}
          className="w-full px-2.5 py-1.5 flex items-center gap-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 active:bg-slate-200/60 rounded-lg transition cursor-pointer font-medium"
        >
          <Star
            className={`h-4 w-4 shrink-0 ${
              item.starred ? "text-amber-500 fill-amber-500" : "text-slate-400"
            }`}
          />
          <span>{item.starred ? "Remove from Starred" : "Add to Starred"}</span>
        </button>

        <button
          onClick={() => {
            onRename(item);
            onClose();
          }}
          className="w-full px-2.5 py-1.5 flex items-center gap-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 active:bg-slate-200/60 rounded-lg transition cursor-pointer font-medium"
        >
          <Edit2 className="h-4 w-4 text-slate-400 shrink-0" />
          <span>Rename</span>
        </button>

        {onMove && (
          <button
            onClick={() => {
              onMove(item);
              onClose();
            }}
            className="w-full px-2.5 py-1.5 flex items-center gap-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 active:bg-slate-200/60 rounded-lg transition cursor-pointer font-medium"
          >
            <FolderInput className="h-4 w-4 text-slate-400 shrink-0" />
            <span>Move to...</span>
          </button>
        )}

        <button
          onClick={() => {
            onDetails(item);
            onClose();
          }}
          className="w-full px-2.5 py-1.5 flex items-center gap-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 active:bg-slate-200/60 rounded-lg transition cursor-pointer font-medium"
        >
          <Info className="h-4 w-4 text-slate-400 shrink-0" />
          <span>File details</span>
        </button>
      </div>

      <div className="py-0.5">
        <button
          onClick={() => {
            void onDelete(item);
            onClose();
          }}
          className="w-full px-2.5 py-1.5 flex items-center gap-2.5 text-rose-600 hover:bg-rose-50 active:bg-rose-100 rounded-lg transition cursor-pointer font-medium"
        >
          <Trash2 className="h-4 w-4 shrink-0 text-rose-500" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
}

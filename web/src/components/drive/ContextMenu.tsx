"use client";

import { useEffect, useRef } from "react";
import { VfsItem } from "@/stores/drive.store";
import { Download, Trash2, Star, Edit2, Info, Share2 } from "lucide-react";

export interface ContextMenuProps {
  x: number;
  y: number;
  item: VfsItem;
  onClose: () => void;
  onDownload: (item: VfsItem) => Promise<void>;
  onDelete: (item: VfsItem) => Promise<void>;
  onToggleStar: (item: VfsItem) => Promise<void>;
  onRename: (item: VfsItem) => void;
  onDetails: (item: VfsItem) => void;
  onShare?: (item: VfsItem) => void;
}

export function ContextMenu({
  x,
  y,
  item,
  onClose,
  onDownload,
  onDelete,
  onToggleStar,
  onRename,
  onDetails,
  onShare,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [onClose]);

  // Prevent context menu from overflowing the screen
  const adjustedX = Math.min(
    x,
    typeof window !== "undefined" ? window.innerWidth - 180 : x,
  );
  const adjustedY = Math.min(
    y,
    typeof window !== "undefined" ? window.innerHeight - 240 : y,
  );

  return (
    <div
      ref={menuRef}
      style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
      className="fixed z-50 w-44 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 text-xs font-sans animate-in fade-in zoom-in-95 duration-100"
    >
      {item.type === "file" && onShare && (
        <button
          onClick={() => {
            onShare(item);
            onClose();
          }}
          className="w-full px-3 py-1.5 flex items-center gap-2.5 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
        >
          <Share2 className="h-3.5 w-3.5 text-blue-600" />
          <span>Share link</span>
        </button>
      )}

      {item.type === "file" && (
        <button
          onClick={() => {
            void onDownload(item);
            onClose();
          }}
          className="w-full px-3 py-1.5 flex items-center gap-2.5 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
        >
          <Download className="h-3.5 w-3.5 text-slate-500" />
          <span>Download</span>
        </button>
      )}

      <button
        onClick={() => {
          void onToggleStar(item);
          onClose();
        }}
        className="w-full px-3 py-1.5 flex items-center gap-2.5 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
      >
        <Star
          className={`h-3.5 w-3.5 ${
            item.starred ? "text-amber-500 fill-amber-500" : "text-slate-500"
          }`}
        />
        <span>{item.starred ? "Unstar" : "Star"}</span>
      </button>

      <button
        onClick={() => {
          onRename(item);
          onClose();
        }}
        className="w-full px-3 py-1.5 flex items-center gap-2.5 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
      >
        <Edit2 className="h-3.5 w-3.5 text-slate-500" />
        <span>Rename</span>
      </button>

      <button
        onClick={() => {
          onDetails(item);
          onClose();
        }}
        className="w-full px-3 py-1.5 flex items-center gap-2.5 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
      >
        <Info className="h-3.5 w-3.5 text-slate-500" />
        <span>File details</span>
      </button>

      <div className="border-t border-slate-100 my-1" />

      <button
        onClick={() => {
          void onDelete(item);
          onClose();
        }}
        className="w-full px-3 py-1.5 flex items-center gap-2.5 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span>Delete</span>
      </button>
    </div>
  );
}

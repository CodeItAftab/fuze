"use client";

import { Upload, FolderPlus, X } from "lucide-react";

interface MobileActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadClick: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNewFolderClick: () => void;
}

export function MobileActionSheet({
  isOpen,
  onClose,
  onUploadClick,
  onNewFolderClick,
}: MobileActionSheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-t-2xl p-5 shadow-2xl border-t border-slate-200 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
          <span className="font-semibold text-sm text-slate-900">
            Create New
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-1.5 pt-1">
          <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-800 font-medium text-xs cursor-pointer">
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Upload className="h-4 w-4" />
            </div>
            <div>
              <span className="block text-xs">Upload File</span>
              <span className="text-[10px] text-slate-400 font-normal">
                Select from phone gallery or files
              </span>
            </div>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={onUploadClick}
            />
          </label>

          <button
            onClick={() => {
              onClose();
              onNewFolderClick();
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-800 font-medium text-xs text-left cursor-pointer"
          >
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <FolderPlus className="h-4 w-4" />
            </div>
            <div>
              <span className="block text-xs">New Folder</span>
              <span className="text-[10px] text-slate-400 font-normal">
                Organize your documents
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

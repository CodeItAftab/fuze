"use client";

import { useState } from "react";

interface NewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}

export function NewFolderModal({
  isOpen,
  onClose,
  onCreate,
}: NewFolderModalProps) {
  const [folderName, setFolderName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = folderName.trim();
    if (!trimmed || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onCreate(trimmed);
      setFolderName("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">
          New Folder
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Enter a title for your new folder.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            autoFocus
            placeholder="Folder title"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:bg-white mb-4"
          />
          <div className="flex justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!folderName.trim() || isSubmitting}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition cursor-pointer"
            >
              {isSubmitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

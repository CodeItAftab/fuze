"use client";

import { useEffect, useState, useCallback } from "react";
import { Sidebar } from "@/components/drive/Sidebar";
import { VerificationBanner } from "@/components/drive/VerificationBanner";
import { useDriveStore, VfsItem } from "@/stores/drive.store";
import {
  Trash2,
  RotateCcw,
  FileText,
  Folder,
  Menu,
  X,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { formatBytes } from "@/lib/format";

export default function TrashPage() {
  const [trashedItems, setTrashedItems] = useState<VfsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [showBatchPermanentConfirm, setShowBatchPermanentConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<VfsItem | null>(null);

  const { setMobileSidebarOpen } = useDriveStore();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const loadTrash = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/files/trash`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const items: VfsItem[] = data.items || [];
        setTrashedItems(items);
        setSelectedIds((prev) => {
          const next = new Set<string>();
          for (const item of items) {
            if (prev.has(item.id)) next.add(item.id);
          }
          return next;
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    let active = true;
    const fetchInitial = async () => {
      try {
        const res = await fetch(`${apiUrl}/files/trash`, { credentials: "include" });
        if (res.ok && active) {
          const data = await res.json();
          setTrashedItems(data.items || []);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void fetchInitial();
    return () => {
      active = false;
    };
  }, [apiUrl]);

  // Selection handlers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === trashedItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(trashedItems.map((item) => item.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Keyboard shortcut: Escape clears selection or closes open modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showEmptyConfirm) {
          setShowEmptyConfirm(false);
        } else if (showBatchPermanentConfirm) {
          setShowBatchPermanentConfirm(false);
        } else if (itemToDelete) {
          setItemToDelete(null);
        } else if (selectedIds.size > 0) {
          clearSelection();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showEmptyConfirm, showBatchPermanentConfirm, itemToDelete, selectedIds.size]);

  // Restore single item
  const handleRestore = async (id: string) => {
    setIsProcessing(true);
    try {
      await fetch(`${apiUrl}/files/${id}/restore`, {
        method: "POST",
        credentials: "include",
      });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await loadTrash();
    } finally {
      setIsProcessing(false);
    }
  };

  // Batch restore selected items
  const handleBatchRestore = async () => {
    if (selectedIds.size === 0 || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`${apiUrl}/files/batch-restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nodeIds: Array.from(selectedIds) }),
      });
      if (res.ok) {
        setSelectedIds(new Set());
        await loadTrash();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Batch permanent delete
  const handleBatchPermanentDelete = async () => {
    if (selectedIds.size === 0 || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`${apiUrl}/files/batch-permanent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nodeIds: Array.from(selectedIds) }),
      });
      if (res.ok) {
        setSelectedIds(new Set());
        setShowBatchPermanentConfirm(false);
        await loadTrash();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Empty entire trash
  const handleEmptyTrash = async () => {
    if (trashedItems.length === 0 || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`${apiUrl}/files/trash/empty`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setSelectedIds(new Set());
        setShowEmptyConfirm(false);
        await loadTrash();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Single item permanent delete
  const handleSinglePermanentDelete = async () => {
    if (!itemToDelete || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`${apiUrl}/files/${itemToDelete.id}/permanent`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(itemToDelete.id);
          return next;
        });
        setItemToDelete(null);
        await loadTrash();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const totalTrashedSize = trashedItems
    .filter((item) => item.type === "file")
    .reduce((acc, item) => acc + (item.size || 0), 0);
  const totalSelectedSize = trashedItems
    .filter((item) => selectedIds.has(item.id) && item.type === "file")
    .reduce((acc, item) => acc + (item.size || 0), 0);

  const allSelected = trashedItems.length > 0 && selectedIds.size === trashedItems.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < trashedItems.length;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans">
      <Sidebar onNewFolderClick={() => {}} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        <VerificationBanner />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-24 sm:pb-8 w-full max-w-7xl mx-auto">
          {/* Header with Mobile Menu Button & Empty Trash Action */}
          <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 mb-5 sm:mb-6">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                aria-label="Open sidebar menu"
                className="lg:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer shrink-0"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-slate-400" />
                <span>Trash</span>
              </h1>
              <span className="hidden sm:inline-flex items-center text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium ml-1">
                {trashedItems.length} {trashedItems.length === 1 ? "item" : "items"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={trashedItems.length === 0 || isLoading || isProcessing}
                onClick={() => setShowEmptyConfirm(true)}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/80 rounded-lg transition disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Permanently erase all items in trash"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Empty Trash</span>
              </button>
            </div>
          </div>

          {/* Sticky Floating Action Bar for Selected Items */}
          {selectedIds.size > 0 && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="sticky top-0 z-30 mb-5 bg-white border border-blue-200/90 rounded-2xl px-3.5 sm:px-4 py-2.5 shadow-md shadow-blue-500/5 flex flex-wrap items-center justify-between gap-2.5 animate-in fade-in slide-in-from-top-2 duration-150 ring-1 ring-blue-500/10"
            >
              {/* Left Side: Close button, Selection Count, and Select All helper */}
              <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={clearSelection}
                  className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
                  title="Clear selection (Esc)"
                  aria-label="Clear selection"
                >
                  <X className="h-4 w-4" />
                </button>
                <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                  {selectedIds.size} selected
                </span>
                {totalSelectedSize > 0 && (
                  <span className="text-xs text-slate-500 hidden sm:inline">
                    ({formatBytes(totalSelectedSize)})
                  </span>
                )}
                {selectedIds.size < trashedItems.length && (
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer ml-1"
                  >
                    Select all {trashedItems.length}
                  </button>
                )}
              </div>

              {/* Right Side: Batch Actions */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleBatchRestore}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer border border-blue-200/80 disabled:opacity-50"
                  title="Restore selected items to Drive"
                >
                  {isProcessing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5" />
                  )}
                  <span>Restore ({selectedIds.size})</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setShowBatchPermanentConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition cursor-pointer border border-rose-200/80 disabled:opacity-50"
                  title="Permanently delete selected items"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Permanently</span>
                </button>
              </div>
            </div>
          )}

          {/* Trash Content Area */}
          {isLoading ? (
            <div className="text-center py-16 text-slate-400 text-xs flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              <span>Loading trash...</span>
            </div>
          ) : trashedItems.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-xl p-12 text-center max-w-sm mx-auto my-12 bg-white">
              <Trash2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-700 text-xs">
                Trash is empty
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Items moved to trash will be permanently purged after 30 days.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              {/* Table Header with Master Select All Checkbox */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs font-medium">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <label className="flex items-center cursor-pointer p-0.5">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) {
                          el.indeterminate = someSelected;
                        }
                      }}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                      title={allSelected ? "Deselect all" : "Select all"}
                    />
                  </label>
                  <span className="truncate">Name</span>
                </div>
                <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                  <span className="hidden sm:inline-block w-24 text-right">Size</span>
                  <span className="w-20 sm:w-28 text-right">Actions</span>
                </div>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-100">
                {trashedItems.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  const isFolder = item.type === "folder";
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleSelect(item.id)}
                      className={`px-4 py-3 flex items-center justify-between transition text-xs gap-3 cursor-pointer select-none ${
                        isSelected
                          ? "bg-blue-50/60 hover:bg-blue-50/80 ring-1 ring-inset ring-blue-200/70"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(item.id)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                          />
                        </div>
                        <div className="shrink-0 p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                          {isFolder ? (
                            <Folder className="h-4 w-4 text-amber-500" />
                          ) : (
                            <FileText className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div
                            className={`font-medium text-xs truncate ${
                              isSelected ? "text-blue-900 font-semibold" : "text-slate-800"
                            }`}
                            title={item.name}
                          >
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-400 sm:hidden mt-0.5">
                            {isFolder ? "Folder • In Trash" : `${formatBytes(item.size)} • In Trash`}
                          </div>
                        </div>
                      </div>

                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-4 sm:gap-6 shrink-0"
                      >
                        <span className="hidden sm:inline-block w-24 text-right text-slate-500">
                          {isFolder ? "—" : formatBytes(item.size)}
                        </span>
                        <div className="w-20 sm:w-28 flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleRestore(item.id)}
                            className="px-2 sm:px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition flex items-center gap-1.5 font-medium text-xs cursor-pointer border border-blue-100 disabled:opacity-50"
                            title="Restore to Drive"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Restore</span>
                          </button>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer border border-transparent hover:border-rose-100 disabled:opacity-50"
                            title="Permanently Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal 1: Empty Trash Confirmation */}
      {showEmptyConfirm && (
        <div
          onClick={() => !isProcessing && setShowEmptyConfirm(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 p-6 text-xs font-sans animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5 text-rose-600 font-bold text-sm">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>Empty Trash?</span>
              </div>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setShowEmptyConfirm(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-slate-600 leading-relaxed mb-6 text-xs">
              Are you sure you want to permanently delete all{" "}
              <strong className="text-slate-900 font-semibold">
                {trashedItems.length} {trashedItems.length === 1 ? "item" : "items"}
              </strong>
              {totalTrashedSize > 0 && ` (${formatBytes(totalTrashedSize)})`}? All
              underlying cloud storage chunks will be permanently purged and cloud
              storage quota will be reclaimed.{" "}
              <strong className="text-rose-600 font-semibold">
                This action cannot be undone.
              </strong>
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setShowEmptyConfirm(false)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-xl font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleEmptyTrash}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold transition cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span>Empty Trash</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Batch Permanent Delete Confirmation */}
      {showBatchPermanentConfirm && (
        <div
          onClick={() => !isProcessing && setShowBatchPermanentConfirm(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 p-6 text-xs font-sans animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5 text-rose-600 font-bold text-sm">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>Permanently Delete Selected Items?</span>
              </div>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setShowBatchPermanentConfirm(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-slate-600 leading-relaxed mb-6 text-xs">
              Permanently delete{" "}
              <strong className="text-slate-900 font-semibold">
                {selectedIds.size} {selectedIds.size === 1 ? "item" : "items"}
              </strong>
              {totalSelectedSize > 0 && ` (${formatBytes(totalSelectedSize)})`}? Their
              cloud chunks will be permanently erased and storage will be reclaimed.{" "}
              <strong className="text-rose-600 font-semibold">
                This action cannot be undone.
              </strong>
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setShowBatchPermanentConfirm(false)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-xl font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleBatchPermanentDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold transition cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Single Item Permanent Delete Confirmation */}
      {itemToDelete && (
        <div
          onClick={() => !isProcessing && setItemToDelete(null)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 p-6 text-xs font-sans animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5 text-rose-600 font-bold text-sm">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>Permanently Delete Item?</span>
              </div>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setItemToDelete(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-slate-600 leading-relaxed mb-6 text-xs">
              Permanently delete{" "}
              <strong className="text-slate-900 font-semibold break-all">
                &ldquo;{itemToDelete.name}&rdquo;
              </strong>
              {itemToDelete.type === "file" && itemToDelete.size > 0 && ` (${formatBytes(itemToDelete.size)})`}
              {itemToDelete.type === "folder" && " and all its contents"}? Cloud
              chunks will be permanently erased and storage will be reclaimed.{" "}
              <strong className="text-rose-600 font-semibold">
                This action cannot be undone.
              </strong>
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-xl font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleSinglePermanentDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold transition cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

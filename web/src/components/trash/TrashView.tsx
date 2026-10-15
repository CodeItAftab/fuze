"use client";

import { useEffect, useState, useCallback } from "react";
import { Sidebar } from "@/components/drive/Sidebar";
import { VerificationBanner } from "@/components/drive/VerificationBanner";
import { EmptyTrashModal } from "@/components/trash/EmptyTrashModal";
import { PermanentDeleteModal } from "@/components/trash/PermanentDeleteModal";
import { TrashTable } from "@/components/trash/TrashTable";
import { TrashActionBar } from "@/components/trash/TrashActionBar";
import { useDriveStore, VfsItem } from "@/stores/drive.store";
import { Trash2, Menu } from "lucide-react";
import { formatBytes } from "@/lib/format";

export function TrashView() {
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

  const handleSinglePermanentDelete = async (id: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${apiUrl}/files/${id}/permanent`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setItemToDelete(null);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        await loadTrash();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEmptyTrash = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${apiUrl}/files/trash/empty`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setShowEmptyConfirm(false);
        setSelectedIds(new Set());
        await loadTrash();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const totalTrashedBytes = trashedItems.reduce((acc, i) => acc + (i.size || 0), 0);

  const selectedTotalSize = trashedItems
    .filter((i) => selectedIds.has(i.id))
    .reduce((acc, i) => acc + (i.size || 0), 0);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans">
      <Sidebar onNewFolderClick={() => {}} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        <VerificationBanner />

        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open navigation menu"
              className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-bold text-sm text-slate-900">Trash</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-slate-400" />
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Trash
                </h1>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                  {trashedItems.length} items ({formatBytes(totalTrashedBytes)})
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Items in trash can be restored or permanently removed from all connected clouds.
              </p>
            </div>

            {trashedItems.length > 0 && (
              <button
                onClick={() => setShowEmptyConfirm(true)}
                disabled={isProcessing}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold transition cursor-pointer self-start sm:self-auto disabled:opacity-50"
              >
                Empty Trash
              </button>
            )}
          </div>

          <TrashActionBar
            selectedCount={selectedIds.size}
            totalSelectedSize={selectedTotalSize}
            totalTrashCount={trashedItems.length}
            isProcessing={isProcessing}
            formatBytes={formatBytes}
            onClearSelection={clearSelection}
            onSelectAll={toggleSelectAll}
            onBatchRestore={handleBatchRestore}
            onBatchPermanentDelete={() => setShowBatchPermanentConfirm(true)}
          />

          <TrashTable
            trashedItems={trashedItems}
            isLoading={isLoading}
            selectedIds={selectedIds}
            isProcessing={isProcessing}
            formatBytes={formatBytes}
            onToggleSelectAll={toggleSelectAll}
            onToggleSelect={toggleSelect}
            onRestore={handleRestore}
            onDeleteItem={(item: VfsItem) => setItemToDelete(item)}
          />

          <EmptyTrashModal
            isOpen={showEmptyConfirm}
            itemCount={trashedItems.length}
            totalSizeFormatted={formatBytes(totalTrashedBytes)}
            isProcessing={isProcessing}
            onClose={() => setShowEmptyConfirm(false)}
            onConfirm={handleEmptyTrash}
          />

          <PermanentDeleteModal
            isOpen={showBatchPermanentConfirm || !!itemToDelete}
            item={itemToDelete}
            selectedCount={selectedIds.size}
            totalSizeFormatted={formatBytes(selectedTotalSize)}
            isProcessing={isProcessing}
            onClose={() => {
              setShowBatchPermanentConfirm(false);
              setItemToDelete(null);
            }}
            onConfirm={() => {
              if (showBatchPermanentConfirm) {
                void handleBatchPermanentDelete();
              } else if (itemToDelete) {
                void handleSinglePermanentDelete(itemToDelete.id);
              }
            }}
          />
        </main>
      </div>
    </div>
  );
}

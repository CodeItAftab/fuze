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

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans">
      <Sidebar onNewFolderClick={() => {}} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        <VerificationBanner />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-24 sm:pb-8 w-full max-w-7xl mx-auto">
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

          <TrashActionBar
            selectedCount={selectedIds.size}
            totalSelectedSize={totalSelectedSize}
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
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onRestore={handleRestore}
            onDeleteItem={(item) => setItemToDelete(item)}
          />
        </main>
      </div>

      <EmptyTrashModal
        isOpen={showEmptyConfirm}
        itemCount={trashedItems.length}
        totalSizeFormatted={totalTrashedSize > 0 ? formatBytes(totalTrashedSize) : ""}
        isProcessing={isProcessing}
        onClose={() => setShowEmptyConfirm(false)}
        onConfirm={handleEmptyTrash}
      />

      <PermanentDeleteModal
        isOpen={showBatchPermanentConfirm}
        item={null}
        selectedCount={selectedIds.size}
        totalSizeFormatted={totalSelectedSize > 0 ? formatBytes(totalSelectedSize) : ""}
        isProcessing={isProcessing}
        onClose={() => setShowBatchPermanentConfirm(false)}
        onConfirm={handleBatchPermanentDelete}
      />

      <PermanentDeleteModal
        isOpen={!!itemToDelete}
        item={itemToDelete}
        totalSizeFormatted={itemToDelete && itemToDelete.size > 0 ? formatBytes(itemToDelete.size) : ""}
        isProcessing={isProcessing}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleSinglePermanentDelete}
      />
    </div>
  );
}

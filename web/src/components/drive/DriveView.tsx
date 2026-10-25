"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDriveStore, VfsItem } from "@/stores/drive.store";
import { useAuthStore } from "@/stores/auth.store";
import { uploadQueueManager } from "@/lib/upload-queue";
import { socketClient } from "@/lib/socket";
import { Sidebar } from "@/components/drive/Sidebar";
import { VerificationBanner } from "@/components/drive/VerificationBanner";
import { PendingRestoreBanner } from "@/components/drive/PendingRestoreBanner";
import { UploadWidget } from "@/components/upload/UploadWidget";
import { ContextMenu } from "@/components/drive/ContextMenu";
import { FileDetailsModal } from "@/components/drive/FileDetailsModal";
import { ShareModal } from "@/components/drive/ShareModal";
import { MoveModal } from "@/components/drive/MoveModal";
import { RenameModal } from "@/components/drive/RenameModal";
import { FilePreviewModal } from "@/components/drive/FilePreviewModal";
import { DriveBreadcrumbs } from "@/components/drive/DriveBreadcrumbs";
import { DriveSelectionBar } from "@/components/drive/DriveSelectionBar";
import { DriveToolbar, SortOption } from "@/components/drive/DriveToolbar";
import { DriveFolderGrid } from "@/components/drive/DriveFolderGrid";
import {
  DriveFileGrid,
  DriveFileList,
} from "@/components/drive/DriveFileViews";
import { NewFolderModal } from "@/components/drive/NewFolderModal";
import { MobileActionSheet } from "@/components/drive/MobileActionSheet";
import { downloadFile } from "@/lib/download-engine";
import { CloudUpload, HardDrive, Plus } from "lucide-react";
import { FloatingTransferHub } from "@/components/transfers/FloatingTransferHub";

interface DriveViewProps {
  folderId?: string | null;
  isStarredView?: boolean;
}

export function DriveView({
  folderId = null,
  isStarredView = false,
}: DriveViewProps) {
  const router = useRouter();
  const {
    breadcrumbs,
    setBreadcrumbs,
    items,
    setItems,
    setCurrentFolder,
    providers,
    setProviders,
    isLoading,
    setIsLoading,
    searchQuery,
    setSearchQuery,
    setMobileSidebarOpen,
    viewMode,
    setViewMode,
    folderCache,
    setFolderCache,
    invalidateFolderCache,
    refreshProviders,
    addItem,
    removeItem,
    invalidateTrashCache,
  } = useDriveStore();

  const { user } = useAuthStore();
  const [isDragging, setIsDragging] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showMobileActionSheet, setShowMobileActionSheet] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: VfsItem;
  } | null>(null);
  const [inspectItem, setInspectItem] = useState<VfsItem | null>(null);
  const [shareItem, setShareItem] = useState<VfsItem | null>(null);
  const [previewItem, setPreviewItem] = useState<VfsItem | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [moveTargetItems, setMoveTargetItems] = useState<VfsItem[]>([]);
  const [renameItem, setRenameItem] = useState<VfsItem | null>(null);

  const [sortBy, setSortBy] = useState<"date" | "name" | "size">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [hasActiveUploads, setHasActiveUploads] = useState(false);
  const [isUploadWidgetOpen, setIsUploadWidgetOpen] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const sortOptions: SortOption[] = useMemo(
    () => [
      { id: "date-desc", label: "Last Modified", field: "date", order: "desc" },
      { id: "date-asc", label: "Oldest First", field: "date", order: "asc" },
      { id: "name-asc", label: "Name (A to Z)", field: "name", order: "asc" },
      { id: "name-desc", label: "Name (Z to A)", field: "name", order: "desc" },
      {
        id: "size-desc",
        label: "Size (Largest)",
        field: "size",
        order: "desc",
      },
    ],
    [],
  );

  const getDisplayBadge = useCallback(
    (file: VfsItem) => {
      if (file.providerBadge) return file.providerBadge;
      if (providers.length === 1) {
        const prov = providers[0].provider;
        const nameMap: Record<string, string> = {
          google_drive: "Google Drive (Whole)",
          one_drive: "OneDrive (Whole)",
          dropbox: "Dropbox (Whole)",
          pcloud: "pCloud (Whole)",
          box: "Box (Whole)",
        };
        return nameMap[prov] || `${prov} (Whole)`;
      }
      if (providers.length > 1) {
        return `Multi-Cloud (${providers.length} Providers)`;
      }
      return "Direct Cloud";
    },
    [providers],
  );

  const navigateToFolder = useCallback(
    (targetFolderId: string | null, targetFolderName?: string) => {
      if (targetFolderId) {
        if (targetFolderName) {
          document.title = `${targetFolderName} - Fuze Drive`;
        }
        router.push(`/dashboard/folder/${targetFolderId}`);
      } else {
        document.title = "Dashboard | Fuze Drive";
        router.push("/dashboard");
      }
    },
    [router],
  );

  const cacheKey = isStarredView ? "starred" : folderId || "root";

  const fetchData = useCallback(
    async (isBackground = false) => {
      if (!isBackground) {
        setIsLoading(true);
      }
      try {
        const endpoint = isStarredView
          ? `${apiUrl}/files/starred`
          : `${apiUrl}/files${folderId ? `?parentId=${folderId}` : ""}`;

        const filesRes = await fetch(endpoint, { credentials: "include" });

        if (filesRes.ok) {
          const data = await filesRes.json();
          const newItems = data.items || [];
          setItems(newItems);

          let newCrumbs = breadcrumbs;
          if (isStarredView) {
            newCrumbs = [{ id: null, name: "Starred" }];
          } else if (data.breadcrumbs && Array.isArray(data.breadcrumbs)) {
            newCrumbs = data.breadcrumbs;
          } else if (!folderId) {
            newCrumbs = [{ id: null, name: "My Drive" }];
          }
          setBreadcrumbs(newCrumbs);

          // Update SWR cache
          setFolderCache(cacheKey, newItems, newCrumbs);
        }

        // Throttled 60s provider fetch (skips network if fresh)
        void refreshProviders();
      } catch (err) {
        console.error("Failed to fetch drive data:", err);
      } finally {
        if (!isBackground) {
          setIsLoading(false);
        }
      }
    },
    [
      apiUrl,
      folderId,
      isStarredView,
      cacheKey,
      breadcrumbs,
      setItems,
      setBreadcrumbs,
      setFolderCache,
      refreshProviders,
      setIsLoading,
    ],
  );

  useEffect(() => {
    setCurrentFolder(folderId || null);

    const cached = folderCache[cacheKey];
    if (cached) {
      // ⚡ INSTANT RENDER (0ms latency, zero skeleton flash)
      setItems(cached.items);
      setBreadcrumbs(cached.breadcrumbs);
      setIsLoading(false);

      // SWR: Revalidate in background if older than 20 seconds
      const isStale = Date.now() - cached.cachedAt > 20_000;
      if (isStale) {
        void fetchData(true);
      }
    } else {
      // First visit: show skeleton and fetch
      void fetchData(false);
    }
  }, [folderId, cacheKey, setCurrentFolder]);

  // Synchronize browser tab title with opened folder, view, or root
  useEffect(() => {
    if (isStarredView) {
      document.title = "Starred - Fuze Drive";
      return;
    }

    if (folderId) {
      const currentCrumb =
        breadcrumbs.find((b) => b.id === folderId) ||
        (breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 1] : null);

      if (currentCrumb && currentCrumb.name && currentCrumb.id !== null) {
        document.title = `${currentCrumb.name} - Fuze Drive`;
      }
    } else {
      document.title = "Dashboard | Fuze Drive";
    }
  }, [folderId, breadcrumbs, isStarredView]);

  useEffect(() => {
    socketClient.connect();
  }, []);

  useEffect(() => {
    const unsub = uploadQueueManager.subscribe((queue) => {
      const hasItems = queue.length > 0 && !uploadQueueManager.getDismissed();
      setHasActiveUploads(hasItems);
    });
    return () => {
      unsub();
    };
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (user?.emailVerified !== true) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadQueueManager.addFiles(
        Array.from(e.dataTransfer.files),
        folderId || null,
      );
    }
  };

  const handleMobileFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (user?.emailVerified !== true) {
      setShowMobileActionSheet(false);
      return;
    }
    if (e.target.files && e.target.files.length > 0) {
      uploadQueueManager.addFiles(Array.from(e.target.files), folderId || null);
      e.target.value = "";
    }
    setShowMobileActionSheet(false);
  };

  const handleCreateFolder = async (name: string) => {
    try {
      const res = await fetch(`${apiUrl}/files/folder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          parentId: folderId || null,
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.folder) {
          addItem(data.folder);
        } else {
          void fetchData(true);
        }
      }
    } catch (err) {
      console.error("Failed to create folder:", err);
    }
  };

  const handleDownload = async (item: VfsItem) => {
    try {
      await downloadFile({ fileId: item.id, fileName: item.name });
    } catch (err) {
      console.warn(
        "Client-side download failed, falling back to server stream:",
        err,
      );
      const link = document.createElement("a");
      link.href = `${apiUrl}/files/${item.id}/download`;
      link.download = item.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleRenameSuccess = (item: VfsItem, newName: string) => {
    addItem({ ...item, name: newName });
  };

  const handleDelete = async (item: VfsItem) => {
    try {
      const res = await fetch(`${apiUrl}/files/${item.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        removeItem(item.id);
        invalidateTrashCache();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleToggleStar = async (item: VfsItem) => {
    try {
      const res = await fetch(`${apiUrl}/files/${item.id}/star`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        addItem({ ...item, starred: !item.starred });
        invalidateFolderCache("starred");
      }
    } catch (err) {
      console.error("Star toggle failed:", err);
    }
  };

  const processedItems = useMemo(() => {
    let result = [...items];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(query));
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "date") {
        comparison =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === "size") {
        comparison = a.size - b.size;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [items, searchQuery, sortBy, sortOrder]);

  const folders = processedItems.filter((i) => i.type === "folder");
  const files = processedItems.filter((i) => i.type === "file");

  const toggleSelectCheckbox = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      setLastSelectedId(id);
    },
    [],
  );

  const handleItemClick = useCallback(
    (item: VfsItem, e: React.MouseEvent) => {
      if (e.shiftKey && lastSelectedId) {
        e.stopPropagation();
        const ids = processedItems.map((i) => i.id);
        const lastIdx = ids.indexOf(lastSelectedId);
        const currIdx = ids.indexOf(item.id);
        if (lastIdx !== -1 && currIdx !== -1) {
          const start = Math.min(lastIdx, currIdx);
          const end = Math.max(lastIdx, currIdx);
          const rangeIds = ids.slice(start, end + 1);
          setSelectedIds((prev) => new Set([...Array.from(prev), ...rangeIds]));
          return;
        }
      }

      if (selectedIds.size > 0 || e.ctrlKey || e.metaKey) {
        e.stopPropagation();
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(item.id)) {
            next.delete(item.id);
          } else {
            next.add(item.id);
          }
          return next;
        });
        setLastSelectedId(item.id);
        return;
      }

      if (item.type === "folder") {
        navigateToFolder(item.id, item.name);
      } else {
        router.push(`/preview/${item.id}`);
      }
    },
    [selectedIds, lastSelectedId, processedItems, navigateToFolder, router],
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setLastSelectedId(null);
  }, []);

  const handleOpenMove = (targetItems: VfsItem[]) => {
    setMoveTargetItems(targetItems);
    setMoveModalOpen(true);
  };

  const handleBatchStar = async (star: boolean) => {
    if (selectedIds.size === 0) return;
    const nodeIds = Array.from(selectedIds);
    try {
      const res = await fetch(`${apiUrl}/files/batch-star`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nodeIds, starred: star }),
      });
      if (res.ok) {
        setItems(
          items.map((i) =>
            selectedIds.has(i.id) ? { ...i, starred: star } : i,
          ),
        );
        invalidateFolderCache("starred");
      }
    } catch (err) {
      console.error("Batch star failed:", err);
    }
  };

  const handleBatchDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (
      !window.confirm(`Move ${count} item${count > 1 ? "s" : ""} to trash?`)
    ) {
      return;
    }
    const nodeIds = Array.from(selectedIds);
    try {
      const res = await fetch(`${apiUrl}/files/batch-trash`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nodeIds }),
      });
      if (res.ok) {
        nodeIds.forEach((id) => removeItem(id));
        invalidateTrashCache();
        clearSelection();
      }
    } catch (err) {
      console.error("Batch delete failed:", err);
    }
  }, [apiUrl, selectedIds, items, setItems, clearSelection]);

  const handleBatchDownload = async () => {
    const selectedFiles = processedItems.filter(
      (i) => selectedIds.has(i.id) && i.type === "file",
    );
    for (const f of selectedFiles) {
      await handleDownload(f);
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }
      if (e.key === "Escape") {
        clearSelection();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.size > 0 && !showFolderModal && !moveModalOpen) {
          e.preventDefault();
          void handleBatchDelete();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [
    clearSelection,
    selectedIds,
    showFolderModal,
    moveModalOpen,
    handleBatchDelete,
  ]);

  return (
    <div
      className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Sidebar onNewFolderClick={() => setShowFolderModal(true)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        <VerificationBanner />
        <PendingRestoreBanner />
        {isDragging && (
          <div className="absolute inset-0 bg-blue-600/10 border-2 border-dashed border-blue-600 z-50 flex items-center justify-center backdrop-blur-xs pointer-events-none p-4">
            <div className="bg-white p-6 rounded-2xl shadow-xl flex items-center gap-3 text-blue-600 font-medium text-sm">
              <CloudUpload className="h-6 w-6 animate-bounce" />
              <span>Drop files anywhere to upload zero-proxy</span>
            </div>
          </div>
        )}

        {/* Fixed Sticky Top Navbar */}
        <header className="shrink-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 z-20">
          <DriveToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={(field, order) => {
              setSortBy(field);
              setSortOrder(order);
            }}
            sortOptions={sortOptions}
            showSortDropdown={showSortDropdown}
            setShowSortDropdown={setShowSortDropdown}
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          />
        </header>

        <main
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              clearSelection();
            }
          }}
          className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-28 sm:pb-28 lg:pb-8 w-full"
        >

          <DriveSelectionBar
            selectedCount={selectedIds.size}
            singleSelected={selectedIds.size === 1}
            hasFiles={processedItems.some(
              (i) => selectedIds.has(i.id) && i.type === "file",
            )}
            anyUnstarred={processedItems.some(
              (i) => selectedIds.has(i.id) && !i.starred,
            )}
            onClear={clearSelection}
            onMove={() => {
              const selectedItems = processedItems.filter((i) =>
                selectedIds.has(i.id),
              );
              handleOpenMove(selectedItems);
            }}
            onRename={() => {
              const item = processedItems.find((i) => selectedIds.has(i.id));
              if (item) setRenameItem(item);
            }}
            onDetails={() => {
              const item = processedItems.find((i) => selectedIds.has(i.id));
              if (item) setInspectItem(item);
            }}
            onToggleStar={() => {
              const anyUnstarred = processedItems.some(
                (i) => selectedIds.has(i.id) && !i.starred,
              );
              void handleBatchStar(anyUnstarred);
            }}
            onDownload={() => void handleBatchDownload()}
            onDelete={() => void handleBatchDelete()}
          />

          <DriveBreadcrumbs
            folderId={folderId}
            breadcrumbs={breadcrumbs}
            onNavigate={navigateToFolder}
          />

          {isLoading ? (
            <div className="space-y-6 animate-pulse">
              <div>
                <div className="h-3 w-16 bg-slate-200 rounded mb-2.5" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="border border-slate-200/80 rounded-xl px-3 py-2.5 sm:p-3.5 flex items-center gap-3 bg-white shadow-2xs"
                    >
                      <div className="h-6 w-6 rounded-lg bg-slate-200 shrink-0" />
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <div className="h-3 bg-slate-200 rounded w-24" />
                        <div className="h-2 bg-slate-100 rounded w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="h-3 w-12 bg-slate-200 rounded mb-2.5" />
                <div className="border border-slate-200/80 rounded-xl divide-y divide-slate-100 bg-white shadow-2xs overflow-hidden">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="p-3 sm:p-3.5 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-4 w-4 bg-slate-200 rounded shrink-0" />
                        <div className="h-3 bg-slate-200 rounded w-44" />
                      </div>
                      <div className="h-4 bg-slate-100 rounded-full w-24 hidden sm:block shrink-0" />
                      <div className="h-3 bg-slate-100 rounded w-14 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="transition-opacity duration-200 ease-in-out animate-in fade-in">
              <DriveFolderGrid
                folders={folders}
                selectedIds={selectedIds}
                onNavigate={navigateToFolder}
                onItemClick={handleItemClick}
                onToggleSelectCheckbox={toggleSelectCheckbox}
                onToggleStar={handleToggleStar}
                onOpenContextMenu={(folder, e) =>
                  setContextMenu({ x: e.clientX, y: e.clientY, item: folder })
                }
              />

              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Files
                </div>

                {files.length === 0 && folders.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-slate-200/90 rounded-xl bg-white p-6 shadow-2xs">
                    <HardDrive className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <div className="text-xs font-semibold text-slate-700">
                      This folder is empty
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                      Drag and drop files here or click + New Upload to store
                      across your clouds.
                    </p>
                  </div>
                ) : files.length === 0 ? (
                  <div className="py-8 px-4 bg-white border border-dashed border-slate-200/90 rounded-xl text-center text-xs text-slate-400">
                    No files in this folder
                  </div>
                ) : viewMode === "grid" ? (
                  <DriveFileGrid
                    files={files}
                    selectedIds={selectedIds}
                    getDisplayBadge={getDisplayBadge}
                    onPreview={(id) => router.push(`/preview/${id}`)}
                    onItemClick={handleItemClick}
                    onToggleSelectCheckbox={toggleSelectCheckbox}
                    onToggleStar={handleToggleStar}
                    onOpenContextMenu={(file, e) =>
                      setContextMenu({ x: e.clientX, y: e.clientY, item: file })
                    }
                  />
                ) : (
                  <DriveFileList
                    files={files}
                    selectedIds={selectedIds}
                    getDisplayBadge={getDisplayBadge}
                    onPreview={(id) => router.push(`/preview/${id}`)}
                    onItemClick={handleItemClick}
                    onToggleSelectCheckbox={toggleSelectCheckbox}
                    onToggleStar={handleToggleStar}
                    onOpenContextMenu={(file, e) =>
                      setContextMenu({ x: e.clientX, y: e.clientY, item: file })
                    }
                  />
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <button
        onClick={() => setShowMobileActionSheet(true)}
        aria-label="Upload file or create folder"
        className="lg:hidden fixed bottom-5 right-5 z-40 h-12 w-12 rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/30 flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all duration-200 cursor-pointer"
      >
        <Plus className="h-5 w-5" />
      </button>

      <MobileActionSheet
        isOpen={showMobileActionSheet}
        onClose={() => setShowMobileActionSheet(false)}
        onUploadClick={handleMobileFileUpload}
        onNewFolderClick={() => setShowFolderModal(true)}
      />

      <NewFolderModal
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        onCreate={handleCreateFolder}
      />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          item={contextMenu.item}
          isSelected={selectedIds.has(contextMenu.item.id)}
          onToggleSelect={(item) => {
            setSelectedIds((prev) => {
              const next = new Set(prev);
              if (next.has(item.id)) next.delete(item.id);
              else next.add(item.id);
              return next;
            });
            setLastSelectedId(item.id);
          }}
          onClose={() => setContextMenu(null)}
          onPreview={(item) => router.push(`/preview/${item.id}`)}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onToggleStar={handleToggleStar}
          onRename={(item) => setRenameItem(item)}
          onDetails={(item) => setInspectItem(item)}
          onShare={(item) => setShareItem(item)}
          onMove={(item) => handleOpenMove([item])}
        />
      )}

      {previewItem && (
        <FilePreviewModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
        />
      )}

      {inspectItem && (
        <FileDetailsModal
          item={inspectItem}
          onClose={() => setInspectItem(null)}
          onPreview={(item) => router.push(`/preview/${item.id}`)}
          onShare={(item) => {
            setInspectItem(null);
            setShareItem(item);
          }}
        />
      )}

      {shareItem && (
        <ShareModal item={shareItem} onClose={() => setShareItem(null)} />
      )}

      <MoveModal
        isOpen={moveModalOpen}
        itemsToMove={moveTargetItems}
        onClose={() => {
          setMoveModalOpen(false);
          setMoveTargetItems([]);
        }}
        onMoved={() => {
          clearSelection();
          void fetchData();
        }}
      />

      <RenameModal
        isOpen={!!renameItem}
        item={renameItem}
        onClose={() => setRenameItem(null)}
        onSuccess={handleRenameSuccess}
      />
      <FloatingTransferHub />
      {/* <UploadWidget onOpenChange={setIsUploadWidgetOpen} /> */}
    </div>
  );
}

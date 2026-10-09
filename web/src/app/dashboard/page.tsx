"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useDriveStore, VfsItem } from "@/stores/drive.store";
import { uploadQueueManager } from "@/lib/upload-queue";
import { socketClient } from "@/lib/socket";
import { Sidebar } from "@/components/drive/Sidebar";
import { UploadWidget } from "@/components/upload/UploadWidget";
import { ContextMenu } from "@/components/drive/ContextMenu";
import { FileDetailsModal } from "@/components/drive/FileDetailsModal";
import { ShareModal } from "@/components/drive/ShareModal";
import {
  Folder,
  FileText,
  ChevronRight,
  HardDrive,
  CloudUpload,
  MoreVertical,
  Image as ImageIcon,
  Video,
  FileCode,
  Archive,
  Star,
  Plus,
  Upload,
  FolderPlus,
  X,
  LayoutGrid,
  List,
  Search,
  Menu,
  ArrowUpDown,
  ChevronDown,
  Check,
} from "lucide-react";

export default function DashboardPage() {
  const {
    currentFolderId,
    breadcrumbs,
    items,
    setItems,
    setCurrentFolder,
    setProviders,
    viewMode,
    setViewMode,
    setIsLoading,
    searchQuery,
    setSearchQuery,
    setMobileSidebarOpen,
  } = useDriveStore();

  const [isDragging, setIsDragging] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showMobileActionSheet, setShowMobileActionSheet] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: VfsItem;
  } | null>(null);
  const [inspectItem, setInspectItem] = useState<VfsItem | null>(null);
  const [shareItem, setShareItem] = useState<VfsItem | null>(null);

  // Sorting and Category Filtering
  const [sortBy, setSortBy] = useState<"name" | "date" | "size">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [hasActiveUploads, setHasActiveUploads] = useState(false);
  const [isUploadWidgetOpen, setIsUploadWidgetOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = uploadQueueManager.subscribe((queue) => {
      const hasItems = queue.length > 0 && !uploadQueueManager.getDismissed();
      setHasActiveUploads(hasItems);
    });
    return () => {
      unsub();
    };
  }, []);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "folder" | "document" | "image" | "video"
  >("all");

  const sortOptions = useMemo(
    () => [
      { id: "date-desc", label: "Newest First", field: "date" as const, order: "desc" as const },
      { id: "date-asc", label: "Oldest First", field: "date" as const, order: "asc" as const },
      { id: "name-asc", label: "Name (A to Z)", field: "name" as const, order: "asc" as const },
      { id: "name-desc", label: "Name (Z to A)", field: "name" as const, order: "desc" as const },
      { id: "size-desc", label: "Size (Largest)", field: "size" as const, order: "desc" as const },
      { id: "size-asc", label: "Size (Smallest)", field: "size" as const, order: "asc" as const },
    ],
    [],
  );

  const currentSortLabel =
    sortOptions.find((opt) => opt.field === sortBy && opt.order === sortOrder)?.label ||
    "Newest First";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(e.target as Node)
      ) {
        setShowSortDropdown(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSortDropdown(false);
      }
      if (
        (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key === "k")) &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // 1. Initial Load & WebSocket Connection
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const folderParam = currentFolderId ? `?parentId=${currentFolderId}` : "";
      const [filesRes, provRes] = await Promise.all([
        fetch(`${apiUrl}/files${folderParam}`, { credentials: "include" }),
        fetch(`${apiUrl}/providers`, { credentials: "include" }),
      ]);

      if (filesRes.ok) {
        const data = await filesRes.json();
        setItems(data.items || []);
      }

      if (provRes.ok) {
        const pData = await provRes.json();
        setProviders(pData.providers || [], pData.summary || {});
      }
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, currentFolderId, setIsLoading, setItems, setProviders]);

  useEffect(() => {
    socketClient.connect();
    void fetchData();
  }, [fetchData]);

  // Intercept page reload/leave while uploading & trigger cloud cleanup beacon if user proceeds
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (uploadQueueManager.hasActiveUploads()) {
        e.preventDefault();
        e.returnValue =
          "You have ongoing uploads. If you leave or reload now, incomplete uploads will be cancelled and cleaned up.";
        return e.returnValue;
      }
    };

    const handlePageHide = () => {
      const sessionIds = uploadQueueManager.getActiveSessionIds();
      for (const sid of sessionIds) {
        if (typeof navigator !== "undefined" && navigator.sendBeacon) {
          navigator.sendBeacon(`${apiUrl}/uploads/${sid}/abort`);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [apiUrl]);

  // 2. Drag & Drop Support
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadQueueManager.addFiles(
        Array.from(e.dataTransfer.files),
        currentFolderId,
      );
    }
  };

  // Mobile file input selection
  const handleMobileFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadQueueManager.addFiles(Array.from(e.target.files), currentFolderId);
      e.target.value = "";
    }
    setShowMobileActionSheet(false);
  };

  // 3. New Folder Handler
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const res = await fetch(`${apiUrl}/files/folder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: newFolderName.trim(),
          parentId: currentFolderId,
        }),
      });

      if (res.ok) {
        setNewFolderName("");
        setShowFolderModal(false);
        void fetchData();
      }
    } catch (err) {
      console.error("Failed to create folder:", err);
    }
  };

  // 4. File Actions
  const handleDownload = async (item: VfsItem) => {
    const link = document.createElement("a");
    link.href = `${apiUrl}/files/${item.id}/download`;
    link.download = item.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (item: VfsItem) => {
    try {
      const res = await fetch(`${apiUrl}/files/${item.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setItems(items.filter((i) => i.id !== item.id));
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
        setItems(
          items.map((i) =>
            i.id === item.id ? { ...i, starred: !i.starred } : i,
          ),
        );
      }
    } catch (err) {
      console.error("Star toggle failed:", err);
    }
  };

  // 5. Client-Side Filtering & Sorting
  const processedItems = useMemo(() => {
    let result = [...items];

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(query));
    }

    // Category pill filter
    if (activeFilter !== "all") {
      result = result.filter((i) => {
        if (activeFilter === "folder") return i.type === "folder";
        if (i.type === "folder") return false;

        const mime = i.mimeType || "";
        const name = i.name.toLowerCase();

        if (activeFilter === "image") {
          return (
            mime.startsWith("image/") ||
            /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(name)
          );
        }
        if (activeFilter === "video") {
          return (
            mime.startsWith("video/") || /\.(mp4|mkv|webm|mov|avi)$/i.test(name)
          );
        }
        if (activeFilter === "document") {
          return (
            mime.startsWith("text/") ||
            mime.includes("pdf") ||
            /\.(pdf|doc|docx|txt|md|csv|xlsx|pptx)$/i.test(name)
          );
        }
        return true;
      });
    }

    // Sort order
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
  }, [items, searchQuery, activeFilter, sortBy, sortOrder]);

  const folders = processedItems.filter((i) => i.type === "folder");
  const files = processedItems.filter((i) => i.type === "file");

  // Helper for file type icons and badge
  const getFileIcon = (file: VfsItem) => {
    const mime = file.mimeType || "";
    const name = file.name.toLowerCase();

    if (
      mime.startsWith("image/") ||
      /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(name)
    ) {
      return <ImageIcon className="h-5 w-5 text-purple-600 shrink-0" />;
    }
    if (mime.startsWith("video/") || /\.(mp4|mkv|webm|mov|avi)$/i.test(name)) {
      return <Video className="h-5 w-5 text-rose-600 shrink-0" />;
    }
    if (
      name.endsWith(".zip") ||
      name.endsWith(".tar") ||
      name.endsWith(".gz")
    ) {
      return <Archive className="h-5 w-5 text-amber-600 shrink-0" />;
    }
    if (/\.(ts|tsx|js|jsx|json|py|html|css)$/i.test(name)) {
      return <FileCode className="h-5 w-5 text-emerald-600 shrink-0" />;
    }
    return <FileText className="h-5 w-5 text-blue-600 shrink-0" />;
  };

  return (
    <div
      className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Sidebar onNewFolderClick={() => setShowFolderModal(true)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {isDragging && (
          <div className="absolute inset-0 bg-blue-600/10 border-2 border-dashed border-blue-600 z-50 flex items-center justify-center backdrop-blur-xs pointer-events-none p-4">
            <div className="bg-white p-6 rounded-2xl shadow-xl flex items-center gap-3 text-blue-600 font-bold text-sm">
              <CloudUpload className="h-6 w-6 animate-bounce" />
              <span>Drop files anywhere to upload zero-proxy</span>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 w-full max-w-7xl">
          {/* Top Integrated Header: Menu button, Title & Sleek Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                aria-label="Open navigation menu"
                className="lg:hidden p-1.5 -ml-1 text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition cursor-pointer shrink-0"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                My Drive
              </h1>
            </div>

            {/* Modern Sleek Search Input */}
            <div className="w-full sm:w-72 md:w-80">
              <div className="relative flex items-center bg-slate-100/70 hover:bg-slate-100 focus-within:bg-white border border-slate-200/80 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15 rounded-xl transition duration-150 shadow-2xs">
                <Search className="h-3.5 w-3.5 text-slate-400 ml-3 pointer-events-none shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search files and folders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-2 pl-2.5 pr-8 text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
                />
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/60 transition cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <div className="hidden sm:flex items-center mr-2.5 pointer-events-none">
                    <kbd className="text-[10px] text-slate-400 font-mono bg-white border border-slate-200/80 px-1.5 py-0.5 rounded shadow-2xs">
                      /
                    </kbd>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Breadcrumb Header */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 font-medium overflow-x-auto scrollbar-none pb-1">
            <button
              onClick={() => setCurrentFolder(null)}
              className={`hover:text-blue-600 transition flex items-center gap-1 shrink-0 ${
                !currentFolderId ? "font-bold text-slate-900" : ""
              }`}
            >
              <HardDrive className="h-3.5 w-3.5" />
              <span>Root</span>
            </button>
            {breadcrumbs.map((crumb, idx) => (
              <div key={crumb.id || idx} className="flex items-center gap-1.5 shrink-0">
                <ChevronRight className="h-3 w-3 text-slate-400" />
                <button
                  onClick={() => setCurrentFolder(crumb.id, crumb.name)}
                  className={`hover:text-blue-600 transition ${
                    idx === breadcrumbs.length - 1 ? "font-bold text-slate-900" : ""
                  }`}
                >
                  {crumb.name}
                </button>
              </div>
            ))}
          </div>

          {/* Filter Pills & Sort Selector Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6 pb-3 sm:pb-4 border-b border-slate-200/80">
            {/* Category Filter Pills (Horizontal Scroll on Mobile) */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs py-1 -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
              {[
                { id: "all", label: "All Items" },
                { id: "folder", label: "Folders" },
                { id: "document", label: "Documents" },
                { id: "image", label: "Images" },
                { id: "video", label: "Videos" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() =>
                    setActiveFilter(
                      f.id as "all" | "folder" | "document" | "image" | "video",
                    )
                  }
                  className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer text-xs shrink-0 ${
                    activeFilter === f.id
                      ? "bg-slate-900 text-white shadow-xs font-semibold"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/90"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Sort & View Mode Toolbar */}
            <div className="flex items-center justify-between sm:justify-end gap-2.5 text-xs">
              {/* Custom Sort Dropdown */}
              <div className="relative" ref={sortDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-medium text-slate-700 shadow-2xs transition cursor-pointer select-none"
                  aria-expanded={showSortDropdown}
                  aria-label="Sort files"
                >
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  <span>{currentSortLabel}</span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>

                {showSortDropdown && (
                  <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 w-48 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Sort by
                    </div>
                    {sortOptions.map((opt) => {
                      const isSelected =
                        opt.field === sortBy && opt.order === sortOrder;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setSortBy(opt.field);
                            setSortOrder(opt.order);
                            setShowSortDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left transition cursor-pointer ${
                            isSelected
                              ? "bg-blue-50/80 text-blue-600 font-semibold"
                              : "text-slate-700 hover:bg-slate-50 font-normal"
                          }`}
                        >
                          <span className="truncate">{opt.label}</span>
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* View Toggle Controls (Grid / List) */}
              <div className="flex items-center gap-0.5 bg-slate-100 p-1 rounded-xl border border-slate-200/60 shrink-0">
                <button
                  onClick={() => setViewMode("grid")}
                  title="Grid view"
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-white text-blue-600 shadow-2xs font-semibold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={() => setViewMode("list")}
                  title="List view"
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    viewMode === "list"
                      ? "bg-white text-blue-600 shadow-2xs font-semibold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Folders Section */}
          {folders.length > 0 && (
            <div className="mb-6 sm:mb-8">
              <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 sm:mb-3">
                Folders ({folders.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 sm:gap-3">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    onDoubleClick={() =>
                      setCurrentFolder(folder.id, folder.name)
                    }
                    onClick={() => {
                      // On touch screens and tablets, single click opens the folder
                      if (window.innerWidth < 1024) {
                        setCurrentFolder(folder.id, folder.name);
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({
                        x: e.clientX,
                        y: e.clientY,
                        item: folder,
                      });
                    }}
                    className="p-2.5 sm:p-3 bg-white rounded-xl border border-slate-200/90 hover:border-blue-400 hover:shadow-xs transition cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                      <Folder className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-amber-500 fill-amber-500 shrink-0" />
                      <span
                        className="font-semibold text-xs text-slate-800 truncate"
                        title={folder.name}
                      >
                        {folder.name}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setContextMenu({
                          x: e.clientX,
                          y: e.clientY,
                          item: folder,
                        });
                      }}
                      className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition shrink-0"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files Section */}
          <div>
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 sm:mb-3">
              Files ({files.length})
            </h2>

            {files.length === 0 && folders.length === 0 ? (
              <div className="text-center py-16 sm:py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-white p-6">
                <HardDrive className="h-10 w-10 sm:h-12 sm:w-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-700">
                  This folder is empty
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Drag and drop files here, or tap the upload button to store
                  zero-proxy across your clouds.
                </p>
              </div>
            ) : files.length === 0 ? (
              <div className="py-6 px-4 bg-white/70 border border-dashed border-slate-200/90 rounded-xl text-center text-xs text-slate-400">
                No files in this folder
              </div>
            ) : viewMode === "grid" ? (
              /* Grid View */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 sm:gap-3.5">
                {files.map((file) => (
                  <div
                    key={file.id}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({
                        x: e.clientX,
                        y: e.clientY,
                        item: file,
                      });
                    }}
                    className="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400 hover:shadow-xs transition flex flex-col justify-between group relative"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 sm:p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        {getFileIcon(file)}
                      </div>
                      <div className="flex items-center gap-1">
                        {file.starred && (
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setContextMenu({
                              x: e.clientX,
                              y: e.clientY,
                              item: file,
                            });
                          }}
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <h4
                        className="font-semibold text-xs text-slate-800 truncate mb-1"
                        title={file.name}
                      >
                        {file.name}
                      </h4>
                      <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400">
                        <span>{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
                        <span className="hidden sm:inline">
                          {new Date(file.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="bg-white border border-slate-200/90 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-2xs">
                {files.map((file) => (
                  <div
                    key={file.id}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({
                        x: e.clientX,
                        y: e.clientY,
                        item: file,
                      });
                    }}
                    className="p-3 sm:p-3.5 px-3.5 sm:px-4 flex items-center justify-between hover:bg-slate-50 transition text-xs gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {getFileIcon(file)}
                      <span className="font-semibold text-slate-800 truncate">
                        {file.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-6 text-slate-500 shrink-0">
                      <span className="text-[11px] sm:text-xs">
                        {(file.size / (1024 * 1024)).toFixed(1)} MB
                      </span>
                      <span className="hidden sm:inline text-xs text-slate-400">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            item: file,
                          });
                        }}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Floating Action Button (FAB) on Mobile/Tablet screens */}
      <button
        onClick={() => setShowMobileActionSheet(true)}
        aria-label="Upload file or create folder"
        className={`lg:hidden fixed right-5 z-40 h-13 w-13 rounded-full bg-blue-600 text-white shadow-xl flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all duration-300 cursor-pointer ${
          hasActiveUploads
            ? isUploadWidgetOpen
              ? "opacity-0 pointer-events-none scale-90"
              : "bottom-16 sm:bottom-20 opacity-100"
            : "bottom-5 opacity-100"
        }`}
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Mobile Action Bottom Sheet */}
      {showMobileActionSheet && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setShowMobileActionSheet(false)}
          />
          <div className="relative bg-white rounded-t-3xl p-5 shadow-2xl border-t border-slate-200 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
              <span className="font-bold text-sm text-slate-900">
                Create New
              </span>
              <button
                onClick={() => setShowMobileActionSheet(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 text-slate-800 font-semibold text-xs cursor-pointer">
                <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
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
                  onChange={handleMobileFileUpload}
                />
              </label>

              <button
                onClick={() => {
                  setShowMobileActionSheet(false);
                  setShowFolderModal(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 text-slate-800 font-semibold text-xs text-left cursor-pointer"
              >
                <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <FolderPlus className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-xs">New Folder</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Organize your files in directories
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Widget Dock */}
      <UploadWidget onOpenChange={setIsUploadWidgetOpen} />

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          item={contextMenu.item}
          onClose={() => setContextMenu(null)}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onToggleStar={handleToggleStar}
          onRename={() => {}}
          onDetails={(item) => setInspectItem(item)}
          onShare={(item: VfsItem) => setShareItem(item)}
        />
      )}

      {/* File Details Modal */}
      {inspectItem && (
        <FileDetailsModal
          item={inspectItem}
          onClose={() => setInspectItem(null)}
        />
      )}

      {/* Public Share Modal */}
      {shareItem && (
        <ShareModal item={shareItem} onClose={() => setShareItem(null)} />
      )}

      {/* New Folder Modal */}
      {showFolderModal && (
        <div
          onClick={() => setShowFolderModal(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-5 sm:p-6 rounded-2xl shadow-xl w-full max-w-sm border border-slate-200 animate-in fade-in zoom-in-95 duration-100"
          >
            <h3 className="font-bold text-sm text-slate-800 mb-3">
              New folder
            </h3>
            <form onSubmit={handleCreateFolder}>
              <input
                type="text"
                autoFocus
                placeholder="Folder title"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none mb-4"
              />
              <div className="flex justify-end gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition cursor-pointer shadow-xs"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

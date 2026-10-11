"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDriveStore, VfsItem } from "@/stores/drive.store";
import { useAuthStore } from "@/stores/auth.store";
import { uploadQueueManager } from "@/lib/upload-queue";
import { socketClient } from "@/lib/socket";
import { Sidebar } from "@/components/drive/Sidebar";
import { VerificationBanner } from "@/components/drive/VerificationBanner";
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

// Subtle pastel palette matching the realistic landing page mockup
const FOLDER_COLOR_PALETTES = [
  {
    icon: "text-amber-500 fill-amber-100",
    bg: "hover:border-amber-200",
  },
  {
    icon: "text-blue-500 fill-blue-100",
    bg: "hover:border-blue-200",
  },
  {
    icon: "text-emerald-500 fill-emerald-100",
    bg: "hover:border-emerald-200",
  },
  {
    icon: "text-indigo-500 fill-indigo-100",
    bg: "hover:border-indigo-200",
  },
  {
    icon: "text-rose-500 fill-rose-100",
    bg: "hover:border-rose-200",
  },
  {
    icon: "text-slate-400 fill-slate-100",
    bg: "hover:border-slate-300",
  },
];

function getFolderPalette(idOrName: string) {
  let hash = 0;
  for (let i = 0; i < idOrName.length; i++) {
    hash = (hash << 5) - hash + idOrName.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % FOLDER_COLOR_PALETTES.length;
  return FOLDER_COLOR_PALETTES[index];
}

function getProviderBadgeStyle(badge: string | null | undefined) {
  if (!badge) {
    return "bg-slate-50 text-slate-600 border border-slate-200/80";
  }
  if (badge.includes("Google Drive")) {
    return "bg-amber-50 text-amber-700 border border-amber-200";
  }
  if (badge.includes("Multi-Cloud")) {
    return "bg-blue-50 text-blue-700 border border-blue-200";
  }
  if (badge.includes("OneDrive")) {
    return "bg-sky-50 text-sky-700 border border-sky-200";
  }
  if (badge.includes("pCloud")) {
    return "bg-cyan-50 text-cyan-700 border border-cyan-200";
  }
  if (badge.includes("Dropbox")) {
    return "bg-indigo-50 text-indigo-700 border border-indigo-200";
  }
  return "bg-slate-50 text-slate-700 border border-slate-200/80";
}

interface DriveViewProps {
  folderId?: string | null;
}

export function DriveView({ folderId = null }: DriveViewProps) {
  const router = useRouter();
  const {
    breadcrumbs,
    setBreadcrumbs,
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

  const { user } = useAuthStore();
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

  // Navigation helper for URL-based folder routing
  const navigateToFolder = useCallback(
    (targetFolderId: string | null) => {
      if (targetFolderId) {
        router.push(`/dashboard/folder/${targetFolderId}`);
      } else {
        router.push("/dashboard");
      }
    },
    [router],
  );

  // Fetch data for the current folder
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const folderParam = folderId ? `?parentId=${folderId}` : "";
      const [filesRes, provRes] = await Promise.all([
        fetch(`${apiUrl}/files${folderParam}`, { credentials: "include" }),
        fetch(`${apiUrl}/providers`, { credentials: "include" }),
      ]);

      if (filesRes.ok) {
        const data = await filesRes.json();
        setItems(data.items || []);
        if (data.breadcrumbs && Array.isArray(data.breadcrumbs)) {
          setBreadcrumbs(data.breadcrumbs);
        } else if (!folderId) {
          setBreadcrumbs([{ id: null, name: "My Drive" }]);
        }
      }

      if (provRes.ok) {
        const pData = await provRes.json();
        setProviders(pData.providers || [], pData.summary);
      }
    } catch (err) {
      console.error("Failed to fetch drive data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, folderId, setItems, setBreadcrumbs, setProviders, setIsLoading]);

  useEffect(() => {
    setCurrentFolder(folderId || null);
    void fetchData();
  }, [folderId, setCurrentFolder, fetchData]);

  // WebSocket real-time updates
  useEffect(() => {
    socketClient.connect();
  }, []);

  // Drag and Drop
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
    if (user?.emailVerified !== true) {
      return;
    }
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadQueueManager.addFiles(Array.from(e.dataTransfer.files), folderId || null);
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

  // Create Folder
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
          parentId: folderId || null,
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

  // File Actions
  const handleDownload = async (item: VfsItem) => {
    const link = document.createElement("a");
    link.href = `${apiUrl}/files/${item.id}/download`;
    link.download = item.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRename = async (item: VfsItem) => {
    const newName = window.prompt("Enter new title:", item.name);
    if (!newName || !newName.trim() || newName.trim() === item.name) return;
    try {
      const res = await fetch(`${apiUrl}/files/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        setItems(
          items.map((i) =>
            i.id === item.id ? { ...i, name: newName.trim() } : i,
          ),
        );
      }
    } catch (err) {
      console.error("Rename failed:", err);
    }
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

  // Client-Side Filtering & Sorting
  const processedItems = useMemo(() => {
    let result = [...items];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(query));
    }

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

  const currentFolderTitle = useMemo(() => {
    if (!folderId || breadcrumbs.length === 0) return "My Drive";
    const lastCrumb = breadcrumbs[breadcrumbs.length - 1];
    return lastCrumb?.name || "Folder";
  }, [folderId, breadcrumbs]);

  const getFileIcon = (file: VfsItem) => {
    const mime = file.mimeType || "";
    const name = file.name.toLowerCase();

    if (
      mime.startsWith("image/") ||
      /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(name)
    ) {
      return <ImageIcon className="h-4.5 w-4.5 text-purple-600 shrink-0" />;
    }
    if (mime.startsWith("video/") || /\.(mp4|mkv|webm|mov|avi)$/i.test(name)) {
      return <Video className="h-4.5 w-4.5 text-rose-600 shrink-0" />;
    }
    if (
      name.endsWith(".zip") ||
      name.endsWith(".tar") ||
      name.endsWith(".gz")
    ) {
      return <Archive className="h-4.5 w-4.5 text-amber-600 shrink-0" />;
    }
    if (/\.(ts|tsx|js|jsx|json|py|html|css)$/i.test(name)) {
      return <FileCode className="h-4.5 w-4.5 text-emerald-600 shrink-0" />;
    }
    return <FileText className="h-4.5 w-4.5 text-blue-600 shrink-0" />;
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
        <VerificationBanner />
        {isDragging && (
          <div className="absolute inset-0 bg-blue-600/10 border-2 border-dashed border-blue-600 z-50 flex items-center justify-center backdrop-blur-xs pointer-events-none p-4">
            <div className="bg-white p-6 rounded-2xl shadow-xl flex items-center gap-3 text-blue-600 font-medium text-sm">
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
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight">
                {currentFolderTitle}
              </h1>
            </div>

            {/* Modern Sleek Search Input matching landing page mockup */}
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

          {/* Breadcrumb Header with native URL routing */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 font-medium overflow-x-auto scrollbar-none pb-1">
            <button
              onClick={() => navigateToFolder(null)}
              className={`hover:text-blue-600 transition flex items-center gap-1 shrink-0 ${
                !folderId ? "font-semibold text-slate-900" : ""
              }`}
            >
              <HardDrive className="h-3.5 w-3.5" />
              <span>Root</span>
            </button>
            {breadcrumbs.map((crumb, idx) => (
              <div key={crumb.id || idx} className="flex items-center gap-1.5 shrink-0">
                <ChevronRight className="h-3 w-3 text-slate-400" />
                <button
                  onClick={() => navigateToFolder(crumb.id)}
                  className={`hover:text-blue-600 transition ${
                    idx === breadcrumbs.length - 1 ? "font-semibold text-slate-900" : ""
                  }`}
                >
                  {crumb.name}
                </button>
              </div>
            ))}
          </div>

          {/* Filter Pills & Sort Selector Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6 pb-3 sm:pb-4 border-b border-slate-200/80">
            {/* Category Filter Pills */}
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
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer text-xs shrink-0 ${
                    activeFilter === f.id
                      ? "bg-slate-900 text-white shadow-2xs font-medium"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/90 font-normal"
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
                    <div className="px-3.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
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
                              ? "bg-blue-50/80 text-blue-600 font-medium"
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
                      ? "bg-white text-blue-600 shadow-2xs"
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
                      ? "bg-white text-blue-600 shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Folders Section - Styled with subtle pastel tints matching mockup */}
          {folders.length > 0 && (
            <div className="mb-6 sm:mb-8">
              <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 sm:mb-3">
                Folders ({folders.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 sm:gap-3">
                {folders.map((folder) => {
                  const palette = getFolderPalette(folder.id || folder.name);
                  return (
                    <div
                      key={folder.id}
                      onDoubleClick={() => navigateToFolder(folder.id)}
                      onClick={() => {
                        // On touch screens and mobile, single click navigates into folder
                        if (window.innerWidth < 1024) {
                          navigateToFolder(folder.id);
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
                      className={`p-3 bg-white rounded-xl border border-slate-200/90 ${palette.bg} hover:shadow-2xs transition cursor-pointer flex items-center justify-between group`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Folder
                          className={`h-5 w-5 sm:h-5.5 sm:w-5.5 shrink-0 transition-transform group-hover:scale-105 ${palette.icon}`}
                        />
                        <div className="min-w-0">
                          <div
                            className="font-medium text-xs text-slate-800 truncate"
                            title={folder.name}
                          >
                            {folder.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            Folder
                          </div>
                        </div>
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
                  );
                })}
              </div>
            </div>
          )}

          {/* Files Section */}
          <div>
            <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 sm:mb-3">
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
                    className="p-3 sm:p-4 bg-white rounded-xl border border-slate-200/90 hover:border-blue-400 hover:shadow-2xs transition flex flex-col justify-between group relative"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                        {getFileIcon(file)}
                      </div>
                      <div className="flex items-center gap-1">
                        {file.starred && (
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
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
                        className="font-medium text-xs text-slate-800 truncate mb-1"
                        title={file.name}
                      >
                        {file.name}
                      </h4>
                      <div className="mb-2">
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[9px] font-medium truncate inline-block max-w-full ${getProviderBadgeStyle(
                            file.providerBadge,
                          )}`}
                        >
                          {file.providerBadge || "Zero-Proxy Cloud"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
                        <span>
                          {new Date(file.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List View matching the realistic in-browser landing page mockup */
              <div className="bg-white border border-slate-200/90 rounded-xl divide-y divide-slate-100 overflow-hidden shadow-2xs">
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
                    className="p-3 sm:px-4 flex items-center justify-between hover:bg-slate-50/80 transition text-xs gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {getFileIcon(file)}
                      <span className="font-medium text-slate-800 truncate" title={file.name}>
                        {file.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 text-slate-500 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium hidden sm:inline-flex ${getProviderBadgeStyle(
                          file.providerBadge,
                        )}`}
                      >
                        {file.providerBadge || "Zero-Proxy Cloud"}
                      </span>
                      <span className="text-[11px] sm:text-xs text-slate-500 w-16 text-right">
                        {(file.size / (1024 * 1024)).toFixed(1)} MB
                      </span>
                      <span className="hidden md:inline text-xs text-slate-400">
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
              <span className="font-semibold text-sm text-slate-900">
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
              <label className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 text-slate-800 font-medium text-xs cursor-pointer">
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
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 text-slate-800 font-medium text-xs text-left cursor-pointer"
              >
                <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
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
      )}

      {/* New Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              New Folder
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter a title for your new folder.
            </p>
            <form onSubmit={handleCreateFolder}>
              <input
                type="text"
                autoFocus
                placeholder="Folder title"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white mb-4"
              />
              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newFolderName.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-medium transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
          onRename={handleRename}
          onDetails={(item) => setInspectItem(item)}
          onShare={(item) => setShareItem(item)}
        />
      )}

      {/* File Chunks Inspector Modal */}
      {inspectItem && (
        <FileDetailsModal
          item={inspectItem}
          onClose={() => setInspectItem(null)}
        />
      )}

      {/* File Share Modal */}
      {shareItem && (
        <ShareModal item={shareItem} onClose={() => setShareItem(null)} />
      )}

      {/* Upload Progress Floating Widget */}
      <UploadWidget onOpenChange={setIsUploadWidgetOpen} />
    </div>
  );
}

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
  Plus,
  Upload,
  FolderPlus,
  X,
  Search,
  Menu,
  ChevronDown,
  Check,
} from "lucide-react";

// Subtle pastel palette matching the landing page mockup
const FOLDER_COLOR_PALETTES = [
  {
    icon: "text-amber-500 fill-amber-100",
  },
  {
    icon: "text-blue-500 fill-blue-100",
  },
  {
    icon: "text-slate-400 fill-slate-100",
  },
  {
    icon: "text-emerald-500 fill-emerald-100",
  },
  {
    icon: "text-indigo-500 fill-indigo-100",
  },
  {
    icon: "text-rose-500 fill-rose-100",
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
    return "bg-amber-50 text-amber-700 border border-amber-200";
  }
  if (badge.includes("Google Drive")) {
    return "bg-amber-50 text-amber-700 border border-amber-200";
  }
  if (badge.includes("Multi-Cloud")) {
    return "bg-blue-50 text-blue-700 border border-blue-200";
  }
  if (badge.includes("pCloud")) {
    return "bg-sky-50 text-sky-700 border border-sky-200";
  }
  if (badge.includes("OneDrive")) {
    return "bg-sky-50 text-sky-700 border border-sky-200";
  }
  if (badge.includes("Dropbox")) {
    return "bg-indigo-50 text-indigo-700 border border-indigo-200";
  }
  return "bg-slate-50 text-slate-700 border border-slate-200";
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

  // Sorting
  const [sortBy, setSortBy] = useState<"date" | "name" | "size">("date");
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

  const sortOptions = useMemo(
    () => [
      { id: "date-desc", label: "Last Modified", field: "date" as const, order: "desc" as const },
      { id: "date-asc", label: "Oldest First", field: "date" as const, order: "asc" as const },
      { id: "name-asc", label: "Name (A to Z)", field: "name" as const, order: "asc" as const },
      { id: "name-desc", label: "Name (Z to A)", field: "name" as const, order: "desc" as const },
      { id: "size-desc", label: "Size (Largest)", field: "size" as const, order: "desc" as const },
    ],
    [],
  );

  const currentSortLabel =
    sortOptions.find((opt) => opt.field === sortBy && opt.order === sortOrder)?.label ||
    "Last Modified";

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

  // URL-based folder navigation
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

  // Fetch folder data
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

  // WebSocket connection
  useEffect(() => {
    socketClient.connect();
  }, []);

  // Drag and drop handlers
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

  // Folder creation
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

  // File operations
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

  // Filtered and sorted items
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

  const getFileIcon = (file: VfsItem) => {
    const mime = file.mimeType || "";
    const name = file.name.toLowerCase();

    if (
      mime.startsWith("image/") ||
      /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(name)
    ) {
      return <ImageIcon className="h-4 w-4 text-purple-600 shrink-0" />;
    }
    if (mime.startsWith("video/") || /\.(mp4|mkv|webm|mov|avi)$/i.test(name)) {
      return <Video className="h-4 w-4 text-rose-600 shrink-0" />;
    }
    if (
      name.endsWith(".zip") ||
      name.endsWith(".tar") ||
      name.endsWith(".gz")
    ) {
      return <Archive className="h-4 w-4 text-purple-600 shrink-0" />;
    }
    if (/\.(ts|tsx|js|jsx|json|py|html|css|sql)$/i.test(name)) {
      return <FileCode className="h-4 w-4 text-emerald-600 shrink-0" />;
    }
    return <FileText className="h-4 w-4 text-blue-600 shrink-0" />;
  };

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
        {isDragging && (
          <div className="absolute inset-0 bg-blue-600/10 border-2 border-dashed border-blue-600 z-50 flex items-center justify-center backdrop-blur-xs pointer-events-none p-4">
            <div className="bg-white p-6 rounded-2xl shadow-xl flex items-center gap-3 text-blue-600 font-medium text-sm">
              <CloudUpload className="h-6 w-6 animate-bounce" />
              <span>Drop files anywhere to upload zero-proxy</span>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-6 md:p-8 w-full max-w-6xl">
          {/* Top Integrated Header: Search Bar on left, Sort on right (Mockup Style) */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                aria-label="Open navigation menu"
                className="lg:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer shrink-0"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 text-slate-400 bg-slate-100/70 border border-slate-200/80 px-3 py-1.5 rounded-lg w-72 sm:w-80">
                <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search files, folders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none font-normal"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Sort Menu */}
            <div className="relative" ref={sortDropdownRef}>
              <button
                type="button"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="text-slate-500 font-medium text-xs flex items-center gap-1.5 hover:text-slate-800 transition cursor-pointer"
                aria-expanded={showSortDropdown}
              >
                <span>Sort: {currentSortLabel}</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {showSortDropdown && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
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
                        className={`w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-left transition cursor-pointer ${
                          isSelected
                            ? "bg-blue-50 text-blue-700 font-semibold"
                            : "text-slate-600 hover:bg-slate-50 font-normal"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && (
                          <Check className="h-3 w-3 text-blue-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Clean breadcrumb only shown when navigating inside subfolders */}
          {folderId && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-6 font-normal overflow-x-auto scrollbar-none pb-0.5">
              <button
                onClick={() => navigateToFolder(null)}
                className="hover:text-blue-600 transition flex items-center gap-1 text-slate-500 hover:underline cursor-pointer"
              >
                <HardDrive className="h-3.5 w-3.5" />
                <span>My Drive</span>
              </button>
              {breadcrumbs.map((crumb, idx) => (
                <div key={crumb.id || idx} className="flex items-center gap-1.5 shrink-0">
                  <ChevronRight className="h-3 w-3 text-slate-400" />
                  <button
                    onClick={() => navigateToFolder(crumb.id)}
                    className={`hover:text-blue-600 transition cursor-pointer ${
                      idx === breadcrumbs.length - 1
                        ? "font-semibold text-slate-800"
                        : "text-slate-500 hover:underline"
                    }`}
                  >
                    {crumb.name}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Sample Folders matching the landing page mockup */}
          {folders.length > 0 && (
            <div className="mb-6">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Folders
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {folders.map((folder) => {
                  const palette = getFolderPalette(folder.id || folder.name);
                  return (
                    <div
                      key={folder.id}
                      onDoubleClick={() => navigateToFolder(folder.id)}
                      onClick={() => {
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
                      className="border border-slate-200 rounded-lg p-3 flex items-center justify-between bg-white hover:border-slate-300 transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Folder className={`h-6 w-6 shrink-0 ${palette.icon}`} />
                        <div className="min-w-0">
                          <div
                            className="font-semibold text-slate-800 text-xs truncate"
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
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Files List matching the landing page mockup */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Files
            </div>

            {files.length === 0 && folders.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-200 rounded-lg bg-white p-6">
                <HardDrive className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <div className="text-xs font-semibold text-slate-700">
                  This folder is empty
                </div>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                  Drag and drop files here or click + New Upload to store across your clouds.
                </p>
              </div>
            ) : files.length === 0 ? (
              <div className="py-6 px-4 bg-white border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-400">
                No files in this folder
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 bg-white">
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
                    className="p-3 flex items-center justify-between hover:bg-slate-50 transition text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {getFileIcon(file)}
                      <span
                        className="font-medium text-slate-800 text-xs truncate"
                        title={file.name}
                      >
                        {file.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getProviderBadgeStyle(
                          file.providerBadge,
                        )}`}
                      >
                        {file.providerBadge || "Google Drive (Whole)"}
                      </span>
                      <span className="text-slate-500 w-16 text-right text-xs">
                        {(file.size / (1024 * 1024)).toFixed(1)} MB
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
                        className="text-slate-400 hover:text-slate-600 p-0.5 transition cursor-pointer"
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

      {/* Floating Action Button (FAB) on Mobile/Tablet */}
      <button
        onClick={() => setShowMobileActionSheet(true)}
        aria-label="Upload file or create folder"
        className={`lg:hidden fixed right-5 z-40 h-12 w-12 rounded-full bg-blue-600 text-white shadow-xl flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all duration-300 cursor-pointer ${
          hasActiveUploads
            ? isUploadWidgetOpen
              ? "opacity-0 pointer-events-none scale-90"
              : "bottom-16 opacity-100"
            : "bottom-5 opacity-100"
        }`}
      >
        <Plus className="h-5 w-5" />
      </button>

      {/* Mobile Action Bottom Sheet */}
      {showMobileActionSheet && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setShowMobileActionSheet(false)}
          />
          <div className="relative bg-white rounded-t-2xl p-5 shadow-2xl border-t border-slate-200 animate-in slide-in-from-bottom duration-300">
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
                  onChange={handleMobileFileUpload}
                />
              </label>

              <button
                onClick={() => {
                  setShowMobileActionSheet(false);
                  setShowFolderModal(true);
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
      )}

      {/* New Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
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
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:bg-white mb-4"
              />
              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newFolderName.trim()}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition cursor-pointer"
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

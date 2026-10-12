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
import { MoveModal } from "@/components/drive/MoveModal";
import { RenameModal } from "@/components/drive/RenameModal";
import { FilePreviewModal } from "@/components/drive/FilePreviewModal";
import { downloadFile } from "@/lib/download-engine";
import { formatBytes } from "@/lib/format";
import { FuzeLogo } from "@/components/brand/FuzeLogo";
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
  LayoutGrid,
  List,
  CheckSquare,
  Square,
  Star,
  FolderInput,
  Download,
  Trash2,
  Edit2,
  Info,
  Play,
  Music,
  FileSpreadsheet,
  Layers,
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
    return "bg-slate-50 text-slate-700 border border-slate-200/80";
  }
  if (badge.includes("Google Drive")) {
    return "bg-amber-50 text-amber-700 border border-amber-200/80";
  }
  if (badge.includes("Multi-Cloud")) {
    return "bg-blue-50 text-blue-700 border border-blue-200/80";
  }
  if (badge.includes("Dropbox")) {
    return "bg-indigo-50 text-indigo-700 border border-indigo-200/80";
  }
  if (badge.includes("pCloud")) {
    return "bg-cyan-50 text-cyan-700 border border-cyan-200/80";
  }
  if (badge.includes("OneDrive")) {
    return "bg-sky-50 text-sky-700 border border-sky-200/80";
  }
  if (badge.includes("Box")) {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200/80";
  }
  return "bg-slate-50 text-slate-700 border border-slate-200/80";
}

function FileThumbnail({
  file,
  badge,
}: {
  file: VfsItem;
  badge: string;
}) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const name = file.name.toLowerCase();
  const ext = (file.name.split(".").pop() || "file").toUpperCase();
  const mime = (file.mimeType || "").toLowerCase();

  const isImage =
    mime.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp|gif|svg|avif|bmp)$/i.test(name);
  const isVideo =
    mime.startsWith("video/") ||
    /\.(mp4|mkv|webm|mov|m4v)$/i.test(name);
  const isPdf = mime.includes("pdf") || name.endsWith(".pdf");
  const isSpreadsheet = /\.(xlsx|xls|csv|tsv)$/i.test(name);
  const isDoc = /\.(docx|doc|txt|rtf|odt)$/i.test(name);
  const isCode = /\.(ts|tsx|js|jsx|json|py|html|css|sql|sh|yaml|yml)$/i.test(name);
  const isAudio = mime.startsWith("audio/") || /\.(mp3|wav|ogg|flac|m4a)$/i.test(name);
  const isArchive = /\.(zip|tar|gz|rar|7z)$/i.test(name);
  const isChunked = badge.includes("Multi-Cloud");

  const [imgError, setImgError] = useState(false);
  const [vidError, setVidError] = useState(false);

  // Common Corner Badges Component
  const CornerBadges = () => (
    <>
      <span className="absolute bottom-2 right-2 text-[9px] font-bold uppercase bg-slate-900/75 text-white px-1.5 py-0.5 rounded backdrop-blur-xs select-none shadow-xs pointer-events-none">
        {ext}
      </span>
      {isChunked && (
        <span className="absolute bottom-2 left-2 text-[9px] font-semibold bg-white/95 text-blue-700 px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1 border border-blue-200/90 select-none pointer-events-none">
          <Layers className="w-2.5 h-2.5 text-blue-600" />
          <span>Pooled</span>
        </span>
      )}
    </>
  );

  // 1. IMAGE THUMBNAIL
  if (isImage && !imgError) {
    return (
      <div className="w-full h-full relative overflow-hidden rounded-lg bg-slate-100/90 flex items-center justify-center p-1.5">
        <img
          crossOrigin="use-credentials"
          src={`${apiUrl}/files/${file.id}/thumbnail`}
          alt={file.name}
          loading="lazy"
          className="w-full h-full object-contain rounded-md transition-transform duration-300 group-hover:scale-105"
          onError={() => setImgError(true)}
        />
        <CornerBadges />
      </div>
    );
  }

  // 2. VIDEO THUMBNAIL
  if (isVideo && !vidError) {
    return (
      <div className="w-full h-full relative overflow-hidden rounded-lg bg-slate-950 flex items-center justify-center">
        <video
          crossOrigin="use-credentials"
          src={`${apiUrl}/files/${file.id}/thumbnail#t=0.5`}
          preload="metadata"
          muted
          playsInline
          className="w-full h-full object-contain pointer-events-none group-hover:scale-105 transition-transform duration-300"
          onError={() => setVidError(true)}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/10 transition">
          <div className="w-9 h-9 rounded-full bg-black/65 backdrop-blur-xs flex items-center justify-center text-white shadow-md group-hover:scale-110 transition">
            <Play className="w-4 h-4 fill-white ml-0.5" />
          </div>
        </div>
        <CornerBadges />
      </div>
    );
  }

  // Fallback for Video if failed or still processing
  if (isVideo) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 to-indigo-950 rounded-lg flex flex-col items-center justify-center relative overflow-hidden p-3 group-hover:from-slate-850 group-hover:to-indigo-900 transition">
        <div className="w-11 h-11 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner group-hover:scale-110 transition">
          <Video className="w-5 h-5 text-indigo-400" />
        </div>
        <CornerBadges />
      </div>
    );
  }

  // 3. PDF DOCUMENT CARD
  if (isPdf) {
    return (
      <div className="w-full h-full bg-rose-50/50 rounded-lg flex items-center justify-center relative overflow-hidden p-3 group-hover:bg-rose-50/80 transition">
        <div className="w-24 h-28 bg-white rounded-lg shadow-2xs border border-rose-200/80 flex flex-col items-center justify-between p-2.5 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xs">
          <div className="w-full flex items-center justify-between">
            <FileText className="w-4 h-4 text-rose-600" />
            <span className="text-[8px] font-bold bg-rose-600 text-white px-1.5 py-0.2 rounded uppercase">PDF</span>
          </div>
          <div className="w-full space-y-1.5 my-auto px-1 opacity-70">
            <div className="h-1 bg-rose-300 rounded-full w-full" />
            <div className="h-1 bg-rose-200 rounded-full w-4/5" />
            <div className="h-1 bg-rose-200 rounded-full w-3/5" />
          </div>
          <div className="w-full pt-1 border-t border-rose-100 flex items-center justify-center">
            <span className="text-[8px] font-bold text-rose-700 uppercase">Document</span>
          </div>
        </div>
        <CornerBadges />
      </div>
    );
  }

  // 4. SPREADSHEET CARD (Excel / CSV)
  if (isSpreadsheet) {
    return (
      <div className="w-full h-full bg-emerald-50/50 rounded-lg flex items-center justify-center relative overflow-hidden p-3 group-hover:bg-emerald-50/80 transition">
        <div className="w-24 h-28 bg-white rounded-lg shadow-2xs border border-emerald-200/80 flex flex-col items-center justify-between p-2.5 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xs">
          <div className="w-full flex items-center justify-between">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="text-[8px] font-bold bg-emerald-600 text-white px-1.5 py-0.2 rounded uppercase">{ext}</span>
          </div>
          <div className="w-full grid grid-cols-3 gap-0.5 my-auto bg-emerald-100/60 p-1 rounded border border-emerald-200/60">
            <div className="h-1.5 bg-emerald-200/80 rounded-xs" />
            <div className="h-1.5 bg-emerald-200/80 rounded-xs" />
            <div className="h-1.5 bg-emerald-200/80 rounded-xs" />
            <div className="h-1.5 bg-white rounded-xs" />
            <div className="h-1.5 bg-white rounded-xs" />
            <div className="h-1.5 bg-white rounded-xs" />
          </div>
          <div className="w-full pt-1 border-t border-emerald-100 flex items-center justify-center">
            <span className="text-[8px] font-bold text-emerald-700 uppercase">Spreadsheet</span>
          </div>
        </div>
        <CornerBadges />
      </div>
    );
  }

  // 5. WORD / TEXT DOCUMENT CARD
  if (isDoc) {
    return (
      <div className="w-full h-full bg-blue-50/50 rounded-lg flex items-center justify-center relative overflow-hidden p-3 group-hover:bg-blue-50/80 transition">
        <div className="w-24 h-28 bg-white rounded-lg shadow-2xs border border-blue-200/80 flex flex-col items-center justify-between p-2.5 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xs">
          <div className="w-full flex items-center justify-between">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-[8px] font-bold bg-blue-600 text-white px-1.5 py-0.2 rounded uppercase">{ext}</span>
          </div>
          <div className="w-full space-y-1.5 my-auto px-1 opacity-70">
            <div className="h-1 bg-blue-300 rounded-full w-full" />
            <div className="h-1 bg-blue-200 rounded-full w-5/6" />
            <div className="h-1 bg-blue-200 rounded-full w-2/3" />
          </div>
          <div className="w-full pt-1 border-t border-blue-100 flex items-center justify-center">
            <span className="text-[8px] font-bold text-blue-700 uppercase">Word Doc</span>
          </div>
        </div>
        <CornerBadges />
      </div>
    );
  }

  // 6. CODE FILE CARD
  if (isCode) {
    return (
      <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden p-3 group-hover:bg-slate-850 transition">
        <div className="w-24 h-28 bg-slate-950 rounded-lg shadow-2xs border border-slate-800 flex flex-col items-center justify-between p-2.5 transition-transform duration-300 group-hover:scale-105">
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            </div>
            <span className="text-[8px] font-mono font-bold bg-slate-800 text-indigo-300 px-1.5 py-0.2 rounded uppercase">{ext}</span>
          </div>
          <div className="w-full space-y-1 my-auto px-1">
            <div className="h-1 bg-indigo-500/70 rounded-full w-1/2" />
            <div className="h-1 bg-slate-700 rounded-full w-3/4 ml-1.5" />
            <div className="h-1 bg-emerald-500/70 rounded-full w-2/3 ml-1.5" />
            <div className="h-1 bg-indigo-500/70 rounded-full w-1/3" />
          </div>
          <div className="w-full pt-1 border-t border-slate-800 flex items-center justify-center">
            <span className="text-[8px] font-mono text-slate-500 uppercase">Source Code</span>
          </div>
        </div>
        <CornerBadges />
      </div>
    );
  }

  // 7. AUDIO CARD
  if (isAudio) {
    return (
      <div className="w-full h-full bg-purple-50/50 rounded-lg flex items-center justify-center relative overflow-hidden p-3 group-hover:bg-purple-50/80 transition">
        <div className="w-24 h-28 bg-white rounded-lg shadow-2xs border border-purple-200/80 flex flex-col items-center justify-between p-2.5 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xs">
          <div className="w-full flex items-center justify-between">
            <Music className="w-4 h-4 text-purple-600" />
            <span className="text-[8px] font-bold bg-purple-600 text-white px-1.5 py-0.2 rounded uppercase">{ext}</span>
          </div>
          <div className="flex items-end justify-center gap-1 h-7 my-auto">
            <div className="w-1 bg-purple-400 rounded-full h-3" />
            <div className="w-1 bg-purple-500 rounded-full h-5" />
            <div className="w-1 bg-purple-600 rounded-full h-7" />
            <div className="w-1 bg-purple-500 rounded-full h-4" />
            <div className="w-1 bg-purple-400 rounded-full h-2" />
          </div>
          <div className="w-full pt-1 border-t border-purple-100 flex items-center justify-center">
            <span className="text-[8px] font-bold text-purple-700 uppercase">Audio Track</span>
          </div>
        </div>
        <CornerBadges />
      </div>
    );
  }

  // 8. ARCHIVE CARD
  if (isArchive) {
    return (
      <div className="w-full h-full bg-amber-50/50 rounded-lg flex items-center justify-center relative overflow-hidden p-3 group-hover:bg-amber-50/80 transition">
        <div className="w-24 h-28 bg-white rounded-lg shadow-2xs border border-amber-200/80 flex flex-col items-center justify-between p-2.5 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xs">
          <div className="w-full flex items-center justify-between">
            <Archive className="w-4 h-4 text-amber-600" />
            <span className="text-[8px] font-bold bg-amber-600 text-white px-1.5 py-0.2 rounded uppercase">{ext}</span>
          </div>
          <div className="flex items-center justify-center my-auto">
            <Archive className="w-7 h-7 text-amber-500" />
          </div>
          <div className="w-full pt-1 border-t border-amber-100 flex items-center justify-center">
            <span className="text-[8px] font-bold text-amber-700 uppercase">Archive</span>
          </div>
        </div>
        <CornerBadges />
      </div>
    );
  }

  // 9. GENERIC FALLBACK CARD
  return (
    <div className="w-full h-full bg-slate-100/70 rounded-lg flex items-center justify-center relative overflow-hidden p-3 group-hover:bg-slate-100 transition">
      <div className="w-24 h-28 bg-white rounded-lg shadow-2xs border border-slate-200/90 flex flex-col items-center justify-between p-2.5 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xs">
        <div className="w-full flex items-center justify-between">
          <FileText className="w-4 h-4 text-slate-500" />
          <span className="text-[8px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded uppercase">{ext}</span>
        </div>
        <div className="flex items-center justify-center my-auto">
          <FileText className="w-7 h-7 text-slate-400" />
        </div>
        <div className="w-full pt-1 border-t border-slate-100 flex items-center justify-center">
          <span className="text-[8px] font-bold text-slate-500 uppercase">{ext}</span>
        </div>
      </div>
      <CornerBadges />
    </div>
  );
}

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
  } = useDriveStore();

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
  const [previewItem, setPreviewItem] = useState<VfsItem | null>(null);

  // Selection & Move State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [moveTargetItems, setMoveTargetItems] = useState<VfsItem[]>([]);
  const [renameItem, setRenameItem] = useState<VfsItem | null>(null);

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

  // Fetch folder or starred data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const endpoint = isStarredView
        ? `${apiUrl}/files/starred`
        : `${apiUrl}/files${folderId ? `?parentId=${folderId}` : ""}`;

      const [filesRes, provRes] = await Promise.all([
        fetch(endpoint, { credentials: "include" }),
        fetch(`${apiUrl}/providers`, { credentials: "include" }),
      ]);

      if (filesRes.ok) {
        const data = await filesRes.json();
        setItems(data.items || []);
        if (isStarredView) {
          setBreadcrumbs([{ id: null, name: "Starred" }]);
        } else if (data.breadcrumbs && Array.isArray(data.breadcrumbs)) {
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
  }, [
    apiUrl,
    folderId,
    isStarredView,
    setItems,
    setBreadcrumbs,
    setProviders,
    setIsLoading,
  ]);

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
    try {
      await downloadFile({ fileId: item.id, fileName: item.name });
    } catch (err) {
      console.warn("Client-side direct download failed, falling back to server stream:", err);
      const link = document.createElement("a");
      link.href = `${apiUrl}/files/${item.id}/download`;
      link.download = item.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleRename = (item: VfsItem) => {
    setRenameItem(item);
  };

  const handleRenameSuccess = (item: VfsItem, newName: string) => {
    setItems(
      items.map((i) => (i.id === item.id ? { ...i, name: newName } : i)),
    );
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

  // Selection Handlers (Google Drive style)
  const toggleSelect = useCallback(
    (item: VfsItem, e: React.MouseEvent) => {
      const id = item.id;
      if (e.shiftKey && lastSelectedId) {
        // Range select across processedItems
        const ids = processedItems.map((i) => i.id);
        const lastIdx = ids.indexOf(lastSelectedId);
        const currIdx = ids.indexOf(id);
        if (lastIdx !== -1 && currIdx !== -1) {
          const start = Math.min(lastIdx, currIdx);
          const end = Math.max(lastIdx, currIdx);
          const rangeIds = ids.slice(start, end + 1);
          setSelectedIds(new Set([...Array.from(selectedIds), ...rangeIds]));
          return;
        }
      }

      if (e.ctrlKey || e.metaKey) {
        // Toggle single item
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
        setLastSelectedId(id);
        return;
      }

      // Normal click: select just this item (or if already selected and single, keep it)
      setSelectedIds(new Set([id]));
      setLastSelectedId(id);
    },
    [lastSelectedId, processedItems, selectedIds],
  );

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
      // Range select with Shift key
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

      // If any items are selected or modifier key pressed, toggle this item in the selection
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

      // Normal click when nothing is selected
      if (item.type === "folder") {
        navigateToFolder(item.id);
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
      }
    } catch (err) {
      console.error("Batch star failed:", err);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (
      !window.confirm(
        `Move ${count} item${count > 1 ? "s" : ""} to trash?`,
      )
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
        setItems(items.filter((i) => !selectedIds.has(i.id)));
        clearSelection();
      }
    } catch (err) {
      console.error("Batch delete failed:", err);
    }
  };

  const handleBatchDownload = async () => {
    const selectedFiles = processedItems.filter(
      (i) => selectedIds.has(i.id) && i.type === "file",
    );
    for (const f of selectedFiles) {
      await handleDownload(f);
    }
  };

  // Keyboard shortcut listener for Ctrl+A, Escape, Delete
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
  }, [clearSelection, selectedIds, showFolderModal, moveModalOpen, handleBatchDelete]);

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

        <main
          onClick={(e) => {
            // If user clicked directly on main background, deselect
            if (e.target === e.currentTarget) {
              clearSelection();
            }
          }}
          className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-28 sm:pb-28 lg:pb-8 w-full max-w-7xl"
        >
          {/* Top Integrated Header: Responsive search on left, controls on right */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-100 mb-5 sm:mb-6">
            <div className="flex items-center flex-1 min-w-0">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                aria-label="Open navigation menu"
                className="lg:hidden h-8 w-8 inline-flex items-center justify-center -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer shrink-0 mr-1"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="lg:hidden shrink-0 inline-flex items-center justify-center h-8 mr-3">
                <FuzeLogo variant="icon" height={24} />
              </div>

              <div className="h-8 flex items-center gap-2 text-slate-400 bg-slate-100/70 border border-slate-200/80 px-3 rounded-lg flex-1 sm:max-w-xs md:max-w-sm transition-all focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 min-w-0">
                <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search files, folders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none font-normal min-w-0"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition cursor-pointer shrink-0"
                    aria-label="Clear search"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Header Right Controls: View Mode & Sort Dropdown */}
            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
              {/* Grid / List View Toggle */}
              <div className="flex items-center gap-0.5 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  title="List view"
                  aria-label="List view"
                  className={`p-1.5 rounded-md transition cursor-pointer ${
                    viewMode === "list"
                      ? "bg-white text-blue-600 shadow-2xs font-semibold"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  title="Grid view"
                  aria-label="Grid view"
                  className={`p-1.5 rounded-md transition cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-white text-blue-600 shadow-2xs font-semibold"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Sort Menu */}
              <div className="relative" ref={sortDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="text-slate-600 font-medium text-xs flex items-center gap-1.5 hover:text-slate-900 transition cursor-pointer px-2.5 py-1.5 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 shadow-2xs"
                  aria-expanded={showSortDropdown}
                >
                  <span className="truncate">Sort: {currentSortLabel}</span>
                  <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
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
          </div>

          {/* Google Drive Inspired Selection Action Bar */}
          {selectedIds.size > 0 && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="sticky top-0 z-30 mb-5 bg-white border border-blue-200/90 rounded-2xl px-3.5 sm:px-4 py-2.5 shadow-md shadow-blue-500/5 flex flex-wrap items-center justify-between gap-2.5 animate-in fade-in slide-in-from-top-2 duration-150 ring-1 ring-blue-500/10"
            >
              {/* Left Side: Close button and Selection Count */}
              <div className="flex items-center gap-2 sm:gap-2.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSelection();
                  }}
                  className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
                  title="Clear selection (Esc)"
                  aria-label="Clear selection"
                >
                  <X className="h-4 w-4" />
                </button>
                <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                  {selectedIds.size} selected
                </span>
              </div>

              {/* Right Side: Action Buttons */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                {/* Move Action */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const selectedItems = processedItems.filter((i) =>
                      selectedIds.has(i.id),
                    );
                    handleOpenMove(selectedItems);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition cursor-pointer border border-slate-200 hover:border-blue-200 bg-white"
                  title="Move to destination folder"
                >
                  <FolderInput className="h-3.5 w-3.5 text-slate-500 group-hover:text-blue-600" />
                  <span className="hidden xs:inline">Move</span>
                </button>

                {/* Rename Action (when exactly 1 item selected) */}
                {selectedIds.size === 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const item = processedItems.find((i) => selectedIds.has(i.id));
                      if (item) handleRename(item);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition cursor-pointer border border-slate-200 hover:border-blue-200 bg-white"
                    title="Rename selected item"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-slate-500 group-hover:text-blue-600" />
                    <span className="hidden xs:inline">Rename</span>
                  </button>
                )}

                {/* Details Action (when exactly 1 item selected) */}
                {selectedIds.size === 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const item = processedItems.find((i) => selectedIds.has(i.id));
                      if (item) setInspectItem(item);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition cursor-pointer border border-slate-200 hover:border-blue-200 bg-white"
                    title="View file details and storage info"
                  >
                    <Info className="h-3.5 w-3.5 text-slate-500 group-hover:text-blue-600" />
                    <span className="hidden xs:inline">Details</span>
                  </button>
                )}

                {/* Star / Unstar Action */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const anyUnstarred = processedItems.some(
                      (i) => selectedIds.has(i.id) && !i.starred,
                    );
                    void handleBatchStar(anyUnstarred);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer border border-slate-200 hover:border-amber-200 bg-white"
                  title="Toggle star on selected items"
                >
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                  <span className="hidden xs:inline">
                    {processedItems.some(
                      (i) => selectedIds.has(i.id) && !i.starred,
                    )
                      ? "Star"
                      : "Unstar"}
                  </span>
                </button>

                {/* Download (if any files selected) */}
                {processedItems.some(
                  (i) => selectedIds.has(i.id) && i.type === "file",
                ) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleBatchDownload();
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer border border-slate-200 hover:border-emerald-200 bg-white"
                    title="Download selected files"
                  >
                    <Download className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="hidden xs:inline">Download</span>
                  </button>
                )}

                {/* Trash Action */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleBatchDelete();
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer border border-rose-200/80 bg-white"
                  title="Move selected items to trash"
                >
                  <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                  <span className="hidden xs:inline">Trash</span>
                </button>
              </div>
            </div>
          )}

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

          {/* Animated Skeleton Loader during folder changes */}
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
              {/* Folders grid */}
              {folders.length > 0 && (
                <div className="mb-6">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Folders
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                    {folders.map((folder) => {
                      const palette = getFolderPalette(folder.id || folder.name);
                      const isSelected = selectedIds.has(folder.id);
                      return (
                        <div
                          key={folder.id}
                          onDoubleClick={() => navigateToFolder(folder.id)}
                          onClick={(e) => handleItemClick(folder, e)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu({
                              x: e.clientX,
                              y: e.clientY,
                              item: folder,
                            });
                          }}
                          className={`border rounded-xl px-3 py-2.5 sm:p-3.5 flex items-center justify-between transition cursor-pointer group gap-2.5 ${
                            isSelected
                              ? "bg-blue-50/60 border-blue-400 ring-2 ring-blue-500/20 shadow-xs"
                              : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs"
                          }`}
                        >
                          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                            {/* Checkbox (always visible) */}
                            <button
                              type="button"
                              onClick={(e) => toggleSelectCheckbox(folder.id, e)}
                              className={`p-1 rounded-md transition cursor-pointer shrink-0 ${
                                isSelected
                                  ? "text-blue-600 bg-blue-50"
                                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                              }`}
                              title={isSelected ? "Deselect" : "Select"}
                            >
                              {isSelected ? (
                                <CheckSquare className="h-4 w-4 fill-blue-50 text-blue-600" />
                              ) : (
                                <Square className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                              )}
                            </button>

                            <Folder className={`h-5 w-5 sm:h-5.5 sm:w-5.5 shrink-0 ${palette.icon}`} />
                            <div className="min-w-0 flex-1">
                              <div
                                className="font-semibold text-slate-800 text-xs truncate leading-snug"
                                title={folder.name}
                              >
                                {folder.name}
                              </div>
                              <div className="text-[10px] text-slate-400 font-normal leading-tight">
                                Folder
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-0.5 shrink-0">
                            {/* Star Toggle (always visible) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleToggleStar(folder);
                              }}
                              className={`p-1.5 rounded-md hover:bg-slate-100 transition cursor-pointer ${
                                folder.starred
                                  ? "text-amber-500"
                                  : "text-slate-300 hover:text-amber-500"
                              }`}
                              title={folder.starred ? "Unstar" : "Star"}
                            >
                              <Star
                                className={`h-3.5 w-3.5 ${
                                  folder.starred ? "fill-amber-400 text-amber-500" : ""
                                }`}
                              />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setContextMenu({
                                  x: e.clientX,
                                  y: e.clientY,
                                  item: folder,
                                });
                              }}
                              className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition shrink-0"
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Files Section */}
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
                      Drag and drop files here or click + New Upload to store across your clouds.
                    </p>
                  </div>
                ) : files.length === 0 ? (
                  <div className="py-8 px-4 bg-white border border-dashed border-slate-200/90 rounded-xl text-center text-xs text-slate-400">
                    No files in this folder
                  </div>
                ) : viewMode === "grid" ? (
                  /* Responsive Grid View for Files */
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5">
                    {files.map((file) => {
                      const badge = getDisplayBadge(file);
                      const isSelected = selectedIds.has(file.id);
                      return (
                        <div
                          key={file.id}
                          onDoubleClick={() => router.push(`/preview/${file.id}`)}
                          onClick={(e) => handleItemClick(file, e)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu({
                              x: e.clientX,
                              y: e.clientY,
                              item: file,
                            });
                          }}
                          className={`border rounded-xl p-3 transition cursor-pointer group flex flex-col justify-between relative ${
                            isSelected
                              ? "bg-blue-50/60 border-blue-400 ring-2 ring-blue-500/20 shadow-xs"
                              : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs"
                          }`}
                        >
                          <div className="h-36 sm:h-40 bg-slate-50/80 rounded-lg flex items-center justify-center mb-2.5 relative group-hover:bg-blue-50/30 transition overflow-hidden">
                            {/* Checkbox (top-left) - always visible */}
                            <button
                              type="button"
                              onClick={(e) => toggleSelectCheckbox(file.id, e)}
                              className={`absolute top-1.5 left-1.5 p-1 rounded-md transition cursor-pointer z-10 ${
                                isSelected
                                  ? "text-blue-600 bg-white/95 shadow-2xs"
                                  : "text-slate-400 bg-white/90 hover:bg-white hover:text-slate-700 shadow-2xs"
                              }`}
                              title={isSelected ? "Deselect" : "Select"}
                            >
                              {isSelected ? (
                                <CheckSquare className="h-3.5 w-3.5 fill-blue-50 text-blue-600" />
                              ) : (
                                <Square className="h-3.5 w-3.5" />
                              )}
                            </button>

                            {/* Visual Thumbnail */}
                            <FileThumbnail file={file} badge={badge} />

                            {/* Star Toggle (top-right next to context menu) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleToggleStar(file);
                              }}
                              className={`absolute top-1.5 right-7 p-1 rounded-md bg-white/90 hover:bg-white transition shadow-2xs cursor-pointer z-10 ${
                                file.starred
                                  ? "text-amber-500"
                                  : "text-slate-300 hover:text-amber-500"
                              }`}
                              title={file.starred ? "Unstar" : "Star"}
                            >
                              <Star
                                className={`h-3 w-3 ${
                                  file.starred ? "fill-amber-400 text-amber-500" : ""
                                }`}
                              />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setContextMenu({
                                  x: e.clientX,
                                  y: e.clientY,
                                  item: file,
                                });
                              }}
                              className="absolute top-1.5 right-1.5 p-1 rounded-md bg-white/90 hover:bg-white text-slate-400 hover:text-slate-700 transition shadow-2xs cursor-pointer z-10"
                            >
                              <MoreVertical className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="min-w-0 pt-0.5">
                            <div
                              className="font-medium text-slate-800 text-xs truncate leading-snug"
                              title={file.name}
                            >
                              {file.name}
                            </div>
                            <div className="flex items-center justify-between gap-1.5 mt-1.5 text-[10px] text-slate-400">
                              <span
                                className={`px-1.5 py-0.5 rounded-full font-medium text-[9px] truncate max-w-[120px] ${getProviderBadgeStyle(
                                  badge,
                                )}`}
                              >
                                {badge}
                              </span>
                              <span className="shrink-0 font-medium">{formatBytes(file.size)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Structured List View for Files */
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white shadow-2xs">
                    {files.map((file) => {
                      const badge = getDisplayBadge(file);
                      const isSelected = selectedIds.has(file.id);
                      return (
                        <div
                          key={file.id}
                          onDoubleClick={() => router.push(`/preview/${file.id}`)}
                          onClick={(e) => handleItemClick(file, e)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu({
                              x: e.clientX,
                              y: e.clientY,
                              item: file,
                            });
                          }}
                          className={`p-3 sm:p-3.5 flex items-center justify-between transition text-xs gap-3 cursor-pointer group ${
                            isSelected
                              ? "bg-blue-50/60 ring-1 ring-inset ring-blue-500/20"
                              : "hover:bg-slate-50/80"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {/* Checkbox - always visible */}
                            <button
                              type="button"
                              onClick={(e) => toggleSelectCheckbox(file.id, e)}
                              className={`p-1 rounded-md transition cursor-pointer shrink-0 ${
                                isSelected
                                  ? "text-blue-600"
                                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                              }`}
                              title={isSelected ? "Deselect" : "Select"}
                            >
                              {isSelected ? (
                                <CheckSquare className="h-4 w-4 fill-blue-50 text-blue-600" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </button>

                            <div className="shrink-0">{getFileIcon(file)}</div>
                            <div className="min-w-0 flex-1">
                              <div
                                className="font-medium text-slate-800 text-xs truncate"
                                title={file.name}
                              >
                                {file.name}
                              </div>
                              {/* Mobile metadata subline */}
                              <div className="flex sm:hidden items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                <span
                                  className={`px-1.5 py-0.2 rounded-full font-medium text-[9px] ${getProviderBadgeStyle(
                                    badge,
                                  )}`}
                                >
                                  {badge}
                                </span>
                                <span>•</span>
                                <span>{formatBytes(file.size)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            {/* Star Toggle Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleToggleStar(file);
                              }}
                              className={`p-1.5 rounded-md hover:bg-slate-100 transition cursor-pointer ${
                                file.starred
                                  ? "text-amber-500"
                                  : "text-slate-300 hover:text-amber-500"
                              }`}
                              title={file.starred ? "Unstar" : "Star"}
                            >
                              <Star
                                className={`h-3.5 w-3.5 ${
                                  file.starred ? "fill-amber-400 text-amber-500" : ""
                                }`}
                              />
                            </button>

                            <span
                              className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${getProviderBadgeStyle(
                                badge,
                              )}`}
                            >
                              {badge}
                            </span>
                            <span className="hidden sm:inline-block text-slate-500 w-16 text-right text-xs">
                              {formatBytes(file.size)}
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
                              aria-label="More actions"
                              className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition cursor-pointer"
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
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
          onRename={handleRename}
          onDetails={(item) => setInspectItem(item)}
          onShare={(item) => setShareItem(item)}
          onMove={(item) => handleOpenMove([item])}
        />
      )}

      {/* File Preview Modal */}
      {previewItem && (
        <FilePreviewModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
        />
      )}

      {/* File Details & Chunks Inspector Modal */}
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

      {/* File Share Modal */}
      {shareItem && (
        <ShareModal item={shareItem} onClose={() => setShareItem(null)} />
      )}

      {/* Move Destination Modal */}
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

      {/* Rename Item Modal */}
      <RenameModal
        isOpen={!!renameItem}
        item={renameItem}
        onClose={() => setRenameItem(null)}
        onSuccess={handleRenameSuccess}
      />

      {/* Upload Progress Floating Widget */}
      <UploadWidget onOpenChange={setIsUploadWidgetOpen} />
    </div>
  );
}

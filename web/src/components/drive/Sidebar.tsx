"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HardDrive,
  Trash2,
  Plus,
  Cloud,
  FolderPlus,
  Upload,
  Settings,
  RefreshCw,
  LogOut,
  Layers,
  X,
} from "lucide-react";
import { useDriveStore } from "@/stores/drive.store";
import { useAuthStore } from "@/stores/auth.store";
import { uploadQueueManager } from "@/lib/upload-queue";

interface SidebarProps {
  onNewFolderClick: () => void;
}

export function Sidebar({ onNewFolderClick }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, checkSession } = useAuthStore();
  const {
    currentFolderId,
    providers,
    storageSummary,
    refreshProviders,
    isMobileSidebarOpen,
    setMobileSidebarOpen,
  } = useDriveStore();

  const [showNewMenu, setShowNewMenu] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Automatically ensure latest quota and provider stats are synced on mount
  useEffect(() => {
    void refreshProviders();
    void checkSession();
  }, [refreshProviders, checkSession]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const handleSyncQuota = async () => {
    setIsSyncing(true);
    try {
      await fetch(`${apiUrl}/providers/sync`, {
        method: "POST",
        credentials: "include",
      });
      await refreshProviders();
    } finally {
      setIsSyncing(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return "0 B";
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    const kb = bytes / 1024;
    if (kb >= 1) return `${kb.toFixed(1)} KB`;
    return `${bytes} B`;
  };

  const poolPercent =
    storageSummary.totalPoolBytes > 0
      ? Math.min(
          100,
          Math.round(
            (storageSummary.usedPoolBytes / storageSummary.totalPoolBytes) *
              100,
          ),
        )
      : 0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadQueueManager.addFiles(Array.from(e.target.files), currentFolderId);
      e.target.value = "";
    }
    setShowNewMenu(false);
    setMobileSidebarOpen(false);
  };

  const closeMobile = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
          onClick={closeMobile}
        />
      )}

      {/* Main Sidebar Drawer Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200/90 flex flex-col h-full shrink-0 select-none transition-transform duration-300 ease-in-out lg:static lg:w-64 lg:translate-x-0 lg:shadow-none lg:visible ${
          isMobileSidebarOpen
            ? "translate-x-0 shadow-2xl visible pointer-events-auto"
            : "-translate-x-full shadow-none invisible pointer-events-none lg:pointer-events-auto"
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 sm:h-16 px-5 sm:px-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Cloud className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-slate-900">
                Fuze
              </span>
              <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">
                Zero-Proxy VFS
              </span>
            </div>
          </div>

          {/* Close Button on Mobile Drawer */}
          <button
            onClick={closeMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* New Action Dropdown (Only visible on desktop/large screens) */}
        <div className="hidden lg:block p-4 relative">
          <button
            onClick={() => setShowNewMenu(!showNewMenu)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs font-semibold text-xs transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Upload</span>
          </button>

          {showNewMenu && (
            <div className="absolute top-16 left-4 right-4 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
              <label className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 cursor-pointer text-slate-700">
                <Upload className="h-4 w-4 text-blue-600" />
                <span>Upload file</span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
              <button
                onClick={() => {
                  setShowNewMenu(false);
                  closeMobile();
                  onNewFolderClick();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 cursor-pointer text-slate-700 text-left"
              >
                <FolderPlus className="h-4 w-4 text-amber-500" />
                <span>New folder</span>
              </button>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 space-y-1 text-xs font-medium overflow-y-auto">
          <Link
            href="/dashboard"
            onClick={closeMobile}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl transition ${
              pathname === "/dashboard"
                ? "bg-blue-50 text-blue-700 font-semibold"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <HardDrive className="h-4 w-4" />
            <span>My Drive</span>
          </Link>

          <Link
            href="/dashboard/storage"
            onClick={closeMobile}
            className={`flex items-center justify-between px-3 py-2 rounded-xl transition ${
              pathname === "/dashboard/storage"
                ? "bg-blue-50 text-blue-700 font-semibold"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <Layers className="h-4 w-4 text-blue-600" />
              <span>Storage Providers</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {providers.length}
            </span>
          </Link>

          <Link
            href="/dashboard/trash"
            onClick={closeMobile}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl transition ${
              pathname === "/dashboard/trash"
                ? "bg-blue-50 text-blue-700 font-semibold"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Trash2 className="h-4 w-4 text-slate-400" />
            <span>Trash</span>
          </Link>

          <div className="pt-3 pb-1">
            <div className="border-t border-slate-100" />
          </div>

          <Link
            href="/dashboard/settings"
            onClick={closeMobile}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl transition ${
              pathname === "/dashboard/settings"
                ? "bg-blue-50 text-blue-700 font-semibold"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Settings className="h-4 w-4 text-slate-400" />
            <span>Settings</span>
          </Link>

          {/* Dedicated Sign Out item */}
          <button
            onClick={() => {
              closeMobile();
              void logout();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer text-left"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </nav>

        {/* Bottom Quota Status & Sync Card */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/50 shrink-0 mt-auto">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
            {/* User Email */}
            <div
              className="font-bold text-[11px] text-slate-800 truncate mb-2"
              title={user?.email || ""}
            >
              {user?.email || "user@example.com"}
            </div>

            {/* Quota Numbers */}
            <div className="text-[10px] text-slate-500 mb-1.5 flex justify-between items-center">
              <span>{formatBytes(storageSummary.usedPoolBytes)} used</span>
              <span className="font-semibold text-slate-700">
                {formatBytes(storageSummary.totalPoolBytes)}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${poolPercent}%` }}
              />
            </div>

            {/* Sync Quota Button */}
            <button
              onClick={handleSyncQuota}
              disabled={isSyncing}
              title="Refresh quotas from connected cloud accounts"
              className="w-full py-1.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-[11px] font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw
                className={`h-3 w-3 ${isSyncing ? "animate-spin text-blue-600" : "text-slate-500"}`}
              />
              <span>{isSyncing ? "Syncing Quotas..." : "Sync Quotas"}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

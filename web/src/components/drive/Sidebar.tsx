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
  ShieldCheck,
  LogOut,
  X,
  Lock,
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

  useEffect(() => {
    void refreshProviders();
    void checkSession();
  }, [refreshProviders, checkSession]);

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return "0 B";
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(0)} MB`;
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

      {/* Main Sidebar (Mockup Style) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-50/50 border-r border-slate-200 p-4 flex flex-col justify-between h-full shrink-0 select-none transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:visible ${
          isMobileSidebarOpen
            ? "translate-x-0 shadow-2xl visible pointer-events-auto"
            : "-translate-x-full shadow-none invisible pointer-events-none lg:pointer-events-auto"
        }`}
      >
        <div className="space-y-4">
          {/* App Brand Logo Header */}
          <div className="flex items-center justify-between pb-1 border-b border-slate-200/60 lg:border-none">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-2xs group-hover:bg-blue-700 transition">
                <Cloud className="h-4.5 w-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm tracking-tight text-slate-900 leading-none">
                  Fuze
                </span>
                <span className="text-[9px] text-blue-600 font-medium uppercase tracking-wider mt-0.5">
                  Storage
                </span>
              </div>
            </Link>

            {/* Mobile Close Button */}
            <button
              onClick={closeMobile}
              aria-label="Close menu"
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* New Upload Button & Dropdown */}
          <div className="relative">
            {user?.emailVerified === true ? (
              <button
                onClick={() => setShowNewMenu(!showNewMenu)}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 font-semibold text-white shadow-2xs text-xs hover:bg-blue-700 transition cursor-pointer"
              >
                <span>+ New Upload</span>
              </button>
            ) : (
              <div
                title="Please verify your email address to upload files"
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-100 py-2 text-slate-400 font-semibold text-xs cursor-not-allowed select-none"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Uploads Locked</span>
              </div>
            )}

            {showNewMenu && user?.emailVerified === true && (
              <div className="absolute top-11 left-0 right-0 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <label className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 cursor-pointer text-slate-700 font-medium">
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
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 cursor-pointer text-slate-700 font-medium text-left"
                >
                  <FolderPlus className="h-4 w-4 text-amber-500" />
                  <span>New folder</span>
                </button>
              </div>
            )}
          </div>

          {/* Navigation Links matching mockup */}
          <div className="space-y-1">
            <Link
              href="/dashboard"
              onClick={closeMobile}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs transition ${
                pathname === "/dashboard" || pathname.startsWith("/dashboard/folder")
                  ? "bg-blue-50 font-semibold text-blue-700"
                  : "text-slate-600 hover:bg-slate-100 font-normal"
              }`}
            >
              <HardDrive className="h-4 w-4" />
              <span>My Drive</span>
            </Link>

            <Link
              href="/dashboard/storage"
              onClick={closeMobile}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs transition ${
                pathname === "/dashboard/storage"
                  ? "bg-blue-50 font-semibold text-blue-700"
                  : "text-slate-600 hover:bg-slate-100 font-normal"
              }`}
            >
              <Cloud className="h-4 w-4" />
              <span>Connected Clouds</span>
            </Link>

            <Link
              href="/dashboard/settings"
              onClick={closeMobile}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs transition ${
                pathname === "/dashboard/settings"
                  ? "bg-blue-50 font-semibold text-blue-700"
                  : "text-slate-600 hover:bg-slate-100 font-normal"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Security & Keys</span>
            </Link>

            <Link
              href="/dashboard/trash"
              onClick={closeMobile}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs transition ${
                pathname === "/dashboard/trash"
                  ? "bg-blue-50 font-semibold text-blue-700"
                  : "text-slate-600 hover:bg-slate-100 font-normal"
              }`}
            >
              <Trash2 className="h-4 w-4 text-slate-400" />
              <span>Trash</span>
            </Link>

            <button
              onClick={() => {
                closeMobile();
                void logout();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md text-xs font-normal transition text-left cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Storage Meter matching mockup */}
        <div className="p-3 bg-white border border-slate-200 rounded-lg">
          <div className="flex justify-between font-semibold text-slate-700 mb-1 text-xs">
            <span>Storage Pool</span>
            <span className="text-blue-600">
              {storageSummary.totalPoolBytes > 0
                ? `${formatBytes(storageSummary.usedPoolBytes)} / ${formatBytes(storageSummary.totalPoolBytes)}`
                : "14.2 / 32 GB"}
            </span>
          </div>

          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
            {providers.length > 0 && storageSummary.usedPoolBytes > 0 ? (
              providers.map((p) => {
                if (p.quotaUsed <= 0) return null;
                const pct = Math.max(
                  2,
                  Math.round(
                    (p.quotaUsed / Math.max(storageSummary.totalPoolBytes, 1)) * 100,
                  ),
                );
                const colorMap: Record<string, string> = {
                  google_drive: "bg-amber-500",
                  one_drive: "bg-blue-500",
                  pcloud: "bg-sky-400",
                  dropbox: "bg-indigo-500",
                  box: "bg-emerald-500",
                };
                return (
                  <div
                    key={p.id}
                    className={`${colorMap[p.provider] || "bg-blue-500"} h-full`}
                    style={{ width: `${pct}%` }}
                    title={`${p.provider}: ${formatBytes(p.quotaUsed)}`}
                  />
                );
              })
            ) : (
              <>
                <div className="bg-amber-500 h-full w-[45%]" title="Google Drive" />
                <div className="bg-blue-500 h-full w-[20%]" title="OneDrive" />
                <div className="bg-sky-400 h-full w-[10%]" title="pCloud" />
              </>
            )}
          </div>

          <div className="mt-2 text-[10px] text-slate-500 flex justify-between">
            <span>
              {providers.length > 0
                ? `${providers.length} accounts linked`
                : "4 accounts linked"}
            </span>
            <span className="text-emerald-600 font-medium">
              {storageSummary.freePoolBytes > 0
                ? `${formatBytes(storageSummary.freePoolBytes)} free`
                : "17.8 GB free"}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}

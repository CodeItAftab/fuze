"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderPlus, Upload, LogOut, X, Lock } from "lucide-react";
import { useDriveStore } from "@/stores/drive.store";
import { useAuthStore } from "@/stores/auth.store";
import { uploadQueueManager } from "@/lib/upload-queue";
import { FuzeLogo } from "@/components/brand/FuzeLogo";
import { DASHBOARD_NAV_ITEMS } from "@/config/navigation.config";
import { StorageMeterCard } from "./StorageMeterCard";

interface SidebarProps {
  onNewFolderClick: () => void;
}

export function Sidebar({ onNewFolderClick }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { currentFolderId, isMobileSidebarOpen, setMobileSidebarOpen } =
    useDriveStore();
  const migrationProgress = useDriveStore((state) => state.migrationProgress);

  const [showNewMenu, setShowNewMenu] = useState(false);
  const [activeUploadCount, setActiveUploadCount] = useState(0);
  const newMenuRef = useRef<HTMLDivElement>(null);

  // 1. Subscribe to active uploads count
  useEffect(() => {
    const unsub = uploadQueueManager.subscribe((items) => {
      const count = items.filter(
        (i) => i.status === "uploading" || i.status === "queued",
      ).length;
      setActiveUploadCount(count);
    });
    return () => {
      unsub();
    };
  }, []);

  // 2. Dropdown outside-click / ESC handler
  useEffect(() => {
    if (!showNewMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (
        newMenuRef.current &&
        !newMenuRef.current.contains(e.target as Node)
      ) {
        setShowNewMenu(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowNewMenu(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [showNewMenu]);

  const closeMobile = () => setMobileSidebarOpen(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadQueueManager.addFiles(Array.from(e.target.files), currentFolderId);
      e.target.value = "";
    }
    setShowNewMenu(false);
    closeMobile();
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
          onClick={closeMobile}
        />
      )}

      {/* Main Sidebar Column */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white border-r border-slate-200 p-4 flex flex-col justify-between h-full shrink-0 select-none transition-transform duration-200 ease-in-out lg:static lg:w-64 lg:max-w-none lg:bg-slate-50/70 lg:border-r lg:border-slate-200/80 lg:shadow-none lg:translate-x-0 ${
          isMobileSidebarOpen
            ? "translate-x-0 shadow-2xl"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="space-y-4">
          {/* Logo & Mobile Close */}
          <div className="flex items-center justify-between pt-0.5 pb-3.5 border-b border-slate-200/70">
            <Link
              href="/dashboard"
              onClick={closeMobile}
              className="flex items-center gap-2.5 group"
            >
              <FuzeLogo
                variant="full"
                height={28}
                className="transition-opacity group-hover:opacity-90"
              />
            </Link>
            <button
              onClick={closeMobile}
              aria-label="Close menu"
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* "+ New" Action Button */}
          <div ref={newMenuRef} className="relative hidden lg:block">
            {user?.emailVerified === true ? (
              <button
                onClick={() => setShowNewMenu(!showNewMenu)}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 font-semibold text-white shadow-2xs text-xs hover:bg-blue-700 active:scale-98 transition cursor-pointer"
              >
                <span>New</span>
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

          {/* 🗺️ Config-Mapped Navigation Items */}
          <nav className="space-y-1">
            {DASHBOARD_NAV_ITEMS.map((item) => {
              const active = item.isActive(pathname);
              const Icon = item.icon;
              const badge = item.getBadge?.({
                activeUploads: activeUploadCount,
                migrationPercent: migrationProgress?.percent,
              });
              const isSpinningMigration =
                item.href === "/dashboard/migrations" && migrationProgress;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobile}
                  className={`flex items-center justify-between px-3 py-2 rounded-md text-xs transition ${
                    active
                      ? "bg-blue-50 font-semibold text-blue-700"
                      : "text-slate-600 hover:bg-slate-100 font-normal"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      className={`h-4 w-4 ${
                        isSpinningMigration
                          ? "animate-spin text-emerald-600"
                          : ""
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {badge && (
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${badge.colorClass}`}
                    >
                      {badge.text}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Sign Out Button */}
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
          </nav>
        </div>

        {/* 📊 Modular Storage Meter Card */}
        <StorageMeterCard />
      </aside>
    </>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { Sidebar } from "@/components/drive/Sidebar";
import { VerificationBanner } from "@/components/drive/VerificationBanner";
import { useDriveStore, VfsItem } from "@/stores/drive.store";
import { Trash2, RotateCcw, FileText, Folder, Menu } from "lucide-react";

export default function TrashPage() {
  const [trashedItems, setTrashedItems] = useState<VfsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setMobileSidebarOpen } = useDriveStore();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const loadTrash = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/files/trash`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setTrashedItems(data.items || []);
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

  const handleRestore = async (id: string) => {
    await fetch(`${apiUrl}/files/${id}/restore`, {
      method: "POST",
      credentials: "include",
    });
    void loadTrash();
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm("Are you sure? This will delete all cloud chunks permanently.")) {
      return;
    }
    await fetch(`${apiUrl}/files/${id}/permanent`, {
      method: "DELETE",
      credentials: "include",
    });
    void loadTrash();
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans">
      <Sidebar onNewFolderClick={() => {}} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        <VerificationBanner />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 w-full max-w-7xl">
          {/* Header with Mobile Menu Button */}
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
            </div>

            <span className="text-xs text-slate-400">
              {trashedItems.length} {trashedItems.length === 1 ? "item" : "items"}
            </span>
          </div>

          {isLoading ? (
            <div className="text-center py-16 text-slate-400 text-xs">
              Loading trash...
            </div>
          ) : trashedItems.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-xl p-12 text-center max-w-sm mx-auto my-12 bg-white">
              <Trash2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-700 text-xs">
                Trash is empty
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Items moved to trash will be permanently purged after 30 days.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 bg-white shadow-2xs">
              {trashedItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 flex items-center justify-between hover:bg-slate-50 transition text-xs gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="shrink-0 p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                      {item.type === "folder" ? (
                        <Folder className="h-4 w-4 text-amber-500" />
                      ) : (
                        <FileText className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-800 text-xs truncate" title={item.name}>
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400 sm:hidden mt-0.5">
                        {(item.size / (1024 * 1024)).toFixed(1)} MB • In Trash
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
                    <span className="hidden sm:inline-block text-slate-500 w-16 text-right text-xs">
                      {(item.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                    <button
                      onClick={() => handleRestore(item.id)}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition flex items-center gap-1.5 font-medium text-xs cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Restore</span>
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Permanently Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

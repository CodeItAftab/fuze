"use client";

import { useEffect, useState, useCallback } from "react";
import { Sidebar } from "@/components/drive/Sidebar";
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
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 w-full max-w-7xl">
          {/* Header with Integrated Mobile Menu */}
          <div className="flex items-center gap-2.5 mb-6 sm:mb-8">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open sidebar menu"
              className="lg:hidden p-1.5 -ml-1 text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition cursor-pointer shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-slate-400 hidden sm:inline" />
              <span>Trash</span>
            </h1>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Loading trash...
            </div>
          ) : trashedItems.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto my-12">
              <Trash2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-700 text-sm">
                Trash is empty
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Items moved to trash will be deleted permanently after 30 days.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
              {trashedItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 px-4 flex items-center justify-between hover:bg-slate-50 transition text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.type === "folder" ? (
                      <Folder className="h-4 w-4 text-amber-500 shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                    )}
                    <span className="font-medium text-slate-800 truncate">
                      {item.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-slate-500">
                    <span>{(item.size / (1024 * 1024)).toFixed(1)} MB</span>
                    <button
                      onClick={() => handleRestore(item.id)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-blue-600 transition flex items-center gap-1 font-semibold text-[11px]"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Restore</span>
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(item.id)}
                      className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition"
                      title="Permanently Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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

"use client";

import { Menu } from "lucide-react";
import { useDriveStore } from "@/stores/drive.store";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { setMobileSidebarOpen } = useDriveStore();
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === "/dashboard/storage") return "Storage Providers";
    if (pathname === "/dashboard/settings") return "Settings";
    if (pathname === "/dashboard/trash") return "Trash";
    return "My Drive";
  };

  return (
    <header className="h-14 md:h-16 px-4 md:px-8 bg-white border-b border-slate-200/90 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Open sidebar menu"
          className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer shrink-0"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Current Page Title */}
        <h1 className="font-bold text-sm text-slate-800">
          {getPageTitle()}
        </h1>
      </div>
    </header>
  );
}

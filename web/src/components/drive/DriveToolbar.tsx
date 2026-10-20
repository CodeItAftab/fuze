"use client";

import { useRef, useEffect } from "react";
import {
  Menu,
  Search,
  X,
  List,
  LayoutGrid,
  ChevronDown,
  Check,
} from "lucide-react";
import { FuzeLogo } from "@/components/brand/FuzeLogo";

export interface SortOption {
  id: string;
  label: string;
  field: "date" | "name" | "size";
  order: "asc" | "desc";
}

interface DriveToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  sortBy: "date" | "name" | "size";
  sortOrder: "asc" | "desc";
  onSortChange: (field: "date" | "name" | "size", order: "asc" | "desc") => void;
  sortOptions: SortOption[];
  showSortDropdown: boolean;
  setShowSortDropdown: (show: boolean) => void;
  onOpenMobileSidebar: () => void;
}

export function DriveToolbar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortBy,
  sortOrder,
  onSortChange,
  sortOptions,
  showSortDropdown,
  setShowSortDropdown,
  onOpenMobileSidebar,
}: DriveToolbarProps) {
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
  }, [setShowSortDropdown]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
      <div className="flex items-center flex-1 min-w-0">
        <button
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation menu"
          className="lg:hidden h-8 w-8 inline-flex items-center justify-center -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer shrink-0 mr-1"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="lg:hidden shrink-0 inline-flex items-center justify-center h-8 mr-3">
          <FuzeLogo variant="icon" height={24} />
        </div>

        <div className="h-8 flex items-center gap-2 text-slate-400 bg-slate-100/70 border border-slate-200/80 px-3 rounded-lg flex-1 sm:max-w-sm md:max-w-md lg:max-w-lg transition-all focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 min-w-0">
          <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search files, folders..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none font-normal min-w-0"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition cursor-pointer shrink-0"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
        <div className="flex items-center gap-0.5 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/80">
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
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
            onClick={() => onViewModeChange("grid")}
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
                      onSortChange(opt.field, opt.order);
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
  );
}

import { create } from "zustand";
import { apiFetch } from "@/lib/api";

import {
  VfsItem,
  ProviderSummary,
  StorageSummary,
  MigrationProgress,
  BreadcrumbItem,
} from "@/types";

export type { VfsItem, ProviderSummary, StorageSummary, MigrationProgress };

interface DriveState {
  currentFolderId: string | null;
  breadcrumbs: Array<{ id: string | null; name: string }>;
  items: VfsItem[];
  providers: ProviderSummary[];
  storageSummary: StorageSummary;
  viewMode: "grid" | "list";
  searchQuery: string;
  isLoading: boolean;
  migrationProgress: MigrationProgress | null;
  lastCompletedMigration: (MigrationProgress & {
    completedAt: string;
    status: string;
  }) | null;
  isMobileSidebarOpen: boolean;

  setCurrentFolder: (id: string | null, name?: string) => void;
  setBreadcrumbs: (breadcrumbs: Array<{ id: string | null; name: string }>) => void;
  setItems: (items: VfsItem[]) => void;
  addItem: (item: VfsItem) => void;
  removeItem: (id: string) => void;
  setProviders: (providers: ProviderSummary[], summary: StorageSummary) => void;
  setViewMode: (mode: "grid" | "list") => void;
  setSearchQuery: (query: string) => void;
  setIsLoading: (loading: boolean) => void;
  setMigrationProgress: (progress: MigrationProgress | null) => void;
  setLastCompletedMigration: (
    migration: (MigrationProgress & {
      completedAt: string;
      status: string;
    }) | null,
  ) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  refreshProviders: () => Promise<void>;
  syncActiveMigration: () => Promise<void>;
}

export const useDriveStore = create<DriveState>((set, get) => ({
  currentFolderId: null,
  breadcrumbs: [{ id: null, name: "My Drive" }],
  items: [],
  providers: [],
  storageSummary: { totalPoolBytes: 0, usedPoolBytes: 0, freePoolBytes: 0 },
  viewMode: "grid",
  searchQuery: "",
  isLoading: false,
  migrationProgress: null,
  lastCompletedMigration: null,
  setLastCompletedMigration: (lastCompletedMigration) =>
    set({ lastCompletedMigration }),
  isMobileSidebarOpen: false,

  setCurrentFolder: (folderId, folderName) => {
    const current = get().breadcrumbs;
    if (folderId === null) {
      set({
        currentFolderId: null,
        breadcrumbs: [{ id: null, name: "My Drive" }],
      });
      return;
    }
    const idx = current.findIndex((c) => c.id === folderId);
    if (idx !== -1) {
      set({
        currentFolderId: folderId,
        breadcrumbs: current.slice(0, idx + 1),
      });
    } else {
      set({
        currentFolderId: folderId,
        breadcrumbs: [
          ...current,
          { id: folderId, name: folderName || "Folder" },
        ],
      });
    }
  },

  setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),

  setItems: (items) => set({ items }),
  addItem: (item) => {
    const current = get().items;
    const exists = current.some((i) => i.id === item.id);
    if (!exists) {
      set({ items: [item, ...current] });
    } else {
      set({ items: current.map((i) => (i.id === item.id ? { ...i, ...item } : i)) });
    }
  },
  removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
  setProviders: (providers, storageSummary) =>
    set({ providers, storageSummary }),
  setViewMode: (viewMode) => set({ viewMode }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setMigrationProgress: (migrationProgress) => set({ migrationProgress }),
  setMobileSidebarOpen: (isMobileSidebarOpen) => set({ isMobileSidebarOpen }),

  refreshProviders: async () => {
    try {
      const data = await apiFetch<{
        providers: ProviderSummary[];
        summary: StorageSummary;
      }>("/providers");
      if (data && data.providers) {
        set({ providers: data.providers, storageSummary: data.summary });
      }
    } catch {}
  },

  syncActiveMigration: async () => {
    try {
      const data = await apiFetch<{ job: MigrationProgress | null }>(
        "/providers/migrations/active",
      );
      set({ migrationProgress: data.job ?? null });
    } catch {}
  },
}));

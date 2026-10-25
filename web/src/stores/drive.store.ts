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

export interface FolderCacheEntry {
  items: VfsItem[];
  breadcrumbs: BreadcrumbItem[];
  cachedAt: number;
}

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

  // Caching layer
  folderCache: Record<string, FolderCacheEntry>;
  providersLastFetched: number;
  trashCache: { items: VfsItem[]; cachedAt: number } | null;

  setFolderCache: (
    key: string,
    items: VfsItem[],
    breadcrumbs: BreadcrumbItem[],
  ) => void;
  invalidateFolderCache: (key?: string) => void;
  setTrashCache: (items: VfsItem[]) => void;
  invalidateTrashCache: () => void;

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
  refreshProviders: (force?: boolean) => Promise<void>;
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

  folderCache: {},
  providersLastFetched: 0,
  trashCache: null,

  setFolderCache: (key, items, breadcrumbs) => {
    set({
      folderCache: {
        ...get().folderCache,
        [key]: { items, breadcrumbs, cachedAt: Date.now() },
      },
    });
  },

  invalidateFolderCache: (key) => {
    if (key) {
      const nextCache = { ...get().folderCache };
      delete nextCache[key];
      set({ folderCache: nextCache });
    } else {
      set({ folderCache: {} });
    }
  },

  setTrashCache: (items) => {
    set({ trashCache: { items, cachedAt: Date.now() } });
  },

  invalidateTrashCache: () => {
    set({ trashCache: null });
  },

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
    const updatedItems = exists
      ? current.map((i) => (i.id === item.id ? { ...i, ...item } : i))
      : [item, ...current];

    set({ items: updatedItems });

    // Patch folder cache for the affected folder
    const targetKey = item.parentId || "root";
    const cached = get().folderCache[targetKey];
    if (cached) {
      const cachedExists = cached.items.some((i) => i.id === item.id);
      const newCachedItems = cachedExists
        ? cached.items.map((i) => (i.id === item.id ? { ...i, ...item } : i))
        : [item, ...cached.items];
      get().setFolderCache(targetKey, newCachedItems, cached.breadcrumbs);
    }
  },

  removeItem: (id) => {
    set({ items: get().items.filter((i) => i.id !== id) });

    // Remove from any cached folder
    const currentCache = get().folderCache;
    let modified = false;
    const nextCache: Record<string, FolderCacheEntry> = {};

    for (const [k, v] of Object.entries(currentCache)) {
      if (v.items.some((i) => i.id === id)) {
        modified = true;
        nextCache[k] = {
          ...v,
          items: v.items.filter((i) => i.id !== id),
        };
      } else {
        nextCache[k] = v;
      }
    }

    if (modified) {
      set({ folderCache: nextCache });
    }
  },

  setProviders: (providers, storageSummary) =>
    set({ providers, storageSummary, providersLastFetched: Date.now() }),

  setViewMode: (viewMode) => set({ viewMode }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setMigrationProgress: (migrationProgress) => set({ migrationProgress }),
  setMobileSidebarOpen: (isMobileSidebarOpen) => set({ isMobileSidebarOpen }),

  refreshProviders: async (force = false) => {
    const last = get().providersLastFetched;
    if (!force && last > 0 && Date.now() - last < 60_000) {
      return; // Cache is fresh within 60s
    }

    try {
      const data = await apiFetch<{
        providers: ProviderSummary[];
        summary: StorageSummary;
      }>("/providers");
      if (data && data.providers) {
        set({
          providers: data.providers,
          storageSummary: data.summary,
          providersLastFetched: Date.now(),
        });
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

import { create } from "zustand";

export interface VfsItem {
  id: string;
  name: string;
  type: "file" | "folder";
  size: number;
  mimeType: string | null;
  parentId: string | null;
  starred: boolean;
  trashedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderSummary {
  id: string;
  provider: "google_drive" | "one_drive" | "dropbox" | "box" | "pcloud";
  accountEmail: string | null;
  quotaTotal: number;
  quotaUsed: number;
}

export interface StorageSummary {
  totalPoolBytes: number;
  usedPoolBytes: number;
  freePoolBytes: number;
}

export interface MigrationProgress {
  providerId: string;
  completed: number;
  total: number;
  percent: number;
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
  isMobileSidebarOpen: boolean;

  setCurrentFolder: (id: string | null, name?: string) => void;
  setItems: (items: VfsItem[]) => void;
  addItem: (item: VfsItem) => void;
  removeItem: (id: string) => void;
  setProviders: (providers: ProviderSummary[], summary: StorageSummary) => void;
  setViewMode: (mode: "grid" | "list") => void;
  setSearchQuery: (query: string) => void;
  setIsLoading: (loading: boolean) => void;
  setMigrationProgress: (progress: MigrationProgress | null) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  refreshProviders: () => Promise<void>;
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

  setItems: (items) => set({ items }),
  addItem: (item) => {
    const current = get().items;
    if (!current.some((i) => i.id === item.id)) {
      set({ items: [item, ...current] });
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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    try {
      const res = await fetch(`${apiUrl}/providers`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        set({ providers: data.providers, storageSummary: data.summary });
      }
    } catch {}
  },
}));

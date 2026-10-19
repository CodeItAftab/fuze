export type VfsNodeType = "file" | "folder";

export interface VfsItem {
  id: string;
  name: string;
  type: VfsNodeType;
  size: number;
  mimeType: string | null;
  parentId: string | null;
  starred: boolean;
  trashedAt: string | null;
  createdAt: string;
  updatedAt: string;
  providerBadge?: string | null;
}

export interface BreadcrumbItem {
  id: string | null;
  name: string;
}

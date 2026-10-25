"use client";

import { useState, useEffect, useMemo } from "react";
import { VfsItem, useDriveStore } from "@/stores/drive.store";
import {
  Folder,
  FolderPlus,
  ChevronRight,
  HardDrive,
  Loader2,
  X,
  AlertCircle,
  Check,
} from "lucide-react";

export interface MoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemsToMove: VfsItem[];
  onMoved: () => void;
}

interface FolderNode {
  id: string;
  name: string;
  parentId: string | null;
}

export function MoveModal({
  isOpen,
  onClose,
  itemsToMove,
  onMoved,
}: MoveModalProps) {
  const [allFolders, setAllFolders] = useState<FolderNode[]>([]);
  const [currentDestId, setCurrentDestId] = useState<string | null>(null);
  const [destBreadcrumbs, setDestBreadcrumbs] = useState<
    Array<{ id: string | null; name: string }>
  >([{ id: null, name: "My Drive" }]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMoving, setIsMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick inline new folder creation
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Load all user folders on open
  useEffect(() => {
    if (!isOpen) return;
    setCurrentDestId(null);
    setDestBreadcrumbs([{ id: null, name: "My Drive" }]);
    setError(null);
    setShowNewFolderInput(false);
    setNewFolderName("");

    const loadFolders = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${apiUrl}/files/folders`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setAllFolders(data.folders || []);
        }
      } catch (err) {
        console.error("Failed to load destination folders", err);
      } finally {
        setIsLoading(false);
      }
    };

    void loadFolders();
  }, [isOpen, apiUrl]);

  // Compute invalid destinations (moving a folder into itself or its descendants)
  const invalidFolderIds = useMemo(() => {
    const invalid = new Set<string>();
    const movingFolderIds = itemsToMove
      .filter((i) => i.type === "folder")
      .map((i) => i.id);

    for (const folderId of movingFolderIds) {
      invalid.add(folderId);

      // Walk children recursively
      const findDescendants = (parentId: string) => {
        for (const f of allFolders) {
          if (f.parentId === parentId && !invalid.has(f.id)) {
            invalid.add(f.id);
            findDescendants(f.id);
          }
        }
      };
      findDescendants(folderId);
    }

    return invalid;
  }, [itemsToMove, allFolders]);

  // Folders inside current destination
  const subfolders = useMemo(() => {
    return allFolders.filter((f) => f.parentId === currentDestId);
  }, [allFolders, currentDestId]);

  // Check if all selected items are ALREADY in current destination
  const isAlreadyHere = useMemo(() => {
    if (itemsToMove.length === 0) return true;
    return itemsToMove.every((i) => i.parentId === currentDestId);
  }, [itemsToMove, currentDestId]);

  const handleDrillDown = (folder: FolderNode) => {
    if (invalidFolderIds.has(folder.id)) return;
    setCurrentDestId(folder.id);
    setDestBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  const handleCrumbClick = (index: number) => {
    const target = destBreadcrumbs[index];
    if (!target) return;
    setCurrentDestId(target.id);
    setDestBreadcrumbs((prev) => prev.slice(0, index + 1));
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setIsCreatingFolder(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/files/folder`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parentId: currentDestId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create folder");

      const created = data.folder;
      setAllFolders((prev) => [...prev, created]);
      setNewFolderName("");
      setShowNewFolderInput(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create folder");
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleMove = async () => {
    if (isAlreadyHere || isMoving || itemsToMove.length === 0) return;

    setIsMoving(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/files/move`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeIds: itemsToMove.map((i) => i.id),
          targetParentId: currentDestId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to move items");

      useDriveStore.getState().invalidateFolderCache();
      onMoved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to move items");
    } finally {
      setIsMoving(false);
    }
  };

  if (!isOpen) return null;

  const currentDestName =
    destBreadcrumbs[destBreadcrumbs.length - 1]?.name || "My Drive";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Move {itemsToMove.length === 1 ? `"${itemsToMove[0].name}"` : `${itemsToMove.length} items`}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Select destination folder
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Destination Breadcrumb Trail */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-1 text-xs overflow-x-auto">
          {destBreadcrumbs.map((crumb, idx) => (
            <div key={crumb.id || "root"} className="flex items-center gap-1 shrink-0">
              {idx > 0 && <ChevronRight className="h-3 w-3 text-slate-400" />}
              <button
                onClick={() => handleCrumbClick(idx)}
                className={`flex items-center gap-1 text-xs hover:underline cursor-pointer ${
                  idx === destBreadcrumbs.length - 1
                    ? "font-semibold text-slate-800"
                    : "text-slate-500"
                }`}
              >
                {idx === 0 && <HardDrive className="h-3 w-3" />}
                <span>{crumb.name}</span>
              </button>
            </div>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="m-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Folder Browser Body */}
        <div className="p-3 sm:p-4 flex-1 overflow-y-auto min-h-[220px]">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="text-xs">Loading folders...</span>
            </div>
          ) : (
            <div className="space-y-1">
              {subfolders.map((folder) => {
                const isInvalid = invalidFolderIds.has(folder.id);
                return (
                  <button
                    key={folder.id}
                    onClick={() => handleDrillDown(folder)}
                    disabled={isInvalid}
                    className={`w-full px-3 py-2 rounded-xl border flex items-center justify-between text-left transition cursor-pointer ${
                      isInvalid
                        ? "opacity-40 bg-slate-50 border-slate-100 cursor-not-allowed"
                        : "border-slate-200/70 hover:border-blue-300 hover:bg-blue-50/40 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Folder className="h-4 w-4 text-amber-500 fill-amber-100 shrink-0" />
                      <span className="text-xs font-medium truncate">
                        {folder.name}
                      </span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  </button>
                );
              })}

              {subfolders.length === 0 && !showNewFolderInput && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No subfolders in {currentDestName}.
                </div>
              )}

              {/* Inline New Folder Form */}
              {showNewFolderInput && (
                <form
                  onSubmit={handleCreateFolder}
                  className="p-2 border border-blue-200 rounded-xl bg-blue-50/20 flex items-center gap-2 mt-2"
                >
                  <FolderPlus className="h-4 w-4 text-blue-600 shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="New folder name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="flex-1 text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={isCreatingFolder || !newFolderName.trim()}
                    className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition cursor-pointer shrink-0"
                  >
                    {isCreatingFolder ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Create"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewFolderInput(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setShowNewFolderInput(true)}
            disabled={showNewFolderInput}
            className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <FolderPlus className="h-3.5 w-3.5 text-slate-500" />
            <span>New Folder</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-slate-600 hover:bg-slate-200/60 rounded-xl text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleMove}
              disabled={isMoving || isAlreadyHere}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              {isMoving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              <span>{isAlreadyHere ? "Already here" : `Move to ${currentDestName}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

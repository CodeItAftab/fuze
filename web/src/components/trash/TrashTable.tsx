import { VfsItem } from "@/stores/drive.store";
import { Folder, FileText, RotateCcw, Trash2, Loader2 } from "lucide-react";

interface TrashTableProps {
  trashedItems: VfsItem[];
  isLoading: boolean;
  selectedIds: Set<string>;
  isProcessing: boolean;
  formatBytes: (bytes: number) => string;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onRestore: (id: string) => void;
  onDeleteItem: (item: VfsItem) => void;
}

export function TrashTable({
  trashedItems,
  isLoading,
  selectedIds,
  isProcessing,
  formatBytes,
  onToggleSelect,
  onToggleSelectAll,
  onRestore,
  onDeleteItem,
}: TrashTableProps) {
  const allSelected =
    trashedItems.length > 0 && selectedIds.size === trashedItems.length;
  const someSelected =
    selectedIds.size > 0 && selectedIds.size < trashedItems.length;

  if (isLoading) {
    return (
      <div className="text-center py-16 text-slate-400 text-xs flex items-center justify-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        <span>Loading trash...</span>
      </div>
    );
  }

  if (trashedItems.length === 0) {
    return (
      <div className="border border-dashed border-slate-200 rounded-xl p-12 text-center max-w-sm mx-auto my-12 bg-white">
        <Trash2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <h3 className="font-semibold text-slate-700 text-xs">Trash is empty</h3>
        <p className="text-[11px] text-slate-400 mt-1">
          Items moved to trash will be permanently purged after 30 days.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs font-medium">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <label className="flex items-center cursor-pointer p-0.5">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) {
                  el.indeterminate = someSelected;
                }
              }}
              onChange={onToggleSelectAll}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
              title={allSelected ? "Deselect all" : "Select all"}
            />
          </label>
          <span className="truncate">Name</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          <span className="hidden sm:inline-block w-24 text-right">Size</span>
          <span className="w-20 sm:w-28 text-right">Actions</span>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {trashedItems.map((item) => {
          const isSelected = selectedIds.has(item.id);
          const isFolder = item.type === "folder";
          return (
            <div
              key={item.id}
              onClick={() => onToggleSelect(item.id)}
              className={`px-4 py-3 flex items-center justify-between transition text-xs gap-3 cursor-pointer select-none ${
                isSelected
                  ? "bg-blue-50/60 hover:bg-blue-50/80 ring-1 ring-inset ring-blue-200/70"
                  : "hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(item.id)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                  />
                </div>
                <div className="shrink-0 p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                  {isFolder ? (
                    <Folder className="h-4 w-4 text-amber-500" />
                  ) : (
                    <FileText className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={`font-medium text-xs truncate ${
                      isSelected ? "text-blue-900 font-semibold" : "text-slate-800"
                    }`}
                    title={item.name}
                  >
                    {item.name}
                  </div>
                  <div className="text-[10px] text-slate-400 sm:hidden mt-0.5">
                    {isFolder ? "Folder • In Trash" : `${formatBytes(item.size)} • In Trash`}
                  </div>
                </div>
              </div>

              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-4 sm:gap-6 shrink-0"
              >
                <span className="hidden sm:inline-block w-24 text-right text-slate-500">
                  {isFolder ? "—" : formatBytes(item.size)}
                </span>
                <div className="w-20 sm:w-28 flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => onRestore(item.id)}
                    className="px-2 sm:px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition flex items-center gap-1.5 font-medium text-xs cursor-pointer border border-blue-100 disabled:opacity-50"
                    title="Restore to Drive"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Restore</span>
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => onDeleteItem(item)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer border border-transparent hover:border-rose-100 disabled:opacity-50"
                    title="Permanently Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

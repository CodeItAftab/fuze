import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteAccountModalProps {
  isOpen: boolean;
  deleteConfirmation: string;
  deleteCloudFiles: boolean;
  isDeleting: boolean;
  deleteError: string | null;
  onConfirmationChange: (value: string) => void;
  onDeleteCloudFilesChange: (value: boolean) => void;
  onClose: () => void;
  onDelete: () => void;
}

export function DeleteAccountModal({
  isOpen,
  deleteConfirmation,
  deleteCloudFiles,
  isDeleting,
  deleteError,
  onConfirmationChange,
  onDeleteCloudFilesChange,
  onClose,
  onDelete,
}: DeleteAccountModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-rose-200 animate-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Delete Account
            </h3>
            <span className="text-[11px] text-rose-600 font-medium">
              Irreversible action
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed mb-3">
          Your Fuze profile, virtual file system, and linked account sessions will be permanently erased.
        </p>

        {/* Cloud Files Choice Checkbox */}
        <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={deleteCloudFiles}
              onChange={(e) => onDeleteCloudFilesChange(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-semibold text-slate-800 block">
                Also delete files from connected cloud drives
              </span>
              <span className="text-slate-500 text-[11px] leading-tight block mt-0.5">
                {deleteCloudFiles
                  ? "All files and chunk parts stored in Google Drive, OneDrive, Dropbox, Box, and pCloud will be permanently erased."
                  : "Files will remain safely in your personal cloud accounts. Only Fuze indexes and connections are deleted."}
              </span>
            </div>
          </label>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-800 mb-1.5">
            Type <strong className="text-rose-600">DELETE</strong> to confirm:
          </label>
          <input
            type="text"
            autoFocus
            value={deleteConfirmation}
            onChange={(e) => onConfirmationChange(e.target.value)}
            placeholder="DELETE"
            className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
          />
          {deleteError && (
            <p className="text-xs text-rose-600 mt-1.5">{deleteError}</p>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition cursor-pointer text-center"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={
              isDeleting ||
              deleteConfirmation.trim().toUpperCase() !== "DELETE"
            }
            className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>
              {isDeleting
                ? deleteCloudFiles
                  ? "Purging cloud data..."
                  : "Deleting account..."
                : "Delete Permanently"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

import { AlertTriangle } from "lucide-react";

interface DangerZoneSectionProps {
  onOpenDeleteModal: () => void;
}

export function DangerZoneSection({ onOpenDeleteModal }: DangerZoneSectionProps) {
  return (
    <section className="bg-white rounded-2xl border border-rose-200 p-4 sm:p-6 shadow-2xs">
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle className="h-4 w-4 text-rose-600" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-rose-900">
          Danger Zone
        </h2>
      </div>
      <p className="text-xs text-slate-500 mb-4 leading-relaxed">
        Permanently delete your account, virtual file system, and unlink all connected cloud drives. This action cannot be reversed.
      </p>

      <button
        type="button"
        onClick={onOpenDeleteModal}
        className="w-full sm:w-auto px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition cursor-pointer"
      >
        Delete Account
      </button>
    </section>
  );
}

import { HardDrive, ChevronRight } from "lucide-react";

interface DriveBreadcrumbsProps {
  folderId: string | null;
  breadcrumbs: Array<{ id: string | null; name: string }>;
  onNavigate: (folderId: string | null) => void;
}

export function DriveBreadcrumbs({
  folderId,
  breadcrumbs,
  onNavigate,
}: DriveBreadcrumbsProps) {
  if (!folderId) return null;

  // Filter out leading root crumb to avoid displaying "My Drive" twice
  const folderCrumbs = breadcrumbs.filter(
    (crumb, idx) =>
      !(idx === 0 && (crumb.id === null || crumb.name.toLowerCase() === "my drive")),
  );

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-xs text-slate-500 mb-6 font-normal overflow-x-auto scrollbar-none pb-0.5"
    >
      <button
        onClick={() => onNavigate(null)}
        className="hover:text-blue-600 transition flex items-center gap-1 text-slate-500 hover:underline cursor-pointer"
      >
        <HardDrive className="h-3.5 w-3.5" />
        <span>My Drive</span>
      </button>
      {folderCrumbs.map((crumb, idx) => (
        <div key={crumb.id || idx} className="flex items-center gap-1.5 shrink-0">
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <button
            onClick={() => onNavigate(crumb.id)}
            className={`hover:text-blue-600 transition cursor-pointer ${
              idx === folderCrumbs.length - 1
                ? "font-semibold text-slate-800"
                : "text-slate-500 hover:underline"
            }`}
          >
            {crumb.name}
          </button>
        </div>
      ))}
    </nav>
  );
}

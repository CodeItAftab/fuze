import { ProviderMeta } from "@/types";

export const PROVIDERS_CONFIG: Record<string, ProviderMeta> = {
  google_drive: {
    id: "google_drive",
    label: "Google Drive",
    bgClass: "bg-amber-500",
    dotClass: "bg-amber-500",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  one_drive: {
    id: "one_drive",
    label: "OneDrive",
    bgClass: "bg-blue-500",
    dotClass: "bg-blue-500",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  pcloud: {
    id: "pcloud",
    label: "pCloud",
    bgClass: "bg-sky-400",
    dotClass: "bg-sky-400",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
  },
  dropbox: {
    id: "dropbox",
    label: "Dropbox",
    bgClass: "bg-indigo-600",
    dotClass: "bg-indigo-600",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  box: {
    id: "box",
    label: "Box",
    bgClass: "bg-emerald-500",
    dotClass: "bg-emerald-500",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

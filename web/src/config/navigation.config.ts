import {
  HardDrive,
  Trash2,
  Cloud,
  Settings,
  Star,
  ArrowUpCircle,
  RefreshCw,
} from "lucide-react";
import { NavItemConfig } from "@/types";

export const DASHBOARD_NAV_ITEMS: NavItemConfig[] = [
  {
    href: "/dashboard",
    label: "My Drive",
    icon: HardDrive,
    isActive: (p) => p === "/dashboard" || p.startsWith("/dashboard/folder"),
  },
  {
    href: "/dashboard/starred",
    label: "Starred",
    icon: Star,
    isActive: (p) => p === "/dashboard/starred",
  },
  {
    href: "/dashboard/storage",
    label: "Connected Clouds",
    icon: Cloud,
    isActive: (p) => p === "/dashboard/storage",
  },
  {
    href: "/dashboard/uploads",
    label: "Uploads",
    icon: ArrowUpCircle,
    isActive: (p) => p === "/dashboard/uploads",
    getBadge: ({ activeUploads }) =>
      activeUploads > 0
        ? { text: activeUploads, colorClass: "bg-blue-600 text-white" }
        : undefined,
  },
  {
    href: "/dashboard/migrations",
    label: "Migrations",
    icon: RefreshCw,
    isActive: (p) => p === "/dashboard/migrations",
    getBadge: ({ migrationPercent }) =>
      migrationPercent !== undefined
        ? {
            text: `${migrationPercent}%`,
            colorClass: "bg-emerald-600 text-white",
          }
        : undefined,
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
    isActive: (p) => p === "/dashboard/settings",
  },
  {
    href: "/dashboard/trash",
    label: "Trash",
    icon: Trash2,
    isActive: (p) => p === "/dashboard/trash",
  },
];

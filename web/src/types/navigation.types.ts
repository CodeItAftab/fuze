import { LucideIcon } from "lucide-react";

export interface NavItemBadge {
  text: string | number;
  colorClass: string;
}

export interface NavContext {
  activeUploads: number;
  migrationPercent?: number;
}

export interface NavItemConfig {
  href: string;
  label: string;
  icon: LucideIcon;
  iconClass?: string;
  isActive: (pathname: string) => boolean;
  getBadge?: (context: NavContext) => NavItemBadge | undefined;
}

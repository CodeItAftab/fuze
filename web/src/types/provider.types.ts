export type ProviderId =
  | "google_drive"
  | "one_drive"
  | "pcloud"
  | "dropbox"
  | "box";

export interface ProviderMeta {
  id: ProviderId;
  label: string;
  bgClass: string;
  dotClass: string;
  badgeClass: string;
}

export interface ProviderSummary {
  id: string;
  provider: ProviderId;
  accountEmail: string | null;
  quotaTotal: number;
  quotaUsed: number;
  isRevoked?: boolean;
}

export interface StorageSummary {
  totalPoolBytes: number;
  usedPoolBytes: number;
  freePoolBytes: number;
}

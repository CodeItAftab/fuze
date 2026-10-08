import { StorageAdapter } from "./base.adapter.js";
import { GoogleDriveAdapter } from "./gdrive.adapter.js";
import { OneDriveAdapter } from "./onedrive.adapter.js";
import { DropboxAdapter } from "./dropbox.adapter.js";
import { PCloudAdapter } from "./pcloud.adapter.js";

export type SupportedProvider =
  | "google_drive"
  | "one_drive"
  | "dropbox"
  | "pcloud";

const adapters: Record<SupportedProvider, StorageAdapter> = {
  google_drive: new GoogleDriveAdapter(),
  one_drive: new OneDriveAdapter(),
  dropbox: new DropboxAdapter(),
  pcloud: new PCloudAdapter(),
};

export function getStorageAdapter(provider: SupportedProvider): StorageAdapter {
  const adapter = adapters[provider];
  if (!adapter) {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  return adapter;
}

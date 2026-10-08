import { StorageAdapter } from "./base.adapter.js";
import { GoogleDriveAdapter } from "./gdrive.adapter.js";
import { OneDriveAdapter } from "./onedrive.adapter.js";
import { DropboxAdapter } from "./dropbox.adapter.js";
import { PCloudAdapter } from "./pcloud.adapter.js";
import { BoxAdapter } from "./box.adapter.js";

export type SupportedProvider =
  | "google_drive"
  | "one_drive"
  | "dropbox"
  | "pcloud"
  | "box";

const adapters: Record<SupportedProvider, StorageAdapter> = {
  google_drive: new GoogleDriveAdapter(),
  one_drive: new OneDriveAdapter(),
  dropbox: new DropboxAdapter(),
  pcloud: new PCloudAdapter(),
  box: new BoxAdapter(),
};

export function getStorageAdapter(provider: SupportedProvider): StorageAdapter {
  const adapter = adapters[provider];
  if (!adapter) {
    throw new Error(`Unsupported storage provider: ${provider}`);
  }
  return adapter;
}

import { Metadata } from "next";
import { StorageView } from "@/components/storage/StorageView";

export const metadata: Metadata = {
  title: "Connected Storage Clouds - Fuze Drive",
  description: "View and manage your connected cloud accounts and unified storage pool.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function StorageProvidersPage() {
  return <StorageView />;
}

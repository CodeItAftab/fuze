import { Metadata } from "next";
import { TrashView } from "@/components/trash/TrashView";

export const metadata: Metadata = {
  title: "Trash - Fuze Drive",
  description: "Manage, restore, or permanently delete trashed files across all connected clouds.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TrashPage() {
  return <TrashView />;
}

import { use } from "react";
import { DriveView } from "@/components/drive/DriveView";

interface FolderPageProps {
  params: Promise<{ folderId: string }>;
}

export default function FolderPage({ params }: FolderPageProps) {
  const resolvedParams = use(params);
  return <DriveView folderId={resolvedParams.folderId} />;
}

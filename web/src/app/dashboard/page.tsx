import { Suspense } from "react";
import { DriveView } from "@/components/drive/DriveView";

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DriveView folderId={null} />
    </Suspense>
  );
}

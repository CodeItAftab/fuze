import { Metadata } from "next";
import { Suspense } from "react";
import { FilePreviewClient } from "@/components/preview/FilePreviewClient";

export const metadata: Metadata = {
  title: "File Preview - Fuze Drive",
  description: "Secure fullscreen file preview and direct cloud streaming.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function FilePreviewPage() {
  return (
    <Suspense fallback={null}>
      <FilePreviewClient />
    </Suspense>
  );
}

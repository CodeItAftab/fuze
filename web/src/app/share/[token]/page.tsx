import { Metadata } from "next";
import { Suspense } from "react";
import { ShareClient } from "@/components/share/ShareClient";

export const metadata: Metadata = {
  title: "Shared File - Fuze Drive",
  description: "Secure shared file download and cloud media streaming via Fuze Drive.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SharePage() {
  return (
    <Suspense fallback={null}>
      <ShareClient />
    </Suspense>
  );
}

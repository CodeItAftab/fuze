import { Metadata } from "next";
import { UploadsView } from "@/components/transfers/UploadsView";

export const metadata: Metadata = {
  title: "Upload Transfers | Fuze Drive",
  description:
    "Monitor real-time zero-proxy file upload transfers across your cloud storage.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function UploadsPage() {
  return <UploadsView />;
}

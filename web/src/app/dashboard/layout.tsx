import type { Metadata } from "next";
import { DashboardClientProvider } from "./DashboardClientProvider";

export const metadata: Metadata = {
  title: "Dashboard | Fuze Drive",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardClientProvider>{children}</DashboardClientProvider>;
}

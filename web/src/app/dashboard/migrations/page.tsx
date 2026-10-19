import { Metadata } from "next";
import { MigrationsView } from "@/components/transfers/MigrationsView";

export const metadata: Metadata = {
  title: "Provider Migrations | Fuze Drive",
  description:
    "Monitor cloud evacuations, chunk rebalancing, and provider disconnections.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MigrationsPage() {
  return <MigrationsView />;
}

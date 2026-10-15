import { Metadata } from "next";
import { SettingsView } from "@/components/settings/SettingsView";

export const metadata: Metadata = {
  title: "Account Settings - Fuze Drive",
  description: "Manage your personal profile, credentials, and active sessions on Fuze Drive.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SettingsPage() {
  return <SettingsView />;
}

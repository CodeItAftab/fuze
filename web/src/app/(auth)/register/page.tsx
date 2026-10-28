import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TOTAL_FREE_STORAGE_GB } from "@/lib/facts";

export const metadata: Metadata = {
  title: "Create Account | Fuze Drive",
  description: `Create a free Fuze Drive account to combine your cloud storage into a unified ${TOTAL_FREE_STORAGE_GB} GB drive.`,
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "https://fuzedrive.tech/register",
  },
};

export default function RegisterPage() {
  redirect("/login?mode=register");
}

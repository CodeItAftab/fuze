import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In & Register | Fuze Drive",
  description:
    "Sign in to your unified personal cloud storage or create a free account to aggregate 42 GB across Google Drive, OneDrive, Dropbox, and Box.",
  alternates: {
    canonical: "https://fuzedrive.tech/login",
  },
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

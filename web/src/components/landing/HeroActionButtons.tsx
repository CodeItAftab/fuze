"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { TOTAL_FREE_STORAGE_GB } from "@/lib/facts";

export function HeroActionButtons() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return <div className="h-12 w-48 rounded-xl bg-slate-100 animate-pulse" />;
  }

  if (user) {
    return (
      <>
        <Link
          href="/dashboard"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition active:scale-95"
        >
          <span>Launch My Drive</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
        <a
          href="#calculator"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-6 py-3.5 text-sm font-semibold text-slate-700 transition"
        >
          Explore {TOTAL_FREE_STORAGE_GB} GB Free Pool
        </a>
      </>
    );
  }

  return (
    <>
      <Link
        href="/register"
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition active:scale-95"
      >
        <span>Get Started Free ({TOTAL_FREE_STORAGE_GB} GB)</span>
        <ArrowRight className="h-4 w-4" />
      </Link>
      <Link
        href="/login"
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-6 py-3.5 text-sm font-semibold text-slate-700 transition"
      >
        Sign In to Your Drive
      </Link>
    </>
  );
}

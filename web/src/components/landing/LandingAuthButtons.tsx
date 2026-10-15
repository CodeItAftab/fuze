"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { GithubIcon } from "@/components/icons/GithubIcon";

const GITHUB_REPO_URL = "https://github.com/CodeItAftab/fuze";

export function LandingAuthButtons() {
  const { user, isLoading, checkSession } = useAuthStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <a
        href={GITHUB_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
        title="Star CodeItAftab/fuze on GitHub"
      >
        <GithubIcon className="h-4 w-4 text-slate-900" />
        <span>Star</span>
        <span className="text-slate-400">|</span>
        <span className="text-amber-500 font-bold flex items-center gap-0.5">
          <Star className="h-3 w-3 fill-amber-400" />
        </span>
      </a>

      {isLoading ? (
        <div className="h-8 sm:h-9 w-20 sm:w-24 rounded-xl bg-slate-100 animate-pulse" />
      ) : user ? (
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition active:scale-95"
          >
            <span>Go to Drive</span>
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/login"
            className="px-2 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-blue-600 hover:bg-blue-700 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition active:scale-95 whitespace-nowrap"
          >
            <span>
              <span className="sm:hidden">Start Free</span>
              <span className="hidden sm:inline">Get Started Free</span>
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}

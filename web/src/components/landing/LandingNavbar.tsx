import Link from "next/link";
import { FuzeLogo } from "@/components/brand/FuzeLogo";
import { LandingAuthButtons } from "@/components/landing/LandingAuthButtons";

export function LandingNavbar() {
  return (
    <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <FuzeLogo variant="full" height={26} />
          </Link>

          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#calculator" className="hover:text-slate-900 transition">
              Storage Pool (42 GB)
            </a>
            <a href="#architecture" className="hover:text-slate-900 transition">
              Architecture
            </a>
            <a
              href="#open-source"
              className="hover:text-slate-900 transition flex items-center gap-1.5"
            >
              <span>Open Source</span>
              <span className="px-1.5 py-0.2 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                MIT
              </span>
            </a>
            <a href="#about" className="hover:text-slate-900 transition">
              About Us
            </a>
            <Link href="/how-it-works" className="hover:text-slate-900 transition">
              How It Works
            </Link>
            <a href="#faq" className="hover:text-slate-900 transition">
              FAQ
            </a>
            <a href="#comparison" className="hover:text-slate-900 transition">
              Comparison
            </a>
          </nav>
        </div>

        <LandingAuthButtons />
      </div>
    </header>
  );
}

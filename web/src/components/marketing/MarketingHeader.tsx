import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FuzeLogo } from "@/components/brand/FuzeLogo";

interface MarketingHeaderProps {
  backHref?: string;
  backLabel?: string;
  ctaHref?: string;
  ctaLabel?: string;
}

export function MarketingHeader({
  backHref = "/",
  backLabel = "Back to Home",
  ctaHref = "/register",
  ctaLabel = "Get Started Free",
}: MarketingHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <FuzeLogo height={28} />
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{backLabel}</span>
          </Link>
          <Link
            href={ctaHref}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-xs"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}

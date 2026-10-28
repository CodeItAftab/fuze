import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TOTAL_FREE_STORAGE_GB } from "@/lib/facts";

interface MarketingCtaProps {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonHref?: string;
}

export function MarketingCta({
  title = "Start Pooling Your Free Cloud Storage Today",
  description = `Combine your free cloud accounts across 7 providers into one unified ${TOTAL_FREE_STORAGE_GB} GB personal drive. 100% free, open source, and direct browser-to-cloud streams.`,
  buttonText = "Get Started Free",
  buttonHref = "/register",
}: MarketingCtaProps) {
  return (
    <div className="mt-12 p-8 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg space-y-5 text-center">
      <h3 className="text-2xl sm:text-3xl font-extrabold m-0">{title}</h3>
      <p className="text-blue-100 text-sm sm:text-base max-w-xl mx-auto m-0">
        {description}
      </p>
      <div className="pt-2">
        <Link
          href={buttonHref}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-blue-700 font-bold text-sm hover:bg-blue-50 transition shadow-sm"
        >
          <span>{buttonText}</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

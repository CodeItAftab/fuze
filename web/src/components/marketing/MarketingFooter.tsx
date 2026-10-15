import Link from "next/link";
import { FuzeLogo } from "@/components/brand/FuzeLogo";
import { GithubIcon } from "@/components/icons/GithubIcon";

const GITHUB_REPO_URL = "https://github.com/CodeItAftab/fuze";

export function MarketingFooter() {
  return (
    <footer className="border-t border-slate-200 py-8 px-4 sm:px-6 text-xs text-slate-500 bg-white mt-12">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <FuzeLogo variant="icon" height={20} />
          <span className="font-semibold text-slate-700">Fuze Drive</span>
          <span>• MIT Licensed Open Source</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-slate-600 font-medium">
          <Link href="/" className="hover:text-slate-900 transition">
            Home
          </Link>
          <Link href="/how-it-works" className="hover:text-slate-900 transition">
            How It Works
          </Link>
          <Link href="/faq" className="hover:text-slate-900 transition">
            FAQ
          </Link>
          <Link href="/compare/multcloud-alternative" className="hover:text-slate-900 transition">
            MultCloud Alternative
          </Link>
          <Link href="/guides/combine-google-drive-onedrive-dropbox" className="hover:text-slate-900 transition">
            Combine Clouds
          </Link>
          <Link href="/privacy" className="hover:text-slate-900 transition">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-slate-900 transition">
            Terms of Service
          </Link>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-900 transition flex items-center gap-1"
          >
            <GithubIcon className="h-3 w-3" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  );
}

import Link from "next/link";
import { FuzeLogo } from "@/components/brand/FuzeLogo";
import { GithubIcon } from "@/components/icons/GithubIcon";

const GITHUB_REPO_URL = "https://github.com/CodeItAftab/fuze";

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 py-10 px-4 sm:px-6 text-xs text-slate-500 bg-slate-50">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <FuzeLogo variant="icon" height={24} />
          <div>
            <span className="font-semibold text-slate-800 block">
              Fuze Drive
            </span>
            <span>
              Released under the MIT License • Built for the open-source community.
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 font-medium text-slate-600">
          <a href="#calculator" className="hover:text-slate-900 transition">
            Calculator
          </a>
          <a href="#architecture" className="hover:text-slate-900 transition">
            Architecture
          </a>
          <a href="#open-source" className="hover:text-slate-900 transition">
            Open Source
          </a>
          <a href="#about" className="hover:text-slate-900 transition">
            About Us
          </a>
          <Link href="/faq" className="hover:text-slate-900 transition">
            FAQ
          </Link>
          <Link
            href="/compare/multcloud-alternative"
            className="hover:text-slate-900 transition"
          >
            MultCloud Alternative
          </Link>
          <Link
            href="/guides/combine-google-drive-onedrive-dropbox"
            className="hover:text-slate-900 transition"
          >
            Combine Cloud Storage
          </Link>
          <Link
            href="/guides/free-cloud-storage-comparison-2026"
            className="hover:text-slate-900 transition"
          >
            Best Free Cloud Storage 2026
          </Link>
          <Link
            href="/guides/open-source-cloud-storage-aggregator"
            className="hover:text-slate-900 transition"
          >
            Open Source Aggregator
          </Link>
          <Link href="/how-it-works" className="hover:text-slate-900 transition">
            How It Works
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
            <GithubIcon className="h-3.5 w-3.5" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  );
}

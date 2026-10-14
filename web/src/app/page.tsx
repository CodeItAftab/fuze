"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FuzeLogo } from "@/components/brand/FuzeLogo";
import { useAuthStore } from "@/stores/auth.store";
import {
  HardDrive,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  Cloud,
  Lock,
  Search,
  Folder,
  FileText,
  Image as ImageIcon,
  MoreVertical,
  Check,
  Settings,
  Sparkles,
  Code2,
  GitPullRequest,
  Users,
  ExternalLink,
  Star,
  GitBranch,
  Terminal,
  Film,
  FileSpreadsheet,
  ChevronDown,
  HelpCircle,
} from "lucide-react";

// Crisp inline SVG for GitHub brand icon
function GithubIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

interface Provider {
  id: string;
  name: string;
  quotaGB: number;
  brandColor: string;
  badgeBg: string;
  badgeText: string;
}

const PROVIDERS: Provider[] = [
  {
    id: "gdrive",
    name: "Google Drive",
    quotaGB: 15,
    brandColor: "#EA4335",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
  },
  {
    id: "box",
    name: "Box",
    quotaGB: 10,
    brandColor: "#0061D5",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
  },
  {
    id: "pcloud",
    name: "pCloud",
    quotaGB: 10,
    brandColor: "#00B0FF",
    badgeBg: "bg-sky-50",
    badgeText: "text-sky-700",
  },
  {
    id: "onedrive",
    name: "Microsoft OneDrive",
    quotaGB: 5,
    brandColor: "#0078D4",
    badgeBg: "bg-cyan-50",
    badgeText: "text-cyan-700",
  },
  {
    id: "dropbox",
    name: "Dropbox",
    quotaGB: 2,
    brandColor: "#0061FF",
    badgeBg: "bg-indigo-50",
    badgeText: "text-indigo-700",
  },
];

const GITHUB_REPO_URL = "https://github.com/CodeItAftab/fuze";
const GITHUB_OWNER_URL = "https://github.com/CodeItAftab";

export default function HomePage() {
  const { user, isLoading, checkSession } = useAuthStore();
  const [selectedProviders, setSelectedProviders] = useState<string[]>([
    "gdrive",
    "box",
    "pcloud",
    "onedrive",
    "dropbox",
  ]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const toggleProvider = (id: string) => {
    setSelectedProviders((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const totalPoolGB = PROVIDERS.filter((p) =>
    selectedProviders.includes(p.id),
  ).reduce((sum, p) => sum + p.quotaGB, 0);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* Top Banner: Open Source Announcement */}
      <aside
        aria-label="Open Source Announcement"
        className="bg-slate-900 text-slate-200 text-xs py-2 px-4 text-center font-medium border-b border-slate-800"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-center flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold text-[11px] border border-blue-500/30">
            <Sparkles className="h-3 w-3" /> Fuze Open Source (v1.0)
          </span>
          <span>
            Zero-proxy personal cloud storage with direct browser-to-cloud
            streams.
          </span>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 underline underline-offset-2 font-semibold transition"
          >
            <GithubIcon className="h-3.5 w-3.5 inline" />
            Star on GitHub &rarr;
          </a>
        </div>
      </aside>

      {/* Navigation */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <FuzeLogo variant="full" height={28} />
            </Link>

            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
              <a href="#calculator" className="hover:text-slate-900 transition">
                Storage Pool (42 GB)
              </a>
              <a
                href="#architecture"
                className="hover:text-slate-900 transition"
              >
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
              <a href="#faq" className="hover:text-slate-900 transition">
                FAQ
              </a>
              <a href="#comparison" className="hover:text-slate-900 transition">
                Comparison
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* GitHub Star Pill */}
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

            {/* Dynamic Auth State Navigation */}
            {isLoading ? (
              <div className="h-9 w-24 rounded-xl bg-slate-100 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-xs transition active:scale-95"
                >
                  <span>Go to Drive</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-xs transition active:scale-95"
                >
                  Get Started Free
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 sm:pt-24 pb-16 px-4 sm:px-6 max-w-5xl mx-auto text-center">
        {/* Open Source & Zero-Proxy Badge */}
        <div className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-semibold text-slate-700 mb-8 shadow-2xs">
          <span className="flex items-center gap-1 text-blue-600">
            <Star className="h-3.5 w-3.5 fill-blue-600 text-blue-600" />
            100% Free & Open Source
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1 text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Zero-Proxy Architecture
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
          Unify all your free cloud storage into{" "}
          <span className="bg-linear-to-r from-blue-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
            one 42 GB personal drive
          </span>
          .
        </h1>

        <p className="mt-6 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Fuze aggregates your free storage across{" "}
          <strong>Google Drive, Box, pCloud, OneDrive, and Dropbox</strong>.
          Enjoy zero server data transit, whole-file priority, and native video
          & document previews.
        </p>

        {/* Dynamic Hero CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          {isLoading ? (
            <div className="h-12 w-48 rounded-xl bg-slate-100 animate-pulse" />
          ) : user ? (
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
                Manage 42 GB Free Pool
              </a>
            </>
          ) : (
            <>
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition active:scale-95"
              >
                <span>Get Started Free</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-6 py-3.5 text-sm font-semibold text-slate-700 transition"
              >
                Sign In to Your Drive
              </Link>
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-5 py-3.5 text-sm font-semibold text-slate-700 transition"
              >
                <GithubIcon className="h-4 w-4 text-slate-900" />
                <span>GitHub Repository</span>
              </a>
            </>
          )}
        </div>

        {/* Metric Badges */}
        <div className="mt-14 pt-8 border-t border-slate-200/90 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto text-left">
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100">
            <div className="text-2xl font-bold text-slate-900">42 GB</div>
            <div className="text-xs text-slate-500 mt-0.5">
              5-Cloud Combined Free Pool
            </div>
          </div>
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100">
            <div className="text-2xl font-bold text-slate-900">0 KB</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Server Transit (Zero-Proxy)
            </div>
          </div>
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100">
            <div className="text-2xl font-bold text-slate-900">Native</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Video & Document Previews
            </div>
          </div>
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100">
            <div className="text-2xl font-bold text-emerald-600">100% Free</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Open Source (MIT License)
            </div>
          </div>
        </div>
      </section>

      {/* Realistic In-Browser Drive Mockup */}
      <section className="px-4 sm:px-6 pb-20 max-w-6xl mx-auto">
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
          {/* Browser Window Header */}
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-rose-400" />
              <div className="h-3 w-3 rounded-full bg-amber-400" />
              <div className="h-3 w-3 rounded-full bg-emerald-400" />
            </div>
            <div className="bg-white border border-slate-200 rounded-lg px-4 py-1 text-xs text-slate-500 font-mono flex items-center gap-2 w-72 justify-center shadow-2xs">
              <Lock className="h-3 w-3 text-emerald-600" />{" "}
              https://fuze.aftabalam.me/dashboard
            </div>
            <div className="text-[11px] font-semibold text-slate-400 hidden sm:block">
              Fuze v1.0
            </div>
          </div>

          {/* Drive App Canvas */}
          <div className="grid grid-cols-12 min-h-105 text-xs">
            {/* Sidebar Mock */}
            <div className="col-span-12 md:col-span-3 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/60 p-4 flex flex-col justify-between gap-4">
              <div className="space-y-4">
                <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 font-semibold text-white shadow-2xs cursor-default">
                  <span>+ Upload Files</span>
                </button>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 font-semibold text-blue-700">
                    <HardDrive className="h-4 w-4" /> My Drive
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                    <Cloud className="h-4 w-4" /> 5 Connected Clouds
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                    <Settings className="h-4 w-4" /> Drive Settings
                  </div>
                </div>
              </div>

              {/* Storage Meter */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                <div className="flex justify-between font-semibold text-slate-700 mb-1.5">
                  <span>Storage Pool</span>
                  <span className="text-blue-600 font-bold">
                    18.4 / 42.0 GB
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                  <div
                    className="bg-amber-500 h-full w-[35%]"
                    title="Google Drive (15 GB)"
                  />
                  <div
                    className="bg-blue-600 h-full w-[24%]"
                    title="Box (10 GB)"
                  />
                  <div
                    className="bg-sky-400 h-full w-[24%]"
                    title="pCloud (10 GB)"
                  />
                  <div
                    className="bg-cyan-500 h-full w-[12%]"
                    title="OneDrive (5 GB)"
                  />
                  <div
                    className="bg-indigo-500 h-full w-[5%]"
                    title="Dropbox (2 GB)"
                  />
                </div>
                <div className="mt-2 text-[10px] text-slate-500 flex justify-between font-medium">
                  <span>5 cloud drives unified</span>
                  <span className="text-emerald-600 font-semibold">
                    23.6 GB free
                  </span>
                </div>
              </div>
            </div>

            {/* File List Mock */}
            <div className="col-span-12 md:col-span-9 p-4 sm:p-6 bg-white">
              {/* Search Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2 text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl w-full sm:w-80">
                  <Search className="h-3.5 w-3.5" />
                  <span className="text-slate-400">
                    Search files, videos, docs...
                  </span>
                </div>
                <div className="text-slate-500 font-medium text-[11px] hidden sm:block">
                  Prioritizing Whole Files
                </div>
              </div>

              {/* Sample Folders */}
              <div className="mb-6">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Folders
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="border border-slate-200 rounded-xl p-3 flex items-center gap-3 bg-white hover:border-slate-300">
                    <Folder className="h-6 w-6 text-amber-500 fill-amber-100" />
                    <div>
                      <div className="font-semibold text-slate-800">
                        Financial Reports
                      </div>
                      <div className="text-[10px] text-slate-400">12 items</div>
                    </div>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-3 flex items-center gap-3 bg-white hover:border-slate-300">
                    <Folder className="h-6 w-6 text-blue-500 fill-blue-100" />
                    <div>
                      <div className="font-semibold text-slate-800">
                        Product Assets
                      </div>
                      <div className="text-[10px] text-slate-400">48 items</div>
                    </div>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-3 flex items-center gap-3 bg-white hover:border-slate-300">
                    <Folder className="h-6 w-6 text-indigo-500 fill-indigo-100" />
                    <div>
                      <div className="font-semibold text-slate-800">
                        Raw 4K Footage
                      </div>
                      <div className="text-[10px] text-slate-400">
                        4 video files
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sample Files with Provider Badges & Thumbnails */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Files & Previews
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                  {/* File 1: Whole video with native thumbnail */}
                  <div className="p-3 flex items-center justify-between hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                        <Film className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">
                          Demo_Walkthrough_1080p.mp4
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Instant Native Video Thumbnail
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Google Drive (Whole)
                      </span>
                      <span className="text-slate-500 w-16 text-right font-medium">
                        84.2 MB
                      </span>
                      <MoreVertical className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </div>

                  {/* File 2: Whole Box Doc */}
                  <div className="p-3 flex items-center justify-between hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">
                          Engineering_RFC_v2.pdf
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Box 120+ Format Preview
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Box (Whole)
                      </span>
                      <span className="text-slate-500 w-16 text-right font-medium">
                        12.6 MB
                      </span>
                      <MoreVertical className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </div>

                  {/* File 3: Multi-Cloud Chunked Archive */}
                  <div className="p-3 flex items-center justify-between hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                        <ImageIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">
                          Dataset_AI_Training.tar.gz
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Merkle Verified • Fallback Chunked
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        Multi-Cloud (3 Providers)
                      </span>
                      <span className="text-slate-500 w-16 text-right font-medium">
                        18.4 GB
                      </span>
                      <MoreVertical className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </div>

                  {/* File 4: pCloud Whole Spreadsheet */}
                  <div className="p-3 flex items-center justify-between hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                        <FileSpreadsheet className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">
                          Q3_Quarterly_Financials.xlsx
                        </div>
                        <div className="text-[10px] text-slate-400">
                          pCloud EU High-Speed Storage
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                        pCloud (Whole)
                      </span>
                      <span className="text-slate-500 w-16 text-right font-medium">
                        4.8 MB
                      </span>
                      <MoreVertical className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Storage Pooling Calculator */}
      <section
        id="calculator"
        className="py-20 px-4 sm:px-6 bg-slate-50 border-t border-slate-200"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1.5 block">
              Free Quota Combiner
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
              Calculate Your Unified Free Storage
            </h2>
            <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto">
              Select your accounts to see how much free personal storage you can
              aggregate without paying a single dollar:
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 mb-8">
            {PROVIDERS.map((provider) => {
              const isChecked = selectedProviders.includes(provider.id);
              return (
                <button
                  key={provider.id}
                  onClick={() => toggleProvider(provider.id)}
                  className={`p-4 rounded-2xl border text-left transition-all bg-white cursor-pointer ${
                    isChecked
                      ? "border-blue-600 shadow-sm ring-2 ring-blue-600/20"
                      : "border-slate-200 opacity-60 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-8 w-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                      <Cloud className="h-4 w-4 text-slate-700" />
                    </div>
                    <div
                      className={`h-4 w-4 rounded-md flex items-center justify-center text-xs font-bold ${
                        isChecked
                          ? "bg-blue-600 text-white"
                          : "border border-slate-300"
                      }`}
                    >
                      {isChecked && <Check className="h-3 w-3 stroke-3" />}
                    </div>
                  </div>
                  <div className="font-semibold text-slate-900 text-sm truncate">
                    {provider.name}
                  </div>
                  <div className="text-xs font-bold text-blue-600 mt-0.5">
                    +{provider.quotaGB} GB Free
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Your Combined Storage Pool
              </div>
              <div className="text-4xl sm:text-5xl font-black text-slate-900 mt-1">
                {totalPoolGB}{" "}
                <span className="text-2xl font-bold text-blue-600">
                  GB Free Storage
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                100% free forever. No credit cards, no recurring bills, and no
                vendor lock-in.
              </p>
            </div>
            {user ? (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3.5 text-sm font-semibold text-white transition whitespace-nowrap shadow-sm text-center"
              >
                Go to Storage Dashboard
              </Link>
            ) : (
              <Link
                href="/register"
                className="w-full sm:w-auto rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3.5 text-sm font-semibold text-white transition whitespace-nowrap shadow-sm text-center"
              >
                Claim Your Free {totalPoolGB} GB
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Architecture & Engineering Principles */}
      <section
        id="architecture"
        className="py-20 px-4 sm:px-6 max-w-6xl mx-auto"
      >
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
            Engineering Principles
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            How Fuze Unifies Multi-Cloud Files
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            Engineered from first principles for direct speed, cryptographic
            safety, and complete privacy.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-blue-200 transition">
            <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-5">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Rule 1: Whole-File Priority
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              If a file fits in <strong>any single connected provider</strong>,
              it is uploaded intact. This eliminates chunking latency and
              enables instant cloud-native thumbnail rendering.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-emerald-200 transition">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-5">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Zero-Proxy Direct Streaming
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Files never pass through Fuze application servers. Bytes stream
              directly between your browser and the respective cloud REST APIs
              via authorized resumable sessions.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-indigo-200 transition">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-5">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Multi-Cloud Dynamic Chunking
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              When a large file exceeds all individual provider limits, Fuze
              automatically splits it across available clouds with SHA-256
              Merkle root verification.
            </p>
          </div>
        </div>
      </section>

      {/* Open Source & Collaborators Section */}
      <section
        id="open-source"
        className="py-20 px-4 sm:px-6 bg-slate-900 text-white relative overflow-hidden"
      >
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
              <Code2 className="h-3.5 w-3.5" /> Built for the Community
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              100% Free & Open Source
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
              Fuze is an independent, community-driven open-source project
              released under the permissive MIT license. We invite open-source
              developers, cloud enthusiasts, and contributors worldwide to
              collaborate with us.
            </p>
          </div>

          {/* Contribution Pillars */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 hover:border-blue-500/50 transition">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                <Cloud className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-2">
                Add Storage Adapters
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Build new provider connectors for Mega, Proton Drive, Nextcloud,
                WebDAV, or S3 backends.
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 hover:border-emerald-500/50 transition">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-2">
                Zero-Knowledge Crypto
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Help enhance client-side WebCrypto encryption so chunks are
                ciphered before touching any cloud.
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 hover:border-purple-500/50 transition">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                <Terminal className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-2">
                CLI & Sync Scripts
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Help build TypeScript CLI tools and background directory sync
                scripts for automated local backups.
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 hover:border-amber-500/50 transition">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                <GitPullRequest className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-2">
                Submit PRs & Ideas
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Improve UI accessibility, optimize chunk packing heuristics, or
                submit feature proposals.
              </p>
            </div>
          </div>

          {/* GitHub Action Box */}
          <div className="bg-linear-to-r from-slate-800 to-slate-800/80 border border-slate-700 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-white text-slate-950 flex items-center justify-center shrink-0 shadow-lg">
                <GithubIcon className="h-8 w-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">
                    CodeItAftab / fuze
                  </h3>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                    Active Development
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Read the code, submit pull requests, report issues, and star
                  our repository on GitHub.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition"
              >
                <GithubIcon className="h-4 w-4" />
                <span>Star on GitHub</span>
              </a>
              <a
                href={`${GITHUB_REPO_URL}/issues`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs transition border border-slate-600"
              >
                <GitBranch className="h-4 w-4" />
                <span>Issues & Roadmap</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About Us / The Story */}
      <section id="about" className="py-20 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1.5 block">
            Our Story & Vision
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Why We Built Fuze
          </h2>
        </div>

        <div className="prose prose-slate max-w-none text-slate-600 text-sm sm:text-base leading-relaxed space-y-5">
          <p>
            Almost every major cloud company gives you free storage: Google
            Drive gives 15 GB, Box gives 10 GB, pCloud gives 10 GB, OneDrive
            gives 5 GB, and Dropbox gives 2 GB. Together, that is{" "}
            <strong>over 42 gigabytes of high-performance cloud storage</strong>{" "}
            that you already own.
          </p>
          <p>
            However, managing 5 different apps, logins, and upload UIs is a
            nightmare. Commercial cloud managers charge $10 to $20 every month,
            and worse—they proxy your sensitive files through their own private
            servers, introducing security vulnerabilities and bandwidth caps.
          </p>
          <p>
            <strong>Fuze</strong> was engineered from the ground up to solve
            this permanently. By leveraging browser-to-cloud resumable upload
            sessions, Fuze eliminates the middleman entirely. Your files stream
            directly to provider infrastructure, your metadata remains clean and
            organized, and you enjoy an enterprise-grade cloud drive completely
            free of cost.
          </p>
        </div>

        <div className="mt-10 p-5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              CA
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">
                Aftab (CodeItAftab)
              </div>
              <div className="text-xs text-slate-500">
                Project Creator & Maintainer
              </div>
            </div>
          </div>
          <a
            href={GITHUB_OWNER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            <GithubIcon className="h-4 w-4" />
            <span>GitHub Profile</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </section>

      {/* Comparison Table */}
      <section
        id="comparison"
        className="py-20 px-4 sm:px-6 bg-slate-50 border-t border-slate-200"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1.5 block">
              Transparent Comparison
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Comparing Fuze to Other Solutions
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="p-4 sm:p-5">Feature</th>
                  <th className="p-4 sm:p-5 text-blue-600 font-extrabold bg-blue-50/50">
                    Fuze Personal Cloud
                  </th>
                  <th className="p-4 sm:p-5">Commercial Aggregators</th>
                  <th className="p-4 sm:p-5">Single Cloud Provider</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-slate-900">
                    Cost
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-600 bg-blue-50/30">
                    100% Free Forever
                  </td>
                  <td className="p-4 sm:p-5 text-slate-500">
                    $10 - $25 / month
                  </td>
                  <td className="p-4 sm:p-5 text-slate-500">
                    $24 - $120 / year
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-slate-900">
                    Data Transit & Privacy
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-slate-900 bg-blue-50/30">
                    Zero-Proxy (Direct-to-Cloud)
                  </td>
                  <td className="p-4 sm:p-5 text-rose-600 font-medium">
                    Proxies through their servers
                  </td>
                  <td className="p-4 sm:p-5 text-slate-500">Direct</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-slate-900">
                    Multi-Account Pooling
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-blue-600 bg-blue-50/30">
                    Up to 42 GB Free
                  </td>
                  <td className="p-4 sm:p-5 text-slate-500">Limited by plan</td>
                  <td className="p-4 sm:p-5 text-slate-500">None (Siloed)</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-slate-900">
                    Open Source License
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-600 bg-blue-50/30">
                    MIT (Inspect all code)
                  </td>
                  <td className="p-4 sm:p-5 text-slate-500">Proprietary</td>
                  <td className="p-4 sm:p-5 text-slate-500">Proprietary</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (SEO Boost) */}
      <section id="faq" className="py-20 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold mb-2">
            <HelpCircle className="h-3.5 w-3.5" /> Answers to Common Questions
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto">
            Everything you need to know about Fuze, free quota pooling, and
            zero-proxy privacy.
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: "How does Fuze combine 42 GB of free cloud storage into one drive?",
              a: "Fuze connects your individual free cloud storage quotas—Google Drive (15 GB), Box (10 GB), pCloud (10 GB), OneDrive (5 GB), and Dropbox (2 GB)—into a single unified Virtual File System (VFS). An intelligent allocation engine stores files whole on the fastest available cloud and only chunks files when they exceed individual limits.",
            },
            {
              q: "Is Fuze really 100% free with no monthly subscription?",
              a: "Yes, Fuze is 100% free and open-source under the MIT license. Because Fuze uses a zero-proxy architecture where files stream directly between your browser and cloud provider APIs, Fuze incurs virtually zero storage transit costs and passes that savings directly to you with no credit card required.",
            },
            {
              q: "Does Fuze see, proxy, or store my personal files on its servers?",
              a: "No. Fuze utilizes direct-to-cloud presigned resumable URLs. Your raw files travel directly between your browser and the respective cloud provider endpoints (Google, Microsoft, Box, Dropbox, pCloud). Fuze never buffers, intercepts, or hosts your file contents.",
            },
            {
              q: "Which cloud storage providers can I connect to Fuze?",
              a: "Fuze natively supports Google Drive, Box, pCloud, Microsoft OneDrive, and Dropbox, aggregating up to 42 GB of free storage with native video, document, and image thumbnail previews.",
            },
            {
              q: "What happens if a file is larger than a single provider's free space?",
              a: "Fuze automatically falls back to Rule 2: Multi-Cloud Dynamic Chunking. The file is split into cryptographic chunks, distributed across remaining connected clouds, and verified using SHA-256 Merkle root trees.",
            },
            {
              q: "Can other users connect to the same cloud account?",
              a: "No. Fuze enforces strict cross-user account collision protection. Once a cloud account email is linked to your Fuze profile, no other user can link that same account, protecting your files against unauthorized access.",
            },
          ].map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200 rounded-2xl bg-white overflow-hidden transition-all shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-slate-900 hover:text-blue-600 transition cursor-pointer text-sm sm:text-base"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-blue-600" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Dynamic Bottom CTA */}
      <section className="py-20 px-4 sm:px-6 text-center border-t border-slate-200 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Start pooling your storage today.
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            Connect your cloud drives in seconds with zero server transit and no
            credit card required.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {isLoading ? (
              <div className="h-12 w-48 rounded-xl bg-slate-100 animate-pulse" />
            ) : user ? (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3.5 text-sm font-semibold text-white shadow-md transition"
              >
                <span>Open Fuze Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3.5 text-sm font-semibold text-white shadow-md transition"
                >
                  <span>Create Free Account</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-6 py-3.5 text-sm font-semibold text-slate-700 transition"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-10 px-4 sm:px-6 text-xs text-slate-500 bg-slate-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <FuzeLogo variant="icon" height={24} />
            <div>
              <span className="font-semibold text-slate-800 block">
                Fuze Storage
              </span>
              <span>
                Released under the MIT License • Built for the open-source
                community.
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
            <a href="#faq" className="hover:text-slate-900 transition">
              FAQ
            </a>
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
    </div>
  );
}

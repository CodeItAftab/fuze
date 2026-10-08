"use client";

import { useState } from "react";
import Link from "next/link";
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
} from "lucide-react";

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
    id: "onedrive",
    name: "Microsoft OneDrive",
    quotaGB: 5,
    brandColor: "#0078D4",
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
    id: "dropbox",
    name: "Dropbox",
    quotaGB: 2,
    brandColor: "#0061FF",
    badgeBg: "bg-indigo-50",
    badgeText: "text-indigo-700",
  },
];

export default function HomePage() {
  const [selectedProviders, setSelectedProviders] = useState<string[]>([
    "gdrive",
    "onedrive",
    "pcloud",
    "dropbox",
  ]);

  const toggleProvider = (id: string) => {
    setSelectedProviders((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const totalPoolGB = PROVIDERS.filter((p) =>
    selectedProviders.includes(p.id),
  ).reduce((sum, p) => sum + p.quotaGB, 0);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased">
      {/* Top Banner */}
      <div className="bg-slate-900 text-slate-200 text-xs py-2 px-4 text-center font-medium">
        <span>
          Fuze Architecture 2.0 is now live. Zero-proxy personal cloud storage
          with direct browser-to-cloud streams.
        </span>
        <a
          href="#how-it-works"
          className="ml-2 text-blue-400 hover:underline font-semibold"
        >
          Learn how it works &rarr;
        </a>
      </div>

      {/* Navigation */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-base shadow-sm">
              F
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">
              Fuze
            </span>
            <span className="ml-1 text-xs font-medium text-slate-400">
              Storage
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#calculator" className="hover:text-slate-900 transition">
              Storage Pooling
            </a>
            <a href="#how-it-works" className="hover:text-slate-900 transition">
              Smart Chunking
            </a>
            <a href="#security" className="hover:text-slate-900 transition">
              Zero-Proxy Security
            </a>
            <a href="#comparison" className="hover:text-slate-900 transition">
              Compare Plans
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white transition shadow-sm active:scale-95"
            >
              Open Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1 text-xs font-semibold text-slate-700 mb-8 shadow-2xs">
          <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
          Enterprise-Grade Zero-Proxy Personal Cloud
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
          Unify all your free cloud storage <br className="hidden sm:inline" />
          into{" "}
          <span className="text-blue-600">one seamless personal drive</span>.
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Fuze aggregates your free storage quotas across Google Drive, Dropbox,
          OneDrive, and pCloud. Your files stream directly between your browser
          and cloud APIs with zero server transit.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition"
          >
            Launch Your Drive <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#calculator"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-6 py-3.5 text-sm font-semibold text-slate-700 transition"
          >
            Calculate Free Storage
          </a>
        </div>

        {/* Metric Badges */}
        <div className="mt-14 pt-8 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto text-left">
          <div>
            <div className="text-2xl font-bold text-slate-900">~32 GB</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Average Free Storage Pool
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">0 KB</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Server Data Transit
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">SHA-256</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Cryptographic Integrity
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">100% Free</div>
            <div className="text-xs text-slate-500 mt-0.5">
              No Credit Card Needed
            </div>
          </div>
        </div>
      </section>

      {/* Realistic In-Browser Drive Mockup */}
      <section className="px-6 pb-20 max-w-6xl mx-auto">
        <div className="rounded-xl border border-slate-200/90 bg-white shadow-xl overflow-hidden">
          {/* Browser Window Header */}
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-amber-400" />
              <div className="h-3 w-3 rounded-full bg-emerald-400" />
            </div>
            <div className="bg-white border border-slate-200 rounded-md px-4 py-1 text-xs text-slate-500 font-mono flex items-center gap-2 w-72 justify-center shadow-2xs">
              <Lock className="h-3 w-3 text-emerald-600" />{" "}
              https://app.fuze.storage/my-drive
            </div>
            <div className="w-12" />
          </div>

          {/* Drive App Canvas */}
          <div className="grid grid-cols-12 min-h-105 text-xs">
            {/* Sidebar Mock */}
            <div className="col-span-3 border-r border-slate-200 bg-slate-50/50 p-4 flex flex-col justify-between">
              <div className="space-y-4">
                <button className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 font-semibold text-white shadow-2xs">
                  <span>+ New Upload</span>
                </button>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-50 font-semibold text-blue-700">
                    <HardDrive className="h-4 w-4" /> My Drive
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-md">
                    <Cloud className="h-4 w-4" /> Connected Clouds
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-md">
                    <ShieldCheck className="h-4 w-4" /> Security & Keys
                  </div>
                </div>
              </div>

              {/* Storage Meter */}
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Storage Pool</span>
                  <span className="text-blue-600">14.2 / 32 GB</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                  <div
                    className="bg-amber-500 h-full w-[45%]"
                    title="Google Drive"
                  />
                  <div
                    className="bg-blue-500 h-full w-[20%]"
                    title="OneDrive"
                  />
                  <div className="bg-sky-400 h-full w-[10%]" title="pCloud" />
                </div>
                <div className="mt-2 text-[10px] text-slate-500 flex justify-between">
                  <span>4 accounts linked</span>
                  <span className="text-emerald-600 font-medium">
                    17.8 GB free
                  </span>
                </div>
              </div>
            </div>

            {/* File List Mock */}
            <div className="col-span-9 p-6">
              {/* Search Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2 text-slate-400 bg-slate-100/70 border border-slate-200/80 px-3 py-1.5 rounded-lg w-80">
                  <Search className="h-3.5 w-3.5" />
                  <span className="text-slate-400">
                    Search files, folders...
                  </span>
                </div>
                <div className="text-slate-500 font-medium">
                  Sort: Last Modified
                </div>
              </div>

              {/* Sample Folders */}
              <div className="mb-6">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Folders
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="border border-slate-200 rounded-lg p-3 flex items-center gap-3 bg-white hover:border-slate-300">
                    <Folder className="h-6 w-6 text-amber-500 fill-amber-100" />
                    <div>
                      <div className="font-semibold text-slate-800">
                        Financial Reports
                      </div>
                      <div className="text-[10px] text-slate-400">12 items</div>
                    </div>
                  </div>
                  <div className="border border-slate-200 rounded-lg p-3 flex items-center gap-3 bg-white hover:border-slate-300">
                    <Folder className="h-6 w-6 text-blue-500 fill-blue-100" />
                    <div>
                      <div className="font-semibold text-slate-800">
                        Design Assets
                      </div>
                      <div className="text-[10px] text-slate-400">48 items</div>
                    </div>
                  </div>
                  <div className="border border-slate-200 rounded-lg p-3 flex items-center gap-3 bg-white hover:border-slate-300">
                    <Folder className="h-6 w-6 text-slate-400 fill-slate-100" />
                    <div>
                      <div className="font-semibold text-slate-800">
                        Raw Footage 4K
                      </div>
                      <div className="text-[10px] text-slate-400">3 items</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sample Files with Provider Badges */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Files
                </div>
                <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 bg-white">
                  <div className="p-3 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-slate-800">
                        Annual_Review_2026.pdf
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        Google Drive (Whole)
                      </span>
                      <span className="text-slate-500 w-16 text-right">
                        4.2 MB
                      </span>
                      <MoreVertical className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </div>

                  <div className="p-3 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <ImageIcon className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-slate-800">
                        Project_Archive_Backup.tar.gz
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        Multi-Cloud Chunked (3 Providers)
                      </span>
                      <span className="text-slate-500 w-16 text-right">
                        18.4 GB
                      </span>
                      <MoreVertical className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </div>

                  <div className="p-3 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-emerald-600" />
                      <span className="font-medium text-slate-800">
                        Database_Dump_Q3.sql
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-sky-50 text-sky-700 border border-sky-200">
                        pCloud (Whole)
                      </span>
                      <span className="text-slate-500 w-16 text-right">
                        820 MB
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
        className="py-20 px-6 bg-slate-50 border-t border-slate-200"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Calculate Your Free Storage Pool
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Select the cloud accounts you have to see how much combined free
              storage you can manage with Fuze:
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {PROVIDERS.map((provider) => {
              const isChecked = selectedProviders.includes(provider.id);
              return (
                <button
                  key={provider.id}
                  onClick={() => toggleProvider(provider.id)}
                  className={`p-5 rounded-xl border text-left transition-all bg-white ${
                    isChecked
                      ? "border-blue-600 shadow-sm ring-1 ring-blue-600"
                      : "border-slate-200 opacity-60 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                      <Cloud className="h-4 w-4 text-slate-700" />
                    </div>
                    <div
                      className={`h-4 w-4 rounded flex items-center justify-center text-xs font-bold ${
                        isChecked
                          ? "bg-blue-600 text-white"
                          : "border border-slate-300"
                      }`}
                    >
                      {isChecked && <Check className="h-3 w-3 stroke-3" />}
                    </div>
                  </div>
                  <div className="font-semibold text-slate-900 text-sm">
                    {provider.name}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {provider.quotaGB} GB Free Tier
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Your Combined Storage Pool
              </div>
              <div className="text-4xl font-extrabold text-slate-900 mt-1">
                {totalPoolGB}{" "}
                <span className="text-xl font-medium text-blue-600">
                  GB Free Storage
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                100% free forever. No credit cards, no recurring bills, and no
                vendor lock-in.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="rounded-lg bg-blue-600 hover:bg-blue-700 px-6 py-3 text-sm font-semibold text-white transition whitespace-nowrap shadow-sm"
            >
              Get Started with Fuze
            </Link>
          </div>
        </div>
      </section>

      {/* Architecture & Core Principles */}
      <section id="how-it-works" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-2">
            Engineering Principles
          </div>
          <h2 className="text-3xl font-bold text-slate-900">
            How Fuze Manages Distributed Files
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Built from first principles for performance, cryptographic safety,
            and zero server bottlenecks.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl border border-slate-200 bg-white">
            <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-5">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Smart Chunking Decision
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              If a file fits in <strong>any single connected cloud</strong>, it
              is uploaded whole with zero splitting. Chunks are only created
              when a file exceeds individual free limits.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-slate-200 bg-white">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-5">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Zero-Proxy Architecture
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Files never transit through Fuze application servers. The browser
              or mobile app directly uploads and downloads encrypted bytes to
              cloud provider endpoints.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-slate-200 bg-white">
            <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-5">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Resumable Upload Sessions
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Upload sessions are stateful and persisted in the database. If
              your connection drops or the browser closes, simply resume without
              re-uploading finished chunks.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section
        id="comparison"
        className="py-20 px-6 bg-slate-50 border-t border-slate-200"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Comparing Fuze to Traditional Storage
            </h2>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="p-4 sm:p-5">Feature</th>
                  <th className="p-4 sm:p-5 text-blue-600 font-bold">
                    Fuze Personal Cloud
                  </th>
                  <th className="p-4 sm:p-5">Single Cloud Provider</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-slate-900">
                    Annual Cost
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-600">
                    $0 / year (Free)
                  </td>
                  <td className="p-4 sm:p-5 text-slate-500">
                    $24 - $120 / year
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-slate-900">
                    Provider Outage Protection
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-slate-900">
                    Multi-Cloud Redundancy
                  </td>
                  <td className="p-4 sm:p-5 text-slate-500">
                    Single Point of Failure
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-slate-900">
                    Bandwidth Limits
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-slate-900">
                    Direct Line Speed
                  </td>
                  <td className="p-4 sm:p-5 text-slate-500">
                    Server Rate-Limited
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-slate-900">
                    Multi-Account Pooling
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-blue-600">
                    Yes (Combine Quotas)
                  </td>
                  <td className="p-4 sm:p-5 text-slate-500">No</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 px-6 text-center border-t border-slate-200 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900">
            Start pooling your storage today.
          </h2>
          <p className="mt-3 text-slate-600">
            Link your first account and organize files with zero server transit.
          </p>
          <div className="mt-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition"
            >
              Open Fuze Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 px-6 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>© 2026 Fuze Storage. Clean, zero-proxy multi-cloud pooling.</div>
          <div className="flex gap-6 font-medium text-slate-600">
            <a href="#calculator" className="hover:text-slate-900">
              Calculator
            </a>
            <a href="#how-it-works" className="hover:text-slate-900">
              Architecture
            </a>
            <a href="#comparison" className="hover:text-slate-900">
              Comparison
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

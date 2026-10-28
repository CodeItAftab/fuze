"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  ChevronDown,
  Menu,
  X,
  BookOpen,
  Cloud,
  Layers,
  HelpCircle,
  ArrowRight,
  GitCompare,
  HardDrive,
  Code2,
  Star,
  KeyRound,
} from "lucide-react";
import { FuzeLogo } from "@/components/brand/FuzeLogo";
import { GithubIcon } from "@/components/icons/GithubIcon";
import { LandingAuthButtons } from "@/components/landing/LandingAuthButtons";

const GITHUB_REPO_URL = "https://github.com/CodeItAftab/fuze";

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Close on Escape key or when screen expands to desktop (>= 1024px)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const mobileSidebarContent = (
    <div
      className="fixed inset-0 lg:hidden"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100dvh",
        zIndex: 99999,
      }}
    >
      {/* Dark backdrop */}
      <div
        className="fixed inset-0 transition-opacity duration-200"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-out drawer */}
      <div
        className="fixed top-0 right-0 bottom-0 w-full max-w-xs sm:max-w-sm bg-white shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-slate-200"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          height: "100dvh",
          maxHeight: "100dvh",
          zIndex: 100000,
        }}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2"
            >
              <FuzeLogo variant="full" height={24} />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition focus:outline-hidden"
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-4 space-y-5">
            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                Navigation
              </div>
              <Link
                href="/how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition"
              >
                <Cloud className="h-4 w-4 text-blue-500" />
                <span>How It Works</span>
              </Link>
              <Link
                href="/compare/multcloud-alternative"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition"
              >
                <div className="flex items-center gap-2.5">
                  <GitCompare className="h-4 w-4 text-indigo-500" />
                  <span>MultCloud Alternative</span>
                </div>
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 rounded border border-blue-200">
                  vs
                </span>
              </Link>
              <a
                href="#calculator"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition"
              >
                <HardDrive className="h-4 w-4 text-emerald-500" />
                <span>Storage Pool (72 GB)</span>
              </a>
              <a
                href="#architecture"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition"
              >
                <Layers className="h-4 w-4 text-purple-500" />
                <span>Architecture</span>
              </a>
              <Link
                href="/faq"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition"
              >
                <HelpCircle className="h-4 w-4 text-slate-400" />
                <span>FAQ &amp; Knowledge Base</span>
              </Link>
            </div>

            {/* Guides Section */}
            <div className="space-y-1 pt-3 border-t border-slate-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                <span>Step-by-Step Guides</span>
              </div>
              <Link
                href="/guides/connect-cloud-providers"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50/70 hover:bg-blue-100/70 transition"
              >
                <span className="flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-blue-600" />
                  <span>How to Add Each Cloud Provider</span>
                </span>
                <span className="text-[10px] bg-blue-200/70 text-blue-800 px-1.5 py-0.2 rounded font-bold">
                  Guide
                </span>
              </Link>
              <Link
                href="/guides/combine-google-drive-onedrive-dropbox"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition"
              >
                Combine Google Drive, OneDrive &amp; Dropbox
              </Link>
              <Link
                href="/guides/free-cloud-storage-comparison-2026"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition"
              >
                Free Cloud Storage Ranked (2026)
              </Link>
              <Link
                href="/guides/open-source-cloud-storage-aggregator"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition"
              >
                Open Source Aggregator Architecture
              </Link>
            </div>

            {/* Open Source Contribution Section */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <GithubIcon className="h-4 w-4 text-slate-900" />
                  <span>Open Source Project</span>
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
                  MIT
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Fuze Drive is 100% open-source. Help us build new connectors, report issues, or star the project.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={GITHUB_REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition shadow-2xs"
                >
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span>Star &amp; Contribute</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 space-y-2">
          <Link
            href="/register"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-xs"
          >
            <span>Get Started Free (72 GB)</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full flex items-center justify-center py-2 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 xl:gap-8">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <FuzeLogo variant="full" height={26} />
          </Link>

          {/* Desktop Nav - Well-spaced, Clean, and Uncramped */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6 text-sm font-medium text-slate-600">
            <Link
              href="/how-it-works"
              className="hover:text-slate-900 transition whitespace-nowrap"
            >
              How It Works
            </Link>

            <Link
              href="/compare/multcloud-alternative"
              className="hover:text-slate-900 transition flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>vs MultCloud</span>
            </Link>

            {/* Guides Dropdown */}
            <div className="relative group py-2">
              <button
                type="button"
                className="flex items-center gap-1 hover:text-slate-900 transition focus:outline-hidden cursor-pointer whitespace-nowrap"
              >
                <span>Guides</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-700 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute top-full left-0 w-80 p-2 bg-white rounded-xl shadow-xl border border-slate-200/90 hidden group-hover:block group-focus-within:block z-50">
                <Link
                  href="/guides/connect-cloud-providers"
                  className="block p-2.5 rounded-lg bg-blue-50/50 hover:bg-blue-100/60 transition mb-1 border border-blue-100"
                >
                  <div className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5" />
                    <span>How to Add Each Provider (Instructions)</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Step-by-step setup for Koofr app passwords, MEGA &amp; OAuth
                  </div>
                </Link>
                <Link
                  href="/guides/combine-google-drive-onedrive-dropbox"
                  className="block p-2.5 rounded-lg hover:bg-slate-50 transition"
                >
                  <div className="text-xs font-semibold text-slate-900 hover:text-blue-600">
                    Combine Google Drive, OneDrive &amp; Dropbox
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Step-by-step setup to aggregate 72 GB free
                  </div>
                </Link>
                <Link
                  href="/guides/free-cloud-storage-comparison-2026"
                  className="block p-2.5 rounded-lg hover:bg-slate-50 transition"
                >
                  <div className="text-xs font-semibold text-slate-900 hover:text-blue-600">
                    Free Cloud Storage Ranked (2026)
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Comparison across Google, MEGA, Box, pCloud &amp; OneDrive
                  </div>
                </Link>
                <Link
                  href="/guides/open-source-cloud-storage-aggregator"
                  className="block p-2.5 rounded-lg hover:bg-slate-50 transition"
                >
                  <div className="text-xs font-semibold text-slate-900 hover:text-blue-600">
                    Open Source Aggregator Architecture
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Zero-proxy privacy &amp; client streaming
                  </div>
                </Link>
              </div>
            </div>

            <a
              href="#calculator"
              className="hover:text-slate-900 transition whitespace-nowrap"
            >
              Storage (72 GB)
            </a>

            <a
              href="#architecture"
              className="hover:text-slate-900 transition whitespace-nowrap"
            >
              Architecture
            </a>

            <Link
              href="/faq"
              className="hover:text-slate-900 transition whitespace-nowrap"
            >
              FAQ
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <LandingAuthButtons />

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition focus:outline-hidden"
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Render Mobile Sidebar in a DOM portal outside the sticky/backdrop-blur header */}
      {mounted && mobileMenuOpen && createPortal(mobileSidebarContent, document.body)}
    </header>
  );
}

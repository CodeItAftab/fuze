import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingCta } from "@/components/marketing/MarketingCta";
import { RelatedGuides } from "@/components/marketing/RelatedGuides";
import { ProviderIcon } from "@/components/drive/ProviderBadge";
import {
  ShieldCheck,
  KeyRound,
  ExternalLink,
  CheckCircle2,
  Lock,
  ArrowRight,
  HardDrive,
  Info,
} from "lucide-react";
import { PROVIDER_FACTS, TOTAL_FREE_STORAGE_GB } from "@/lib/facts";

export const metadata: Metadata = {
  title: "How to Add Each Cloud Provider to Fuze Drive (Step-by-Step Instructions)",
  description:
    "Complete walkthrough for connecting Google Drive, MEGA, Box, pCloud, Koofr, OneDrive, and Dropbox to Fuze Drive. Includes Koofr app password setup and OAuth steps.",
  alternates: {
    canonical: "https://fuzedrive.tech/guides/connect-cloud-providers",
  },
};

export default function ConnectCloudProvidersGuidePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "How to Add Each Cloud Provider to Fuze Drive",
    description:
      "Step-by-step instructions for linking Google Drive, MEGA, Box, pCloud, Koofr, OneDrive, and Dropbox to create a unified 72 GB personal cloud pool.",
    author: {
      "@type": "Person",
      name: "Aftab Alam",
    },
    publisher: {
      "@type": "Organization",
      name: "Fuze Drive",
      url: "https://fuzedrive.tech",
    },
    mainEntityOfPage: "https://fuzedrive.tech/guides/connect-cloud-providers",
    datePublished: "2026-10-28",
    dateModified: "2026-10-28",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://fuzedrive.tech",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Guides",
        item: "https://fuzedrive.tech/guides/combine-google-drive-onedrive-dropbox",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Connect Cloud Providers",
        item: "https://fuzedrive.tech/guides/connect-cloud-providers",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col justify-between">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <MarketingHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <Link href="/" className="hover:text-blue-600 transition">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-400">Guides</span>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Connect Providers</span>
        </nav>

        {/* Article Header */}
        <header className="mb-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <KeyRound className="h-3.5 w-3.5" /> Step-by-Step Setup Instructions
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
            How to Add Each Cloud Provider to Fuze Drive
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Fuze Drive aggregates up to <strong>{TOTAL_FREE_STORAGE_GB} GB</strong> of free cloud storage across 7 providers. Some services connect via one-click OAuth 2.0 authorization, while others like Koofr use secure App Passwords. Follow the quick instructions below for each provider.
          </p>
        </header>

        {/* Table of Contents Pill Bar */}
        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl mb-10 shadow-2xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Quick Jump to Provider
          </div>
          <div className="flex flex-wrap gap-2">
            {PROVIDER_FACTS.map((p) => (
              <a
                key={p.id}
                href={`#${p.id}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 transition"
              >
                <span>{p.name}</span>
                <span className="text-[10px] text-slate-400">({p.officialFreeGb} GB)</span>
              </a>
            ))}
          </div>
        </div>

        {/* Detailed Provider Sections */}
        <div className="space-y-8">
          {/* 1. Google Drive */}
          <section id="google_drive" className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-sm space-y-4 scroll-mt-20">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <ProviderIcon type="google_drive" className="h-7 w-7" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">1. Google Drive</h2>
                  <p className="text-xs text-slate-500">15 GB Free · Official OAuth 2.0</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                15 GB
              </span>
            </div>
            <div className="space-y-2 text-sm text-slate-600 leading-relaxed">
              <p>
                Google Drive connects via official Google OAuth 2.0 authorization. Fuze Drive requests the minimal <code>drive.file</code> scope, meaning Fuze Drive only accesses files and folders you upload through or open in Fuze Drive—it never accesses your personal Gmail messages, Google Photos, or existing Drive files.
              </p>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pt-2">How to connect:</h3>
              <ol className="list-decimal pl-5 space-y-1.5 text-xs">
                <li>Go to your Fuze Drive dashboard &rarr; <strong>Connected Clouds</strong>.</li>
                <li>Click <strong>Connect</strong> on Google Drive.</li>
                <li>A Google consent window opens. Select your Google account and grant permission for file creation.</li>
                <li>You are redirected back to Fuze Drive with 15 GB added to your pool.</li>
              </ol>
            </div>
          </section>

          {/* 2. MEGA */}
          <section id="mega" className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-sm space-y-4 scroll-mt-20">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <ProviderIcon type="mega" className="h-7 w-7" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">2. MEGA</h2>
                  <p className="text-xs text-slate-500">20 GB Free · End-to-End Encrypted</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                20 GB
              </span>
            </div>
            <div className="space-y-2 text-sm text-slate-600 leading-relaxed">
              <p>
                MEGA provides 20 GB of zero-knowledge encrypted personal cloud storage. Because MEGA does not provide standard consumer OAuth redirects, Fuze Drive connects using your MEGA account email and password, which are encrypted at rest using <strong>AES-256-GCM</strong>.
              </p>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pt-2">How to connect:</h3>
              <ol className="list-decimal pl-5 space-y-1.5 text-xs">
                <li>If you don&apos;t have an account, register free at <a href="https://mega.io/register" target="_blank" rel="noopener noreferrer" className="text-rose-600 underline font-semibold">mega.io</a>.</li>
                <li>In Fuze Drive, click <strong>Connect</strong> next to MEGA.</li>
                <li>Enter your MEGA Email and Password in the modal.</li>
                <li>Click <strong>Connect MEGA</strong> to verify and sync your 20 GB free quota.</li>
              </ol>
            </div>
          </section>

          {/* 3. Koofr */}
          <section id="koofr" className="p-6 bg-teal-50/40 border border-teal-200 rounded-3xl shadow-sm space-y-4 scroll-mt-20">
            <div className="flex items-center justify-between border-b border-teal-200/80 pb-4">
              <div className="flex items-center gap-3">
                <ProviderIcon type="koofr" className="h-7 w-7" />
                <div>
                  <h2 className="text-lg font-bold text-teal-950">3. Koofr (Requires App Password)</h2>
                  <p className="text-xs text-teal-700">10 GB Free · European High-Speed WebDAV</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-900 border border-teal-300">
                10 GB
              </span>
            </div>
            <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
              <div className="p-3 bg-white/90 border border-teal-200 rounded-xl text-xs flex items-start gap-2 text-teal-950">
                <Info className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Important:</strong> Koofr security policies require an <strong>App Password</strong> for third-party client connections. Do not enter your main Koofr login password.
                </span>
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-900 pt-1">
                Step-by-step Koofr App Password Setup:
              </h3>
              <ol className="list-decimal pl-5 space-y-2 text-xs">
                <li>
                  Sign in to your free 10 GB account at <a href="https://app.koofr.net" target="_blank" rel="noopener noreferrer" className="text-teal-700 underline font-bold">app.koofr.net</a>.
                </li>
                <li>
                  Click your profile avatar at the top right and select <strong>Settings</strong> &rarr; <strong>Preferences</strong> &rarr; <strong>Password</strong> (or use this <a href="https://app.koofr.net/app/admin/preferences/password" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-bold">direct password settings link</a>).
                </li>
                <li>
                  Scroll down to the <strong>App Passwords</strong> section.
                </li>
                <li>
                  Enter <code>Fuze Drive</code> into the name field and click the <strong>Generate</strong> button.
                </li>
                <li>
                  Copy the generated password (e.g. <code>koofr-xxxx-xxxx-xxxx</code>).
                </li>
                <li>
                  Return to Fuze Drive, click <strong>Connect Koofr</strong>, and paste your Koofr email and the generated App Password.
                </li>
              </ol>
            </div>
          </section>

          {/* 4. Box */}
          <section id="box" className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-sm space-y-4 scroll-mt-20">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <ProviderIcon type="box" className="h-7 w-7" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">4. Box</h2>
                  <p className="text-xs text-slate-500">10 GB Free · 250 MB Single-File Limit</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                10 GB
              </span>
            </div>
            <div className="space-y-2 text-sm text-slate-600 leading-relaxed">
              <p>
                Box provides 10 GB of free storage on consumer accounts. Box imposes a 250 MB single-file upload limit on personal free accounts. Fuze Drive respects this limit automatically: whole files under 250 MB are allocated to Box, while larger files are intelligently distributed across other clouds.
              </p>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pt-2">How to connect:</h3>
              <ol className="list-decimal pl-5 space-y-1.5 text-xs">
                <li>In Fuze Drive, click <strong>Connect</strong> next to Box.</li>
                <li>Sign in with your Box account and click <strong>Grant access to Box</strong>.</li>
                <li>You are redirected back with 10 GB added to your personal pool.</li>
              </ol>
            </div>
          </section>

          {/* 5. pCloud */}
          <section id="pcloud" className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-sm space-y-4 scroll-mt-20">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <ProviderIcon type="pcloud" className="h-7 w-7" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">5. pCloud</h2>
                  <p className="text-xs text-slate-500">Up to 10 GB Free · European High-Security Storage</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                Up to 10 GB
              </span>
            </div>
            <div className="space-y-2 text-sm text-slate-600 leading-relaxed">
              <p>
                pCloud starts with 2 GB free upon signup, and unlocks up to 10 GB by verifying your email, downloading the desktop/mobile app, and completing optional onboarding steps. Fuze Drive connects via OAuth 2.0 and queries your actual unlocked storage quota directly.
              </p>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pt-2">How to connect:</h3>
              <ol className="list-decimal pl-5 space-y-1.5 text-xs">
                <li>In Fuze Drive, click <strong>Connect</strong> next to pCloud.</li>
                <li>Choose your data region (United States or European Union).</li>
                <li>Authorize Fuze Drive in the pCloud OAuth dialog.</li>
              </ol>
            </div>
          </section>

          {/* 6. Microsoft OneDrive */}
          <section id="one_drive" className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-sm space-y-4 scroll-mt-20">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <ProviderIcon type="one_drive" className="h-7 w-7" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">6. Microsoft OneDrive</h2>
                  <p className="text-xs text-slate-500">5 GB Free · Microsoft Graph API</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
                5 GB
              </span>
            </div>
            <div className="space-y-2 text-sm text-slate-600 leading-relaxed">
              <p>
                OneDrive connects through the Microsoft Identity platform. Fuze Drive authenticates with Microsoft Graph using the <code>Files.ReadWrite</code> scope to manage your files seamlessly.
              </p>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pt-2">How to connect:</h3>
              <ol className="list-decimal pl-5 space-y-1.5 text-xs">
                <li>In Fuze Drive, click <strong>Connect</strong> next to OneDrive.</li>
                <li>Sign in to your Microsoft consumer account.</li>
                <li>Click <strong>Yes</strong> to allow Fuze Drive to access your OneDrive storage.</li>
              </ol>
            </div>
          </section>

          {/* 7. Dropbox */}
          <section id="dropbox" className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-sm space-y-4 scroll-mt-20">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <ProviderIcon type="dropbox" className="h-7 w-7" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">7. Dropbox</h2>
                  <p className="text-xs text-slate-500">2 GB Free · Official Dropbox v2 API</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                2 GB
              </span>
            </div>
            <div className="space-y-2 text-sm text-slate-600 leading-relaxed">
              <p>
                Dropbox Basic accounts receive 2 GB of free storage. Fuze Drive links with official Dropbox OAuth 2.0 PKCE code flow for high reliability and direct browser-to-cloud streams.
              </p>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pt-2">How to connect:</h3>
              <ol className="list-decimal pl-5 space-y-1.5 text-xs">
                <li>In Fuze Drive, click <strong>Connect</strong> next to Dropbox.</li>
                <li>Log in to Dropbox and click <strong>Allow</strong>.</li>
              </ol>
            </div>
          </section>
        </div>

        {/* Security & Unlinking Section */}
        <section className="mt-12 p-6 sm:p-8 bg-slate-900 text-slate-100 rounded-3xl space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <ShieldCheck className="h-5 w-5" />
            <span>Zero-Lockin &amp; Safe Unlinking</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            What happens if you disconnect a provider later?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            You can disconnect any cloud provider at any time from <strong>Settings &rarr; Storage Providers</strong>. Fuze Drive offers a <strong>Smart Unlink</strong> option: your files remain intact in your personal cloud accounts, while stored OAuth tokens and database indices are permanently removed from Fuze Drive servers.
          </p>
        </section>

        {/* Related Guides */}
        <RelatedGuides currentGuideHref="/guides/connect-cloud-providers" />

        {/* CTA */}
        <MarketingCta
          title="Ready to Combine Your 72 GB Free Pool?"
          description="Connect your accounts once in under 3 minutes. Zero monthly subscriptions, 100% open-source transparency."
          buttonText="Launch My 72 GB Drive"
          buttonHref="/register"
        />
      </main>

      <MarketingFooter />
    </div>
  );
}

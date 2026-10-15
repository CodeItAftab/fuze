import type { Metadata } from "next";
import Link from "next/link";
import { FuzeLogo } from "@/components/brand/FuzeLogo";
import {
  ArrowLeft,
  CheckCircle2,
  HardDrive,
  Cloud,
  Zap,
  Shield,
  ArrowRight,
  Clock,
  Layers,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "How to Combine Google Drive, OneDrive, and Dropbox into One (2026 Guide) | Fuze Drive",
  description:
    "Step-by-step tutorial on how to combine Google Drive (15 GB), OneDrive (5 GB), Dropbox (2 GB), Box (10 GB), and pCloud (10 GB) into a single 42 GB unified virtual drive.",
  alternates: {
    canonical: "https://fuzedrive.tech/guides/combine-google-drive-onedrive-dropbox",
  },
  openGraph: {
    title: "How to Combine Google Drive, OneDrive, & Dropbox into One 42 GB Drive",
    description:
      "Learn how to aggregate multiple free cloud storage accounts into a unified, zero-proxy virtual drive with 42 GB total capacity.",
    url: "https://fuzedrive.tech/guides/combine-google-drive-onedrive-dropbox",
    siteName: "Fuze Drive",
    type: "article",
  },
};

export default function CombineCloudStorageGuidePage() {
  const lastUpdated = "October 15, 2026";

  const quotas = [
    { provider: "Google Drive", freeTier: "15 GB", color: "text-amber-600 bg-amber-50 border-amber-200" },
    { provider: "Box", freeTier: "10 GB", color: "text-blue-600 bg-blue-50 border-blue-200" },
    { provider: "pCloud", freeTier: "10 GB", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    { provider: "Microsoft OneDrive", freeTier: "5 GB", color: "text-sky-600 bg-sky-50 border-sky-200" },
    { provider: "Dropbox", freeTier: "2 GB", color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased flex flex-col justify-between">
      {/* Navigation */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <FuzeLogo height={28} />
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Home</span>
            </Link>
            <Link
              href="/register"
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-xs"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6 font-medium">
          <Link href="/" className="hover:text-blue-600 transition">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-700">Guides</span>
          <span>/</span>
          <span className="text-blue-600 font-semibold">Combine Cloud Storage</span>
        </nav>

        {/* Hero Section */}
        <div className="space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <Layers className="h-3.5 w-3.5 text-blue-600" />
            Complete 2026 Step-by-Step Tutorial
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
            How to Combine Google Drive, OneDrive, and Dropbox into One 42 GB Drive
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
            Managing separate logins for Google Drive, Microsoft OneDrive, Dropbox, Box, and pCloud is frustrating and wastes free storage. Learn how to pool them all into a single, high-speed virtual drive without installing desktop sync bloatware.
          </p>

          <div className="flex items-center gap-4 pt-2 text-xs text-slate-500 border-t border-slate-200">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              Last Updated: {lastUpdated}
            </span>
            <span>•</span>
            <span className="font-medium text-slate-600">6 min read</span>
            <span>•</span>
            <span className="text-emerald-700 font-medium">Verified for 2026</span>
          </div>
        </div>

        {/* Free Quota Breakdown Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-10">
          {quotas.map((item, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border text-center ${item.color} flex flex-col justify-center`}
            >
              <span className="text-xs font-medium block opacity-80">{item.provider}</span>
              <span className="text-lg sm:text-xl font-extrabold">{item.freeTier}</span>
            </div>
          ))}
        </div>

        {/* Article Body */}
        <article className="prose prose-slate max-w-none text-slate-700 leading-relaxed space-y-8">
          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              The Problem with Multi-Cloud Fragmentation
            </h2>
            <p>
              Nearly every internet user has an active Google account (which includes <strong>15 GB</strong> of Google Drive storage), a Microsoft account for Windows or Office (granting <strong>5 GB</strong> of OneDrive), and an old <strong>Dropbox</strong> account (holding <strong>2 GB</strong>). Many also have free accounts with <strong>Box</strong> (<strong>10 GB</strong>) and <strong>pCloud</strong> (<strong>10 GB</strong>).
            </p>
            <p>
              Added together, that is <strong>42 GB of zero-cost personal cloud storage</strong>. Yet in practice, most people only use a fraction of it because:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm">
              <li>You have to remember 5 different logins and passwords.</li>
              <li>Installing 5 desktop sync clients (Google Drive Desktop, OneDrive client, Dropbox daemon) consumes 2+ GB of system RAM and slows down boot times.</li>
              <li>When one drive fills up with photos, your other drives sit completely empty.</li>
              <li>Searching for an old document requires opening five separate browser tabs.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-4 pt-4">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              How Cloud Aggregation Works (Without Paying Subscriptions)
            </h2>
            <p>
              Traditionally, if you wanted to merge cloud storage, you had to turn to commercial services like MultCloud or CloudFuze. But these services come with significant drawbacks:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>
                <strong>Artificial Traffic Caps</strong>: Free accounts are capped at 5 GB of monthly transfer, making regular backups impossible.
              </li>
              <li>
                <strong>Privacy Risk</strong>: Your personal files are uploaded to their commercial servers before reaching the destination cloud.
              </li>
              <li>
                <strong>High Pricing</strong>: Upgrading typically costs $10 to $25 per month — more expensive than simply buying storage directly from Google or Microsoft!
              </li>
            </ol>
            <p>
              <strong>The modern solution is Fuze Drive</strong>: an open-source, web-based personal cloud aggregator that connects to your existing storage accounts via official OAuth2 APIs and streams files directly from your browser.
            </p>
          </section>

          {/* Section 3: Tutorial */}
          <section className="space-y-4 pt-4">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Step-by-Step: Combining Your Clouds in 4 Easy Steps
            </h2>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    1
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 m-0">
                    Create a Free Fuze Drive Account
                  </h3>
                </div>
                <p className="text-sm text-slate-600 m-0 pl-11">
                  Head over to{" "}
                  <Link href="/register" className="text-blue-600 font-semibold hover:underline">
                    fuzedrive.tech/register
                  </Link>
                  . Sign up with your email and password. No credit card or billing details are ever required.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    2
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 m-0">
                    Connect Your Storage Accounts via OAuth2
                  </h3>
                </div>
                <p className="text-sm text-slate-600 m-0 pl-11">
                  In your dashboard, click <strong>Settings</strong> &gt; <strong>Connected Clouds</strong>. Click &ldquo;Connect&rdquo; next to each provider you use:
                </p>
                <div className="pl-11 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-slate-700">
                  <span className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Google Drive (15 GB)
                  </span>
                  <span className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Microsoft OneDrive (5 GB)
                  </span>
                  <span className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Box (10 GB)
                  </span>
                  <span className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> pCloud (10 GB)
                  </span>
                  <span className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Dropbox (2 GB)
                  </span>
                </div>
                <p className="text-xs text-slate-500 m-0 pl-11 pt-1">
                  You authorize directly on the provider&rsquo;s official login page. Fuze never sees or stores your master passwords.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    3
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 m-0">
                    Unified Storage Calculation
                  </h3>
                </div>
                <p className="text-sm text-slate-600 m-0 pl-11">
                  Once connected, your storage bar updates dynamically to display your aggregated pool. If you connect all 5 providers, you will see <strong>42.0 GB Total Available</strong> in one central gauge.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    4
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 m-0">
                    Drag and Drop Files Seamlessly
                  </h3>
                </div>
                <p className="text-sm text-slate-600 m-0 pl-11">
                  Upload documents, photos, or audio files through the web file explorer. Fuze&rsquo;s intelligent allocation engine selects the optimal provider based on file size and available quotas. You can organize files into virtual folders, search globally across all clouds, and view high-resolution native previews.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Security */}
          <section className="space-y-4 pt-4">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Is Combining Cloud Storage Safe?
            </h2>
            <p>
              Yes, when using a direct-to-cloud zero-proxy architecture:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>
                <strong>Official OAuth2 Scopes</strong>: Permissions can be revoked at any time from your Google, Microsoft, or Dropbox account security settings.
              </li>
              <li>
                <strong>Encrypted Token Storage</strong>: Access tokens stored by Fuze are protected with military-grade <strong>AES-256-GCM encryption</strong>.
              </li>
              <li>
                <strong>Browser-Direct Transfers</strong>: When uploading or downloading, your files stream directly between your computer and the cloud provider&rsquo;s encrypted endpoints (HTTPS/TLS 1.3). No middleman server touches your data.
              </li>
              <li>
                <strong>Account Collision Protection</strong>: Fuze ensures that no two users can link the same cloud email address, preventing any unauthorized cross-account access.
              </li>
            </ul>
          </section>

          {/* CTA Box */}
          <div className="mt-12 p-8 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg space-y-5 text-center">
            <h3 className="text-2xl sm:text-3xl font-extrabold m-0">
              Combine Your Free Cloud Storage Now
            </h3>
            <p className="text-blue-100 text-sm sm:text-base max-w-xl mx-auto m-0">
              Stop juggling 5 different cloud logins. Pool 42 GB of free personal storage into one high-speed virtual drive in under 3 minutes.
            </p>
            <div className="pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-blue-700 font-bold text-sm hover:bg-blue-50 transition shadow-sm"
              >
                <span>Get Started Free</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 px-4 sm:px-6 text-xs text-slate-500 bg-white mt-12">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FuzeLogo variant="icon" height={20} />
            <span className="font-semibold text-slate-700">Fuze Drive</span>
            <span>• MIT Licensed Open Source</span>
          </div>

          <div className="flex items-center gap-4 text-slate-600 font-medium">
            <Link href="/" className="hover:text-slate-900 transition">
              Home
            </Link>
            <Link href="/compare/multcloud-alternative" className="hover:text-slate-900 transition">
              MultCloud Alternative
            </Link>
            <Link href="/privacy" className="hover:text-slate-900 transition">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-slate-900 transition">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

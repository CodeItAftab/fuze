import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingCta } from "@/components/marketing/MarketingCta";
import { RelatedGuides } from "@/components/marketing/RelatedGuides";
import {
  ShieldCheck,
  Zap,
  Layers,
  Cloud,
  CheckCircle2,
  Clock,
  ArrowRight,
  HardDrive,
  Lock,
} from "lucide-react";
import { TOTAL_FREE_STORAGE_GB, PROVIDER_FACTS } from "@/lib/facts";

export const metadata: Metadata = {
  title: `How to Combine Cloud Storage Accounts into One ${TOTAL_FREE_STORAGE_GB} GB Drive | Fuze Drive`,
  description:
    `Step-by-step tutorial on how to combine Google Drive, MEGA, Box, pCloud, Koofr, OneDrive, and Dropbox into a single ${TOTAL_FREE_STORAGE_GB} GB unified virtual drive.`,
  alternates: {
    canonical: "https://fuzedrive.tech/guides/combine-google-drive-onedrive-dropbox",
  },
  openGraph: {
    title: `How to Combine Cloud Storage Accounts into One ${TOTAL_FREE_STORAGE_GB} GB Drive`,
    description:
      `Learn how to aggregate multiple free cloud storage accounts into a unified, zero-proxy virtual drive with ${TOTAL_FREE_STORAGE_GB} GB total capacity.`,
    url: "https://fuzedrive.tech/guides/combine-google-drive-onedrive-dropbox",
    siteName: "Fuze Drive",
    type: "article",
  },
};

export default function CombineCloudStorageGuidePage() {
  const lastUpdated = "October 28, 2026";

  const quotas = [
    { provider: "MEGA", freeTier: "20 GB", color: "text-rose-600 bg-rose-50 border-rose-200" },
    { provider: "Google Drive", freeTier: "15 GB", color: "text-amber-600 bg-amber-50 border-amber-200" },
    { provider: "Box", freeTier: "10 GB", color: "text-blue-600 bg-blue-50 border-blue-200" },
    { provider: "Koofr", freeTier: "10 GB", color: "text-teal-600 bg-teal-50 border-teal-200" },
    { provider: "pCloud", freeTier: "10 GB", color: "text-cyan-600 bg-cyan-50 border-cyan-200" },
    { provider: "OneDrive", freeTier: "5 GB", color: "text-sky-600 bg-sky-50 border-sky-200" },
    { provider: "Dropbox", freeTier: "2 GB", color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased flex flex-col justify-between">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Article",
              headline:
                `How to Combine Cloud Storage Accounts into One ${TOTAL_FREE_STORAGE_GB} GB Drive (2026 Guide)`,
              description:
                `Step-by-step tutorial on how to combine Google Drive, MEGA, Box, pCloud, Koofr, OneDrive, and Dropbox into a single ${TOTAL_FREE_STORAGE_GB} GB unified virtual drive.`,
              url: "https://fuzedrive.tech/guides/combine-google-drive-onedrive-dropbox",
              datePublished: "2026-10-15T00:00:00Z",
              dateModified: "2026-10-28T00:00:00Z",
              author: {
                "@type": "Person",
                name: "Aftab Alam",
                url: "https://aftabalam.me",
              },
              publisher: {
                "@type": "Organization",
                name: "Fuze Drive",
                url: "https://fuzedrive.tech",
              },
            },
            {
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
              ],
            },
          ]),
        }}
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
          <span className="text-slate-800 font-semibold">Combine Cloud Storage</span>
        </nav>

        {/* Header Section */}
        <div className="space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <Layers className="h-3.5 w-3.5 text-blue-600" />
            Complete Step-by-Step Tutorial
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
            How to Combine Cloud Storage Accounts into One {TOTAL_FREE_STORAGE_GB} GB Drive
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
            Managing separate logins for Google Drive, MEGA, Box, pCloud, Koofr, OneDrive, and Dropbox is frustrating and fragments your storage. Learn how to pool them all into a single, high-speed virtual drive.
          </p>

          <div className="flex items-center gap-4 pt-2 text-xs text-slate-500 border-t border-slate-200">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              Last Updated: {lastUpdated}
            </span>
            <span>•</span>
            <span className="font-medium text-slate-600">6 min read</span>
            <span>•</span>
            <span className="text-emerald-700 font-medium">Verified for 7 Cloud Services</span>
          </div>
        </div>

        {/* Free Quota Breakdown Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 mb-10">
          {quotas.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-2xl border text-center ${item.color} flex flex-col justify-center`}
            >
              <span className="text-[11px] font-medium block opacity-80">{item.provider}</span>
              <span className="text-base sm:text-lg font-extrabold">{item.freeTier}</span>
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
              Nearly every internet user has an active Google account (including <strong>15 GB</strong> of Google Drive storage), a Microsoft account (<strong>5 GB</strong> of OneDrive), a <strong>MEGA</strong> account (<strong>20 GB</strong>), and free allocations across <strong>Box</strong> (<strong>10 GB</strong>), <strong>Koofr</strong> (<strong>10 GB</strong>), <strong>pCloud</strong> (up to <strong>10 GB</strong>), and <strong>Dropbox</strong> (<strong>2 GB</strong>).
            </p>
            <p>
              Added together, that represents <strong>up to {TOTAL_FREE_STORAGE_GB} GB of zero-cost personal cloud storage</strong>. Yet in practice, most people only use a fraction of it because:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm">
              <li>Remembering 7 different logins, authenticators, and passwords is inconvenient.</li>
              <li>Installing multiple desktop sync clients consumes considerable system memory and slows down computer performance.</li>
              <li>When one drive fills up with documents or media, other drives sit empty.</li>
              <li>Searching for an old file requires navigating multiple separate web dashboards.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-4 pt-4">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              How Cloud Aggregation Works (Without Paying Monthly Subscriptions)
            </h2>
            <p>
              Historically, combining clouds required commercial multi-cloud SaaS platforms designed for enterprise migrations, often with monthly data traffic meters on free tiers.
            </p>
            <p>
              <strong>Fuze Drive takes a client-side approach</strong>: an open-source web application that connects to your personal storage accounts via official APIs and streams uploads and downloads directly between your browser and each cloud provider.
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
                  . Sign up with your email and password. No credit card or billing information is ever required.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    2
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 m-0">
                    Connect Your Storage Accounts
                  </h3>
                </div>
                <p className="text-sm text-slate-600 m-0 pl-11">
                  In your dashboard, click <strong>Connected Clouds</strong>. Click &ldquo;Connect&rdquo; next to each provider you use:
                </p>
                <div className="pl-11 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-slate-700">
                  <span className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> MEGA (20 GB)
                  </span>
                  <span className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Google Drive (15 GB)
                  </span>
                  <span className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Box (10 GB)
                  </span>
                  <span className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Koofr (10 GB via App Password)
                  </span>
                  <span className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> pCloud (up to 10 GB)
                  </span>
                  <span className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Microsoft OneDrive (5 GB)
                  </span>
                  <span className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Dropbox (2 GB)
                  </span>
                </div>
                <p className="text-xs text-slate-500 m-0 pl-11 pt-1">
                  For Koofr, use an App Password generated in Koofr Preferences. See our <Link href="/guides/connect-cloud-providers" className="text-blue-600 underline font-semibold">step-by-step setup guide</Link>.
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
                  Once connected, your storage pool dynamically calculates your combined free quota, aggregating up to <strong>{TOTAL_FREE_STORAGE_GB} GB</strong> in one central gauge.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    4
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 m-0">
                    Manage Files Seamlessly
                  </h3>
                </div>
                <p className="text-sm text-slate-600 m-0 pl-11">
                  Upload documents, photos, or media through the web explorer. Fuze Drive&rsquo;s allocation engine selects the optimal provider based on file size and available quotas. You can organize files into virtual folders, search globally across all clouds, and view high-resolution native previews.
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
              Yes, when using a direct client-side architecture:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
              <li>
                <strong>Official OAuth 2.0 Scopes:</strong> Permissions can be revoked at any time from your cloud account security settings.
              </li>
              <li>
                <strong>Encrypted Token Storage:</strong> Access tokens and app passwords stored by Fuze Drive are protected with <strong>AES-256-GCM encryption</strong> at rest.
              </li>
              <li>
                <strong>Browser-Direct Transfers:</strong> Uploads and standard downloads stream directly between your browser and each provider&rsquo;s encrypted endpoints (HTTPS/TLS 1.2+).
              </li>
              <li>
                <strong>Account Collision Protection:</strong> Fuze Drive blocks multiple accounts from linking the same cloud email address, maintaining account isolation.
              </li>
            </ul>
          </section>

          <RelatedGuides currentPath="/guides/combine-google-drive-onedrive-dropbox" />

          <MarketingCta
            title="Combine Your Free Cloud Storage Now"
            description={`Stop juggling multiple separate cloud logins. Pool up to ${TOTAL_FREE_STORAGE_GB} GB of free personal storage into one virtual drive in under 3 minutes.`}
            buttonText="Get Started Free"
            buttonHref="/register"
          />
        </article>
      </main>

      <MarketingFooter />
    </div>
  );
}

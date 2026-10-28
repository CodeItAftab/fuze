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
  Workflow,
  Server,
  Lock,
  RefreshCw,
} from "lucide-react";
import { TOTAL_FREE_STORAGE_GB } from "@/lib/facts";

export const metadata: Metadata = {
  title: `How It Works: Zero-Proxy Cloud Aggregation Architecture | Fuze Drive`,
  description:
    `Learn how Fuze Drive unifies up to ${TOTAL_FREE_STORAGE_GB} GB across 7 clouds using direct browser-to-cloud streams, resumable sessions, and zero server bandwidth.`,
  alternates: {
    canonical: "https://fuzedrive.tech/how-it-works",
  },
  openGraph: {
    title: "How Fuze Drive Works — Zero-Proxy Cloud Architecture",
    description:
      "Deep dive into Fuze Drive's control plane vs data plane separation, OAuth2 security, and direct-to-cloud file streaming.",
    url: "https://fuzedrive.tech/how-it-works",
    siteName: "Fuze Drive",
    type: "article",
  },
};

export default function HowItWorksPage() {
  const lastUpdated = "October 28, 2026";

  const workflowSteps = [
    {
      step: "1",
      title: "Client Initiates Upload",
      desc: "When you select a file in Fuze Drive, your browser calculates its size, MIME type, and requests an upload ticket from the Fuze Drive backend.",
      icon: <Layers className="h-5 w-5 text-blue-600" />,
    },
    {
      step: "2",
      title: "Smart Allocation Decision",
      desc: "Fuze Drive inspects your connected cloud quotas (evaluating real-time API capacity) and selects the optimal provider based on file size and transfer speed.",
      icon: <Zap className="h-5 w-5 text-amber-500" />,
    },
    {
      step: "3",
      title: "Authorized Resumable Session",
      desc: "Fuze Drive backend requests an authorized upload URL from the chosen cloud provider and returns the direct endpoint to your browser.",
      icon: <Lock className="h-5 w-5 text-indigo-600" />,
    },
    {
      step: "4",
      title: "Direct Browser-to-Cloud Stream",
      desc: "Your browser uploads the file bytes directly to the cloud provider endpoint (Google, Microsoft, Box, etc.). Bytes do not route through Fuze Drive servers.",
      icon: <Cloud className="h-5 w-5 text-emerald-600" />,
    },
    {
      step: "5",
      title: "Indexation & Instant Availability",
      desc: "Once the provider confirms upload completion, Fuze Drive records the file metadata in your Virtual File System (VFS) tree.",
      icon: <CheckCircle2 className="h-5 w-5 text-teal-600" />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased flex flex-col justify-between">
      <MarketingHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <Link href="/" className="hover:text-blue-600 transition">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">How It Works</span>
        </nav>

        {/* Header Section */}
        <div className="space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <Workflow className="h-3.5 w-3.5 text-blue-600" />
            Zero-Proxy Architecture Deep Dive
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
            How Fuze Drive Works
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
            Understand how Fuze Drive aggregates multiple free cloud providers into a unified {TOTAL_FREE_STORAGE_GB} GB personal drive while ensuring your files stream directly to provider infrastructure.
          </p>

          <div className="flex items-center gap-4 pt-2 text-xs text-slate-500 border-t border-slate-200">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              Last Updated: {lastUpdated}
            </span>
            <span>•</span>
            <span className="font-medium text-slate-600">6 min read</span>
            <span>•</span>
            <span className="text-emerald-700 font-medium">Open-Source MIT Architecture</span>
          </div>
        </div>

        {/* Article Body */}
        <article className="prose prose-slate max-w-none text-slate-700 leading-relaxed space-y-10">
          {/* Section 1: The Core Philosophy */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              The Fundamental Architecture: Control Plane vs. Data Plane
            </h2>
            <p>
              Most traditional cloud aggregator tools route all your file payloads through their own application servers. When uploading large files, this creates bandwidth bottlenecks and privacy risks.
            </p>
            <p>
              Fuze Drive cleanly separates the <strong>Control Plane</strong> from the <strong>Data Plane</strong>:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="font-bold text-blue-900 text-base flex items-center gap-2">
                  <Server className="h-4 w-4 text-blue-600" />
                  Control Plane (Fuze Drive Server)
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Handles user authentication, encrypted token storage, Virtual File System (VFS) folder indexing, and thumbnail preview generation. Only JSON metadata payloads are exchanged.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="font-bold text-emerald-900 text-base flex items-center gap-2">
                  <Cloud className="h-4 w-4 text-emerald-600" />
                  Data Plane (Browser to Cloud)
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Raw file binaries stream directly between your web browser and official cloud endpoints (Google Drive, Microsoft Graph, Box API, Dropbox, pCloud, MEGA, Koofr).
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: 5-Step Workflow */}
          <section className="space-y-6 pt-4">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              The 5-Step Direct Upload Lifecycle
            </h2>

            <div className="space-y-4">
              {workflowSteps.map((stepItem, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex gap-4 items-start"
                >
                  <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                    {stepItem.icon}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">STEP {stepItem.step}</span>
                      <h3 className="text-base font-bold text-slate-900 m-0">
                        {stepItem.title}
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 m-0 leading-relaxed">
                      {stepItem.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Smart Allocation */}
          <section className="space-y-4 pt-4">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Intelligent Allocation: Whole-File Priority &amp; Fallback Chunking
            </h2>
            <p>
              Fuze Drive uses an allocation engine designed to preserve whole files whenever possible:
            </p>
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs sm:text-sm space-y-1">
                <strong className="text-blue-900 block font-bold">Rule 1: Whole-File Prioritization</strong>
                <p className="text-slate-700 m-0">
                  If any connected provider with sufficient space can store the file intact within its single-file limits (e.g. Box&apos;s 250 MB personal limit), it is assigned to that provider based on throughput and preview capabilities. This ensures native video and document previews work seamlessly.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs sm:text-sm space-y-1">
                <strong className="text-slate-900 block font-bold">Rule 2: Cross-Cloud Dynamic Chunking (Fallback)</strong>
                <p className="text-slate-700 m-0">
                  When a large file exceeds the available space or upload limit of every individual provider, Fuze Drive automatically activates chunking. The file is partitioned into discrete SHA-256 validated segments, uploaded across remaining quotas, and indexed with composite hashes.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Security */}
          <section className="space-y-4 pt-4">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              How Your Credentials and Data Stay Secure
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
              <li>
                <strong>Official OAuth 2.0 Authorization:</strong> Passwords for Google Drive, Microsoft, Box, Dropbox, and pCloud are never requested or stored. Authentication occurs via official provider OAuth flows.
              </li>
              <li>
                <strong>AES-256-GCM Token Encryption:</strong> All OAuth tokens, refresh tokens, and app passwords are encrypted at rest with AES-256-GCM using 16-byte random IVs and authentication tags.
              </li>
              <li>
                <strong>Account Collision Protection:</strong> Fuze Drive blocks multiple users from linking the same third-party cloud account email, ensuring profile isolation.
              </li>
              <li>
                <strong>Safe Disconnect:</strong> You can unlink any provider at any time using <em>Smart Unlink</em> to remove stored tokens while leaving your personal cloud files completely intact.
              </li>
            </ul>
          </section>

          {/* Related Guides */}
          <RelatedGuides currentPath="/how-it-works" />

          {/* CTA Box */}
          <div className="mt-12">
            <MarketingCta
              title={`Ready to Experience Unified Cloud Storage?`}
              description={`Aggregate your free storage across 7 providers into one ${TOTAL_FREE_STORAGE_GB} GB personal drive today.`}
              buttonText="Get Started Free"
              buttonHref="/register"
            />
          </div>
        </article>
      </main>

      <MarketingFooter />
    </div>
  );
}

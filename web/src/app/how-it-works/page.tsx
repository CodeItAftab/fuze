import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingCta } from "@/components/marketing/MarketingCta";
import {
  CheckCircle2,
  HardDrive,
  Cloud,
  Zap,
  Shield,
  Clock,
  Layers,
  Sparkles,
  Workflow,
  Server,
  Lock,
  RefreshCw,
} from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works: Zero-Proxy Cloud Aggregation Architecture | Fuze Drive",
  description:
    "Learn how Fuze Drive unifies 42 GB across Google Drive, Box, pCloud, OneDrive, and Dropbox using direct browser-to-cloud streams, resumable sessions, and zero server bandwidth.",
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
  const lastUpdated = "October 15, 2026";

  const workflowSteps = [
    {
      step: "1",
      title: "Client Initiates Upload",
      desc: "When you drop a file into Fuze Drive, the browser calculates its size, MIME type, and asks the Fuze backend for an upload strategy.",
      icon: <Layers className="h-5 w-5 text-blue-600" />,
    },
    {
      step: "2",
      title: "Smart Allocation Engine",
      desc: "Fuze checks your connected accounts. If Google Drive (15 GB) or pCloud (10 GB) has enough free space, it selects Whole-File Priority. If a file is massive, it allocates chunks across multiple clouds.",
      icon: <Zap className="h-5 w-5 text-amber-500" />,
    },
    {
      step: "3",
      title: "Presigned Session Generation",
      desc: "The backend queries the target cloud provider's API to initiate an authorized resumable session URL and hands it directly to your browser.",
      icon: <Server className="h-5 w-5 text-purple-600" />,
    },
    {
      step: "4",
      title: "Direct Browser-to-Cloud Binary Stream",
      desc: "Your browser uploads raw bytes directly to Google, Microsoft, Box, Dropbox, or pCloud endpoints via HTTPS PUT requests. 0 KB of file payload touches Fuze servers.",
      icon: <Cloud className="h-5 w-5 text-emerald-600" />,
    },
    {
      step: "5",
      title: "Metadata & Tree Finalization",
      desc: "Once the provider acknowledges the completed upload, Fuze records the file ID, size, and path in your encrypted Virtual File System (VFS) tree.",
      icon: <CheckCircle2 className="h-5 w-5 text-blue-600" />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased flex flex-col justify-between">
      <MarketingHeader />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6 font-medium">
          <Link href="/" className="hover:text-blue-600 transition">
            Home
          </Link>
          <span>/</span>
          <span className="text-blue-600 font-semibold">How It Works</span>
        </nav>

        {/* Hero Section */}
        <div className="space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <Workflow className="h-3.5 w-3.5 text-blue-600" />
            Zero-Proxy Architecture Deep Dive
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
            How Fuze Drive Works
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
            Understand how Fuze aggregates multiple free cloud providers into a unified 42 GB personal drive while ensuring your files never pass through intermediate proxy servers.
          </p>

          <div className="flex items-center gap-4 pt-2 text-xs text-slate-500 border-t border-slate-200">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              Last Updated: {lastUpdated}
            </span>
            <span>•</span>
            <span className="font-medium text-slate-600">6 min read</span>
            <span>•</span>
            <span className="text-emerald-700 font-medium">Full Open-Source Architecture</span>
          </div>
        </div>

        {/* Article Body */}
        <article className="prose prose-slate max-w-none text-slate-700 leading-relaxed space-y-10">
          {/* Section 1: The Core Philosophy */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              The Fundamental Difference: Control Plane vs. Data Plane
            </h2>
            <p>
              Most cloud backup and synchronization applications act as a heavy middleman. When you send a 2 GB video through a traditional aggregator, the aggregator’s server buffers the full 2 GB in memory and re-uploads it to the cloud. This results in slow transfer speeds, expensive bandwidth bills for the provider, and major privacy risks for you.
            </p>
            <p>
              Fuze Drive completely separates the <strong>Control Plane</strong> from the <strong>Data Plane</strong>:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="font-bold text-blue-900 text-base flex items-center gap-2">
                  <Server className="h-4 w-4 text-blue-600" />
                  Control Plane (Fuze Server)
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Handles user authentication, encrypted OAuth token storage, Virtual File System (VFS) folder structures, and high-speed metadata queries. Only JSON payloads are exchanged.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="font-bold text-emerald-900 text-base flex items-center gap-2">
                  <Cloud className="h-4 w-4 text-emerald-600" />
                  Data Plane (Browser to Cloud)
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Raw file binaries stream directly between your web browser and official cloud endpoints (Google Drive, Microsoft Graph, Box API, Dropbox, pCloud).
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
              Intelligent Allocation: Whole-File Priority &amp; Merkle Trees
            </h2>
            <p>
              Many experimental multi-cloud tools make the mistake of slicing every single file into tiny pieces across multiple providers. While interesting in theory, this destroys performance and breaks native cloud previews.
            </p>
            <p>
              Fuze Drive uses a pragmatic <strong>Two-Rule Allocation Engine</strong>:
            </p>
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs sm:text-sm space-y-1">
                <strong className="text-blue-900 block font-bold">Rule 1: Whole-File Prioritization</strong>
                <p className="text-slate-700 m-0">
                  If any connected provider with sufficient space can store the file intact, it is assigned to that provider based on transfer speed (Google Drive &gt; pCloud &gt; OneDrive &gt; Box &gt; Dropbox). This guarantees instant cloud-native previews and maximum single-stream throughput.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs sm:text-sm space-y-1">
                <strong className="text-slate-900 block font-bold">Rule 2: Cross-Cloud Dynamic Chunking (Fallback)</strong>
                <p className="text-slate-700 m-0">
                  Only when a large file exceeds the free capacity of every individual provider does Fuze activate chunking. The file is partitioned into discrete SHA-256 validated segments, uploaded in parallel across your remaining quotas, and linked via a cryptographic Merkle root.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Security */}
          <section className="space-y-4 pt-4">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              How Your Credentials and Data Stay Secure
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>
                <strong>Official OAuth2 Authorization</strong>: You never enter your Google, Microsoft, Box, or Dropbox passwords on Fuze. Authorization happens on each provider&rsquo;s official login domain.
              </li>
              <li>
                <strong>AES-256-GCM Token Encryption</strong>: OAuth refresh and access tokens are encrypted before being saved to the database.
              </li>
              <li>
                <strong>Distributed Redis Token Locking</strong>: Concurrent upload streams share a centralized Redlock mechanism, preventing race conditions or rate-limit lockouts during token refresh cycles.
              </li>
              <li>
                <strong>Account Collision Protection</strong>: Fuze enforces unique email ownership across providers, preventing another user from linking your cloud drive.
              </li>
            </ul>
          </section>

          {/* CTA Box */}
          <div className="mt-12">
            <MarketingCta
              title="Ready to Experience Zero-Proxy Cloud Storage?"
              description="Aggregate your free Google Drive, OneDrive, Dropbox, Box, and pCloud into one 42 GB personal drive today."
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

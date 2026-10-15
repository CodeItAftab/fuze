import type { Metadata } from "next";
import Link from "next/link";
import { FuzeLogo } from "@/components/brand/FuzeLogo";
import {
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  Shield,
  Zap,
  HardDrive,
  Lock,
  ArrowRight,
  Clock,
  ChevronDown,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Frequently Asked Questions (FAQ) | Fuze Drive",
  description:
    "Find answers to common questions about Fuze Drive: how the 42 GB unified storage pool works, browser-to-cloud security, zero-proxy uploads, and OAuth privacy.",
  alternates: {
    canonical: "https://fuzedrive.tech/faq",
  },
  openGraph: {
    title: "Frequently Asked Questions (FAQ) | Fuze Drive",
    description:
      "All your questions answered: 42 GB free pool, zero-knowledge file streaming, and multi-cloud storage management.",
    url: "https://fuzedrive.tech/faq",
    siteName: "Fuze Drive",
    type: "article",
  },
};

export default function FaqPage() {
  const lastUpdated = "October 15, 2026";

  const faqCategories = [
    {
      category: "General & Storage Aggregation",
      questions: [
        {
          q: "How does Fuze give me 42 GB of free storage?",
          a: "Fuze aggregates the official free tiers provided by major cloud platforms: Google Drive (15 GB) + Box (10 GB) + pCloud (10 GB) + Microsoft OneDrive (5 GB) + Dropbox (2 GB) = 42 GB total. You connect each account once via standard OAuth2, and Fuze presents them as a single unified drive.",
        },
        {
          q: "Is Fuze Drive really 100% free?",
          a: "Yes. Fuze Drive is completely free and open-source under the MIT license. Because files stream directly between your browser and cloud APIs via resumable sessions, Fuze doesn't bear heavy server bandwidth costs and never charges subscriptions or paywalls.",
        },
        {
          q: "What happens if one of my connected cloud drives is full?",
          a: "Fuze's intelligent allocation engine automatically handles quota limits. When you upload a file, Fuze evaluates your remaining capacity across all active accounts and assigns the file to the fastest connected provider that has room.",
        },
      ],
    },
    {
      category: "Security, Privacy & Data Plane",
      questions: [
        {
          q: "Do my files pass through Fuze application servers?",
          a: "No. File payloads stream directly between your web browser and the cloud provider's official REST APIs (Google, Microsoft, Box, Dropbox, pCloud) using authorized resumable sessions. Fuze servers only manage your metadata, folder tree, and cached thumbnail previews.",
        },
        {
          q: "Does Fuze see or store my cloud passwords?",
          a: "Never. You authenticate exclusively through the official OAuth2 login dialogs of Google, Microsoft, Box, Dropbox, and pCloud. Fuze never sees your passwords. The returned OAuth tokens are encrypted in our database using industry-standard AES-256-GCM encryption.",
        },
        {
          q: "Can another user link the same cloud drive account?",
          a: "No. Fuze enforces strict cross-user account collision protection. Once a cloud account email is linked to your Fuze profile, no other user can link that same account, protecting your files against unauthorized access.",
        },
      ],
    },
    {
      category: "Uploading, Streaming & Files",
      questions: [
        {
          q: "Are my files split into chunks across different clouds?",
          a: "Fuze follows a Whole-File Priority rule: if any single connected provider has enough free space to store your file intact, it is uploaded whole to that provider. Dynamic multi-cloud chunking is strictly reserved as an automatic fallback when an individual file is larger than any single provider's remaining free quota.",
        },
        {
          q: "Can I preview videos, photos, and PDF documents inside Fuze?",
          a: "Yes. Fuze utilizes native preview APIs from underlying storage providers (including Google Drive high-res streams, Microsoft Graph thumbnails, and Box's 120+ file format renderer) backed by a server-side atomic LRU thumbnail cache.",
        },
        {
          q: "What happens if I decide to delete my Fuze account?",
          a: "You have complete control: you can choose to 'Unlink Only' (which wipes your Fuze metadata while keeping your physical files safely intact in your original cloud accounts) or perform a 'Complete Cloud Purge' (which cascades deletion across your connected cloud drives).",
        },
      ],
    },
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
          <span className="text-blue-600 font-semibold">FAQ</span>
        </nav>

        {/* Hero Section */}
        <div className="space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="h-3.5 w-3.5 text-blue-600" />
            Knowledge Base &amp; FAQ
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
            Frequently Asked Questions
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
            Everything you need to know about Fuze Drive, pooling free cloud storage, zero-proxy security, and managing your unified 42 GB drive.
          </p>

          <div className="flex items-center gap-4 pt-2 text-xs text-slate-500 border-t border-slate-200">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              Last Updated: {lastUpdated}
            </span>
            <span>•</span>
            <span className="font-medium text-slate-600">Quick answers</span>
          </div>
        </div>

        {/* FAQ Content */}
        <div className="space-y-10">
          {faqCategories.map((cat, cIdx) => (
            <section key={cIdx} className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 border-b border-slate-200 pb-2">
                {cat.category}
              </h2>

              <div className="space-y-3">
                {cat.questions.map((faq, qIdx) => (
                  <details
                    key={qIdx}
                    className="group border border-slate-200 rounded-2xl bg-white p-5 transition-all shadow-2xs"
                  >
                    <summary className="font-semibold text-slate-900 cursor-pointer list-none flex items-center justify-between text-sm sm:text-base select-none">
                      <span>{faq.q}</span>
                      <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 group-open:rotate-180 group-open:text-blue-600" />
                    </summary>
                    <div className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-3 pt-3 border-t border-slate-100">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* CTA Box */}
        <div className="mt-12 p-8 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg space-y-5 text-center">
          <h3 className="text-2xl sm:text-3xl font-extrabold m-0">
            Still Have Questions?
          </h3>
          <p className="text-blue-100 text-sm sm:text-base max-w-xl mx-auto m-0">
            Experience Fuze Drive for yourself. Set up your unified 42 GB personal cloud in under 3 minutes with zero obligation.
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
            <Link href="/how-it-works" className="hover:text-slate-900 transition">
              How It Works
            </Link>
            <Link href="/compare/multcloud-alternative" className="hover:text-slate-900 transition">
              MultCloud Alternative
            </Link>
            <Link href="/privacy" className="hover:text-slate-900 transition">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingCta } from "@/components/marketing/MarketingCta";
import { RelatedGuides } from "@/components/marketing/RelatedGuides";
import {
  HelpCircle,
  Clock,
  ChevronDown,
  KeyRound,
  ShieldCheck,
  HardDrive,
} from "lucide-react";
import { TOTAL_FREE_STORAGE_GB, PROVIDER_FACTS } from "@/lib/facts";

export const metadata: Metadata = {
  title: `Frequently Asked Questions (FAQ) | Fuze Drive`,
  description: `Find answers to common questions about Fuze Drive: how the ${TOTAL_FREE_STORAGE_GB} GB unified storage pool works, browser-to-cloud security, zero-proxy uploads, and OAuth privacy.`,
  alternates: {
    canonical: "https://fuzedrive.tech/faq",
  },
  openGraph: {
    title: `Frequently Asked Questions (FAQ) | Fuze Drive`,
    description: `All your questions answered: ${TOTAL_FREE_STORAGE_GB} GB free pool, client-side streaming, and multi-cloud storage management.`,
    url: "https://fuzedrive.tech/faq",
    siteName: "Fuze Drive",
    type: "article",
  },
};

export default function FaqPage() {
  const lastUpdated = "October 28, 2026";

  const faqCategories = [
    {
      category: "General & Storage Aggregation",
      questions: [
        {
          q: `How does Fuze Drive give me up to ${TOTAL_FREE_STORAGE_GB} GB of free storage?`,
          a: `Fuze Drive aggregates the official consumer free allocations provided by 7 major cloud platforms: MEGA (20 GB) + Google Drive (15 GB) + Box (10 GB) + Koofr (10 GB) + pCloud (up to 10 GB) + Microsoft OneDrive (5 GB) + Dropbox (2 GB) = up to ${TOTAL_FREE_STORAGE_GB} GB total. You connect each account once, and Fuze Drive presents them as a single unified drive.`,
        },
        {
          q: "Which free cloud providers are supported and what are their individual capacities?",
          a: "Fuze Drive connects 7 cloud storage services: MEGA (20 GB), Google Drive (15 GB), Box (10 GB, 250 MB per-file limit), Koofr (10 GB via App Password), pCloud (up to 10 GB), Microsoft OneDrive (5 GB), and Dropbox (2 GB). Detailed setup steps for each are provided in our Connect Providers guide.",
        },
        {
          q: "Is Fuze Drive really 100% free with no monthly subscription?",
          a: "Yes. Fuze Drive is completely free and open-source under the MIT license. Because files stream directly between your browser and cloud provider APIs, Fuze Drive does not incur heavy data proxy costs and never charges monthly subscription fees.",
        },
        {
          q: "What happens if one of my connected cloud drives is full?",
          a: "Fuze Drive's allocation engine automatically monitors remaining space across all your connected accounts. When you upload a file, Fuze Drive assigns the file to the fastest connected provider that has sufficient quota.",
        },
      ],
    },
    {
      category: "Security, Privacy & Data Plane",
      questions: [
        {
          q: "Do my files pass through Fuze Drive application servers?",
          a: "File uploads and regular downloads stream directly between your browser and each cloud provider's official REST endpoints using authorized sessions. Fuze Drive servers store virtual metadata, folder hierarchies, and an ephemeral thumbnail cache (14-day TTL).",
        },
        {
          q: "How are my cloud credentials and OAuth tokens protected?",
          a: "All OAuth access tokens, refresh tokens, and app passwords are encrypted at rest using AES-256-GCM (Galois/Counter Mode) with 16-byte random initialization vectors and authentication tags. Passwords for OAuth providers are never requested or stored.",
        },
        {
          q: "How does Koofr connect to Fuze Drive?",
          a: "Koofr connects using a generated WebDAV App Password from your Koofr Account Preferences -> Password menu. This isolates Fuze Drive from your main Koofr login password, ensuring maximum account safety.",
        },
        {
          q: "What happens if I disconnect a cloud provider?",
          a: "You can disconnect any provider at any time. Fuze Drive provides a Smart Unlink option: your files remain intact in your personal cloud account, while OAuth tokens and indexing records are permanently deleted from Fuze Drive servers.",
        },
      ],
    },
    {
      category: "File Management & Large Files",
      questions: [
        {
          q: "What is the maximum file size I can upload?",
          a: "For single-provider uploads, files are subject to each provider's individual limit (e.g., Box limits personal free accounts to 250 MB per file). If a file exceeds a provider's limit or available space, Fuze Drive splits the file into cryptographic chunks distributed across multiple connected clouds.",
        },
        {
          q: "Can I preview documents, images, and videos in Fuze Drive?",
          a: "Yes. Fuze Drive provides built-in preview support for PDFs, Office documents, markdown, text files, images, and video playback.",
        },
        {
          q: "Can other users connect to the same cloud account?",
          a: "No. Fuze Drive enforces strict cross-user account collision protection: once a cloud account email is linked to your profile, no other user can link that same account.",
        },
      ],
    },
  ];

  // Flatten all questions for JSON-LD FAQPage schema
  const allQuestions = faqCategories.flatMap((cat) => cat.questions);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allQuestions.map((q) => ({
      "@type": "Question",
      name: q.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.a,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col justify-between">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <MarketingHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
            <HelpCircle className="h-3.5 w-3.5" /> Answers &amp; Knowledge Base
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
            Frequently Asked Questions
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            Everything you need to know about Fuze Drive, pooling up to {TOTAL_FREE_STORAGE_GB} GB across 7 free clouds, and zero-proxy privacy.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            <span>Updated {lastUpdated}</span>
          </div>
        </div>

        {/* Quick Guide Callout */}
        <div className="mb-10 p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-blue-950 font-medium">
            <KeyRound className="h-4 w-4 text-blue-600 shrink-0" />
            <span>Need help setting up Koofr app passwords or linking cloud providers?</span>
          </div>
          <Link
            href="/guides/connect-cloud-providers"
            className="font-bold text-blue-700 hover:text-blue-900 underline whitespace-nowrap"
          >
            Read Provider Setup Guide &rarr;
          </Link>
        </div>

        {/* Categorized FAQs */}
        <div className="space-y-10">
          {faqCategories.map((category, catIdx) => (
            <div key={catIdx} className="space-y-4">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 border-b border-slate-200 pb-2">
                {category.category}
              </h2>
              <div className="space-y-3">
                {category.questions.map((faq, qIdx) => (
                  <details
                    key={qIdx}
                    className="group border border-slate-200 rounded-2xl bg-white overflow-hidden transition-all shadow-2xs"
                  >
                    <summary className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-slate-900 hover:text-blue-600 transition cursor-pointer text-sm sm:text-base list-none select-none">
                      <span>{faq.q}</span>
                      <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 group-open:rotate-180 group-open:text-blue-600" />
                    </summary>
                    <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Related Guides */}
        <RelatedGuides currentPath="/faq" />

        {/* Call to Action */}
        <MarketingCta
          title={`Ready to Aggregate Up to ${TOTAL_FREE_STORAGE_GB} GB of Free Storage?`}
          description="Connect your free clouds in minutes. Zero monthly subscriptions, MIT open-source license."
          buttonText="Get Started Free"
          buttonHref="/register"
        />
      </main>

      <MarketingFooter />
    </div>
  );
}

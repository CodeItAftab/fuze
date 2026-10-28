import Link from "next/link";
import { HelpCircle, ChevronDown, ArrowRight } from "lucide-react";
import { TOTAL_FREE_STORAGE_GB } from "@/lib/facts";

export const FAQ_ITEMS = [
  {
    q: `How does Fuze Drive combine up to ${TOTAL_FREE_STORAGE_GB} GB of free cloud storage into one drive?`,
    a: `Fuze Drive connects your personal free consumer cloud storage quotas—MEGA (20 GB), Google Drive (15 GB), Box (10 GB), Koofr (10 GB), pCloud (up to 10 GB), Microsoft OneDrive (5 GB), and Dropbox (2 GB)—into a single unified Virtual File System (VFS). An allocation engine prioritizes whole files on the fastest available cloud and only chunks files when they exceed individual provider storage or file size ceilings.`,
  },
  {
    q: "Is Fuze Drive really 100% free with no monthly subscription?",
    a: "Yes, Fuze Drive is 100% free and open-source under the MIT license. Because Fuze Drive uses a client-side streaming architecture where file uploads and downloads travel directly between your browser and cloud provider APIs, Fuze Drive incurs minimal server transit overhead and does not charge subscription fees or require credit cards.",
  },
  {
    q: "Does Fuze Drive see, proxy, or store my personal file contents?",
    a: "No. File uploads and standard downloads stream directly between your browser and each cloud provider's official REST endpoints. Fuze Drive servers index your file metadata and folder structure. For optional features (like video thumbnails and document previews), the backend temporarily buffers requested chunks in an ephemeral cache with a 14-day time-to-live.",
  },
  {
    q: "Which cloud storage providers can I connect to Fuze Drive?",
    a: `Fuze Drive natively supports 7 major cloud storage providers: Google Drive, MEGA, Box, pCloud, Koofr, Microsoft OneDrive, and Dropbox, delivering up to ${TOTAL_FREE_STORAGE_GB} GB of pooled personal storage. Instructions for each provider (including Koofr's WebDAV app password) are available in our step-by-step connection guide.`,
  },
  {
    q: "What happens if a file is larger than a single provider's available space?",
    a: "Fuze Drive automatically uses dynamic multi-cloud chunking: the file is split into cryptographic chunks, distributed across your remaining connected clouds with available quota, and indexed with composite SHA-256 chunk hashes.",
  },
  {
    q: "Can other users connect to or access my cloud accounts?",
    a: "No. Fuze Drive enforces cross-user account collision protection. Once a cloud account email is linked to your profile, no other user can link that same account, ensuring your storage remains isolated and secure.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="py-20 px-4 sm:px-6 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold mb-2">
          <HelpCircle className="h-3.5 w-3.5" /> Answers to Common Questions
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Frequently Asked Questions
        </h2>
        <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto">
          Everything you need to know about Fuze Drive, free quota pooling, and zero-proxy privacy.
        </p>
      </div>

      <div className="space-y-3">
        {FAQ_ITEMS.map((faq, idx) => (
          <details
            key={idx}
            className="group border border-slate-200 rounded-2xl bg-white overflow-hidden transition-all shadow-2xs"
          >
            <summary className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-slate-900 hover:text-blue-600 transition cursor-pointer text-sm sm:text-base list-none select-none">
              <span>{faq.q}</span>
              <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 group-open:rotate-180 group-open:text-blue-600" />
            </summary>
            <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
              {faq.a}
            </div>
          </details>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/faq"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
        >
          <span>Have more questions? Read all questions in our full Knowledge Base &amp; FAQ</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}

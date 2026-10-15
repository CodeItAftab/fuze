import { HelpCircle, ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "How does Fuze combine 42 GB of free cloud storage into one drive?",
    a: "Fuze connects your individual free cloud storage quotas—Google Drive (15 GB), Box (10 GB), pCloud (10 GB), OneDrive (5 GB), and Dropbox (2 GB)—into a single unified Virtual File System (VFS). An intelligent allocation engine stores files whole on the fastest available cloud and only chunks files when they exceed individual limits.",
  },
  {
    q: "Is Fuze really 100% free with no monthly subscription?",
    a: "Yes, Fuze is 100% free and open-source under the MIT license. Because Fuze uses a zero-proxy architecture where files stream directly between your browser and cloud provider APIs, Fuze incurs virtually zero storage transit costs and passes that savings directly to you with no credit card required.",
  },
  {
    q: "Does Fuze see, proxy, or store my personal files on its servers?",
    a: "No. Fuze utilizes direct-to-cloud presigned resumable URLs. Your raw files travel directly between your browser and the respective cloud provider endpoints (Google, Microsoft, Box, Dropbox, pCloud). Fuze never buffers, intercepts, or hosts your file contents.",
  },
  {
    q: "Which cloud storage providers can I connect to Fuze?",
    a: "Fuze natively supports Google Drive, Box, pCloud, Microsoft OneDrive, and Dropbox, aggregating up to 42 GB of free storage with native video, document, and image thumbnail previews.",
  },
  {
    q: "What happens if a file is larger than a single provider's free space?",
    a: "Fuze automatically falls back to Rule 2: Multi-Cloud Dynamic Chunking. The file is split into cryptographic chunks, distributed across remaining connected clouds, and verified using SHA-256 Merkle root trees.",
  },
  {
    q: "Can other users connect to the same cloud account?",
    a: "No. Fuze enforces strict cross-user account collision protection. Once a cloud account email is linked to your Fuze profile, no other user can link that same account, protecting your files against unauthorized access.",
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
          Everything you need to know about Fuze, free quota pooling, and zero-proxy privacy.
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
    </section>
  );
}

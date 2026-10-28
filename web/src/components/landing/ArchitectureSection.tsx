import Link from "next/link";
import { Zap, ShieldCheck, Layers, ArrowRight } from "lucide-react";

export function ArchitectureSection() {
  return (
    <section id="architecture" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
          Engineering Principles
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
          How Fuze Drive Unifies Multi-Cloud Files
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate-600">
          Engineered from first principles for direct speed, cryptographic safety, and complete privacy.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-blue-200 transition">
          <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-5">
            <Zap className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-2">
            Rule 1: Whole-File Priority
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            If a file fits in <strong>any single connected provider</strong>, it is uploaded intact. This eliminates chunking latency and enables instant cloud-native thumbnail rendering.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-emerald-200 transition">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-5">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-2">
            Direct-to-Cloud Streaming
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Files stream directly between your browser and cloud REST APIs via authorized resumable sessions. Fuze Drive servers only manage your metadata, virtual folder tree, and cached previews.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-indigo-200 transition">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-5">
            <Layers className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-2">
            Multi-Cloud Dynamic Chunking
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            When a large file exceeds all individual provider limits, Fuze Drive automatically splits it across available clouds with SHA-256 Merkle root verification.
          </p>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/guides/open-source-cloud-storage-aggregator"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
        >
          <span>Deep dive into our open-source cloud storage aggregator architecture</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}

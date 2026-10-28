import Link from "next/link";
import { Star, ShieldCheck } from "lucide-react";
import { HeroActionButtons } from "@/components/landing/HeroActionButtons";

export function HeroSection() {
  return (
    <section className="pt-16 sm:pt-24 pb-16 px-4 sm:px-6 max-w-5xl mx-auto text-center">
      <div className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-semibold text-slate-700 mb-8 shadow-2xs">
        <span className="flex items-center gap-1 text-blue-600">
          <Star className="h-3.5 w-3.5 fill-blue-600 text-blue-600" />
          100% Free & Open Source
        </span>
        <span className="text-slate-300">•</span>
        <span className="flex items-center gap-1 text-emerald-700">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          Zero-Proxy Architecture
        </span>
      </div>

      <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.14]">
        Unify all your free cloud storage into{" "}
        <span className="bg-linear-to-r from-blue-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
          one 72 GB personal drive
        </span>
        .
      </h1>

      <p className="mt-4 sm:mt-6 text-sm sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
        Fuze Drive aggregates your free storage across{" "}
        <strong>Google Drive, MEGA, Box, pCloud, Koofr, OneDrive, and Dropbox</strong>.
        Enjoy zero server data transit, whole-file priority, and native video
        & document previews.
      </p>

      <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-3.5">
        <HeroActionButtons />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-500">
        <span>Popular guides:</span>
        <Link
          href="/guides/combine-google-drive-onedrive-dropbox"
          className="text-blue-600 hover:text-blue-800 font-medium underline underline-offset-4 decoration-blue-200 hover:decoration-blue-500 transition"
        >
          combine Google Drive, OneDrive and Dropbox
        </Link>
        <span className="text-slate-300">•</span>
        <Link
          href="/guides/free-cloud-storage-comparison-2026"
          className="text-blue-600 hover:text-blue-800 font-medium underline underline-offset-4 decoration-blue-200 hover:decoration-blue-500 transition"
        >
          free cloud storage comparison
        </Link>
        <span className="text-slate-300">•</span>
        <Link
          href="/compare/multcloud-alternative"
          className="text-blue-600 hover:text-blue-800 font-medium underline underline-offset-4 decoration-blue-200 hover:decoration-blue-500 transition"
        >
          MultCloud alternative
        </Link>
      </div>

      <div className="mt-12 sm:mt-14 pt-8 border-t border-slate-200/90 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 max-w-3xl mx-auto text-left">
        <div className="bg-slate-50/70 p-3 sm:p-4 rounded-xl border border-slate-100">
          <div className="text-xl sm:text-2xl font-bold text-slate-900">72 GB</div>
          <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            7-Cloud Free Pool
          </div>
        </div>
        <div className="bg-slate-50/70 p-3 sm:p-4 rounded-xl border border-slate-100">
          <div className="text-xl sm:text-2xl font-bold text-slate-900">Direct</div>
          <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Browser-to-Cloud Uploads
          </div>
        </div>
        <div className="bg-slate-50/70 p-3 sm:p-4 rounded-xl border border-slate-100">
          <div className="text-xl sm:text-2xl font-bold text-slate-900">Native</div>
          <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Video & Doc Previews
          </div>
        </div>
        <div className="bg-slate-50/70 p-3 sm:p-4 rounded-xl border border-slate-100">
          <div className="text-xl sm:text-2xl font-bold text-emerald-600">100% Free</div>
          <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Open Source (MIT)
          </div>
        </div>
      </div>
    </section>
  );
}

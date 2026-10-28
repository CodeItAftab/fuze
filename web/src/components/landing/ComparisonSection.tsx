import Link from "next/link";
import { ArrowRight, Info, ShieldCheck } from "lucide-react";
import { TOTAL_FREE_STORAGE_GB, MULTCLOUD_VERIFIED_FACTS } from "@/lib/facts";

export function ComparisonSection() {
  return (
    <section
      id="comparison"
      className="py-20 px-4 sm:px-6 bg-slate-50 border-t border-slate-200"
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1.5 block">
            Architectural Comparison
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Comparing Architectural Approaches
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            Understanding how Fuze Drive&apos;s direct client-side aggregation differs from traditional server-side cloud management tools.
          </p>
        </div>

        {/* Mobile View */}
        <div className="sm:hidden space-y-3.5">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-slate-900 text-sm">Monthly Pricing</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Model</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/70">
                <span className="font-bold text-blue-900 text-xs">⚡ Fuze Drive</span>
                <span className="font-extrabold text-emerald-700 text-xs px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">
                  100% Free (MIT)
                </span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-1 text-xs text-slate-600">
                <span>Commercial Tools (e.g. MultCloud)</span>
                <span className="font-medium text-slate-500">5 GB free/mo · Paid tiers</span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-1 text-xs text-slate-600">
                <span>Single Cloud Provider</span>
                <span className="font-medium text-slate-500">Free tier or paid plan</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-slate-900 text-sm">Data Transit</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Architecture</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/70">
                <span className="font-bold text-blue-900 text-xs">⚡ Fuze Drive</span>
                <span className="font-bold text-blue-700 text-xs">
                  Direct Browser-to-Cloud
                </span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-1 text-xs text-slate-600">
                <span>Commercial Tools</span>
                <span className="font-medium text-slate-600 text-right">Server-side cloud sync</span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-1 text-xs text-slate-600">
                <span>Single Cloud Provider</span>
                <span className="font-medium text-slate-500">Direct to vendor API</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-slate-900 text-sm">Storage Model</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Capacity</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/70">
                <span className="font-bold text-blue-900 text-xs">⚡ Fuze Drive</span>
                <span className="font-extrabold text-blue-600 text-xs">
                  Up to {TOTAL_FREE_STORAGE_GB} GB Pooled
                </span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-1 text-xs text-slate-600">
                <span>Commercial Tools</span>
                <span className="font-medium text-slate-500">Multi-cloud directory</span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-1 text-xs text-slate-600">
                <span>Single Cloud Provider</span>
                <span className="font-medium text-slate-500">Siloed (2–20 GB)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm min-w-[540px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="p-4 sm:p-5">Feature</th>
                  <th className="p-4 sm:p-5 text-blue-600 font-extrabold bg-blue-50/50">
                    Fuze Drive
                  </th>
                  <th className="p-4 sm:p-5 font-semibold text-slate-700">
                    Commercial Tools (e.g. MultCloud)
                  </th>
                  <th className="p-4 sm:p-5 font-semibold text-slate-700">
                    Individual Cloud Provider
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-slate-900">Cost &amp; Licensing</td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-600 bg-blue-50/30">
                    100% Free · MIT License
                  </td>
                  <td className="p-4 sm:p-5 text-slate-600">
                    5 GB free traffic/mo · Paid subscriptions
                  </td>
                  <td className="p-4 sm:p-5 text-slate-600">
                    Free quota tier or monthly plan
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-slate-900">
                    Data Transit Architecture
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-slate-900 bg-blue-50/30">
                    Direct Browser-to-Cloud
                  </td>
                  <td className="p-4 sm:p-5 text-slate-600">
                    Server-to-cloud automated transfers
                  </td>
                  <td className="p-4 sm:p-5 text-slate-600">
                    Direct to provider infrastructure
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-slate-900">
                    Quota Aggregation
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-blue-600 bg-blue-50/30">
                    Unified Virtual Pool (up to {TOTAL_FREE_STORAGE_GB} GB)
                  </td>
                  <td className="p-4 sm:p-5 text-slate-600">
                    Connect 30+ services as separate folders
                  </td>
                  <td className="p-4 sm:p-5 text-slate-600">
                    Siloed single service (2–20 GB)
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-slate-900">
                    Code Transparency
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-600 bg-blue-50/30">
                    Open Source (Auditable on GitHub)
                  </td>
                  <td className="p-4 sm:p-5 text-slate-600">
                    Proprietary SaaS
                  </td>
                  <td className="p-4 sm:p-5 text-slate-600">
                    Proprietary
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-slate-400">
              {MULTCLOUD_VERIFIED_FACTS.trademarkDisclaimer}
            </p>
            <Link
              href="/compare/multcloud-alternative"
              className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
            >
              <span>Read in-depth comparison</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

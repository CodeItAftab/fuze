import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function ComparisonSection() {
  return (
    <section
      id="comparison"
      className="py-20 px-4 sm:px-6 bg-slate-50 border-t border-slate-200"
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1.5 block">
            Transparent Comparison
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Comparing Fuze to Other Solutions
          </h2>
        </div>

        {/* Mobile View */}
        <div className="sm:hidden space-y-3.5">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-slate-900 text-sm">Monthly Cost</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Pricing</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/70">
                <span className="font-bold text-blue-900 text-xs">⚡ Fuze</span>
                <span className="font-extrabold text-emerald-700 text-xs px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">
                  100% Free Forever
                </span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-1 text-xs text-slate-600">
                <span>Commercial Aggregators</span>
                <span className="font-medium text-slate-500">$10 – $25 / mo</span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-1 text-xs text-slate-600">
                <span>Single Cloud Provider</span>
                <span className="font-medium text-slate-500">$24 – $120 / yr</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-slate-900 text-sm">Data Transit &amp; Privacy</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Architecture</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/70">
                <span className="font-bold text-blue-900 text-xs">⚡ Fuze Drive</span>
                <span className="font-bold text-blue-700 text-xs">
                  Direct-to-Cloud
                </span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-1 text-xs text-slate-600">
                <span>Some Commercial Aggregators</span>
                <span className="font-medium text-rose-600 text-right">Proxies on their servers</span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-1 text-xs text-slate-600">
                <span>Single Cloud Provider</span>
                <span className="font-medium text-slate-500">Direct (1 Cloud)</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-slate-900 text-sm">Storage Aggregation</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Capacity</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/70">
                <span className="font-bold text-blue-900 text-xs">⚡ Fuze Drive</span>
                <span className="font-extrabold text-blue-600 text-xs">
                  42 GB Free Unified
                </span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-1 text-xs text-slate-600">
                <span>Some Commercial Aggregators</span>
                <span className="font-medium text-slate-500">Paywalled tiers</span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-1 text-xs text-slate-600">
                <span>Single Cloud Provider</span>
                <span className="font-medium text-slate-500">Siloed (5–15 GB)</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-slate-900 text-sm">Open Source License</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Freedom</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/70">
                <span className="font-bold text-blue-900 text-xs">⚡ Fuze Drive</span>
                <span className="font-extrabold text-emerald-700 text-xs px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">
                  MIT License
                </span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-1 text-xs text-slate-600">
                <span>Some Commercial Aggregators</span>
                <span className="font-medium text-slate-500">Proprietary</span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-1 text-xs text-slate-600">
                <span>Single Cloud Provider</span>
                <span className="font-medium text-slate-500">Proprietary</span>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm min-w-[540px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="p-4 sm:p-5">Feature</th>
                  <th className="p-4 sm:p-5 text-blue-600 font-extrabold bg-blue-50/50">
                    Fuze Drive
                  </th>
                  <th className="p-4 sm:p-5">Some Commercial Aggregators (e.g. MultCloud)</th>
                  <th className="p-4 sm:p-5">Single Cloud Provider</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-slate-900">Cost</td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-600 bg-blue-50/30">
                    100% Free Forever
                  </td>
                  <td className="p-4 sm:p-5 text-slate-500">$10 - $25 / month</td>
                  <td className="p-4 sm:p-5 text-slate-500">$24 - $120 / year</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-slate-900">
                    Data Transit &amp; Privacy
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-slate-900 bg-blue-50/30">
                    Zero-Proxy (Direct-to-Cloud)
                  </td>
                  <td className="p-4 sm:p-5 text-rose-600 font-medium">
                    Proxies through their servers
                  </td>
                  <td className="p-4 sm:p-5 text-slate-500">Direct</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-slate-900">
                    Multi-Account Pooling
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-blue-600 bg-blue-50/30">
                    Up to 42 GB Free
                  </td>
                  <td className="p-4 sm:p-5 text-slate-500">Limited by plan</td>
                  <td className="p-4 sm:p-5 text-slate-500">None (Siloed)</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-slate-900">
                    Open Source License
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-600 bg-blue-50/30">
                    MIT (Inspect all code)
                  </td>
                  <td className="p-4 sm:p-5 text-slate-500">Proprietary</td>
                  <td className="p-4 sm:p-5 text-slate-500">Proprietary</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/compare/multcloud-alternative"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 transition bg-blue-50/70 hover:bg-blue-100/70 px-4 py-2 rounded-xl border border-blue-200"
            >
              <span>Compare: Why Fuze Drive is the Free, Open-Source MultCloud Alternative</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

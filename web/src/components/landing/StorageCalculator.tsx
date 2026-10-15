"use client";

import { useState } from "react";
import Link from "next/link";
import { Cloud, Check } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";

interface Provider {
  id: string;
  name: string;
  quotaGB: number;
}

const PROVIDERS: Provider[] = [
  { id: "gdrive", name: "Google Drive", quotaGB: 15 },
  { id: "box", name: "Box", quotaGB: 10 },
  { id: "pcloud", name: "pCloud", quotaGB: 10 },
  { id: "onedrive", name: "Microsoft OneDrive", quotaGB: 5 },
  { id: "dropbox", name: "Dropbox", quotaGB: 2 },
];

export function StorageCalculator() {
  const { user } = useAuthStore();
  const [selectedProviders, setSelectedProviders] = useState<string[]>([
    "gdrive",
    "box",
    "pcloud",
    "onedrive",
    "dropbox",
  ]);

  const toggleProvider = (id: string) => {
    setSelectedProviders((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const totalPoolGB = PROVIDERS.filter((p) =>
    selectedProviders.includes(p.id)
  ).reduce((sum, p) => sum + p.quotaGB, 0);

  return (
    <section id="calculator" className="py-20 px-4 sm:px-6 bg-slate-50 border-t border-slate-200">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1.5 block">
            Free Quota Combiner
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
            Calculate Your Unified Free Storage
          </h2>
          <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto">
            Select your accounts to see how much free personal storage you can
            aggregate without paying a single dollar:
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 mb-8">
          {PROVIDERS.map((provider) => {
            const isChecked = selectedProviders.includes(provider.id);
            return (
              <button
                key={provider.id}
                type="button"
                onClick={() => toggleProvider(provider.id)}
                className={`p-4 rounded-2xl border text-left transition-all bg-white cursor-pointer ${
                  isChecked
                    ? "border-blue-600 shadow-sm ring-2 ring-blue-600/20"
                    : "border-slate-200 opacity-60 hover:opacity-100"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="h-8 w-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                    <Cloud className="h-4 w-4 text-slate-700" />
                  </div>
                  <div
                    className={`h-4 w-4 rounded-md flex items-center justify-center text-xs font-bold ${
                      isChecked
                        ? "bg-blue-600 text-white"
                        : "border border-slate-300"
                    }`}
                  >
                    {isChecked && <Check className="h-3 w-3 stroke-3" />}
                  </div>
                </div>
                <div className="font-semibold text-slate-900 text-sm truncate">
                  {provider.name}
                </div>
                <div className="text-xs font-bold text-blue-600 mt-0.5">
                  +{provider.quotaGB} GB Free
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Your Combined Storage Pool
            </div>
            <div className="text-4xl sm:text-5xl font-black text-slate-900 mt-1">
              {totalPoolGB}{" "}
              <span className="text-2xl font-bold text-blue-600">
                GB Free Storage
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              100% free forever. No credit cards, no recurring bills, and no
              vendor lock-in.
            </p>
          </div>
          {user ? (
            <Link
              href="/dashboard"
              className="w-full sm:w-auto rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3.5 text-sm font-semibold text-white transition whitespace-nowrap shadow-sm text-center"
            >
              Go to Storage Dashboard
            </Link>
          ) : (
            <Link
              href="/register"
              className="w-full sm:w-auto rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3.5 text-sm font-semibold text-white transition whitespace-nowrap shadow-sm text-center"
            >
              Claim Your Free {totalPoolGB} GB
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

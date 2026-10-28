import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import {
  ShieldCheck,
  Lock,
  FileText,
  CheckCircle2,
  HardDrive,
  Cloud,
  KeyRound,
  Trash2,
  Clock,
  Info,
} from "lucide-react";
import { TOTAL_FREE_STORAGE_GB, PROVIDER_FACTS } from "@/lib/facts";

export const metadata: Metadata = {
  title: "Privacy Policy | Fuze Drive",
  description:
    "Comprehensive Privacy Policy, data retention rules, and third-party API compliance statement for Google Drive, MEGA, Box, pCloud, Koofr, OneDrive, and Dropbox.",
  alternates: {
    canonical: "https://fuzedrive.tech/privacy",
  },
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "October 28, 2026";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased flex flex-col justify-between">
      <MarketingHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1">
        {/* Header Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <Link href="/" className="hover:text-blue-600 transition">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Privacy Policy</span>
        </nav>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-12 shadow-sm space-y-8">
          {/* Header */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-4">
              <ShieldCheck className="h-3.5 w-3.5" /> Privacy &amp; Data Protection Commitment
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Privacy Policy
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
              <Clock className="h-3.5 w-3.5" />
              <span>Last Updated: {lastUpdated}</span>
            </div>
          </div>

          {/* Quick Summary Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-1.5">
              <div className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-blue-600" />
                <span>Client-Side Streaming</span>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Raw files upload and download directly between your browser and cloud provider endpoints.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
              <div className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>AES-256-GCM Tokens</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                All OAuth access tokens, refresh tokens, and app passwords are encrypted at rest.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-100/80 border border-slate-200 space-y-1.5">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Trash2 className="h-4 w-4 text-slate-600" />
                <span>Full Data Deletion</span>
              </div>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                Delete your account and all indexed database records anytime via Settings.
              </p>
            </div>
          </div>

          <div className="space-y-8 text-sm sm:text-base text-slate-600 leading-relaxed pt-4 border-t border-slate-100">
            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                1. Introduction &amp; Scope
              </h2>
              <p>
                Fuze Drive (&quot;Fuze&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is an open-source multi-cloud storage aggregator designed to unify free consumer cloud storage quotas (up to {TOTAL_FREE_STORAGE_GB} GB) into a single virtual directory. We support integration with 7 major third-party storage providers: <strong>Google Drive, MEGA, Box, pCloud, Koofr, Microsoft OneDrive, and Dropbox</strong>.
              </p>
              <p>
                This Privacy Policy explains what information we collect, how that data is stored and encrypted, and how your files and third-party credentials are handled.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                2. Information We Collect
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
                <li>
                  <strong>Account Credentials:</strong> When you register an account, we collect your email address and an Argon2id-hashed representation of your password. We never store plain-text passwords.
                </li>
                <li>
                  <strong>OAuth 2.0 Tokens &amp; App Passwords:</strong> When you connect third-party clouds, we store encrypted access tokens, refresh tokens, or app passwords. These are encrypted at rest using <strong>AES-256-GCM</strong> (Galois/Counter Mode) with 16-byte random IVs and authentication tags.
                </li>
                <li>
                  <strong>Virtual File System (VFS) Metadata:</strong> We store metadata (file names, sizes, MIME types, folder paths, and provider chunk maps) in our PostgreSQL database to render your virtual folder directory inside the application.
                </li>
                <li>
                  <strong>Ephemeral Thumbnail &amp; Preview Cache:</strong> To render document and video previews efficiently, requested preview chunks and thumbnails are cached locally on our backend in an ephemeral directory with a 14-day time-to-live and automatic LRU eviction.
                </li>
              </ul>
            </section>

            {/* Section 3: Third-Party Provider Compliance */}
            <section className="space-y-4">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                3. Third-Party Provider Integration &amp; Compliance
              </h2>
              <p className="text-xs sm:text-sm">
                Fuze Drive connects to external storage backends using official REST APIs. Below is the breakdown of how credentials and data are handled per provider:
              </p>

              <div className="space-y-3 text-xs sm:text-sm">
                {/* Google Drive */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Cloud className="h-4 w-4 text-blue-600" />
                    Google Drive (Google API Services User Data Policy Compliance)
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-xs">
                    Fuze Drive complies strictly with the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google API Services User Data Policy</a>, including the Limited Use requirements. Fuze Drive only requests the <code>drive.file</code> scope, limiting file access strictly to files created or opened by Fuze Drive. Fuze Drive does not transfer, sell, or use Google user data for advertising or AI model training.
                  </p>
                </div>

                {/* Microsoft OneDrive */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Cloud className="h-4 w-4 text-sky-600" />
                    Microsoft OneDrive
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-xs">
                    Connects via Microsoft Graph API with the <code>Files.ReadWrite</code> scope. OAuth tokens are encrypted at rest with AES-256-GCM.
                  </p>
                </div>

                {/* Koofr */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-teal-600" />
                    Koofr (WebDAV App Passwords)
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-xs">
                    Koofr connections require a dedicated App Password generated from your Koofr account preferences. Fuze Drive stores this app password encrypted at rest using AES-256-GCM and never has access to your main Koofr login password.
                  </p>
                </div>

                {/* MEGA, Box, pCloud, Dropbox */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-purple-600" />
                    MEGA, Box, pCloud &amp; Dropbox
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-xs">
                    Box, pCloud, and Dropbox authenticate using standard OAuth 2.0 PKCE. MEGA credentials are encrypted at rest with AES-256-GCM. All single-file uploads and downloads stream directly between your browser and their respective official endpoints.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4: Data Retention & Account Deletion */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                4. Data Retention &amp; User Deletion Rights (GDPR &amp; CCPA)
              </h2>
              <p className="text-xs sm:text-sm">
                You retain complete ownership and control over your data:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
                <li>
                  <strong>Unlinking Providers:</strong> You can disconnect any cloud provider at any time from your dashboard. Using our <em>Smart Unlink</em> feature, stored OAuth tokens and database indices are permanently removed from Fuze Drive servers, while your files remain safely stored in your cloud provider account.
                </li>
                <li>
                  <strong>Permanent Account Deletion:</strong> You can permanently delete your Fuze Drive account anytime from <strong>Settings &rarr; Delete Account</strong>. This immediately purges your user profile, sessions, OAuth tokens, and virtual directory records from our database.
                </li>
              </ul>
            </section>

            {/* Section 5: Security Architecture */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                5. Security Measures
              </h2>
              <p className="text-xs sm:text-sm">
                Fuze Drive employs multiple defense-in-depth security measures:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>HTTPS with minimum TLS 1.2+ encryption for all data in transit.</li>
                <li>AES-256-GCM encryption at rest for all third-party credentials.</li>
                <li>HTTP-only, SameSite=Lax, Secure session cookies.</li>
                <li>Cross-user account collision protection blocking simultaneous multi-user claims on the same cloud account email.</li>
              </ul>
            </section>

            {/* Section 6: Contact */}
            <section className="space-y-2 pt-4 border-t border-slate-100">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                6. Questions &amp; Contact
              </h2>
              <p className="text-xs sm:text-sm">
                If you have questions about this Privacy Policy or wish to inspect the open-source implementation, visit our public GitHub repository at <a href="https://github.com/CodeItAftab/fuze" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold">github.com/CodeItAftab/fuze</a> or contact the maintainer at <code>aftabalamdlm@gmail.com</code>.
              </p>
            </section>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}

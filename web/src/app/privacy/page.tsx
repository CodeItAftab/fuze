import Link from "next/link";
import { FuzeLogo } from "@/components/brand/FuzeLogo";
import { ShieldCheck, ArrowLeft, Lock, FileText, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Fuze Storage",
  description: "Privacy Policy and Google API Services User Data Policy compliance statement for Fuze Storage.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "October 14, 2026";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <FuzeLogo height={28} />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-12 shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-4">
            <ShieldCheck className="h-3.5 w-3.5" /> Privacy & Security Commitment
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-400 mt-2 mb-8">
            Last Updated: {lastUpdated}
          </p>

          <div className="space-y-8 text-sm sm:text-base text-slate-600 leading-relaxed">
            <section>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">
                1. Introduction
              </h2>
              <p>
                Fuze Storage (&quot;Fuze&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is an open-source multi-cloud storage aggregator designed to empower users to unify their personal free cloud storage quotas into a single virtual drive. We are committed to absolute transparency and data privacy.
              </p>
            </section>

            <section className="bg-blue-50/60 border border-blue-200/70 rounded-2xl p-5 sm:p-6 text-slate-700">
              <h2 className="text-base sm:text-lg font-bold text-blue-950 mb-2 flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-600" />
                Zero-Proxy Architecture Guarantee
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Fuze employs a client-side streaming architecture. Your files, documents, photos, and video data stream directly between your web browser and the connected cloud storage providers (Google Drive, Microsoft OneDrive, Dropbox, Box, pCloud). <strong>Fuze servers never proxy, download, inspect, or store your raw file contents.</strong>
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">
                2. Information We Collect
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Account Information:</strong> When you register an account with Fuze, we collect your email address and an Argon2id-hashed representation of your password.
                </li>
                <li>
                  <strong>Connected Provider Tokens:</strong> When you connect a third-party cloud provider via OAuth 2.0, we store encrypted access and refresh tokens strictly to facilitate storage operations on your behalf. All tokens are encrypted at rest using AES-256.
                </li>
                <li>
                  <strong>File Metadata:</strong> We store virtual file hierarchy metadata (file names, sizes, MIME types, and chunk locations) in our database to render your virtual folder directory in the application.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">
                3. Google API Services User Data Policy Compliance
              </h2>
              <p className="mb-3">
                Fuze&apos;s use and transfer of information received from Google APIs adheres to the{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Google API Services User Data Policy
                </a>
                , including the Limited Use requirements:
              </p>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-1" />
                  <span>
                    <strong>Requested Scopes:</strong> Fuze only requests the non-sensitive <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">https://www.googleapis.com/auth/drive.file</code> scope. We do not request or possess access to existing files in your Google Drive that were not created or opened by Fuze.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-1" />
                  <span>
                    <strong>No Third-Party Sharing:</strong> We do not sell, rent, or transfer Google user data to any external parties, advertisers, or data brokers.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-1" />
                  <span>
                    <strong>No AI/ML Training:</strong> Google user data and file contents are never used to train generalized artificial intelligence or machine learning models.
                  </span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">
                4. User Rights and Data Deletion
              </h2>
              <p className="mb-2">
                You retain complete ownership of your data at all times:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  You can disconnect Google Drive or any other cloud provider at any time from the Fuze Storage Settings dashboard, which immediately revokes and purges the stored OAuth tokens.
                </li>
                <li>
                  You may also revoke Fuze&apos;s access directly at{" "}
                  <a
                    href="https://myaccount.google.com/permissions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Google Account Security Settings
                  </a>
                  .
                </li>
                <li>
                  You can request complete deletion of your account and metadata by contacting us.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">
                5. Contact Us
              </h2>
              <p>
                If you have questions regarding this Privacy Policy or our security practices, please contact us at:{" "}
                <a
                  href="mailto:aftabalam01072004@gmail.com"
                  className="text-blue-600 hover:underline font-medium"
                >
                  aftabalam01072004@gmail.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

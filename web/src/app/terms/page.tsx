import Link from "next/link";
import { FuzeLogo } from "@/components/brand/FuzeLogo";
import { FileText, ArrowLeft, Shield } from "lucide-react";

export const metadata = {
  title: "Terms of Service | Fuze Storage",
  description: "Terms of Service and conditions for using the Fuze multi-cloud storage platform.",
};

export default function TermsOfServicePage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold mb-4">
            <FileText className="h-3.5 w-3.5" /> Terms and Conditions
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs text-slate-400 mt-2 mb-8">
            Last Updated: {lastUpdated}
          </p>

          <div className="space-y-8 text-sm sm:text-base text-slate-600 leading-relaxed">
            <section>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing or using the Fuze platform (&quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service. Fuze is released under the MIT Open Source License.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">
                2. Nature of the Service
              </h2>
              <p>
                Fuze is a unified multi-cloud client interface. Fuze provides software tools allowing users to connect their own independent cloud storage accounts (such as Google Drive, OneDrive, Dropbox, Box, and pCloud). Fuze does not provide standalone server storage; rather, it coordinates storage across your connected accounts.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">
                3. User Responsibilities & Acceptable Use
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  You are responsible for maintaining the confidentiality of your account credentials.
                </li>
                <li>
                  You agree to comply with the terms of service and acceptable use policies of all third-party storage providers you connect to Fuze.
                </li>
                <li>
                  You may not use the Service to upload, store, or distribute malicious software, unlawful content, or material that infringes intellectual property rights.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">
                4. Third-Party Services & APIs
              </h2>
              <p>
                The Service integrates with third-party APIs (including Google API Services, Microsoft Graph, Dropbox API, Box API, and pCloud API). Fuze is not responsible for provider outages, changes to provider quota limits, or modifications to third-party API availability.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">
                5. Disclaimer of Warranties
              </h2>
              <p>
                The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, whether express or implied.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">
                6. Contact
              </h2>
              <p>
                For questions regarding these Terms, please contact us at:{" "}
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

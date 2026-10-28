import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { FileText, Shield, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { TOTAL_FREE_STORAGE_GB } from "@/lib/facts";

export const metadata: Metadata = {
  title: "Terms of Service | Fuze Drive",
  description:
    "Terms of Service and conditions for using the Fuze Drive open-source multi-cloud storage platform.",
  alternates: {
    canonical: "https://fuzedrive.tech/terms",
  },
};

export default function TermsOfServicePage() {
  const lastUpdated = "October 28, 2026";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased flex flex-col justify-between">
      <MarketingHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <Link href="/" className="hover:text-blue-600 transition">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Terms of Service</span>
        </nav>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-12 shadow-sm space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold mb-4">
              <FileText className="h-3.5 w-3.5" /> Terms and Conditions of Use
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Terms of Service
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
              <Clock className="h-3.5 w-3.5" />
              <span>Last Updated: {lastUpdated}</span>
            </div>
          </div>

          <div className="space-y-8 text-sm sm:text-base text-slate-600 leading-relaxed border-t border-slate-100 pt-6">
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing or using the Fuze Drive platform (&quot;Service&quot;, &quot;we&quot;, &quot;us&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please discontinue use of the Service. The software is released under the permissive MIT Open Source License.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                2. Nature of the Service
              </h2>
              <p>
                Fuze Drive is a unified client aggregation interface. We provide software tools allowing users to connect their own independent consumer cloud storage accounts (including <strong>Google Drive, MEGA, Box, pCloud, Koofr, Microsoft OneDrive, and Dropbox</strong>) to pool up to {TOTAL_FREE_STORAGE_GB} GB of free capacity into a single virtual directory.
              </p>
              <p>
                Fuze Drive does not act as an independent cloud hosting provider; instead, it coordinates storage across your authenticated third-party accounts using client-side direct streaming.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                3. User Responsibilities &amp; Acceptable Use
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
                <li>
                  <strong>Third-Party Compliance:</strong> You agree to comply with the terms of service of each connected third-party cloud provider (e.g., Google Terms of Service, Microsoft Services Agreement, Box Terms).
                </li>
                <li>
                  <strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your Fuze Drive account login credentials and any generated app passwords.
                </li>
                <li>
                  <strong>Prohibited Activities:</strong> You may not use Fuze Drive to distribute malicious software, violate copyright or intellectual property rights, or engage in unlawful activities.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                4. Third-Party Trademarks &amp; Services
              </h2>
              <p className="text-xs sm:text-sm">
                Google Drive, Microsoft OneDrive, Dropbox, Box, pCloud, MEGA, Koofr, MultCloud, and other product names or trademarks referenced within this service are the property of their respective owners. Fuze Drive is an independent open-source project and is not affiliated with, endorsed by, or sponsored by these third-party companies.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                5. Disclaimer of Warranties (MIT License)
              </h2>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-700 leading-relaxed">
                THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                6. Termination &amp; Account Purge
              </h2>
              <p className="text-xs sm:text-sm">
                You may terminate your account at any time through <strong>Settings &rarr; Delete Account</strong>. Upon deletion, all user sessions, stored tokens, and virtual indexing records are permanently erased from our database.
              </p>
            </section>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}

import Link from "next/link";
import { FuzeLogo } from "@/components/brand/FuzeLogo";
import {
  ShieldCheck,
  ArrowLeft,
  Lock,
  FileText,
  CheckCircle2,
  HardDrive,
  Cloud,
} from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Fuze Drive",
  description:
    "Comprehensive Privacy Policy and Third-Party API compliance statement for Google Drive, Microsoft OneDrive, Dropbox, Box, and pCloud.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "October 15, 2026";

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
            {/* Section 1 */}
            <section>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">
                1. Introduction
              </h2>
              <p>
                Fuze Drive (&quot;Fuze Drive&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is an open-source multi-cloud storage aggregator designed to empower users to unify their personal free cloud storage quotas into a single virtual drive. We support integration with multiple third-party storage providers, including <strong>Google Drive, Microsoft OneDrive, Dropbox, Box, and pCloud</strong>, as well as community-authored open-source connectors.
              </p>
            </section>

            {/* Architecture Guarantee */}
            <section className="bg-blue-50/60 border border-blue-200/70 rounded-2xl p-5 sm:p-6 text-slate-700">
              <h2 className="text-base sm:text-lg font-bold text-blue-950 mb-2 flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-600" />
                Zero-Proxy Architecture Guarantee (All Providers)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Fuze employs a client-side streaming architecture. Your files, documents, photos, and video data stream directly between your web browser and the connected cloud storage providers. <strong>Fuze servers never proxy, download, inspect, or store your raw file contents.</strong> All chunking, reassembly, and Merkle root cryptographic integrity checks occur locally within your browser.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">
                2. Information We Collect
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Account Credentials:</strong> When you register an account with Fuze, we collect your email address and an Argon2id-hashed representation of your password.
                </li>
                <li>
                  <strong>OAuth 2.0 Access & Refresh Tokens:</strong> When you link your cloud accounts, we store securely encrypted OAuth 2.0 credentials using AES-256 encryption at rest. These tokens are used solely to authenticate API requests to manage files and retrieve storage quota information on your behalf.
                </li>
                <li>
                  <strong>Virtual File Metadata:</strong> We store virtual file system metadata (file names, sizes, MIME types, folder paths, and provider chunk maps) in our PostgreSQL database to render your virtual folder directory inside the application.
                </li>
              </ul>
            </section>

            {/* Section 3: Comprehensive Provider Breakdown */}
            <section>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">
                3. Third-Party Cloud Providers & Platform Compliance
              </h2>
              <p className="mb-4">
                Fuze connects to multiple storage backends via their official REST APIs. Below is the breakdown of how each provider&apos;s data is handled:
              </p>

              <div className="space-y-4">
                {/* 3.1 Google Drive */}
                <div className="border border-slate-200 rounded-2xl p-4 sm:p-5 bg-slate-50/50">
                  <h3 className="font-bold text-slate-900 text-base mb-1.5 flex items-center gap-2">
                    <Cloud className="h-4 w-4 text-blue-600" />
                    3.1 Google Drive & Google API Services User Data Policy
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mb-2">
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
                  <ul className="text-xs sm:text-sm text-slate-600 space-y-1.5 pl-4 list-disc">
                    <li>
                      <strong>Scope Requested:</strong> We only request <code className="bg-slate-200/80 text-slate-800 px-1 py-0.5 rounded font-mono text-[11px]">https://www.googleapis.com/auth/drive.file</code>. This non-sensitive scope limits Fuze to only reading, modifying, and deleting files that Fuze itself created or that you explicitly open with Fuze. We never access your other Google Drive files.
                    </li>
                    <li>
                      <strong>No Third-Party Sharing:</strong> Google user data is never shared, sold, or transferred to third parties or advertising platforms.
                    </li>
                    <li>
                      <strong>No AI Model Training:</strong> Google user data is never used to train generalized machine learning or artificial intelligence models.
                    </li>
                  </ul>
                </div>

                {/* 3.2 Microsoft OneDrive */}
                <div className="border border-slate-200 rounded-2xl p-4 sm:p-5 bg-slate-50/50">
                  <h3 className="font-bold text-slate-900 text-base mb-1.5 flex items-center gap-2">
                    <Cloud className="h-4 w-4 text-sky-600" />
                    3.2 Microsoft OneDrive (Microsoft Graph API)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600">
                    Fuze requests standard delegated scopes (<code className="bg-slate-200/80 text-slate-800 px-1 py-0.5 rounded font-mono text-[11px]">Files.ReadWrite</code> and <code className="bg-slate-200/80 text-slate-800 px-1 py-0.5 rounded font-mono text-[11px]">offline_access</code>) through the Microsoft identity platform to upload and retrieve file chunks and monitor quota consumption. Microsoft user data is never shared or inspected.
                  </p>
                </div>

                {/* 3.3 Dropbox */}
                <div className="border border-slate-200 rounded-2xl p-4 sm:p-5 bg-slate-50/50">
                  <h3 className="font-bold text-slate-900 text-base mb-1.5 flex items-center gap-2">
                    <Cloud className="h-4 w-4 text-blue-700" />
                    3.3 Dropbox (Dropbox API v2)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600">
                    Fuze interacts with Dropbox using OAuth 2.0 PKCE / token authorization (<code className="bg-slate-200/80 text-slate-800 px-1 py-0.5 rounded font-mono text-[11px]">files.content.write</code>, <code className="bg-slate-200/80 text-slate-800 px-1 py-0.5 rounded font-mono text-[11px]">files.content.read</code>, and <code className="bg-slate-200/80 text-slate-800 px-1 py-0.5 rounded font-mono text-[11px]">files.metadata.read</code>) to manage dedicated storage chunks.
                  </p>
                </div>

                {/* 3.4 Box */}
                <div className="border border-slate-200 rounded-2xl p-4 sm:p-5 bg-slate-50/50">
                  <h3 className="font-bold text-slate-900 text-base mb-1.5 flex items-center gap-2">
                    <Cloud className="h-4 w-4 text-blue-500" />
                    3.4 Box (Box Platform API)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600">
                    Fuze uses Box OAuth 2.0 User Authentication with read and write permissions on Box folders. All file transfers occur over direct client upload sessions.
                  </p>
                </div>

                {/* 3.5 pCloud */}
                <div className="border border-slate-200 rounded-2xl p-4 sm:p-5 bg-slate-50/50">
                  <h3 className="font-bold text-slate-900 text-base mb-1.5 flex items-center gap-2">
                    <Cloud className="h-4 w-4 text-cyan-600" />
                    3.5 pCloud (pCloud REST API)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600">
                    Fuze connects to pCloud via its global and European endpoints using OAuth 2.0 to stream chunks directly to your authenticated pCloud storage drive.
                  </p>
                </div>

                {/* 3.6 Future & Community Connectors */}
                <div className="border border-slate-200 rounded-2xl p-4 sm:p-5 bg-slate-50/50">
                  <h3 className="font-bold text-slate-900 text-base mb-1.5 flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-purple-600" />
                    3.6 Community & Future Storage Connectors
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600">
                    All upcoming and community-built connectors (e.g. Mega, MediaFire, Nextcloud, WebDAV, Proton Drive) must adhere to our strict zero-proxy architecture and open-source audit standards.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">
                4. User Rights, Token Revocation & Data Deletion
              </h2>
              <p className="mb-3">
                You retain complete ownership and control of your accounts and stored files:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>One-Click Disconnection:</strong> You can disconnect any cloud provider at any time from your Fuze Settings dashboard. Disconnecting a provider immediately purges all associated encrypted access and refresh tokens from our database.
                </li>
                <li>
                  <strong>Provider-Side Revocation:</strong> You can revoke Fuze&apos;s API access directly from each provider&apos;s security portal:
                  <ul className="list-circle pl-5 mt-1 space-y-1 text-xs sm:text-sm">
                    <li>
                      <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Google Account Permissions
                      </a>
                    </li>
                    <li>
                      <a href="https://account.microsoft.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Microsoft Account Privacy & Apps
                      </a>
                    </li>
                    <li>
                      <a href="https://www.dropbox.com/account/connected_apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Dropbox Connected Apps
                      </a>
                    </li>
                    <li>
                      <a href="https://app.box.com/account" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Box Account Security & Authorized Apps
                      </a>
                    </li>
                    <li>
                      <a href="https://my.pcloud.com/#page=settings&tab=linkedaccounts" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        pCloud Linked Accounts
                      </a>
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>Account Deletion:</strong> If you delete your Fuze account, all user profile records, encrypted tokens, and file metadata are permanently destroyed.
                </li>
              </ul>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">
                5. Contact Us
              </h2>
              <p>
                If you have questions regarding this Privacy Policy, your connected cloud providers, or data handling, please reach out to the project maintainer:
              </p>
              <div className="mt-3 p-4 rounded-2xl bg-slate-100 border border-slate-200">
                <p className="font-semibold text-slate-900">Aftab Alam</p>
                <p className="text-xs text-slate-500 mt-0.5">Project Lead & Maintainer</p>
                <p className="text-xs text-slate-700 mt-1">
                  Email:{" "}
                  <a
                    href="mailto:privacy@fuzedrive.tech"
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    privacy@fuzedrive.tech
                  </a>{" "}
                  or{" "}
                  <a
                    href="mailto:support@fuzedrive.tech"
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    support@fuzedrive.tech
                  </a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

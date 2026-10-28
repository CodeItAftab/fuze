import { ExternalLink } from "lucide-react";
import { GithubIcon } from "@/components/icons/GithubIcon";
import { TOTAL_FREE_STORAGE_GB } from "@/lib/facts";

const GITHUB_OWNER_URL = "https://github.com/CodeItAftab";

export function AboutSection() {
  return (
    <section id="about" className="py-20 px-4 sm:px-6 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1.5 block">
          Our Story &amp; Vision
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
          Why We Built Fuze Drive
        </h2>
      </div>

      <div className="prose prose-slate max-w-none text-slate-600 text-sm sm:text-base leading-relaxed space-y-5">
        <p>
          Almost every major cloud provider offers a consumer free tier: MEGA provides 20 GB, Google Drive provides 15 GB, Box provides 10 GB, Koofr provides 10 GB, pCloud provides up to 10 GB, OneDrive provides 5 GB, and Dropbox provides 2 GB. Together, that represents{" "}
          <strong>up to {TOTAL_FREE_STORAGE_GB} gigabytes of personal cloud storage</strong> across accounts you may already own.
        </p>
        <p>
          However, juggling 7 separate web apps, mobile clients, and logins creates friction. Traditional commercial tools often focus on enterprise migrations or charge ongoing monthly subscriptions with server-side transfer meters.
        </p>
        <p>
          We built <strong>Fuze Drive</strong> as an independent open-source project to solve this: a unified virtual directory that lets you manage your personal storage pool from one clean interface using direct browser-to-cloud streaming.
        </p>
      </div>

      <div className="mt-10 p-5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            CA
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm">
              Aftab Alam (CodeItAftab)
            </div>
            <div className="text-xs text-slate-500">
              Project Creator &amp; Maintainer
            </div>
          </div>
        </div>
        <a
          href={GITHUB_OWNER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
        >
          <span>View GitHub Profile</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </section>
  );
}

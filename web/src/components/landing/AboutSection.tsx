import { ExternalLink } from "lucide-react";
import { GithubIcon } from "@/components/icons/GithubIcon";

const GITHUB_OWNER_URL = "https://github.com/CodeItAftab";

export function AboutSection() {
  return (
    <section id="about" className="py-20 px-4 sm:px-6 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1.5 block">
          Our Story &amp; Vision
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
          Why We Built Fuze
        </h2>
      </div>

      <div className="prose prose-slate max-w-none text-slate-600 text-sm sm:text-base leading-relaxed space-y-5">
        <p>
          Almost every major cloud company gives you free storage: Google Drive gives 15 GB, Box gives 10 GB, pCloud gives 10 GB, OneDrive gives 5 GB, and Dropbox gives 2 GB. Together, that is{" "}
          <strong>over 42 gigabytes of high-performance cloud storage</strong> that you already own.
        </p>
        <p>
          However, managing 5 different apps, logins, and upload UIs is a nightmare. Commercial cloud managers charge $10 to $20 every month, and worse—they proxy your sensitive files through their own private servers, introducing security vulnerabilities and bandwidth caps.
        </p>
        <p>
          <strong>Fuze</strong> was engineered from the ground up to solve this permanently. By leveraging browser-to-cloud resumable upload sessions, Fuze eliminates the middleman entirely. Your files stream directly to provider infrastructure, your metadata remains clean and organized, and you enjoy an enterprise-grade cloud drive completely free of cost.
        </p>
      </div>

      <div className="mt-10 p-5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            CA
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm">
              Aftab (CodeItAftab)
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
          <GithubIcon className="h-4 w-4" />
          <span>GitHub Profile</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </section>
  );
}

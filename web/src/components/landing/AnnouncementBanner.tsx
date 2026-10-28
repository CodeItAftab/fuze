import { Sparkles } from "lucide-react";
import { GithubIcon } from "@/components/icons/GithubIcon";

const GITHUB_REPO_URL = "https://github.com/CodeItAftab/fuze";

export function AnnouncementBanner() {
  return (
    <aside
      aria-label="Open Source Announcement"
      className="hidden sm:block bg-slate-900 text-slate-200 text-xs py-2 px-4 text-center font-medium border-b border-slate-800"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold text-[11px] border border-blue-500/30">
          <Sparkles className="h-3 w-3" /> Fuze Drive Open Source (v1.0)
        </span>
        <span>
          Zero-proxy personal cloud storage with direct browser-to-cloud streams.
        </span>
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 underline underline-offset-2 font-semibold transition"
        >
          <GithubIcon className="h-3.5 w-3.5 inline" />
          Star on GitHub &rarr;
        </a>
      </div>
    </aside>
  );
}

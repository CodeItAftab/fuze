import {
  Users,
  Cloud,
  ShieldCheck,
  Layers,
  Zap,
  ExternalLink,
  GitPullRequest,
  ArrowRight,
} from "lucide-react";
import { GithubIcon } from "@/components/icons/GithubIcon";
import { TOTAL_FREE_STORAGE_GB } from "@/lib/facts";

const GITHUB_REPO_URL = "https://github.com/CodeItAftab/fuze";

export function OpenSourceSection() {
  return (
    <section
      id="open-source"
      className="py-20 px-4 sm:px-6 bg-slate-900 text-white relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
            <Users className="h-3.5 w-3.5" /> Call for Open Source Collaborators
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Build With Us: Help Add More Free Cloud Adapters
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
            Fuze Drive is 100% community-driven and MIT licensed. We recently expanded our storage pool to {TOTAL_FREE_STORAGE_GB} GB across 7 clouds—and we invite you to collaborate with us to reach 100+ GB! Help us author connectors for more consumer and self-hosted clouds:
          </p>
        </div>

        {/* Collaboration Opportunities */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10 sm:mb-12">
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 sm:p-5 hover:border-blue-500/50 transition">
            <div className="flex items-center justify-between mb-3.5">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Cloud className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Help Build
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">
              MediaFire &amp; InfiniCLOUD
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Help author adapters for MediaFire (10 GB free) and InfiniCLOUD (20 GB WebDAV) using our typed <code>base.adapter.ts</code>.
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 sm:p-5 hover:border-emerald-500/50 transition">
            <div className="flex items-center justify-between mb-3.5">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Help Build
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">
              Proton Drive &amp; Icedrive
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Collaborate on adding privacy-first Swiss and EU free cloud providers (Proton 5 GB, Icedrive 10 GB) with client-side streaming.
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 sm:p-5 hover:border-purple-500/50 transition">
            <div className="flex items-center justify-between mb-3.5">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Layers className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Help Build
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">
              Nextcloud &amp; MinIO
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Want to mount your own private server? Help author self-hosted connectors for Nextcloud, MinIO, or S3-compatible endpoints.
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 sm:p-5 hover:border-amber-500/50 transition">
            <div className="flex items-center justify-between mb-3.5">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Zap className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Collaborate
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">
              Engine &amp; Performance
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Optimize multi-stream browser transfer speeds, improve mobile touch UX, fix bugs, or suggest architectural enhancements.
            </p>
          </div>
        </div>

        {/* GitHub Callout Card */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-700/80 bg-linear-to-b from-slate-800/90 via-slate-800/60 to-slate-900/95 p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
          <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4 sm:gap-4.5 max-w-2xl min-w-0">
              <div className="h-12 w-12 sm:h-13 sm:w-13 rounded-2xl bg-slate-950/90 border border-slate-700/80 text-white flex items-center justify-center shrink-0 shadow-lg shadow-black/40">
                <GithubIcon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Ready to Build an Adapter With Us?
                  </h3>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <GitPullRequest className="h-3 w-3" /> PRs Welcome
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                  Fork <code className="text-blue-300">CodeItAftab/fuze</code>, check out our existing adapters in <code className="text-blue-300">server/src/adapters/</code>, and submit a pull request.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto shrink-0">
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition shadow-md shadow-blue-500/20 active:scale-95"
              >
                <span>Contribute on GitHub</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

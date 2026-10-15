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
            Fuze is 100% community-driven and MIT licensed. We want to expand our free storage pool from 42 GB to 100+ GB—and we invite you to collaborate with us! Whether you are an experienced TypeScript developer or a first-time contributor, help us build connectors for the world&apos;s best free clouds:
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
              Mega &amp; MediaFire Adapters
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Help us write connectors for Mega.nz (20 GB free) and MediaFire (10 GB free) using our typed <code>base.adapter.ts</code>.
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
              Proton Drive &amp; IceDrive
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Collaborate on adding privacy-first Swiss and EU free cloud providers (Proton 5 GB, IceDrive 10 GB) with client-side safety.
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
              Nextcloud, WebDAV &amp; MinIO
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Want to mount your own private server? Help us author self-hosted connectors for Nextcloud, MinIO, or S3-compatible buckets.
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
              Engine &amp; Chunk Optimizations
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Optimize multi-stream browser transfer speeds, improve mobile accessibility, fix bugs, or suggest architectural enhancements.
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
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Open Source &amp; Active
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                  Every adapter in Fuze Drive is an isolated TypeScript class implementing{" "}
                  <a
                    href={`${GITHUB_REPO_URL}/blob/main/server/src/adapters/base.adapter.ts`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-200 font-mono text-[11px] sm:text-xs bg-slate-950/70 hover:bg-slate-950 px-1.5 py-0.5 rounded border border-slate-700/80 hover:border-blue-500/40 transition"
                    title="Inspect base.adapter.ts on GitHub"
                  >
                    <code>base.adapter.ts</code>
                    <ExternalLink className="h-2.5 w-2.5 text-blue-400" />
                  </a>
                  . Fork the repository, plug in a new free provider, and open a PR!
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0">
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-semibold text-xs tracking-tight shadow-md hover:shadow-lg transition-all active:scale-95 shrink-0 whitespace-nowrap"
              >
                <GithubIcon className="h-4 w-4 text-slate-950" />
                <span>Fork &amp; Star on GitHub</span>
              </a>

              <a
                href={`${GITHUB_REPO_URL}/issues`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-600/80 hover:border-slate-500 font-medium text-xs tracking-tight shadow-sm transition-all active:scale-95 shrink-0 whitespace-nowrap"
              >
                <GitPullRequest className="h-4 w-4 text-emerald-400" />
                <span>View Adapter Issues</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

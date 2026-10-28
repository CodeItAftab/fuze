import Link from "next/link";
import { ArrowRight, BookOpen, Home } from "lucide-react";

interface RelatedGuidesProps {
  currentPath?: string;
  currentGuideHref?: string;
}

const ALL_GUIDES = [
  {
    path: "/guides/connect-cloud-providers",
    title: "How to Add Each Cloud Provider",
    description: "Step-by-step setup for Koofr WebDAV app passwords, MEGA, Box, pCloud, and Google Drive.",
  },
  {
    path: "/guides/combine-google-drive-onedrive-dropbox",
    title: "Combine Google Drive, OneDrive & Dropbox",
    description: "Step-by-step tutorial to unify up to 72 GB of free cloud accounts into one personal drive.",
  },
  {
    path: "/guides/free-cloud-storage-comparison-2026",
    title: "Best Free Cloud Storage Ranked (2026)",
    description: "Speed, quota, and limit benchmark across Google Drive, MEGA, Box, pCloud, Koofr, and OneDrive.",
  },
  {
    path: "/guides/open-source-cloud-storage-aggregator",
    title: "Open-Source Storage Aggregator Architecture",
    description: "Deep dive into zero-proxy client streaming, Merkle trees, and direct cloud REST APIs.",
  },
  {
    path: "/compare/multcloud-alternative",
    title: "MultCloud Alternative Overview",
    description: "Neutral architectural comparison between server-side aggregators and direct browser streaming.",
  },
];

export function RelatedGuides({ currentPath, currentGuideHref }: RelatedGuidesProps) {
  const activePath = currentPath || currentGuideHref || "";
  const otherGuides = ALL_GUIDES.filter((g) => g.path !== activePath);

  return (
    <section className="mt-12 pt-10 border-t border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Related Guides &amp; Comparisons
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Explore more resources, architectural guides, and step-by-step tutorials.
          </p>
        </div>
        <Link
          href="/"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
        >
          <Home className="h-3.5 w-3.5" />
          <span>Back to Homepage</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {otherGuides.slice(0, 3).map((guide) => (
          <Link
            key={guide.path}
            href={guide.path}
            className="group p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-xs transition flex flex-col justify-between"
          >
            <div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug">
                {guide.title}
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                {guide.description}
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-600 group-hover:text-blue-700">
              <span>Read guide</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 text-center sm:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
        >
          <Home className="h-3.5 w-3.5" />
          <span>Return to Fuze Drive Homepage</span>
        </Link>
      </div>
    </section>
  );
}

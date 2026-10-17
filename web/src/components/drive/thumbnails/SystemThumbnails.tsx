import React from "react";
import {
  Terminal,
  FolderKanban,
  Archive,
  Database,
  Box,
  Palette,
  Type,
  Disc,
  Key,
  FileBox,
} from "lucide-react";
import { ThumbnailCard } from "./ThumbnailCard";

export function ExecutableThumbnail({ ext }: { ext: string }) {
  const label =
    ext === "APK"
      ? "Android App"
      : ext === "DMG" || ext === "PKG"
      ? "macOS App"
      : "Executable";

  return (
    <ThumbnailCard
      ext={ext}
      theme="dark"
      containerBg="bg-violet-50/50"
      containerHoverBg="group-hover:bg-violet-50/80"
      cardBg="bg-slate-950"
      cardBorder="border-violet-900/50"
      badgeColor="bg-violet-950 text-violet-300"
      badgeBorder="border border-violet-800/60"
      headerIcon={<Terminal className="w-3.5 h-3.5 text-violet-400" />}
      footerLabel={label}
      footerColor="text-violet-400"
    >
      <div className="w-full space-y-1.5 my-auto px-1">
        <div className="flex items-center gap-1 font-mono text-[9px] text-violet-400 font-bold">
          <span>&gt;_</span>
          <span className="inline-block w-1.5 h-3 bg-violet-400 animate-pulse" />
        </div>
        <div className="space-y-1">
          <div className="h-1 bg-violet-500/70 rounded-full w-4/5" />
          <div className="h-1 bg-violet-400/40 rounded-full w-3/5" />
        </div>
      </div>
    </ThumbnailCard>
  );
}

export function ProjectPlanThumbnail({ ext }: { ext: string }) {
  return (
    <ThumbnailCard
      ext={ext}
      badgeColor="bg-teal-600 text-white"
      containerBg="bg-teal-50/50"
      containerHoverBg="group-hover:bg-teal-50/80"
      cardBorder="border-teal-200/80"
      headerIcon={<FolderKanban className="w-4 h-4 text-teal-600" />}
      footerLabel={ext.startsWith("V") ? "Diagram" : "Project Plan"}
      footerColor="text-teal-700"
    >
      <div className="w-full space-y-1.5 my-auto px-1">
        <div className="w-full bg-teal-50 rounded p-1 space-y-1 border border-teal-200/60">
          <div className="h-1 bg-teal-500 rounded-full w-3/4" />
          <div className="h-1 bg-teal-400 rounded-full w-1/2 ml-2" />
          <div className="h-1 bg-teal-600 rounded-full w-2/3 ml-1" />
        </div>
      </div>
    </ThumbnailCard>
  );
}

export function ArchiveThumbnail({ ext }: { ext: string }) {
  return (
    <ThumbnailCard
      ext={ext}
      badgeColor="bg-amber-600 text-white"
      containerBg="bg-amber-50/50"
      containerHoverBg="group-hover:bg-amber-50/80"
      cardBorder="border-amber-200/80"
      headerIcon={<Archive className="w-4 h-4 text-amber-600" />}
      footerLabel="Archive"
      footerColor="text-amber-700"
    >
      <div className="flex items-center justify-center my-auto">
        <Archive className="w-7 h-7 text-amber-500" />
      </div>
    </ThumbnailCard>
  );
}

export function DatabaseThumbnail({ ext }: { ext: string }) {
  return (
    <ThumbnailCard
      ext={ext}
      badgeColor="bg-emerald-600 text-white"
      containerBg="bg-emerald-50/50"
      containerHoverBg="group-hover:bg-emerald-50/80"
      cardBorder="border-emerald-200/80"
      headerIcon={<Database className="w-4 h-4 text-emerald-600" />}
      footerLabel="Database"
      footerColor="text-emerald-700"
    >
      <div className="flex flex-col items-center justify-center gap-1 my-auto">
        <div className="w-10 h-2.5 rounded-full border border-emerald-500 bg-emerald-100" />
        <div className="w-10 h-2.5 rounded-full border border-emerald-500 bg-emerald-100 -mt-1" />
        <div className="w-10 h-2.5 rounded-full border border-emerald-500 bg-emerald-200 -mt-1" />
      </div>
    </ThumbnailCard>
  );
}

export function ThreeDThumbnail({ ext }: { ext: string }) {
  return (
    <ThumbnailCard
      ext={ext}
      badgeColor="bg-sky-600 text-white"
      containerBg="bg-sky-50/50"
      containerHoverBg="group-hover:bg-sky-50/80"
      cardBorder="border-sky-200/80"
      headerIcon={<Box className="w-4 h-4 text-sky-600" />}
      footerLabel="3D / CAD"
      footerColor="text-sky-700"
    >
      <div className="flex items-center justify-center my-auto">
        <Box className="w-7 h-7 text-sky-500" />
      </div>
    </ThumbnailCard>
  );
}

export function DesignThumbnail({ ext }: { ext: string }) {
  return (
    <ThumbnailCard
      ext={ext}
      badgeColor="bg-pink-600 text-white"
      containerBg="bg-pink-50/50"
      containerHoverBg="group-hover:bg-pink-50/80"
      cardBorder="border-pink-200/80"
      headerIcon={<Palette className="w-4 h-4 text-pink-600" />}
      footerLabel="Design"
      footerColor="text-pink-700"
    >
      <div className="flex items-center justify-center my-auto">
        <Palette className="w-7 h-7 text-pink-500" />
      </div>
    </ThumbnailCard>
  );
}

export function FontThumbnail({ ext }: { ext: string }) {
  return (
    <ThumbnailCard
      ext={ext}
      badgeColor="bg-rose-600 text-white"
      containerBg="bg-rose-50/50"
      containerHoverBg="group-hover:bg-rose-50/80"
      cardBorder="border-rose-200/80"
      headerIcon={<Type className="w-4 h-4 text-rose-600" />}
      footerLabel="Font"
      footerColor="text-rose-700"
    >
      <div className="flex items-center justify-center my-auto">
        <span className="text-xl font-serif font-black text-rose-600 tracking-tight">
          Aa
        </span>
      </div>
    </ThumbnailCard>
  );
}

export function DiskImageThumbnail({ ext }: { ext: string }) {
  return (
    <ThumbnailCard
      ext={ext}
      badgeColor="bg-cyan-600 text-white"
      containerBg="bg-cyan-50/50"
      containerHoverBg="group-hover:bg-cyan-50/80"
      cardBorder="border-cyan-200/80"
      headerIcon={<Disc className="w-4 h-4 text-cyan-600" />}
      footerLabel="Disk Image"
      footerColor="text-cyan-700"
    >
      <div className="flex items-center justify-center my-auto">
        <Disc className="w-7 h-7 text-cyan-500" />
      </div>
    </ThumbnailCard>
  );
}

export function CertificateThumbnail({ ext }: { ext: string }) {
  return (
    <ThumbnailCard
      ext={ext}
      badgeColor="bg-teal-600 text-white"
      containerBg="bg-teal-50/50"
      containerHoverBg="group-hover:bg-teal-50/80"
      cardBorder="border-teal-200/80"
      headerIcon={<Key className="w-4 h-4 text-teal-600" />}
      footerLabel="Security Key"
      footerColor="text-teal-700"
    >
      <div className="flex items-center justify-center my-auto">
        <Key className="w-7 h-7 text-teal-500" />
      </div>
    </ThumbnailCard>
  );
}

export function GenericThumbnail({ ext }: { ext: string }) {
  return (
    <ThumbnailCard
      ext={ext}
      badgeColor="bg-slate-100 text-slate-700"
      badgeBorder="border border-slate-200"
      containerBg="bg-slate-50/70"
      containerHoverBg="group-hover:bg-slate-100/80"
      cardBorder="border-slate-200"
      headerIcon={<FileBox className="w-4 h-4 text-slate-600" />}
      footerLabel={`${ext} File`}
      footerColor="text-slate-600"
    >
      <div className="w-full my-auto px-1 flex flex-col items-center gap-1.5">
        <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shadow-inner">
          <span className="text-[10px] font-black font-mono text-slate-700">
            {ext.slice(0, 3)}
          </span>
        </div>
        <div className="w-full space-y-0.5">
          <div className="h-0.5 bg-slate-200 rounded-full w-4/5 mx-auto" />
          <div className="h-0.5 bg-slate-100 rounded-full w-3/5 mx-auto" />
        </div>
      </div>
    </ThumbnailCard>
  );
}

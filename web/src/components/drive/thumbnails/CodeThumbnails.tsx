import React from "react";
import { ThumbnailCard } from "./ThumbnailCard";

export function CodeThumbnail({ ext }: { ext: string }) {
  return (
    <ThumbnailCard
      ext={ext}
      theme="dark"
      containerBg="bg-slate-900"
      containerHoverBg="group-hover:bg-slate-850"
      cardBg="bg-slate-950"
      cardBorder="border-slate-800"
      badgeColor="bg-slate-800 text-indigo-300"
      headerLeft={
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
        </div>
      }
      footerLabel="Source Code"
      footerColor="text-slate-500"
    >
      <div className="w-full space-y-1 my-auto px-1">
        <div className="h-1 bg-indigo-500/70 rounded-full w-1/2" />
        <div className="h-1 bg-slate-700 rounded-full w-3/4 ml-1.5" />
        <div className="h-1 bg-emerald-500/70 rounded-full w-2/3 ml-1.5" />
        <div className="h-1 bg-indigo-500/70 rounded-full w-1/3" />
      </div>
    </ThumbnailCard>
  );
}

export function MarkdownThumbnail({ ext }: { ext: string }) {
  return (
    <ThumbnailCard
      ext={ext}
      theme="dark"
      containerBg="bg-slate-900"
      containerHoverBg="group-hover:bg-slate-850"
      cardBg="bg-slate-950"
      cardBorder="border-slate-800"
      badgeColor="bg-slate-800 text-cyan-300"
      headerLeft={
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 inline-block" />
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
        </div>
      }
      footerLabel="Markdown"
      footerColor="text-cyan-400"
    >
      <div className="w-full space-y-1.5 my-auto px-1">
        <div className="h-1.5 bg-cyan-400/80 rounded-full w-3/4" />
        <div className="h-1 bg-slate-600 rounded-full w-full" />
        <div className="h-1 bg-slate-600 rounded-full w-5/6" />
        <div className="h-1 bg-slate-700 rounded-full w-2/3" />
      </div>
    </ThumbnailCard>
  );
}

import React, { useState } from "react";
import { Image as ImageIcon, Film, Play, Music } from "lucide-react";
import { VfsItem } from "@/stores/drive.store";
import { ThumbnailCard, CornerBadge } from "./ThumbnailCard";

export function ImageThumbnail({
  file,
  ext,
  apiUrl,
}: {
  file: VfsItem;
  ext: string;
  apiUrl: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (!hasError) {
    return (
      <div className="w-full h-full bg-slate-50 flex items-center justify-center relative overflow-hidden group/thumb">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${apiUrl}/files/${file.id}/thumbnail?size=large`}
          alt={file.name}
          loading="lazy"
          decoding="async"
          onError={() => setHasError(true)}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Slight border so pure white images/screenshots stand out distinctly from the card */}
        <div className="absolute inset-0 pointer-events-none rounded-lg border border-black/[0.06]" />
      </div>
    );
  }

  return (
    <ThumbnailCard
      ext={ext}
      badgeColor="bg-emerald-600 text-white"
      containerBg="bg-emerald-50/50"
      containerHoverBg="group-hover:bg-emerald-50/80"
      cardBorder="border-emerald-200/80"
      headerIcon={<ImageIcon className="w-4 h-4 text-emerald-600" />}
      footerLabel="Image"
      footerColor="text-emerald-700"
    >
      <div className="flex items-center justify-center my-auto">
        <ImageIcon className="w-7 h-7 text-emerald-500" />
      </div>
    </ThumbnailCard>
  );
}

export function VideoThumbnail({
  file,
  ext,
  apiUrl,
}: {
  file: VfsItem;
  ext: string;
  apiUrl: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (!hasError) {
    return (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center relative overflow-hidden group-hover:bg-slate-850 transition">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${apiUrl}/files/${file.id}/thumbnail?size=large`}
          alt={file.name}
          loading="lazy"
          decoding="async"
          onError={() => setHasError(true)}
          className="w-full h-full object-cover opacity-85 transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="w-11 h-11 rounded-full bg-slate-900/60 backdrop-blur-md text-white flex items-center justify-center border border-white/25 shadow-lg transition-transform duration-200 group-hover:scale-110 group-hover:bg-slate-900/80">
            <Play className="w-4 h-4 fill-white text-white ml-0.5" />
          </div>
        </div>
              </div>
    );
  }

  return (
    <ThumbnailCard
      ext={ext}
      theme="dark"
      containerBg="bg-indigo-50/50"
      containerHoverBg="group-hover:bg-indigo-50/80"
      cardBg="bg-slate-950"
      cardBorder="border-indigo-900/50"
      badgeColor="bg-indigo-950 text-indigo-300"
      badgeBorder="border border-indigo-800/60"
      headerIcon={<Film className="w-3.5 h-3.5 text-indigo-400" />}
      footerLabel="Video"
      footerColor="text-indigo-400"
    >
      <div className="flex items-center justify-center my-auto">
        <div className="w-10 h-10 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-md">
          <Play className="w-4 h-4 fill-white ml-0.5" />
        </div>
      </div>
    </ThumbnailCard>
  );
}

export function AudioThumbnail({ ext }: { ext: string }) {
  return (
    <ThumbnailCard
      ext={ext}
      badgeColor="bg-purple-600 text-white"
      containerBg="bg-purple-50/50"
      containerHoverBg="group-hover:bg-purple-50/80"
      cardBorder="border-purple-200/80"
      headerIcon={<Music className="w-4 h-4 text-purple-600" />}
      footerLabel="Audio Track"
      footerColor="text-purple-700"
    >
      <div className="flex items-end justify-center gap-1 h-7 my-auto">
        <div className="w-1 bg-purple-400 rounded-full h-3" />
        <div className="w-1 bg-purple-500 rounded-full h-5" />
        <div className="w-1 bg-purple-600 rounded-full h-7" />
        <div className="w-1 bg-purple-500 rounded-full h-4" />
        <div className="w-1 bg-purple-400 rounded-full h-2" />
      </div>
    </ThumbnailCard>
  );
}

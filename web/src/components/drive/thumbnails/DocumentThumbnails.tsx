import React from "react";
import { FileText, FileSpreadsheet, Presentation } from "lucide-react";
import { ThumbnailCard } from "./ThumbnailCard";

export function PdfThumbnail({ ext }: { ext: string }) {
  return (
    <ThumbnailCard
      ext={ext}
      badgeText="PDF"
      badgeColor="bg-rose-600 text-white"
      containerBg="bg-rose-50/50"
      containerHoverBg="group-hover:bg-rose-50/80"
      cardBorder="border-rose-200/80"
      headerIcon={<FileText className="w-4 h-4 text-rose-600" />}
      footerLabel="PDF Document"
      footerColor="text-rose-700"
    >
      <div className="w-full bg-rose-50/70 rounded p-1.5 space-y-1.5 border border-rose-200/60 my-auto">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-xs bg-rose-500" />
          <div className="h-1.5 bg-rose-400 rounded-full w-3/5" />
        </div>
        <div className="space-y-1">
          <div className="h-1 bg-rose-300/80 rounded-full w-full" />
          <div className="h-1 bg-rose-300/80 rounded-full w-4/5" />
          <div className="h-1 bg-rose-200/70 rounded-full w-3/5" />
        </div>
      </div>
    </ThumbnailCard>
  );
}

export function SpreadsheetThumbnail({ ext }: { ext: string }) {
  return (
    <ThumbnailCard
      ext={ext}
      badgeColor="bg-emerald-600 text-white"
      containerBg="bg-emerald-50/50"
      containerHoverBg="group-hover:bg-emerald-50/80"
      cardBorder="border-emerald-200/80"
      headerIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
      footerLabel="Spreadsheet"
      footerColor="text-emerald-700"
    >
      <div className="w-full bg-emerald-50/80 rounded p-1.5 space-y-1 border border-emerald-200/70 my-auto">
        <div className="grid grid-cols-3 gap-1 pb-1 border-b border-emerald-200">
          <div className="h-1.5 bg-emerald-500 rounded-xs" />
          <div className="h-1.5 bg-emerald-500 rounded-xs" />
          <div className="h-1.5 bg-emerald-500 rounded-xs" />
        </div>
        <div className="grid grid-cols-3 gap-1">
          <div className="h-1 bg-emerald-300/80 rounded-xs" />
          <div className="h-1 bg-emerald-200/80 rounded-xs" />
          <div className="h-1 bg-emerald-300/80 rounded-xs" />
        </div>
        <div className="grid grid-cols-3 gap-1">
          <div className="h-1 bg-emerald-200/80 rounded-xs" />
          <div className="h-1 bg-emerald-300/80 rounded-xs" />
          <div className="h-1 bg-emerald-200/80 rounded-xs" />
        </div>
      </div>
    </ThumbnailCard>
  );
}

export function WordDocumentThumbnail({ ext }: { ext: string }) {
  return (
    <ThumbnailCard
      ext={ext}
      badgeColor="bg-blue-600 text-white"
      containerBg="bg-blue-50/50"
      containerHoverBg="group-hover:bg-blue-50/80"
      cardBorder="border-blue-200/80"
      headerIcon={<FileText className="w-4 h-4 text-blue-600" />}
      footerLabel={ext === "TXT" ? "Text File" : "Word Document"}
      footerColor="text-blue-700"
    >
      <div className="w-full bg-blue-50/70 rounded p-1.5 space-y-1.5 border border-blue-200/60 my-auto">
        <div className="h-1.5 bg-blue-500 rounded-full w-2/3" />
        <div className="space-y-1">
          <div className="h-1 bg-blue-300/90 rounded-full w-full" />
          <div className="h-1 bg-blue-300/90 rounded-full w-5/6" />
          <div className="h-1 bg-blue-200/80 rounded-full w-3/4" />
        </div>
      </div>
    </ThumbnailCard>
  );
}

export function PresentationThumbnail({ ext }: { ext: string }) {
  return (
    <ThumbnailCard
      ext={ext}
      badgeColor="bg-orange-600 text-white"
      containerBg="bg-orange-50/50"
      containerHoverBg="group-hover:bg-orange-50/80"
      cardBorder="border-orange-200/80"
      headerIcon={<Presentation className="w-4 h-4 text-orange-600" />}
      footerLabel="Presentation"
      footerColor="text-orange-700"
    >
      <div className="w-full bg-orange-50/70 rounded p-1.5 space-y-1 border border-orange-200/60 my-auto flex flex-col items-center">
        <div className="w-full flex items-center justify-between pb-0.5 border-b border-orange-200/60">
          <div className="h-1 bg-orange-500 rounded-full w-1/2" />
          <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
        </div>
        <div className="w-full flex items-center gap-1.5 pt-0.5">
          <div className="w-5 h-4 rounded-xs bg-orange-200/80 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full border border-orange-500 border-t-transparent" />
          </div>
          <div className="space-y-0.5 flex-1">
            <div className="h-0.5 bg-orange-300 rounded-full w-full" />
            <div className="h-0.5 bg-orange-300 rounded-full w-4/5" />
          </div>
        </div>
      </div>
    </ThumbnailCard>
  );
}

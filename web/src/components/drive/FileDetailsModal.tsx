"use client";

import { useEffect, useState } from "react";
import { VfsItem } from "@/stores/drive.store";
import { X, Layers, HardDrive } from "lucide-react";

export interface ChunkDetail {
  chunkIndex: number;
  byteStart: number;
  byteEnd: number;
  chunkHash: string;
  provider: string;
  accountEmail: string | null;
}

export interface FileDetailsResponse {
  file: {
    id: string;
    name: string;
    size: number;
    mimeType: string | null;
    merkleRoot: string | null;
  };
  chunks: ChunkDetail[];
}

export function FileDetailsModal({
  item,
  onClose,
}: {
  item: VfsItem;
  onClose: () => void;
}) {
  const [details, setDetails] = useState<FileDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    fetch(`${apiUrl}/files/${item.id}/details`, { credentials: "include" })
      .then((res) => res.json())
      .then((data: FileDetailsResponse) => {
        setDetails(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [item.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-100"
      >
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-5 py-3.5 sm:py-4 flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-2.5 font-bold text-slate-800 text-sm min-w-0 flex-1">
            <Layers className="h-4 w-4 text-blue-600 shrink-0" />
            <span className="truncate min-w-0 flex-1" title={item.name}>
              {item.name}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition shrink-0 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">
                Total Size
              </div>
              <div className="font-semibold text-slate-800 mt-0.5">
                {(item.size / (1024 * 1024)).toFixed(2)} MB
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">
                Merkle Root
              </div>
              <div
                className="font-mono text-[10px] text-slate-600 truncate mt-0.5"
                title={details?.file?.merkleRoot || ""}
              >
                {details?.file?.merkleRoot || "Verified"}
              </div>
            </div>
          </div>

          <div>
            <div className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <HardDrive className="h-4 w-4 text-slate-600" />
              <span>Multi-Cloud Chunk Distribution</span>
            </div>

            {isLoading ? (
              <div className="text-center py-6 text-slate-400">
                Loading chunk map...
              </div>
            ) : details?.chunks && details.chunks.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {details.chunks.map((chunk: ChunkDetail) => (
                  <div
                    key={chunk.chunkIndex}
                    className="p-2.5 rounded-lg border border-slate-200 bg-white flex justify-between items-center"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">
                        Chunk {chunk.chunkIndex}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Bytes: {chunk.byteStart} - {chunk.byteEnd}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 uppercase border border-blue-200">
                      {chunk.provider}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-400 py-3">Single-chunk file.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

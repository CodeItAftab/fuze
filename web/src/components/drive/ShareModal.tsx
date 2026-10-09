"use client";

import { useEffect, useState } from "react";
import { VfsItem } from "@/stores/drive.store";
import { Share2, Copy, Check, X, Globe, Loader2 } from "lucide-react";

export function ShareModal({
  item,
  onClose,
}: {
  item: VfsItem;
  onClose: () => void;
}) {
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Automatically generate share link on modal open
  useEffect(() => {
    let isMounted = true;

    fetch(`${apiUrl}/files/${item.id}/share`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.error || "Failed to generate share link");
        return data;
      })
      .then((data: { token?: string }) => {
        if (isMounted && data.token) {
          setShareLink(`${window.location.origin}/share/${data.token}`);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const message =
            err instanceof Error
              ? err.message
              : "Failed to generate share link";
          setError(message);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [apiUrl, item.id]);

  const handleCopy = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
        className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 p-6 text-xs font-sans animate-in fade-in zoom-in-95 duration-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-4 min-w-0">
          <div className="flex items-center gap-2.5 font-bold text-sm text-slate-900 min-w-0 flex-1">
            <Share2 className="h-4 w-4 text-blue-600 shrink-0" />
            <span className="truncate min-w-0 flex-1" title={item.name}>
              Share &ldquo;{item.name}&rdquo;
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition shrink-0 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span>Creating instant share link...</span>
          </div>
        ) : error ? (
          <div className="py-4">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs mb-3">
              {error}
            </div>
            <button
              onClick={onClose}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Globe className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-slate-800 block text-[11px]">
                  Anyone with this link
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  Can view and download zero-proxy directly
                </span>
              </div>
            </div>

            {/* 1-Click Copy Link Input Bar */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareLink || ""}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 select-all font-mono focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-xs"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-white" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

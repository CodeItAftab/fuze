import { Download, X, Layers } from "lucide-react";
import { DownloadPlan } from "@/lib/download-engine";

interface FileDetailsDrawerProps {
  isOpen: boolean;
  plan: DownloadPlan;
  formatBytes: (bytes: number) => string;
  onClose: () => void;
  onDownload: () => void;
}

export function FileDetailsDrawer({
  isOpen,
  plan,
  formatBytes,
  onClose,
  onDownload,
}: FileDetailsDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 sm:hidden animate-in fade-in duration-150"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-[320px] sm:relative sm:z-20 sm:w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 shadow-2xl sm:shadow-xs animate-in slide-in-from-right-full sm:slide-in-from-right-4 duration-200">
        <div className="h-14 px-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-xs uppercase tracking-wider text-slate-700">
            Details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
            title="Close Details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs font-sans">
          <div>
            <h3 className="font-semibold text-slate-900 text-xs mb-3">
              File Properties
            </h3>
            <dl className="space-y-3.5">
              <div>
                <dt className="text-slate-400 text-[11px]">Name</dt>
                <dd className="font-medium text-slate-800 mt-0.5 break-all">
                  {plan.file.name}
                </dd>
              </div>

              <div>
                <dt className="text-slate-400 text-[11px]">Size</dt>
                <dd className="font-medium text-slate-800 mt-0.5">
                  {formatBytes(plan.file.size)}{" "}
                  <span className="text-[10px] text-slate-400 font-normal">
                    ({plan.file.size.toLocaleString()} bytes)
                  </span>
                </dd>
              </div>

              <div>
                <dt className="text-slate-400 text-[11px]">Format / MIME</dt>
                <dd className="font-medium text-slate-800 mt-0.5">
                  {plan.file.mimeType || "application/octet-stream"}
                </dd>
              </div>

              <div>
                <dt className="text-slate-400 text-[11px]">Storage Mode</dt>
                <dd className="font-medium text-slate-800 mt-0.5 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>
                    {plan.strategy === "chunked"
                      ? "Multi-Cloud Pooled"
                      : "Single Cloud (Whole)"}
                  </span>
                </dd>
              </div>

              {plan.chunks && plan.chunks.length > 0 && (
                <div>
                  <dt className="text-slate-400 text-[11px]">Parallel Chunks</dt>
                  <dd className="font-medium text-slate-800 mt-0.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>
                      {plan.chunks.length}{" "}
                      {plan.chunks.length === 1 ? "Chunk" : "Chunks"} (Zero-Proxy
                      Direct Streaming)
                    </span>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onDownload}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

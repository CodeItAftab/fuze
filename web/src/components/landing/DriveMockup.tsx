import {
  HardDrive,
  Cloud,
  Settings,
  Search,
  Folder,
  FileText,
  FileSpreadsheet,
  Code2,
  FileCode,
  MoreVertical,
  Lock,
  Plus,
  Star,
  ArrowUpCircle,
  RefreshCw,
  Trash2,
  LayoutGrid,
  List,
  ChevronDown,
} from "lucide-react";
import { FuzeLogo } from "@/components/brand/FuzeLogo";
import { ProviderLogo } from "@/components/drive/ProviderBadge";

export function DriveMockup() {
  const files = [
    {
      name: "Form9_1792990641812.pdf",
      size: "34.6 KB",
      providerBadge: "mega",
      icon: <FileText className="h-4 w-4 text-blue-500" />,
    },
    {
      name: "tsconfig.json",
      size: "670 B",
      providerBadge: "koofr",
      icon: <FileCode className="h-4 w-4 text-emerald-500" />,
    },
    {
      name: "README.md",
      size: "27 KB",
      providerBadge: "box",
      icon: <FileText className="h-4 w-4 text-blue-500" />,
    },
    {
      name: ".gitignore",
      size: "344 B",
      providerBadge: "box",
      icon: <Code2 className="h-4 w-4 text-slate-500" />,
    },
    {
      name: "SPMP_Template-2.docx",
      size: "569.5 KB",
      providerBadge: "box",
      icon: <FileText className="h-4 w-4 text-blue-600" />,
    },
    {
      name: "COCOMO template.xlsx",
      size: "11.9 KB",
      providerBadge: "one_drive",
      icon: <FileSpreadsheet className="h-4 w-4 text-emerald-600" />,
    },
    {
      name: "topscore.awk",
      size: "265 B",
      providerBadge: "box",
      icon: <FileCode className="h-4 w-4 text-indigo-500" />,
    },
    {
      name: "Nam1793184655270.pdf",
      size: "55 KB",
      providerBadge: "box",
      icon: <FileText className="h-4 w-4 text-blue-500" />,
    },
    {
      name: "index.html",
      size: "4.1 KB",
      providerBadge: "koofr",
      icon: <FileCode className="h-4 w-4 text-amber-500" />,
    },
  ];

  return (
    <section className="px-3 sm:px-6 pb-20 max-w-6xl mx-auto">
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
        {/* Window Chrome Header */}
        <div className="bg-slate-100 border-b border-slate-200 px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-rose-400" />
            <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-amber-400" />
            <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-emerald-400" />
          </div>
          <div className="bg-white border border-slate-200 rounded-lg px-2.5 sm:px-4 py-1 text-[11px] sm:text-xs text-slate-500 font-mono flex items-center gap-1.5 max-w-[240px] sm:max-w-xs truncate justify-center shadow-2xs">
            <Lock className="h-3 w-3 text-emerald-600 shrink-0" />
            <span className="truncate">https://fuzedrive.tech/dashboard</span>
          </div>
          <div className="text-[11px] font-semibold text-slate-400 hidden sm:block shrink-0">
            Fuze Drive Unified VFS · 72 GB Pool
          </div>
        </div>

        {/* ============================================================ */}
        {/* 1. DESKTOP & TABLET DASHBOARD VIEW (md:grid)                  */}
        {/* ============================================================ */}
        <div className="hidden md:grid grid-cols-12 min-h-135 text-xs">
          {/* Authentic Sidebar Matching Live Dashboard */}
          <div className="col-span-4 lg:col-span-3 border-r border-slate-200 bg-slate-50/70 p-4 flex flex-col justify-between gap-5">
            <div className="space-y-4">
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 font-semibold text-white shadow-xs cursor-default text-xs"
              >
                <Plus className="h-4 w-4" />
                <span>New</span>
              </button>

              <div className="space-y-0.5 font-medium">
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-blue-100/60 font-semibold text-blue-700">
                  <HardDrive className="h-4 w-4" />
                  <span>My Drive</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2 text-slate-600 rounded-xl hover:bg-slate-100/70 transition">
                  <Star className="h-4 w-4 text-slate-400" />
                  <span>Starred</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2 text-slate-600 rounded-xl hover:bg-slate-100/70 transition">
                  <Cloud className="h-4 w-4 text-slate-400" />
                  <span>Connected Clouds</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2 text-slate-600 rounded-xl hover:bg-slate-100/70 transition">
                  <ArrowUpCircle className="h-4 w-4 text-slate-400" />
                  <span>Uploads</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2 text-slate-600 rounded-xl hover:bg-slate-100/70 transition">
                  <RefreshCw className="h-4 w-4 text-slate-400" />
                  <span>Migrations</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2 text-slate-600 rounded-xl hover:bg-slate-100/70 transition">
                  <Settings className="h-4 w-4 text-slate-400" />
                  <span>Settings</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2 text-slate-600 rounded-xl hover:bg-slate-100/70 transition">
                  <Trash2 className="h-4 w-4 text-slate-400" />
                  <span>Trash</span>
                </div>
              </div>
            </div>

            {/* Storage Pool Widget - Fully Unlocked 72 GB Clean Layout (No Overflow) */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-800">Storage Pool</span>
                <span className="text-blue-600 font-bold">8 GB / 72 GB</span>
              </div>

              {/* Segmented Progress Bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                <div className="bg-indigo-600 h-full w-[2%]" title="Dropbox" />
                <div className="bg-amber-500 h-full w-[10%]" title="Google Drive" />
                <div className="bg-rose-500 h-full w-[1%]" title="mega" />
                <div className="bg-blue-600 h-full w-[1%]" title="Box" />
                <div className="bg-teal-500 h-full w-[1%]" title="pCloud" />
                <div className="bg-sky-500 h-full w-[1%]" title="OneDrive" />
                <div className="bg-emerald-500 h-full w-[1%]" title="koofr" />
              </div>

              {/* Cleanly Aligned Provider List with zero overflow */}
              <div className="space-y-1 text-[11px] text-slate-600 pt-0.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span>Google Drive</span>
                  </span>
                  <span className="text-slate-400 font-mono text-[10px] shrink-0 ml-1">7.3 MB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                    <span>Box</span>
                  </span>
                  <span className="text-slate-400 font-mono text-[10px] shrink-0 ml-1">426 MB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>Koofr</span>
                  </span>
                  <span className="text-slate-400 font-mono text-[10px] shrink-0 ml-1">122 MB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0" />
                    <span>OneDrive</span>
                  </span>
                  <span className="text-slate-400 font-mono text-[10px] shrink-0 ml-1">96.6 MB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500 shrink-0" />
                    <span>pCloud</span>
                  </span>
                  <span className="text-slate-400 font-mono text-[10px] shrink-0 ml-1">85.7 MB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span>MEGA</span>
                  </span>
                  <span className="text-slate-400 font-mono text-[10px] shrink-0 ml-1">34.6 KB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
                    <span>Dropbox</span>
                  </span>
                  <span className="text-slate-400 font-mono text-[10px] shrink-0 ml-1">17 KB</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between font-medium">
                <span>7 accounts linked</span>
                <span className="text-emerald-600 font-semibold">64 GB free</span>
              </div>
            </div>
          </div>

          {/* Real Main Explorer View */}
          <div className="col-span-8 lg:col-span-9 p-5 bg-white min-w-0 space-y-5">
            {/* Top Search Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-2 text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl w-full max-w-sm">
                <Search className="h-3.5 w-3.5 shrink-0" />
                <span className="text-slate-400 truncate">Search files, folders...</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                  <button type="button" className="p-1 rounded text-slate-400 hover:text-slate-700">
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" className="p-1 rounded bg-white text-blue-600 shadow-2xs">
                    <List className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg bg-white">
                  <span>Sort: Last Modified</span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Folders Section */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Folders
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="border border-slate-200 rounded-xl p-3 flex items-center justify-between bg-white hover:border-slate-300 transition">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Folder className="h-5 w-5 text-emerald-500 fill-emerald-100 shrink-0" />
                    <span className="font-semibold text-slate-800 text-xs truncate">Downloads</span>
                  </div>
                  <MoreVertical className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                </div>
              </div>
            </div>

            {/* Files List Table */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Files
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white shadow-2xs">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-2.5 flex items-center justify-between hover:bg-slate-50/80 transition gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Round checkbox placeholder matching real dashboard */}
                      <div className="h-4 w-4 rounded-full border border-slate-300 shrink-0" />
                      <div className="shrink-0">{file.icon}</div>
                      <span className="font-medium text-slate-800 text-xs truncate">
                        {file.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Provider logo badge matching real dashboard */}
                      <ProviderLogo badge={file.providerBadge} size="sm" />
                      <span className="text-slate-500 text-xs text-right font-medium min-w-16">
                        {file.size}
                      </span>
                      <MoreVertical className="h-3.5 w-3.5 text-slate-400 shrink-0 cursor-default" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. DEDICATED MOBILE DASHBOARD VIEW (md:hidden)                */}
        {/* ============================================================ */}
        <div className="block md:hidden p-3.5 sm:p-4 bg-slate-50/60 space-y-3.5">
          {/* Mobile App Bar With Official Brand Logo */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <FuzeLogo variant="icon" height={22} className="shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-900 leading-none">Fuze Drive</div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                  7 Clouds Connected (72 GB Pool)
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
              <Plus className="h-3.5 w-3.5" />
              <span>New</span>
            </div>
          </div>

          {/* Mobile Compact Storage Pool Card */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-800">Storage Pool</span>
              <span className="font-bold text-blue-600">8 GB / 72 GB</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
              <div className="bg-indigo-600 h-full w-[2%]" />
              <div className="bg-amber-500 h-full w-[10%]" />
              <div className="bg-rose-500 h-full w-[1%]" />
              <div className="bg-blue-600 h-full w-[1%]" />
              <div className="bg-teal-500 h-full w-[1%]" />
              <div className="bg-sky-500 h-full w-[1%]" />
              <div className="bg-emerald-500 h-full w-[1%]" />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
              <span>7 linked accounts</span>
              <span className="text-emerald-600 font-semibold">64 GB free</span>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="flex items-center gap-2 text-slate-400 bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs">
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Search files, folders...</span>
          </div>

          {/* Mobile Folder Chip */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 shadow-2xs">
              <Folder className="h-4 w-4 text-emerald-500 fill-emerald-100 shrink-0" />
              <span>Downloads</span>
              <span className="text-[10px] text-slate-400 font-normal">(1 item)</span>
            </div>
          </div>

          {/* Mobile Files List */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 shadow-2xs">
            {files.map((file, idx) => (
              <div key={idx} className="p-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="h-3.5 w-3.5 rounded-full border border-slate-300 shrink-0" />
                  <div className="shrink-0">{file.icon}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-slate-900 truncate">
                      {file.name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {file.size}
                    </div>
                  </div>
                </div>
                <ProviderLogo badge={file.providerBadge} size="sm" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

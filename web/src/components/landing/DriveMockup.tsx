import {
  HardDrive,
  Cloud,
  Settings,
  Search,
  Folder,
  Film,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  MoreVertical,
  Lock,
} from "lucide-react";

export function DriveMockup() {
  return (
    <section className="px-4 sm:px-6 pb-20 max-w-6xl mx-auto">
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
        {/* Window Chrome */}
        <div className="bg-slate-100 border-b border-slate-200 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-rose-400" />
            <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-amber-400" />
            <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-emerald-400" />
          </div>
          <div className="bg-white border border-slate-200 rounded-lg px-2.5 sm:px-4 py-1 text-[11px] sm:text-xs text-slate-500 font-mono flex items-center gap-1.5 sm:gap-2 max-w-[210px] sm:max-w-72 truncate justify-center shadow-2xs">
            <Lock className="h-3 w-3 text-emerald-600 shrink-0" />
            <span className="truncate">https://fuzedrive.tech/dashboard</span>
          </div>
          <div className="text-[11px] font-semibold text-slate-400 hidden sm:block shrink-0">
            Fuze Drive v1.0
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-12 min-h-105 text-xs">
          {/* Sidebar */}
          <div className="col-span-12 md:col-span-3 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/60 p-3.5 sm:p-4 flex flex-col justify-between gap-4">
            <div className="space-y-4">
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 font-semibold text-white shadow-2xs cursor-default"
              >
                <span>+ Upload Files</span>
              </button>
              <div className="space-y-1">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 font-semibold text-blue-700">
                  <HardDrive className="h-4 w-4" /> My Drive
                </div>
                <div className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                  <Cloud className="h-4 w-4" /> 5 Connected Clouds
                </div>
                <div className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                  <Settings className="h-4 w-4" /> Drive Settings
                </div>
              </div>
            </div>

            {/* Storage Meter */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <div className="flex justify-between font-semibold text-slate-700 mb-1.5 text-xs">
                <span>Storage Pool</span>
                <span className="text-blue-600 font-bold">18.4 / 42.0 GB</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                <div className="bg-amber-500 h-full w-[35%]" title="Google Drive (15 GB)" />
                <div className="bg-blue-600 h-full w-[24%]" title="Box (10 GB)" />
                <div className="bg-sky-400 h-full w-[24%]" title="pCloud (10 GB)" />
                <div className="bg-cyan-500 h-full w-[12%]" title="OneDrive (5 GB)" />
                <div className="bg-indigo-500 h-full w-[5%]" title="Dropbox (2 GB)" />
              </div>
              <div className="mt-2 text-[10px] text-slate-500 flex justify-between font-medium">
                <span>5 cloud drives unified</span>
                <span className="text-emerald-600 font-semibold">23.6 GB free</span>
              </div>
            </div>
          </div>

          {/* Explorer Content */}
          <div className="col-span-12 md:col-span-9 p-3.5 sm:p-6 bg-white min-w-0">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl w-full sm:w-80">
                <Search className="h-3.5 w-3.5 shrink-0" />
                <span className="text-slate-400 truncate">
                  Search files, videos, docs...
                </span>
              </div>
              <div className="text-slate-500 font-medium text-[11px] hidden sm:block shrink-0 ml-3">
                Prioritizing Whole Files
              </div>
            </div>

            {/* Folders */}
            <div className="mb-6">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Folders
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div className="border border-slate-200 rounded-xl p-3 flex items-center gap-3 bg-white hover:border-slate-300">
                  <Folder className="h-6 w-6 text-amber-500 fill-amber-100 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-800 truncate">
                      Financial Reports
                    </div>
                    <div className="text-[10px] text-slate-400">12 items</div>
                  </div>
                </div>
                <div className="border border-slate-200 rounded-xl p-3 flex items-center gap-3 bg-white hover:border-slate-300">
                  <Folder className="h-6 w-6 text-blue-500 fill-blue-100 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-800 truncate">
                      Product Assets
                    </div>
                    <div className="text-[10px] text-slate-400">48 items</div>
                  </div>
                </div>
                <div className="border border-slate-200 rounded-xl p-3 flex items-center gap-3 bg-white hover:border-slate-300">
                  <Folder className="h-6 w-6 text-indigo-500 fill-indigo-100 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-800 truncate">
                      Raw 4K Footage
                    </div>
                    <div className="text-[10px] text-slate-400">4 video files</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Files List */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Files &amp; Previews
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                <div className="p-2.5 sm:p-3 flex items-center justify-between hover:bg-slate-50 transition gap-2">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                      <Film className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-800 text-xs sm:text-sm truncate">
                        Demo_Walkthrough_1080p.mp4
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        Instant Native Video Thumbnail
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                      Google Drive
                    </span>
                    <span className="text-slate-500 text-[10px] sm:text-xs text-right font-medium shrink-0">
                      84.2 MB
                    </span>
                    <MoreVertical className="h-3.5 w-3.5 text-slate-400 shrink-0 hidden sm:block" />
                  </div>
                </div>

                <div className="p-2.5 sm:p-3 flex items-center justify-between hover:bg-slate-50 transition gap-2">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-800 text-xs sm:text-sm truncate">
                        Engineering_RFC_v2.pdf
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        Box 120+ Format Preview
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                      Box
                    </span>
                    <span className="text-slate-500 text-[10px] sm:text-xs text-right font-medium shrink-0">
                      12.6 MB
                    </span>
                    <MoreVertical className="h-3.5 w-3.5 text-slate-400 shrink-0 hidden sm:block" />
                  </div>
                </div>

                <div className="p-2.5 sm:p-3 flex items-center justify-between hover:bg-slate-50 transition gap-2">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className="h-8 w-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                      <ImageIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-800 text-xs sm:text-sm truncate">
                        Dataset_AI_Training.tar.gz
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        Merkle Verified • Fallback Chunked
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">
                      Multi-Cloud <span className="hidden sm:inline">(3 Clouds)</span><span className="sm:hidden">(3x)</span>
                    </span>
                    <span className="text-slate-500 text-[10px] sm:text-xs text-right font-medium shrink-0">
                      18.4 GB
                    </span>
                    <MoreVertical className="h-3.5 w-3.5 text-slate-400 shrink-0 hidden sm:block" />
                  </div>
                </div>

                <div className="p-2.5 sm:p-3 flex items-center justify-between hover:bg-slate-50 transition gap-2">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                      <FileSpreadsheet className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-800 text-xs sm:text-sm truncate">
                        Q3_Quarterly_Financials.xlsx
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        pCloud EU High-Speed Storage
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 whitespace-nowrap">
                      pCloud
                    </span>
                    <span className="text-slate-500 text-[10px] sm:text-xs text-right font-medium shrink-0">
                      4.8 MB
                    </span>
                    <MoreVertical className="h-3.5 w-3.5 text-slate-400 shrink-0 hidden sm:block" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

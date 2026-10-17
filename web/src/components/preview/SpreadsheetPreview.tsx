"use client";

import React, { useState, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  Search,
  Table,
  Copy,
  Check,
  FileSpreadsheet,
  Download,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface SpreadsheetPreviewProps {
  content?: string | null;
  blob?: Blob | null;
  src?: string;
  fileName: string;
  isTsv?: boolean;
}

interface SheetData {
  name: string;
  rows: string[][];
  maxCols: number;
  totalRows: number;
}

/**
 * Converts 0-indexed column number to Excel column letters (0 -> A, 25 -> Z, 26 -> AA).
 */
function getColumnLetter(colIndex: number): string {
  let letter = "";
  let temp = colIndex;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

export function SpreadsheetPreview({
  content,
  blob,
  src,
  fileName,
  isTsv,
}: SpreadsheetPreviewProps) {
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [tableSearch, setTableSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const isExcel = ["xlsx", "xls", "xlsm", "xlsb"].includes(ext);

  // Parse CSV/TSV or Excel Workbook
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    const parseSpreadsheet = async () => {
      try {
        if (isExcel) {
          let buffer: ArrayBuffer;
          if (blob) {
            buffer = await blob.arrayBuffer();
          } else if (src) {
            const res = await fetch(src, { credentials: "include" });
            if (!res.ok) throw new Error(`HTTP ${res.status} fetching spreadsheet`);
            buffer = await res.arrayBuffer();
          } else {
            throw new Error("No spreadsheet data source");
          }

          if (isCancelled) return;

          const workbook = XLSX.read(buffer, { type: "array" });
          const parsedSheets: SheetData[] = workbook.SheetNames.map((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            const rawJson: any[][] = XLSX.utils.sheet_to_json(worksheet, {
              header: 1,
              defval: "",
            });

            let maxCols = 0;
            const rows = rawJson.map((row) => {
              if (row.length > maxCols) maxCols = row.length;
              return row.map((cell) => String(cell ?? ""));
            });

            return {
              name: sheetName,
              rows,
              maxCols: Math.max(maxCols, 1),
              totalRows: rows.length,
            };
          });

          if (!isCancelled) {
            setSheets(parsedSheets);
            setActiveSheetIndex(0);
            setLoading(false);
          }
        } else if (content !== undefined && content !== null) {
          // Parse CSV / TSV text
          const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
          const delimiter = isTsv ? "\t" : ",";

          let maxCols = 0;
          const rows = lines.map((line) => {
            const cells: string[] = [];
            let cur = "";
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"') inQuotes = !inQuotes;
              else if (char === delimiter && !inQuotes) {
                cells.push(cur.trim());
                cur = "";
              } else cur += char;
            }
            cells.push(cur.trim());
            if (cells.length > maxCols) maxCols = cells.length;
            return cells;
          });

          if (!isCancelled) {
            setSheets([
              {
                name: ext.toUpperCase() || "Sheet1",
                rows,
                maxCols: Math.max(maxCols, 1),
                totalRows: rows.length,
              },
            ]);
            setActiveSheetIndex(0);
            setLoading(false);
          }
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to parse spreadsheet",
          );
          setLoading(false);
        }
      }
    };

    void parseSpreadsheet();

    return () => {
      isCancelled = true;
    };
  }, [content, blob, src, isExcel, isTsv, ext]);

  const currentSheet = sheets[activeSheetIndex] || {
    name: "",
    rows: [],
    maxCols: 1,
    totalRows: 0,
  };

  const filteredRowsWithIndex = useMemo(() => {
    if (!tableSearch.trim()) {
      return currentSheet.rows.map((row, idx) => ({ row, originalIndex: idx + 1 }));
    }
    const q = tableSearch.toLowerCase();
    const result: { row: string[]; originalIndex: number }[] = [];
    currentSheet.rows.forEach((row, idx) => {
      if (row.some((cell) => cell.toLowerCase().includes(q))) {
        result.push({ row, originalIndex: idx + 1 });
      }
    });
    return result;
  }, [currentSheet.rows, tableSearch]);

  const displayedRows = useMemo(() => {
    return filteredRowsWithIndex.slice(0, 1000);
  }, [filteredRowsWithIndex]);

  const handleCopy = () => {
    if (content) {
      void navigator.clipboard.writeText(content);
    } else {
      const csvStr = currentSheet.rows.map((r) => r.join(",")).join("\n");
      void navigator.clipboard.writeText(csvStr);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-400 p-12 bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <div className="text-xs font-medium text-slate-300">
          Loading workbook...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6 bg-slate-950">
        <div className="p-8 bg-slate-900 border border-rose-500/30 rounded-2xl max-w-md text-center space-y-3 shadow-2xl">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h4 className="text-sm font-bold text-white">
            Failed to load spreadsheet
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
          {src && (
            <a
              href={src}
              download={fileName}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-md mt-2"
            >
              <Download className="w-3.5 h-3.5" />
              Download Spreadsheet
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-none border-0 overflow-hidden select-text">
      {/* Top Header / Formula Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 bg-slate-100/90 border-b border-slate-300 text-xs shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-semibold text-slate-800 truncate">{fileName}</span>
          <span className="text-slate-500 text-[11px] shrink-0 font-mono">
            ({filteredRowsWithIndex.length}{" "}
            {filteredRowsWithIndex.length === 1 ? "row" : "rows"}
            {filteredRowsWithIndex.length !== currentSheet.totalRows &&
              ` of ${currentSheet.totalRows}`}
            )
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex-1 sm:w-56">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Filter cells..."
              className="w-full pl-8 pr-3 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
            />
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition text-[11px] font-medium cursor-pointer shrink-0"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Raw</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid Table with Authentic Column Letters and Row Numbers */}
      <div className="flex-1 overflow-auto bg-white custom-scrollbar relative">
        <table className="w-full text-left text-xs border-collapse table-fixed">
          {/* Top Column Letter Headers: A, B, C, D... */}
          <thead className="bg-[#f8f9fa] sticky top-0 z-20 text-slate-600 font-medium select-none shadow-xs">
            <tr>
              {/* Corner junction */}
              <th className="w-12 min-w-12 max-w-12 py-1.5 px-2 text-center text-[10px] text-slate-400 font-mono bg-[#f1f3f4] border-r border-b border-slate-300 sticky left-0 z-30">
                #
              </th>
              {Array.from({ length: currentSheet.maxCols }).map((_, cIdx) => (
                <th
                  key={cIdx}
                  className="w-36 min-w-28 py-1.5 px-2 text-center text-[11px] text-slate-600 font-mono border-r border-b border-slate-300 bg-[#f8f9fa] truncate"
                >
                  {getColumnLetter(cIdx)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {displayedRows.map(({ row, originalIndex }) => (
              <tr key={originalIndex} className="hover:bg-blue-50/40 transition-colors">
                {/* Left Row Number Header: 1, 2, 3... */}
                <td className="w-12 min-w-12 max-w-12 py-1 px-2 text-center text-[10px] text-slate-500 font-mono bg-[#f8f9fa] border-r border-b border-slate-300 sticky left-0 z-10 select-none">
                  {originalIndex}
                </td>
                {/* Cells */}
                {Array.from({ length: currentSheet.maxCols }).map((_, cIdx) => {
                  const cell = row[cIdx] || "";
                  return (
                    <td
                      key={cIdx}
                      className="py-1 px-2.5 border-r border-b border-slate-200 truncate max-w-xs text-slate-800 text-[11px] font-sans leading-normal whitespace-nowrap overflow-hidden text-ellipsis hover:outline hover:outline-1 hover:outline-emerald-500"
                      title={cell}
                    >
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {filteredRowsWithIndex.length > 1000 && (
          <div className="p-2.5 text-center text-xs text-slate-500 bg-slate-50 border-t border-slate-300 font-mono">
            Showing first 1,000 rows. Filter with search bar above to see specific rows.
          </div>
        )}
      </div>

      {/* Bottom Sheet Tabs & Status Bar (Authentic Excel/Sheets Style) */}
      <div className="flex items-center justify-between px-2 py-1 bg-[#f1f3f4] border-t border-slate-300 overflow-x-auto shrink-0 text-xs select-none">
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
          {sheets.map((sheet, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                setActiveSheetIndex(index);
                setTableSearch("");
              }}
              className={`px-3 py-1 rounded-t text-xs transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeSheetIndex === index
                  ? "bg-white text-emerald-800 font-semibold border-t-2 border-t-emerald-600 border-x border-slate-300 shadow-2xs"
                  : "text-slate-600 hover:bg-slate-200/90 font-medium"
              }`}
            >
              <Table className="w-3.5 h-3.5 text-emerald-600" />
              <span>{sheet.name}</span>
            </button>
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-500 font-mono px-2 shrink-0">
          <span>{currentSheet.totalRows} rows</span>
          <span>•</span>
          <span>{currentSheet.maxCols} cols</span>
        </div>
      </div>
    </div>
  );
}


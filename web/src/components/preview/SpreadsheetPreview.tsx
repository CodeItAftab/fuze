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
  headers: string[];
  rows: string[][];
  totalRows: number;
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

            const headers = (rawJson[0] || []).map((h) => String(h || ""));
            const rows = rawJson
              .slice(1)
              .map((row) => row.map((cell) => String(cell || "")));

            return {
              name: sheetName,
              headers,
              rows,
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

          const allRows = lines.map((line) => {
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
            return cells;
          });

          const headers = allRows[0] || [];
          const rows = allRows.slice(1);

          if (!isCancelled) {
            setSheets([
              {
                name: ext.toUpperCase() || "Sheet1",
                headers,
                rows,
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
    headers: [],
    rows: [],
    totalRows: 0,
  };

  const filteredRows = useMemo(() => {
    if (!tableSearch.trim()) return currentSheet.rows;
    const q = tableSearch.toLowerCase();
    return currentSheet.rows.filter((row) =>
      row.some((cell) => cell.toLowerCase().includes(q)),
    );
  }, [currentSheet.rows, tableSearch]);

  const displayedRows = useMemo(() => {
    return filteredRows.slice(0, 1000);
  }, [filteredRows]);

  const handleCopy = () => {
    if (content) {
      void navigator.clipboard.writeText(content);
    } else {
      const csvStr = [
        currentSheet.headers.join(","),
        ...currentSheet.rows.map((r) => r.join(",")),
      ].join("\n");
      void navigator.clipboard.writeText(csvStr);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-slate-400 p-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <div className="text-xs font-medium text-slate-300">
          Loading spreadsheet workbook...
        </div>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
    <div className="w-full max-w-6xl h-full flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-bold text-slate-800 truncate">{fileName}</span>
          <span className="text-slate-400 text-[11px] shrink-0 font-mono">
            ({filteredRows.length}{" "}
            {filteredRows.length === 1 ? "row" : "rows"}
            {filteredRows.length !== currentSheet.totalRows &&
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
              placeholder="Search table rows..."
              className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition text-[11px] font-medium cursor-pointer shrink-0"
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

      {/* Grid Table */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100 sticky top-0 z-10 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-2 px-3 w-12 text-slate-400 font-mono text-[10px] text-center border-r border-slate-200 bg-slate-100">
                #
              </th>
              {currentSheet.headers.map((h, i) => (
                <th
                  key={i}
                  className="py-2 px-3 border-r border-slate-200 truncate max-w-xs font-semibold text-slate-800"
                >
                  {h || String.fromCharCode(65 + (i % 26))}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {displayedRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-emerald-50/30 transition">
                <td className="py-1.5 px-3 font-mono text-[10px] text-slate-400 text-center border-r border-slate-100 bg-slate-50/60">
                  {rIdx + 1}
                </td>
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className="py-1.5 px-3 border-r border-slate-100 truncate max-w-xs text-slate-700 font-mono text-[11px]"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {filteredRows.length > 1000 && (
          <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 border-t border-slate-200 font-mono">
            Showing first 1,000 rows. Use search to filter specific records.
          </div>
        )}
      </div>

      {/* Bottom Sheet Tabs (Excel Multi-Sheet Workbooks) */}
      {sheets.length > 1 && (
        <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 border-t border-slate-200 overflow-x-auto shrink-0 text-xs">
          {sheets.map((sheet, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                setActiveSheetIndex(index);
                setTableSearch("");
              }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeSheetIndex === index
                  ? "bg-white text-emerald-700 shadow-2xs font-semibold border border-slate-200"
                  : "text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>{sheet.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                ({sheet.totalRows})
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

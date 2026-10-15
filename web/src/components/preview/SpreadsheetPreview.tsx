import { useState, useMemo } from "react";
import { Search, Table, Copy, Check } from "lucide-react";

interface SpreadsheetPreviewProps {
  content: string;
  fileName: string;
  isTsv?: boolean;
}

export function SpreadsheetPreview({
  content,
  fileName,
  isTsv,
}: SpreadsheetPreviewProps) {
  const [tableSearch, setTableSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const csvData = useMemo(() => {
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
    let rows = allRows.slice(1);

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      rows = rows.filter((r) => r.some((c) => c.toLowerCase().includes(q)));
    }

    return {
      headers,
      rows: rows.slice(0, 500),
      totalMatches: rows.length,
      totalLines: allRows.length - 1,
    };
  }, [content, isTsv, tableSearch]);

  return (
    <div className="w-full max-w-6xl h-full flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          <Table className="h-4 w-4 text-emerald-600" />
          <span className="font-bold text-slate-800 truncate">{fileName}</span>
          <span className="text-slate-400 text-[11px]">
            ({csvData.totalMatches}{" "}
            {csvData.totalMatches === 1 ? "row" : "rows"}
            {csvData.totalMatches !== csvData.totalLines &&
              ` of ${csvData.totalLines}`}
            )
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Search table rows..."
              className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition text-[11px] font-medium cursor-pointer shrink-0"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-600">Copied</span>
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

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100/80 sticky top-0 z-10 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-2 px-3 w-10 text-slate-400 font-mono text-[10px] text-center border-r border-slate-200">
                #
              </th>
              {csvData.headers.map((h, i) => (
                <th key={i} className="py-2 px-3 border-r border-slate-200 truncate max-w-xs">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {csvData.rows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-blue-50/40 transition">
                <td className="py-1.5 px-3 font-mono text-[10px] text-slate-400 text-center border-r border-slate-100 bg-slate-50/50">
                  {rIdx + 1}
                </td>
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="py-1.5 px-3 border-r border-slate-100 truncate max-w-xs">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

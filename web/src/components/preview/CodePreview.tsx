import { useState } from "react";
import { Copy, Check, FileCode } from "lucide-react";

interface CodePreviewProps {
  content: string;
  fileName: string;
  extension: string;
}

export function CodePreview({ content, fileName, extension }: CodePreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = content.split(/\r?\n/);

  return (
    <div className="w-full max-w-5xl h-full flex flex-col bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-800">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-mono">
          <FileCode className="h-4 w-4 text-blue-400" />
          <span className="font-semibold">{fileName}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
            {extension}
          </span>
          <span className="text-slate-500 text-[11px] hidden sm:inline">
            • {lines.length} lines
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-[11px] font-medium cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-100 flex">
        <div className="select-none text-slate-600 text-right pr-4 border-r border-slate-800 font-mono shrink-0">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <pre className="pl-4 flex-1 overflow-x-auto whitespace-pre">
          <code>{content}</code>
        </pre>
      </div>
    </div>
  );
}

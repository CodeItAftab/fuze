"use client";

import React, { useState, useMemo } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-python";
import "prismjs/components/prism-json";
import "prismjs/components/prism-css";
import "prismjs/components/prism-scss";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-go";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";

import {
  Copy,
  Check,
  FileCode,
  WrapText,
  Search,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

interface CodePreviewProps {
  content: string;
  fileName: string;
  extension: string;
}

export function CodePreview({
  content,
  fileName,
  extension,
}: CodePreviewProps) {
  const [copied, setCopied] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("sm");
  const [searchQuery, setSearchQuery] = useState("");

  const handleCopy = () => {
    void navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = useMemo(() => content.split(/\r?\n/), [content]);

  // Map file extension to Prism language grammar
  const grammar = useMemo(() => {
    const ext = extension.toLowerCase();
    switch (ext) {
      case "ts":
        return Prism.languages.typescript;
      case "tsx":
        return Prism.languages.tsx;
      case "js":
      case "mjs":
      case "cjs":
        return Prism.languages.javascript;
      case "jsx":
        return Prism.languages.jsx;
      case "py":
        return Prism.languages.python;
      case "json":
        return Prism.languages.json;
      case "html":
      case "xml":
      case "svg":
        return Prism.languages.markup;
      case "css":
        return Prism.languages.css;
      case "scss":
        return Prism.languages.scss;
      case "sql":
        return Prism.languages.sql;
      case "sh":
      case "bash":
      case "zsh":
        return Prism.languages.bash;
      case "yaml":
      case "yml":
        return Prism.languages.yaml;
      case "md":
      case "markdown":
        return Prism.languages.markdown;
      case "rs":
        return Prism.languages.rust;
      case "go":
        return Prism.languages.go;
      case "java":
        return Prism.languages.java;
      case "c":
        return Prism.languages.c;
      case "cpp":
        return Prism.languages.cpp;
      default:
        return Prism.languages.plain || Prism.languages.javascript;
    }
  }, [extension]);

  // Highlight code safely
  const highlightedHtml = useMemo(() => {
    try {
      return Prism.highlight(content, grammar || Prism.languages.javascript, extension);
    } catch {
      return content;
    }
  }, [content, grammar, extension]);

  const fontSizeClass =
    fontSize === "sm"
      ? "text-xs"
      : fontSize === "base"
        ? "text-sm"
        : "text-base";

  return (
    <div className="w-full max-w-5xl h-full flex flex-col bg-[#1e1e1e] rounded-2xl shadow-2xl overflow-hidden border border-slate-800">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#181818] border-b border-slate-800 text-xs shrink-0 select-none">
        <div className="flex items-center gap-2 text-slate-300 font-mono">
          <FileCode className="h-4 w-4 text-blue-400" />
          <span className="font-semibold">{fileName}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-mono">
            {extension}
          </span>
          <span className="text-slate-500 text-[11px] hidden sm:inline">
            • {lines.length} lines
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Word Wrap Toggle */}
          <button
            type="button"
            onClick={() => setWordWrap((w) => !w)}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              wordWrap
                ? "bg-blue-600/20 border-blue-500/40 text-blue-400"
                : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white"
            }`}
            title="Toggle Word Wrap"
          >
            <WrapText className="w-3.5 h-3.5" />
          </button>

          {/* Font Size Buttons */}
          <div className="flex items-center gap-0.5 bg-slate-800/80 rounded-lg p-0.5 border border-slate-700 text-[11px]">
            <button
              type="button"
              onClick={() => setFontSize("sm")}
              className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                fontSize === "sm" ? "bg-slate-700 text-white font-bold" : "text-slate-400"
              }`}
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => setFontSize("base")}
              className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                fontSize === "base" ? "bg-slate-700 text-white font-bold" : "text-slate-400"
              }`}
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontSize("lg")}
              className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                fontSize === "lg" ? "bg-slate-700 text-white font-bold" : "text-slate-400"
              }`}
            >
              A+
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-[11px] font-medium cursor-pointer border border-slate-700"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
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

      {/* Code Viewer Body with Line Numbers */}
      <div className={`flex-1 overflow-auto p-4 font-mono ${fontSizeClass} leading-relaxed text-slate-100 flex`}>
        {/* Line Numbers */}
        <div className="select-none text-slate-600 text-right pr-4 border-r border-slate-800 font-mono shrink-0">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Highlighted Code */}
        <pre
          className={`pl-4 flex-1 ${
            wordWrap ? "whitespace-pre-wrap break-all" : "whitespace-pre overflow-x-auto"
          }`}
        >
          <code
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            className={`language-${extension}`}
          />
        </pre>
      </div>
    </div>
  );
}

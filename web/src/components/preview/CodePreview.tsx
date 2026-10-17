"use client";

import React, { useState, useMemo, useRef } from "react";
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
import "prismjs/components/prism-csharp";

import {
  Copy,
  Check,
  FileCode,
  WrapText,
  Search,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface CodePreviewProps {
  content: string;
  fileName: string;
  extension: string;
}

const languageLabels: Record<string, string> = {
  c: "C",
  h: "C Header",
  cpp: "C++",
  hpp: "C++ Header",
  cc: "C++",
  cxx: "C++",
  cs: "C#",
  ts: "TypeScript",
  tsx: "TSX",
  js: "JavaScript",
  jsx: "JSX",
  py: "Python",
  rs: "Rust",
  go: "Go",
  java: "Java",
  json: "JSON",
  html: "HTML",
  xml: "XML",
  svg: "SVG",
  css: "CSS",
  scss: "SCSS",
  sql: "SQL",
  sh: "Shell",
  bash: "Bash",
  zsh: "Zsh",
  yaml: "YAML",
  yml: "YAML",
  md: "Markdown",
  dockerfile: "Docker",
  env: "Config",
  gitignore: "Git",
};

const codeCustomStyles = `
  /* High-Contrast VS Code Dark / One Dark syntax theme */
  .fuze-code-view code,
  .fuze-code-view pre {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
  }
  .fuze-code-view .token.comment,
  .fuze-code-view .token.prolog,
  .fuze-code-view .token.doctype,
  .fuze-code-view .token.cdata {
    color: #64748b !important; /* slate-500 */
    font-style: italic;
  }
  .fuze-code-view .token.punctuation {
    color: #94a3b8 !important; /* slate-400 */
  }
  .fuze-code-view .token.property,
  .fuze-code-view .token.tag,
  .fuze-code-view .token.boolean,
  .fuze-code-view .token.number,
  .fuze-code-view .token.constant,
  .fuze-code-view .token.symbol,
  .fuze-code-view .token.deleted {
    color: #fb923c !important; /* orange-400 */
  }
  .fuze-code-view .token.selector,
  .fuze-code-view .token.attr-name,
  .fuze-code-view .token.string,
  .fuze-code-view .token.char,
  .fuze-code-view .token.builtin,
  .fuze-code-view .token.inserted {
    color: #4ade80 !important; /* green-400 */
  }
  .fuze-code-view .token.operator,
  .fuze-code-view .token.entity,
  .fuze-code-view .token.url,
  .fuze-code-view .language-css .token.string,
  .fuze-code-view .style .token.string {
    color: #38bdf8 !important; /* sky-400 */
  }
  .fuze-code-view .token.atrule,
  .fuze-code-view .token.attr-value,
  .fuze-code-view .token.keyword {
    color: #c084fc !important; /* purple-400 */
    font-weight: 500;
  }
  .fuze-code-view .token.function,
  .fuze-code-view .token.class-name {
    color: #60a5fa !important; /* blue-400 */
  }
  .fuze-code-view .token.regex,
  .fuze-code-view .token.important,
  .fuze-code-view .token.variable {
    color: #facc15 !important; /* yellow-400 */
  }
  .fuze-code-view .token.macro,
  .fuze-code-view .token.directive-hash,
  .fuze-code-view .token.directive {
    color: #f43f5e !important; /* rose-500 */
    font-weight: 500;
  }
`;

export function CodePreview({
  content,
  fileName,
  extension,
}: CodePreviewProps) {
  const [copied, setCopied] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize input string: strip BOM and stray null bytes
  const cleanContent = useMemo(() => {
    if (!content) return "";
    let s = content;
    if (s.charCodeAt(0) === 0xfeff || s.charCodeAt(0) === 0xfffe) {
      s = s.slice(1);
    }
    if (s.includes("\u0000")) {
      s = s.replace(/\u0000/g, "");
    }
    return s;
  }, [content]);

  const handleCopy = () => {
    void navigator.clipboard.writeText(cleanContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = useMemo(() => cleanContent.split(/\r?\n/), [cleanContent]);

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
      case "h":
        return Prism.languages.c;
      case "cpp":
      case "hpp":
      case "cc":
      case "cxx":
        return Prism.languages.cpp;
      case "cs":
        return Prism.languages.csharp;
      default:
        return Prism.languages.plain || Prism.languages.javascript;
    }
  }, [extension]);

  // Highlight code safely
  const highlightedHtml = useMemo(() => {
    try {
      return Prism.highlight(cleanContent, grammar || Prism.languages.javascript, extension);
    } catch {
      return cleanContent;
    }
  }, [cleanContent, grammar, extension]);

  // Match counter for find search
  const matchCount = useMemo(() => {
    if (!searchQuery.trim()) return 0;
    try {
      const regex = new RegExp(
        searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "gi",
      );
      return (cleanContent.match(regex) || []).length;
    } catch {
      return 0;
    }
  }, [cleanContent, searchQuery]);

  const fontTextClass =
    fontSize === "sm"
      ? "text-xs"
      : fontSize === "base"
        ? "text-[13px]"
        : "text-[14.5px]";

  const lineHeightClass = fontSize === "lg" ? "leading-7" : "leading-6";

  const langLabel =
    languageLabels[extension.toLowerCase()] || extension.toUpperCase() || "CODE";

  return (
    <div className="fuze-code-view w-full h-full flex flex-col bg-slate-950 text-slate-100 select-text overflow-hidden font-sans relative">
      <style dangerouslySetInnerHTML={{ __html: codeCustomStyles }} />

      {/* Floating Bottom Control Bar - Unified with all Fuze Previewers */}
      <div className="no-print print-hidden absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 transition-all duration-200 max-w-[calc(100vw-1.5rem)]">
        {isToolbarCollapsed ? (
          <button
            type="button"
            onClick={() => setIsToolbarCollapsed(false)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 shadow-2xl text-slate-300 hover:text-white text-xs cursor-pointer transition hover:bg-slate-800"
            title="Expand Controls"
          >
            <FileCode className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-mono text-[11px] font-semibold">{langLabel}</span>
            <span className="text-slate-500">•</span>
            <span className="font-mono text-[11px]">{lines.length} lines</span>
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          </button>
        ) : (
          <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 shadow-[0_16px_36px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)] text-white text-xs">
            {/* Language Pill */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 font-mono text-[11px] font-semibold">
              <FileCode className="w-3.5 h-3.5" />
              <span>{langLabel}</span>
            </div>

            <span className="text-[11px] font-mono text-slate-400 px-1 hidden xs:inline">
              {lines.length} {lines.length === 1 ? "line" : "lines"}
            </span>

            <div className="w-px h-4 bg-slate-700/60 mx-0.5" />

            {/* Search in Code */}
            {showSearch ? (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-800/95 border border-blue-500/50 rounded-lg text-xs animate-in fade-in duration-150">
                <Search className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find in code..."
                  className="bg-transparent text-white text-[11px] placeholder:text-slate-500 outline-none w-20 sm:w-28 font-mono"
                  autoFocus
                />
                {searchQuery.trim() && (
                  <span className="text-[10px] font-mono px-1 py-0.2 bg-slate-700/80 rounded text-slate-300">
                    {matchCount}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setShowSearch(false);
                  }}
                  className="p-0.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition cursor-pointer"
                  title="Close Search"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowSearch(true);
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                title="Find in code"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Word Wrap Toggle */}
            <button
              type="button"
              onClick={() => setWordWrap((w) => !w)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition cursor-pointer text-[11px] ${
                wordWrap
                  ? "bg-blue-600/20 border-blue-500/40 text-blue-400 font-semibold"
                  : "hover:bg-slate-800 border-transparent text-slate-400 hover:text-white"
              }`}
              title="Toggle Word Wrap"
            >
              <WrapText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Wrap</span>
            </button>

            {/* Font Size Selector */}
            <div className="flex items-center gap-0.5 bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/60 text-[11px]">
              <button
                type="button"
                onClick={() => setFontSize("sm")}
                className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                  fontSize === "sm" ? "bg-slate-700 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                }`}
                title="Small font"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setFontSize("base")}
                className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                  fontSize === "base" ? "bg-slate-700 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                }`}
                title="Default font"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSize("lg")}
                className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                  fontSize === "lg" ? "bg-slate-700 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                }`}
                title="Large font"
              >
                A+
              </button>
            </div>

            <div className="w-px h-4 bg-slate-700/60 mx-0.5" />

            {/* Clean Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition text-xs font-semibold cursor-pointer shadow-xs active:scale-95"
              title="Copy code to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-300" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {/* Minimize Toolbar Chevron */}
            <button
              type="button"
              onClick={() => setIsToolbarCollapsed(true)}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer ml-0.5"
              title="Minimize toolbar"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Edge-to-Edge Code Canvas with Sticky Line Numbers Gutter */}
      <div className="flex-1 overflow-auto custom-scrollbar bg-slate-950">
        <div className="flex min-w-full">
          {/* Sticky Gutter with Line Numbers - generous bottom padding clears floating toolbar */}
          <div
            className={`sticky left-0 select-none text-slate-600 bg-slate-950/95 border-r border-slate-800/80 pl-3 sm:pl-4 pr-3 sm:pr-4 pt-4 pb-28 sm:pb-36 text-right shrink-0 z-10 backdrop-blur-xs font-mono ${lineHeightClass} ${fontTextClass}`}
          >
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Syntax Highlighted Code Area - generous bottom padding clears floating toolbar */}
          <pre
            className={`pt-4 pb-28 sm:pb-36 pl-4 sm:pl-5 pr-4 flex-1 m-0 font-mono ${lineHeightClass} ${fontTextClass} text-slate-100 ${
              wordWrap ? "whitespace-pre-wrap break-all" : "whitespace-pre overflow-x-visible"
            }`}
          >
            <code
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
              className={`language-${extension} text-slate-100 font-mono`}
            />
          </pre>
        </div>
      </div>
    </div>
  );
}

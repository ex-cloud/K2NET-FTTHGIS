

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Check,
  Copy,
  Terminal,
  Code2,
  Database,
  FileText,
  ExternalLink,
  Table,
} from "lucide-react";
import { cn } from "@/lib/utils";

function CodeBlock({
  language,
  value,
}: {
  language: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLanguageIcon = (lang: string) => {
    const l = lang.toLowerCase();
    if (l === "sql" || l === "postgres" || l === "postgis") {
      return <Database className="w-3.5 h-3.5 text-blue-400" />;
    }
    if (
      l === "bash" ||
      l === "sh" ||
      l === "shell" ||
      l === "cli" ||
      l === "terminal" ||
      l === "cmd"
    ) {
      return <Terminal className="w-3.5 h-3.5 text-primary" />;
    }
    if (l === "json" || l === "yaml" || l === "yml") {
      return <FileText className="w-3.5 h-3.5 text-amber-500" />;
    }
    return <Code2 className="w-3.5 h-3.5 text-purple-500" />;
  };

  const formatLangName = (lang: string) => {
    if (!lang) return "CODE / SCRIPT";
    const l = lang.toLowerCase();
    if (l === "sql") return "SQL Query";
    if (l === "bash" || l === "sh" || l === "shell" || l === "cli") return "CLI / Terminal";
    if (l === "json") return "JSON";
    if (l === "yaml" || l === "yml") return "YAML Config";
    if (l === "python" || l === "py") return "Python";
    if (l === "javascript" || l === "js") return "JavaScript";
    if (l === "typescript" || l === "ts") return "TypeScript";
    return lang.toUpperCase();
  };

  return (
    <div className="my-3 rounded-xl border border-border bg-card text-card-foreground overflow-hidden shadow-xs not-prose">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-muted/70 border-b border-border text-[11px] font-mono">
        <div className="flex items-center gap-2 text-muted-foreground">
          {getLanguageIcon(language)}
          <span className="font-semibold text-foreground">{formatLangName(language)}</span>
        </div>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          title="Salin ke clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-primary" />
              <span className="text-primary font-sans font-medium">Disalin!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span className="font-sans">Salin</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="p-3.5 overflow-x-auto custom-scrollbar font-mono text-[12px] leading-relaxed text-foreground bg-muted/30">
        <pre className="!bg-transparent !p-0 !m-0">
          <code>{value}</code>
        </pre>
      </div>
    </div>
  );
}

export function AiMarkdownRenderer({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-full text-xs sm:text-[13px] leading-relaxed break-words [word-break:break-word] overflow-hidden",
        "prose-headings:font-semibold prose-headings:text-foreground prose-headings:break-words",
        "prose-p:my-2 prose-p:leading-relaxed prose-p:text-foreground/90 prose-p:break-words",
        "prose-strong:font-semibold prose-strong:text-foreground",
        "prose-ul:my-2 prose-ul:pl-4 prose-ol:my-2 prose-ol:pl-4",
        "prose-li:my-0.5 prose-li:break-words",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className: codeClassName, children, ...props }) {
            const match = /language-(\w+)/.exec(codeClassName || "");
            const codeStr = String(children);
            const isInline = !match && !codeStr.includes("\n");

            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 mx-0.5 rounded-md font-mono text-[11px] font-semibold bg-muted text-primary border border-border/50 break-all inline align-baseline"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            const codeText = codeStr.replace(/\n$/, "");
            const language = match ? match[1] : "";

            return <CodeBlock language={language} value={codeText} />;
          },
          table({ children }) {
            return (
              <div className="my-3 rounded-xl border border-border bg-card shadow-xs not-prose overflow-hidden max-w-full">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/40 border-b border-border text-[11px] font-semibold text-muted-foreground">
                  <Table className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Tabel Data & Parameter</span>
                </div>
                <div className="overflow-x-auto custom-scrollbar w-full">
                  <table className="min-w-full text-left text-xs border-collapse divide-y divide-border/40 whitespace-normal">{children}</table>
                </div>
              </div>
            );
          },
          thead({ children }) {
            return (
              <thead className="bg-muted/70 text-foreground font-semibold border-b border-border">
                {children}
              </thead>
            );
          },
          tbody({ children }) {
            return <tbody className="divide-y divide-border/40 text-foreground/90">{children}</tbody>;
          },
          tr({ children }) {
            return <tr className="hover:bg-muted/30 transition-colors">{children}</tr>;
          },
          th({ children }) {
            return <th className="px-3 py-2 text-[11px] font-semibold text-foreground whitespace-nowrap bg-muted/40">{children}</th>;
          },
          td({ children }) {
            return <td className="px-3 py-2 text-[11px] leading-relaxed break-words">{children}</td>;
          },
          h1({ children }) {
            return (
              <h1 className="text-base font-bold text-foreground mt-4 mb-2 pb-1.5 border-b border-border/60 flex items-center gap-2">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-sm font-semibold text-foreground mt-4 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-xs font-semibold text-foreground/90 mt-3 mb-1">
                {children}
              </h3>
            );
          },
          ul({ children }) {
            return <ul className="my-2 pl-4 list-disc space-y-1 text-foreground/85">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="my-2 pl-4 list-decimal space-y-1 text-foreground/85">{children}</ol>;
          },
          li({ children }) {
            return <li className="leading-relaxed pl-0.5">{children}</li>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="my-2.5 pl-3.5 py-1.5 border-l-2 border-primary/70 bg-primary/5 rounded-r-lg text-foreground/80 text-xs italic">
                {children}
              </blockquote>
            );
          },
          p({ children }) {
            return <p className="my-2 leading-relaxed text-foreground/90">{children}</p>;
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
              >
                {children}
                <ExternalLink className="w-2.5 h-2.5 opacity-70" />
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

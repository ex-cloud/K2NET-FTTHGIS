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
} from "lucide-react";
import { cn } from "../../utils";

function CodeBlock({
  language,
  value,
}: {
  language: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard error
    }
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
        "prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed text-xs sm:text-[13px]",
        "prose-headings:text-foreground prose-headings:font-bold prose-headings:tracking-tight",
        "prose-h1:text-base prose-h2:text-sm prose-h3:text-xs",
        "prose-p:my-1.5 prose-p:leading-relaxed",
        "prose-strong:text-foreground prose-strong:font-bold",
        "prose-ul:my-1.5 prose-ul:pl-4 prose-li:my-0.5",
        "prose-ol:my-1.5 prose-ol:pl-4 prose-li:my-0.5",
        "prose-table:my-2 prose-table:w-full prose-table:border-collapse",
        "prose-th:border prose-th:border-border prose-th:bg-muted/60 prose-th:px-2.5 prose-th:py-1.5 prose-th:text-left prose-th:text-[11px] prose-th:font-semibold prose-th:text-foreground",
        "prose-td:border prose-td:border-border prose-td:px-2.5 prose-td:py-1.5 prose-td:text-[11px]",
        "prose-blockquote:border-l-2 prose-blockquote:border-primary/60 prose-blockquote:pl-3 prose-blockquote:italic prose-blockquote:text-muted-foreground",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match && !String(children).includes("\n");
            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md bg-muted text-primary font-mono text-[11px] border border-border/60"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <CodeBlock
                language={match ? match[1] : ""}
                value={String(children).replace(/\n$/, "")}
              />
            );
          },
          a({ href, children, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-primary hover:underline font-medium"
                {...props}
              >
                {children}
                <ExternalLink className="w-2.5 h-2.5 inline opacity-70" />
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

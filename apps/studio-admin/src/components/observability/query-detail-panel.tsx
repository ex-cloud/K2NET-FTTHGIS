

import React, { useState, useEffect } from "react";
import { X, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { SlowQuery } from "@/hooks/useDbPerformance";
import { cn } from "@k2net/ui";

interface QueryDetailPanelProps {
  selectedQuery: SlowQuery | null;
  onClose: () => void;
}

/**
 * SQL keyword highlighting — pure CSS-class-based approach (no external deps)
 * Parses SQL text and wraps keywords/strings/comments in styled spans.
 */
function formatSql(sql: string): React.ReactNode[] {
  const tokens: Array<{ type: string; value: string }> = [];

  // Tokenize SQL into keywords, strings, comments, identifiers, operators
  const patterns: Array<[string, RegExp]> = [
    ["comment_line", /^--[^\n]*/],
    ["comment_block", /^\/\*[\s\S]*?\*\//],
    ["string", /^'(?:[^'\\]|\\.)*'/],
    ["string", /^"(?:[^"\\]|\\.)*"/],
    ["number", /^\b\d+(\.\d+)?\b/],
    [
      "keyword",
      /^\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AND|OR|NOT|IN|IS|NULL|AS|WITH|HAVING|GROUP\s+BY|ORDER\s+BY|BY|LIMIT|OFFSET|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|INDEX|DROP|ALTER|ADD|COLUMN|PRIMARY|KEY|FOREIGN|REFERENCES|CONSTRAINT|IF|EXISTS|UNIQUE|DEFAULT|CASCADE|RETURNING|DISTINCT|UNION|ALL|CASE|WHEN|THEN|ELSE|END|BEGIN|COMMIT|ROLLBACK|TRANSACTION|USING|INTERVAL|NOW|COALESCE|COUNT|SUM|AVG|MAX|MIN|ROUND|EXTRACT|DATE|CAST|CONVERT|SUBSTRING|TRIM|REPLACE|LOWER|UPPER|CONCAT|NULLIF|IIF|ST_Contains|ST_SetSRID|ST_Point|ST_AsGeoJSON|ST_AsText|pg_stat_statements_reset|pg_stat_statements|pg_size_pretty|pg_relation_size)\b/i,
    ],
    ["operator", /^[=<>!+\-*/,;().[\]{}]/],
    ["identifier", /^[a-zA-Z_][a-zA-Z0-9_$]*/],
    ["whitespace", /^[\s]+/],
    ["other", /^./],
  ];

  let remaining = sql;
  while (remaining.length > 0) {
    let matched = false;
    for (const [type, pattern] of patterns) {
      const match = remaining.match(pattern);
      if (match) {
        tokens.push({ type, value: match[0] });
        remaining = remaining.slice(match[0].length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      tokens.push({ type: "other", value: remaining[0] });
      remaining = remaining.slice(1);
    }
  }

  return tokens.map((token, i) => {
    switch (token.type) {
      case "keyword":
        return (
          <span key={i} className="text-sky-400 font-semibold">
            {token.value}
          </span>
        );
      case "string":
        return (
          <span key={i} className="text-primary/80">
            {token.value}
          </span>
        );
      case "number":
        return (
          <span key={i} className="text-amber-400">
            {token.value}
          </span>
        );
      case "comment_line":
      case "comment_block":
        return (
          <span key={i} className="text-muted-foreground/60 italic">
            {token.value}
          </span>
        );
      case "operator":
        return (
          <span key={i} className="text-rose-400/80">
            {token.value}
          </span>
        );
      case "identifier":
        return (
          <span key={i} className="text-foreground">
            {token.value}
          </span>
        );
      default:
        return <span key={i}>{token.value}</span>;
    }
  });
}

function MetadataRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-xs font-mono font-medium text-foreground", valueClassName)}>
        {value}
      </span>
    </div>
  );
}

function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
  return `${ms.toFixed(0)}ms`;
}

export function QueryDetailPanel({ selectedQuery, onClose }: QueryDetailPanelProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Reset expand state when query changes
  useEffect(() => {
    setExpanded(false);
    setCopied(false);
  }, [selectedQuery?.query]);

  const handleCopy = () => {
    if (!selectedQuery) return;
    navigator.clipboard.writeText(selectedQuery.query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ESC key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedQuery) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedQuery, onClose]);

  const isOpen = !!selectedQuery;

  return (
    <>
      {/* Backdrop overlay — click to close (starts below SystemHeader h-12 = 48px) */}
      <div
        className={cn(
          "fixed top-12 left-0 right-0 bottom-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Side Panel — top-12 to start below the 48px SystemHeader */}
      <div
        className={cn(
          "fixed top-12 right-0 z-50 h-[calc(100vh-3rem)] w-full max-w-[480px] bg-card border-l border-border shadow-2xl flex flex-col transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {selectedQuery && (
          <>
            {/* Panel Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <h3 className="text-sm font-semibold text-foreground">Query details</h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Close panel (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Panel Content */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar-thin">
              {/* Query Pattern Section */}
              <div className="px-5 py-4 border-b border-border/60">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-foreground">Query pattern</span>
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-md border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Copy SQL"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-primary" />
                        <span className="text-primary">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* SQL Code Block */}
                <div className="relative rounded-xl bg-background border border-border/60 overflow-hidden">
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-300",
                      expanded ? "max-h-[600px]" : "max-h-[200px]"
                    )}
                  >
                    <pre className="p-4 text-[11px] leading-relaxed font-mono overflow-x-auto whitespace-pre-wrap break-words select-all custom-scrollbar-thin">
                      {formatSql(selectedQuery.query)}
                    </pre>
                  </div>

                  {/* Collapse / Expand Button */}
                  <div className="flex justify-center border-t border-border/40 bg-background/80">
                    <button
                      onClick={() => setExpanded((prev) => !prev)}
                      className="flex items-center gap-1.5 text-[10px] py-1.5 px-4 text-muted-foreground hover:text-foreground transition-colors w-full justify-center hover:bg-white/5"
                    >
                      {expanded ? (
                        <>
                          <ChevronUp className="h-3 w-3" />
                          Collapse
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3" />
                          Expand
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Metadata Section */}
              <div className="px-5 py-4">
                <h4 className="text-xs font-semibold text-foreground mb-1">Metadata</h4>
                <div>
                  <MetadataRow
                    label="Time consumed"
                    value={
                      <>
                        {selectedQuery.totalTimePercent !== undefined && (
                          <span className="text-muted-foreground mr-1.5">
                            {selectedQuery.totalTimePercent.toFixed(1)}% /
                          </span>
                        )}
                        {formatMs(selectedQuery.totalTimeMs)}
                      </>
                    }
                  />
                  <MetadataRow
                    label="Calls"
                    value={selectedQuery.calls.toLocaleString()}
                  />
                  <MetadataRow
                    label="Max time"
                    value={formatMs(selectedQuery.maxTimeMs)}
                  />
                  <MetadataRow
                    label="Mean time"
                    value={formatMs(selectedQuery.meanTimeMs)}
                  />
                  <MetadataRow
                    label="Min time"
                    value={formatMs(selectedQuery.minTimeMs)}
                  />
                  <MetadataRow
                    label="Rows processed"
                    value={selectedQuery.rows.toLocaleString()}
                  />
                  <MetadataRow
                    label="Cache hit rate"
                    value={`${selectedQuery.cacheHitRate.toFixed(2)}%`}
                    valueClassName={
                      selectedQuery.cacheHitRate >= 99
                        ? "text-primary"
                        : selectedQuery.cacheHitRate >= 95
                        ? "text-amber-500"
                        : "text-destructive"
                    }
                  />
                  <MetadataRow
                    label="Role"
                    value={
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-semibold">
                        {selectedQuery.role}
                      </span>
                    }
                  />
                  <MetadataRow
                    label="Application"
                    value={
                      <span className="text-muted-foreground">n/a</span>
                    }
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

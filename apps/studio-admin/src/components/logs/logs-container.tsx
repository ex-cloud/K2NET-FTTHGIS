"use client";

import { useState, useMemo, useEffect } from "react";
import React from "react";
import {
  Button,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  UniversalContextMenu,
  ContextMenuGroupConfig,
  ActionTooltip,
} from "@k2net/ui";
import {
  Terminal,
  Copy,
  Check,
  X,
  FileCode,
  Building2,
  Cpu,
  Server,
  Globe,
  Shield,
  Send,
  Database,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  type ColumnDef,
  type VisibilityState,
} from "@tanstack/react-table";
import { useAuditLogStream, AuditStreamEntry, LOG_GROUPS } from "@/hooks/use-audit-log-stream";
import { useLogsFilter } from "@/components/logs/logs-filter-context";
import { LogsTopHeader } from "@/components/logs/logs-top-header";
import { LogsHistogram, buildHistogramData } from "@/components/logs/logs-histogram";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSourceIcon(source: string) {
  const src = source.toLowerCase();
  if (src.includes("kong") || src.includes("edge")) {
    return <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
  }
  if (src.includes("keycloak") || src.includes("auth")) {
    return <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
  }
  if (src.includes("notification") || src.includes("whatsapp") || src.includes("sms")) {
    return <Send className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
  }
  if (src.includes("db") || src.includes("postgres")) {
    return <Database className="w-3.5 h-3.5 text-primary/80 shrink-0" />;
  }
  if (src.includes("backend")) {
    return <Server className="w-3.5 h-3.5 text-violet-400 shrink-0" />;
  }
  return <Cpu className="w-3.5 h-3.5 text-muted-foreground shrink-0" />;
}

function getEventMessageDisplay(log: AuditStreamEntry): string {
  const parts: (string | undefined | null)[] = [
    log.actor !== "system" ? log.actor : null,
    log.ip ? `IP:${log.ip}` : null,
    log.message ?? null,
  ];
  return parts.filter(Boolean).join(" | ");
}

function getLevel(log: AuditStreamEntry): "error" | "warning" | "success" {
  const s = log.severity?.toUpperCase();
  if (s === "ERROR" || s === "CRITICAL") return "error";
  if (s === "WARN" || s === "WARNING") return "warning";
  return "success";
}

/**
 * Computes date details in Supabase style
 * Returns UTC, Local (with time zone name), Relative, and raw Timestamp
 */
function getDetailedTime(timestampStr: string) {
  const d = new Date(timestampStr);
  if (isNaN(d.getTime())) {
    return { utc: "—", local: "—", tzName: "Local", relative: "—", timestamp: "—" };
  }

  // Format UTC: "dd MMM yy HH:mm:ss" in UTC timezone
  const utcFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
  const utcStr = utcFormatter.format(d).replace(",", "");

  // Format Local: "dd MMM yy HH:mm:ss" in local browser timezone
  const localFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const localStr = localFormatter.format(d).replace(",", "");

  // Get local timezone name (like "Asia/Jakarta") or default to "Local"
  let tzName = "Local";
  try {
    tzName = Intl.DateTimeFormat().resolvedOptions().timeZone || "Local";
  } catch {}

  // Relative time
  let relativeStr = "";
  const diffMs = Date.now() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 5) {
    relativeStr = "just now";
  } else if (diffSecs < 60) {
    relativeStr = `${diffSecs} seconds ago`;
  } else if (diffMins < 60) {
    relativeStr = `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  } else if (diffHours < 24) {
    relativeStr = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  } else {
    relativeStr = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  }

  return {
    utc: utcStr,
    local: localStr,
    tzName,
    relative: relativeStr,
    timestamp: String(d.getTime()),
  };
}

// Column definitions for TanStack Table
const columnHelper = createColumnHelper<AuditStreamEntry>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LOG_COLUMNS: ColumnDef<AuditStreamEntry, any>[] = [
  columnHelper.accessor("timestamp", {
    id: "date",
    meta: { label: "Date" },
    enableHiding: true,
  }),
  columnHelper.accessor("serviceSource", {
    id: "source",
    meta: { label: "Source" },
    enableHiding: true,
  }),
  columnHelper.accessor("status", {
    id: "status",
    meta: { label: "Status" },
    enableHiding: true,
  }),
  columnHelper.accessor("tenantSlug", {
    id: "tenant",
    meta: { label: "Tenant" },
    enableHiding: true,
  }),
  columnHelper.accessor("method", {
    id: "method",
    meta: { label: "Method" },
    enableHiding: true,
  }),
  columnHelper.accessor("pathname", {
    id: "pathname",
    meta: { label: "Pathname" },
    enableHiding: true,
  }),
  columnHelper.accessor("message", {
    id: "message",
    meta: { label: "Event Message" },
    enableHiding: true,
  }),
];

export function LogsContainer() {
  const {
    searchQuery,
    showHistogram,
    selectedLog,
    setSelectedLog,
    isLivePaused,
    selectedTypes,
    selectedLevels,
    setLogTypeCounts,
    tenantFilter,
    timeRange,
    advancedFilters,
  } = useLogsFilter();

  const { logs, rawLogs, totalCount, hasAnyTypeSelected, clearLogs } =
    useAuditLogStream("all", {
      isPaused: isLivePaused,
      selectedTypes,
      timeRange,
    });

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const logTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const log of rawLogs) {
      counts[log.logType] = (counts[log.logType] ?? 0) + 1;
    }
    return counts;
  }, [rawLogs]);

  useEffect(() => {
    setLogTypeCounts(logTypeCounts);
  }, [logTypeCounts, setLogTypeCounts]);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredLogs = useMemo(() => {
    let result = logs;

    if (tenantFilter.trim()) {
      const tf = tenantFilter.toLowerCase().trim();
      result = result.filter(
        (log) => (log.tenantSlug ?? "").toLowerCase().includes(tf)
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (log) =>
          log.message?.toLowerCase().includes(q) ||
          log.action?.toLowerCase().includes(q) ||
          log.actor?.toLowerCase().includes(q) ||
          log.timestamp?.toLowerCase().includes(q) ||
          log.tenantSlug?.toLowerCase().includes(q) ||
          log.serviceSource?.toLowerCase().includes(q)
      );
    }

    // Apply level filter if not all levels are active
    const allLevelsActive = Object.values(selectedLevels).every(Boolean);
    if (!allLevelsActive) {
      result = result.filter((log) => {
        const level = getLevel(log);
        return !!selectedLevels[level];
      });
    }

    for (const f of advancedFilters) {
      result = result.filter((log) => {
        let raw = "";
        if (f.field === "logType") {
          raw = log.logType;
        } else if (f.field === "level") {
          raw = getLevel(log);
        } else {
          raw = String(log[f.field as keyof AuditStreamEntry] ?? "");
        }
        const val = raw.toLowerCase();
        const target = f.value.toLowerCase();
        switch (f.operator) {
          case "eq":           return val === target;
          case "neq":          return val !== target;
          case "contains":     return val.includes(target);
          case "not_contains": return !val.includes(target);
          case "starts_with":  return val.startsWith(target);
          case "ends_with":    return val.endsWith(target);
          default:             return true;
        }
      });
    }

    return result;
  }, [logs, searchQuery, tenantFilter, selectedLevels, advancedFilters]);

  // Histogram always uses raw (unfiltered) logs so it shows total activity
  // even when the type/level filter returns zero results.
  const histogramData = useMemo(() => buildHistogramData(rawLogs), [rawLogs]);

  const table = useReactTable({
    data: filteredLogs,
    columns: LOG_COLUMNS,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleCopyLog = (log: AuditStreamEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopiedId(log.id);
    toast.success("Log JSON copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getLogContextMenuGroups = (log: AuditStreamEntry): ContextMenuGroupConfig[] => [
    {
      items: [
        {
          label: "Tanya AI Analisis Log Ini",
          icon: Sparkles,
          shortcut: "Ctrl+J",
          onClick: () => {
            window.dispatchEvent(
              new CustomEvent("k2net-ai-prompt-input", {
                detail: {
                  prompt: `Analisis event log [${log.serviceSource || "system"}] ${log.method || ""} ${log.pathname || ""}: "${log.message || log.action || ""}". Status: ${log.status || "-"}, Tenant: ${log.tenantSlug || "global"}. Identifikasi potensi masalah atau anomali.`,
                },
              })
            );
            window.dispatchEvent(new CustomEvent("k2net-toggle-ai-assistant"));
          },
        },
        {
          label: selectedLog?.id === log.id ? "Tutup Detail Panel" : "Buka Detail Panel",
          icon: FileCode,
          shortcut: "Enter",
          onClick: () => setSelectedLog(selectedLog?.id === log.id ? null : log),
        },
      ],
    },
    {
      items: [
        {
          label: "Salin Log JSON",
          icon: Copy,
          shortcut: "Ctrl+C",
          onClick: () => {
            navigator.clipboard.writeText(JSON.stringify(log, null, 2));
            toast.success("Log event JSON disalin ke clipboard!");
          },
        },
        {
          label: "Salin Event ID / Trace ID",
          icon: Copy,
          shortcut: "Alt+C",
          onClick: () => {
            const id = (log as any).traceId || (log as any).requestId || log.id || "";
            navigator.clipboard.writeText(id);
            toast.success(`ID ${id} disalin ke clipboard!`);
          },
        },
        {
          label: "Salin Pathname URL",
          icon: Globe,
          shortcut: "Alt+P",
          onClick: () => {
            if (log.pathname) {
              navigator.clipboard.writeText(log.pathname);
              toast.success(`Path ${log.pathname} disalin!`);
            }
          },
          disabled: !log.pathname,
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-background font-mono text-xs overflow-hidden select-none">
      <LogsTopHeader
        filteredLogs={filteredLogs}
        clearLogs={clearLogs}
        table={table}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
      />

      {showHistogram && (
        <div className="bg-muted/20 border-b border-border/60 shrink-0">
          <LogsHistogram data={histogramData} />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Table column header - fixed widths must match row cells exactly */}
        <div className="flex items-center px-4 py-2 bg-muted/50 border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0 font-mono">
          {/* Checkbox */}
          <div className="w-[42px] shrink-0 flex items-center">
            <input
              type="checkbox"
              className="w-3.5 h-3.5 rounded border-border text-primary accent-primary cursor-pointer"
            />
          </div>
          {/* Level dot placeholder */}
          <div className="w-[16px] mr-2 shrink-0" />
          {table.getAllLeafColumns().filter(c => c.getIsVisible()).map((col) => {
            const label = (col.columnDef.meta as { label?: string })?.label ?? col.id;
            if (col.id === "date")     return <div key={col.id} className="w-[148px] shrink-0">{label}</div>;
            // Source: blank space header
            if (col.id === "source")   return <div key={col.id} className="w-[28px] shrink-0" />;
            // Status: blank space header + copy spacer
            if (col.id === "status")   return (
              <React.Fragment key={col.id}>
                <div className="w-[52px] shrink-0" />
                {/* Spacer for copy button that appears in rows */}
                <div className="w-7 shrink-0" />
              </React.Fragment>
            );
            // Tenant: text only (no icon)
            if (col.id === "tenant")   return <div key={col.id} className="w-[88px] shrink-0">{label}</div>;
            if (col.id === "method")   return <div key={col.id} className="w-[56px] shrink-0">{label}</div>;
            if (col.id === "pathname") return <div key={col.id} className="w-[140px] shrink-0">{label}</div>;
            if (col.id === "message")  return <div key={col.id} className="flex-1 min-w-0">{label}</div>;
            return <div key={col.id} className="shrink-0 px-1">{label}</div>;
          })}
        </div>

        {/* Rows feed - overflow-x-hidden prevents horizontal scrollbar */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden divide-y divide-border/30 custom-scrollbar-thin">
          {!hasAnyTypeSelected ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
              <Terminal className="w-10 h-10 opacity-20 text-primary" />
              <p className="font-semibold text-foreground text-xs font-sans">No log type selected</p>
              <p className="text-[11px] text-muted-foreground/60 font-sans">
                Select at least one Log Type from the left filter panel.
              </p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
              <Terminal className="w-10 h-10 opacity-20 text-primary" />
              <p className="font-semibold text-foreground text-xs font-sans">
                No matching events
              </p>
              <p className="text-[11px] text-muted-foreground/60 font-sans text-center max-w-[260px]">
                {totalCount > 0
                  ? `${totalCount} raw event${totalCount !== 1 ? "s" : ""} exist — try adjusting the type, level, or time-range filter.`
                  : "No events received yet. Check your log sources or wait for new events."}
              </p>
            </div>
          ) : (
            filteredLogs.map((log: AuditStreamEntry) => {
              const isSelected = selectedLog?.id === log.id;
              const level = getLevel(log);
              const isError = level === "error";
              const isWarn = level === "warning";

              let formattedDate = log.timestamp ?? "";
              try {
                formattedDate = format(new Date(log.timestamp), "dd MMM yy HH:mm:ss");
              } catch {}

              const timeDetails = getDetailedTime(log.timestamp ?? "");

              const statusNum = typeof log.status === "number"
                ? log.status
                : log.status ? parseInt(String(log.status)) : undefined;
              const statusColor = statusNum
                ? statusNum >= 500 ? "text-rose-400"
                : statusNum >= 400 ? "text-amber-400"
                : statusNum >= 200 ? "text-primary/80"
                : "text-muted-foreground/50"
                : "text-muted-foreground/30";

              const methodColor =
                log.method === "POST" ? "text-sky-400 bg-sky-500/10 border-sky-500/20"
                : log.method === "PUT" || log.method === "PATCH" ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                : log.method === "DELETE" ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
                : log.method === "GET" ? "text-primary/80 bg-primary/10 border-primary/20"
                : "text-muted-foreground/60 bg-muted/20 border-border/30";

              const visibleCols = new Set(
                table.getAllLeafColumns().filter(c => c.getIsVisible()).map(c => c.id)
              );

              return (
                <UniversalContextMenu key={log.id} groups={getLogContextMenuGroups(log)}>
                  <div
                    onClick={() => setSelectedLog(isSelected ? null : log)}
                    className={`flex items-center px-4 py-1.5 font-mono text-[11px] transition-colors cursor-pointer group ${
                      isSelected
                        ? "bg-primary/10 text-foreground border-l-2 border-primary"
                        : "hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {/* Checkbox */}
                    <div className="w-[42px] shrink-0 flex items-center">
                      <input type="checkbox" onClick={(e) => e.stopPropagation()}
                        className="w-3.5 h-3.5 rounded border-border text-primary accent-primary cursor-pointer" />
                    </div>

                    {/* Level dot */}
                    <div className="w-[16px] mr-2 shrink-0 flex items-center justify-center">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        isError ? "bg-rose-500" : isWarn ? "bg-amber-500" : "bg-primary/70"
                      }`} />
                    </div>

                    {/* Date Column with Supabase-style Date details Tooltip */}
                    {visibleCols.has("date") && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="w-[148px] shrink-0 text-muted-foreground text-[11px] font-mono flex items-center cursor-default outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 border-none select-none">
                              {formattedDate}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="z-50 p-3 bg-popover border border-border text-foreground font-mono text-[10px] rounded-lg shadow-xl w-[260px] select-none [&_svg]:!hidden">
                            <div className="space-y-1.5">
                              <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground font-semibold">UTC</span>
                                <span className="text-right font-medium">{timeDetails.utc}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground font-semibold">{timeDetails.tzName}</span>
                                <span className="text-right font-medium">{timeDetails.local}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground font-semibold">Relative</span>
                                <span className="text-right font-medium">{timeDetails.relative}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground font-semibold">Timestamp</span>
                                <span className="text-right font-medium">{timeDetails.timestamp}</span>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    {/* Source Column — icon only in narrow w-[28px], full badge tooltip on hover */}
                    {visibleCols.has("source") && (
                      <div className="w-[28px] shrink-0 flex items-center justify-center">
                        {log.serviceSource ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="flex items-center justify-center cursor-default outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 border-none select-none">
                                  {getSourceIcon(log.serviceSource)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-[11px] font-mono px-2 py-1.5 bg-popover border border-border text-foreground [&_svg]:!hidden">
                                <span className="flex items-center gap-1.5">
                                  {getSourceIcon(log.serviceSource)}
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${
                                    log.logGroup
                                      ? `${LOG_GROUPS[log.logGroup]?.color ?? "text-muted-foreground"} ${LOG_GROUPS[log.logGroup]?.accentBg ?? "bg-muted/20"} border-current/20`
                                      : "text-muted-foreground/60 bg-muted/20 border-border/30"
                                  }`}>
                                    {log.serviceSource}
                                  </span>
                                </span>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-muted-foreground/20">—</span>
                        )}
                      </div>
                    )}

                     {/* Status Column + Copy Icon */}
                    {visibleCols.has("status") && (
                      <React.Fragment>
                        <div className="w-[52px] shrink-0">
                          {statusNum ? (
                            <span className={`font-mono text-[11px] font-semibold ${statusColor}`}>{statusNum}</span>
                          ) : (
                            <span className="text-muted-foreground/20">—</span>
                          )}
                        </div>
                        {/* Copy Icon — occupies w-7 space to keep alignment */}
                        <button onClick={(e) => handleCopyLog(log, e)} title="Copy Log JSON"
                          className="w-7 shrink-0 flex items-center justify-center p-0.5 rounded hover:bg-muted/80 text-muted-foreground/60 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          {copiedId === log.id
                            ? <Check className="w-3.5 h-3.5 text-primary" />
                            : <Copy className="w-3.5 h-3.5" />
                          }
                        </button>
                      </React.Fragment>
                    )}

                    {/* Tenant Column — no dash separator */}
                    {visibleCols.has("tenant") && (
                      <div className="w-[88px] shrink-0 font-mono text-[10px] truncate">
                        {log.tenantSlug ? (
                          <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary/80 font-mono text-[9px] border border-primary/20">
                            {log.tenantSlug}
                          </span>
                        ) : <span className="text-muted-foreground/20">—</span>}
                      </div>
                    )}

                    {/* Method Column */}
                    {visibleCols.has("method") && (
                      <div className="w-[56px] shrink-0">
                        {log.method ? (
                          <span className={`px-1 py-0.5 rounded text-[9px] font-mono font-bold border ${methodColor}`}>
                            {log.method}
                          </span>
                        ) : <span className="text-muted-foreground/20">—</span>}
                      </div>
                    )}

                    {/* Pathname Column */}
                    {visibleCols.has("pathname") && (
                      <div className="w-[140px] shrink-0 font-mono text-[10px] truncate text-muted-foreground/80">
                        {log.pathname ? (
                          <span title={log.pathname}>{log.pathname}</span>
                        ) : <span className="text-muted-foreground/20">—</span>}
                      </div>
                    )}

                    {/* Event Message Column */}
                    {visibleCols.has("message") && (
                      <div className="flex-1 min-w-0 truncate font-mono text-[11px]">
                        <span className={
                          isError ? "text-rose-400" : isWarn ? "text-amber-400" : "text-foreground/90"
                        }>
                          {getEventMessageDisplay(log)}
                        </span>
                      </div>
                    )}
                  </div>
                </UniversalContextMenu>
              );
            })
          )}
        </div>

        {/* Bottom status bar */}
        <div className="px-6 py-2 border-t border-border bg-muted/20 flex items-center justify-between text-[10px] text-muted-foreground font-mono shrink-0">
          <span>
            {isLivePaused
              ? `⏸ Paused — ${filteredLogs.length} of ${totalCount} events buffered`
              : `● Live — ${filteredLogs.length} of ${totalCount} events matching`}
          </span>
          <div className="flex items-center gap-2">
            {isLivePaused ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Stream Paused</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span>Kong API Gateway Ingestion Active</span>
              </>
            )}
          </div>
        </div>

        {/* Detail drawer */}
        {selectedLog && (
          <div className="absolute right-0 top-0 h-full w-96 bg-card border-l border-border flex flex-col z-20 shadow-2xl animate-in slide-in-from-right duration-250">
            <div className="p-3 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-primary" />
                <span className="font-bold text-foreground font-sans text-sm">Log Details</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLog(null)}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Event ID</label>
                <p className="text-foreground bg-muted/40 p-2 rounded border border-border/50 text-[10px] break-all font-mono">
                  {selectedLog.id}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Level</label>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      getLevel(selectedLog) === "error"
                        ? "bg-rose-500"
                        : getLevel(selectedLog) === "warning"
                        ? "bg-amber-500"
                        : "bg-primary/70"
                    }`}
                  />
                  <span className="text-foreground capitalize text-xs font-mono">
                    {getLevel(selectedLog)}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Action / Type</label>
                <p className="text-primary font-bold text-xs font-mono">{selectedLog.action}</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Actor</label>
                <p className="text-foreground text-xs font-mono">{selectedLog.actor}</p>
              </div>

              {selectedLog.tenantSlug && (
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Tenant</label>
                  <p className="text-foreground font-mono text-xs inline-flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 text-primary" />
                    {selectedLog.tenantSlug}
                  </p>
                </div>
              )}

              {selectedLog.serviceSource && (
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Service Source</label>
                  <p className="text-foreground font-mono text-xs inline-flex items-center gap-1.5">
                    {getSourceIcon(selectedLog.serviceSource)}
                    {selectedLog.serviceSource}
                  </p>
                </div>
              )}

              {selectedLog.logGroup && (
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Log Group</label>
                  <p className={`font-mono text-xs font-semibold ${LOG_GROUPS[selectedLog.logGroup]?.color ?? "text-muted-foreground"}`}>
                    {LOG_GROUPS[selectedLog.logGroup]?.label ?? selectedLog.logGroup}
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Timestamp</label>
                <p className="text-foreground font-mono text-xs">{selectedLog.timestamp}</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Event Message</label>
                <p className="text-foreground bg-muted/30 p-2 rounded border border-border/50 text-[10px] break-all font-mono">
                  {selectedLog.message}
                </p>
              </div>

              {(selectedLog.method || selectedLog.status || selectedLog.pathname || selectedLog.ip) && (
                <div className="space-y-2">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">HTTP Request</label>
                  <div className="bg-muted/30 p-2 rounded border border-border/50 space-y-1.5">
                    {selectedLog.method && (
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground w-16 shrink-0">Method</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          selectedLog.method === "POST" ? "text-sky-400 bg-sky-500/10 border-sky-500/20"
                          : selectedLog.method === "DELETE" ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
                          : selectedLog.method === "PUT" || selectedLog.method === "PATCH" ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                          : "text-primary/80 bg-primary/10 border-primary/20"
                        }`}>{selectedLog.method}</span>
                      </div>
                    )}
                    {selectedLog.status && (
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground w-16 shrink-0">Status</span>
                        <span className={`font-mono text-[11px] font-semibold ${
                          Number(selectedLog.status) >= 500 ? "text-rose-400"
                          : Number(selectedLog.status) >= 400 ? "text-amber-400"
                          : "text-primary/80"
                        }`}>{selectedLog.status}</span>
                      </div>
                    )}
                    {selectedLog.pathname && (
                      <div className="flex items-start gap-2">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground w-16 shrink-0 mt-0.5">Path</span>
                        <span className="font-mono text-[10px] text-foreground break-all">{selectedLog.pathname}</span>
                      </div>
                    )}
                    {selectedLog.ip && (
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground w-16 shrink-0">IP</span>
                        <span className="font-mono text-[10px] text-foreground">{selectedLog.ip}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Raw JSON Payload</label>
                <pre className="bg-background p-3 rounded border border-border text-[10px] text-foreground/80 overflow-x-auto whitespace-pre-wrap font-mono">
                  {JSON.stringify(selectedLog, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-3 border-t border-border bg-muted/20 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => handleCopyLog(selectedLog, e as any)}
                className="w-full text-xs font-mono gap-1.5 h-8"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Raw Event JSON
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo, useEffect } from "react";
import { Button, Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@k2net/ui";
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
} from "lucide-react";
import { format } from "date-fns";
import { useAuditLogStream, AuditStreamEntry, LOG_GROUPS } from "@/hooks/use-audit-log-stream";
import { SystemHealthWrapper } from "@/components/page-guards/system-health-wrapper";
import { useLogsFilter } from "@/components/logs/logs-filter-context";
import { LogsTopHeader } from "@/components/logs/logs-top-header";
import { LogsHistogram, buildHistogramData } from "@/components/logs/logs-histogram";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSourceIcon(source: string) {
  const src = source.toLowerCase();
  if (src.includes("kong") || src.includes("edge")) {
    return <Globe className="w-3.5 h-3.5 text-indigo-400" />;
  }
  if (src.includes("keycloak") || src.includes("auth")) {
    return <Shield className="w-3.5 h-3.5 text-amber-400" />;
  }
  if (src.includes("notification") || src.includes("whatsapp") || src.includes("sms")) {
    return <Send className="w-3.5 h-3.5 text-sky-400" />;
  }
  if (src.includes("db") || src.includes("postgres")) {
    return <Database className="w-3.5 h-3.5 text-emerald-400" />;
  }
  if (src.includes("backend")) {
    return <Server className="w-3.5 h-3.5 text-violet-400" />;
  }
  return <Cpu className="w-3.5 h-3.5 text-muted-foreground" />;
}

/**
 * Format a log entry's event_message in Supabase style.
 * Since method/pathname/status are now separate columns, this shows
 * just actor + message (and any extra context not in those columns).
 */
function getEventMessageDisplay(log: AuditStreamEntry): string {
  const parts: (string | undefined | null)[] = [
    log.actor !== "system" ? log.actor : null,
    log.ip ? `IP:${log.ip}` : null,
    log.message ?? null,
  ];
  return parts.filter(Boolean).join(" | ");
}

/** Determine level from log severity */
function getLevel(log: AuditStreamEntry): "error" | "warning" | "success" {
  const s = log.severity?.toUpperCase();
  if (s === "ERROR" || s === "CRITICAL") return "error";
  if (s === "WARN" || s === "WARNING") return "warning";
  return "success";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GlobalLogsPage() {
  const {
    searchQuery,
    showHistogram,
    selectedLog,
    setSelectedLog,
    isLivePaused,
    selectedTypes,
    setLogTypeCounts,
    tenantFilter,
    timeRange,
  } = useLogsFilter();

  // Pass isPaused, selectedTypes, and timeRange into the hook
  const { logs, rawLogs, totalCount, hasAnyTypeSelected, clearLogs } =
    useAuditLogStream("all", {
      isPaused: isLivePaused,
      selectedTypes,
      timeRange,
    });

  // Compute per-type counts from ALL raw logs (unfiltered by type)
  // so sidebar badges reflect what’s in the stream regardless of checkboxes
  const logTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const log of rawLogs) {
      counts[log.logType] = (counts[log.logType] ?? 0) + 1;
    }
    return counts;
  }, [rawLogs]);

  // Sync computed counts into context so LogsFilterSidebar can read them
  useEffect(() => {
    setLogTypeCounts(logTypeCounts);
  }, [logTypeCounts, setLogTypeCounts]);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Client-side free-text search + tenant filter
  const filteredLogs = useMemo(() => {
    let result = logs;

    // Tenant filter (Super Admin: empty = all tenants)
    if (tenantFilter.trim()) {
      const tf = tenantFilter.toLowerCase().trim();
      result = result.filter(
        (log) => (log.tenantSlug ?? "").toLowerCase().includes(tf)
      );
    }

    if (!searchQuery.trim()) return result;
    const q = searchQuery.toLowerCase();
    return result.filter(
      (log) =>
        log.message?.toLowerCase().includes(q) ||
        log.action?.toLowerCase().includes(q) ||
        log.actor?.toLowerCase().includes(q) ||
        log.timestamp?.toLowerCase().includes(q) ||
        log.tenantSlug?.toLowerCase().includes(q) ||
        log.serviceSource?.toLowerCase().includes(q)
    );
  }, [logs, searchQuery, tenantFilter]);

  // Histogram data — built from full log stream (not filtered)
  const histogramData = useMemo(() => buildHistogramData(logs), [logs]);

  const handleCopyLog = (log: AuditStreamEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopiedId(log.id);
    toast.success("Log JSON copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <SystemHealthWrapper>
      {/*
        NOTE: <LogsFilterSidebar> is intentionally NOT rendered here.
        It is already rendered by SystemSecondarySidebar in the layout
        whenever pathname includes /logs — rendering it here again would
        create a double-sidebar. The page owns only the main canvas.
      */}
      <div className="flex flex-col h-full w-full bg-background font-mono text-xs overflow-hidden select-none">

        {/* ── TOP HEADER BAR (full width) ── */}
        <LogsTopHeader filteredLogs={filteredLogs} clearLogs={clearLogs} />

        {/* ── HISTOGRAM (full width, recharts stacked bar) ── */}
        {showHistogram && (
          <div className="bg-muted/20 border-b border-border/60 shrink-0">
            <LogsHistogram data={histogramData} />
          </div>
        )}

        {/* ── LOG TABLE (flex-1, fills remaining canvas) ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

          {/* Table column header */}
          <div className="flex items-center px-4 py-2 bg-muted/50 border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0 font-mono">
            {/* Col 1: checkbox 42px */}
            <div className="w-[42px] shrink-0 flex items-center">
              <input
                type="checkbox"
                className="w-3.5 h-3.5 rounded border-border text-primary accent-primary cursor-pointer"
              />
            </div>
            {/* Col 2: level dot */}
            <div className="w-4 shrink-0" />
            {/* Col 3: date ~148px */}
            <div className="w-[148px] shrink-0">Date</div>
            {/* Col 4: status ~52px */}
            <div className="w-[52px] shrink-0">Status</div>
            {/* Col 5: copy icon spacer */}
            <div className="w-7 shrink-0" />
            {/* divider */}
            <span className="text-muted-foreground/30 mr-3">—</span>
            {/* Col 6: tenant ~88px */}
            <div className="w-[88px] shrink-0 flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              Tenant
            </div>
            {/* Col 7: source ~80px */}
            <div className="w-[80px] shrink-0 flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              Source
            </div>
            {/* Col 8: method ~56px */}
            <div className="w-[56px] shrink-0">Method</div>
            {/* Col 9: pathname ~140px */}
            <div className="w-[140px] shrink-0">Pathname</div>
            {/* Col 10: event message */}
            <div className="flex-1 min-w-0">Event Message</div>
          </div>

          {/* ── ROWS FEED ── */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/30 custom-scrollbar">

            {/* Empty state: no types selected */}
            {!hasAnyTypeSelected ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                <Terminal className="w-10 h-10 opacity-20 text-primary" />
                <p className="font-semibold text-foreground text-xs font-sans">No log type selected</p>
                <p className="text-[11px] text-muted-foreground/60 font-sans">
                  Select at least one Log Type from the left filter panel.
                </p>
              </div>
            ) : filteredLogs.length === 0 ? (
              /* Empty state: all filtered out */
              <div className="h-full flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                <Terminal className="w-10 h-10 opacity-20 text-primary" />
                <p className="font-semibold text-foreground text-xs font-sans">
                  No data to load (0 of {totalCount} rows)
                </p>
                <p className="text-[11px] text-muted-foreground/60 font-sans">
                  Try clearing the search or adjusting filters.
                </p>
              </div>
            ) : (
              filteredLogs.map((log: AuditStreamEntry) => {
                const isSelected = selectedLog?.id === log.id;
                const level = getLevel(log);
                const isError = level === "error";
                const isWarn = level === "warning";

                // Format timestamp: "28 Jul 26 02:17:01"
                let formattedDate = log.timestamp ?? "";
                try {
                  formattedDate = format(new Date(log.timestamp), "dd MMM yy HH:mm:ss");
                } catch { /* keep raw timestamp */ }

                // Status code color
                const statusNum = typeof log.status === "number"
                  ? log.status
                  : log.status ? parseInt(String(log.status)) : undefined;
                const statusColor = statusNum
                  ? statusNum >= 500 ? "text-rose-400"
                  : statusNum >= 400 ? "text-amber-400"
                  : statusNum >= 200 ? "text-emerald-400"
                  : "text-muted-foreground/50"
                  : "text-muted-foreground/30";

                // Method badge color
                const methodColor =
                  log.method === "POST" ? "text-sky-400 bg-sky-500/10 border-sky-500/20"
                  : log.method === "PUT" || log.method === "PATCH" ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                  : log.method === "DELETE" ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
                  : log.method === "GET" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                  : "text-muted-foreground/60 bg-muted/20 border-border/30";

                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(isSelected ? null : log)}
                    className={`flex items-center px-4 py-1.5 font-mono text-[11px] transition-colors cursor-pointer group ${
                      isSelected
                        ? "bg-primary/10 text-foreground border-l-2 border-primary"
                        : "hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {/* Col 1: Checkbox */}
                    <div className="w-[42px] shrink-0 flex items-center">
                      <input
                        type="checkbox"
                        onClick={(e) => e.stopPropagation()}
                        className="w-3.5 h-3.5 rounded border-border text-primary accent-primary cursor-pointer"
                      />
                    </div>

                    {/* Col 2: Level dot */}
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 mr-2 ${
                        isError
                          ? "bg-rose-500"
                          : isWarn
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                    />

                    {/* Col 3: Timestamp ~148px — with source icon tooltip */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="w-[148px] shrink-0 text-muted-foreground text-[11px] font-mono flex items-center gap-1.5 cursor-default">
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              {getSourceIcon(log.serviceSource)}
                            </span>
                            {formattedDate}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-[11px] font-mono px-2 py-1">
                          <span className="flex items-center gap-1.5">
                            {getSourceIcon(log.serviceSource)}
                            {log.serviceSource || "unknown"}
                          </span>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* Col 4: HTTP Status ~52px */}
                    <div className="w-[52px] shrink-0">
                      {statusNum ? (
                        <span className={`font-mono text-[11px] font-semibold ${statusColor}`}>
                          {statusNum}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/20">—</span>
                      )}
                    </div>

                    {/* Col 5: Copy icon */}
                    <button
                      onClick={(e) => handleCopyLog(log, e)}
                      title="Copy Log JSON"
                      className="w-7 shrink-0 flex items-center justify-center p-0.5 rounded hover:bg-muted/80 text-muted-foreground/60 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {copiedId === log.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Divider */}
                    <span className="text-muted-foreground/30 mr-3 shrink-0">—</span>

                    {/* Col 6: Tenant slug ~88px */}
                    <div className="w-[88px] shrink-0 font-mono text-[10px] truncate">
                      {log.tenantSlug ? (
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary/80 font-mono text-[9px] border border-primary/20">
                          {log.tenantSlug}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </div>

                    {/* Col 7: Service source ~80px */}
                    <div className="w-[80px] shrink-0 font-mono text-[10px] truncate">
                      {log.serviceSource ? (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${
                            log.logGroup
                              ? `${LOG_GROUPS[log.logGroup]?.color ?? "text-muted-foreground"} ${LOG_GROUPS[log.logGroup]?.accentBg ?? "bg-muted/20"} border-current/20`
                              : "text-muted-foreground/60 bg-muted/20 border-border/30"
                          }`}
                        >
                          {log.serviceSource.replace("gateway-", "").replace("-gateway", "")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </div>

                    {/* Col 8: HTTP Method ~56px */}
                    <div className="w-[56px] shrink-0">
                      {log.method ? (
                        <span className={`px-1 py-0.5 rounded text-[9px] font-mono font-bold border ${methodColor}`}>
                          {log.method}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/20">—</span>
                      )}
                    </div>

                    {/* Col 9: Pathname ~140px */}
                    <div className="w-[140px] shrink-0 font-mono text-[10px] truncate text-muted-foreground/80">
                      {log.pathname ? (
                        <span title={log.pathname}>{log.pathname}</span>
                      ) : (
                        <span className="text-muted-foreground/20">—</span>
                      )}
                    </div>

                    {/* Col 10: Event Message (flex-1, truncated) */}
                    <div className="flex-1 min-w-0 truncate font-mono text-[11px]">
                      <span
                        className={
                          isError
                            ? "text-rose-400"
                            : isWarn
                            ? "text-amber-400"
                            : "text-foreground/90"
                        }
                      >
                        {getEventMessageDisplay(log)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom status bar */}
          <div className="px-6 py-2 border-t border-border bg-muted/20 flex items-center justify-between text-[10px] text-muted-foreground font-mono shrink-0">
            <span>
              {isLivePaused
                ? `⏸ Paused — ${filteredLogs.length} rows buffered`
                : `No more data to load (${filteredLogs.length} of ${totalCount} rows)`}
            </span>
            <div className="flex items-center gap-2">
              {isLivePaused ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Stream Paused</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Kong API Gateway Ingestion Active</span>
                </>
              )}
            </div>
          </div>

          {/* ── DETAIL DRAWER (absolute slide-over, right side) ── */}
          {selectedLog && (
            <div className="absolute right-0 top-0 h-full w-96 bg-card border-l border-border flex flex-col z-20 shadow-2xl">
              {/* Drawer header */}
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

              {/* Drawer content */}
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
                          : "bg-emerald-500"
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
                      <Cpu className="w-3 h-3 text-primary" />
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

                {/* HTTP Request details */}
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
                            : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                          }`}>{selectedLog.method}</span>
                        </div>
                      )}
                      {selectedLog.status && (
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] uppercase tracking-wider text-muted-foreground w-16 shrink-0">Status</span>
                          <span className={`font-mono text-[11px] font-semibold ${
                            Number(selectedLog.status) >= 500 ? "text-rose-400"
                            : Number(selectedLog.status) >= 400 ? "text-amber-400"
                            : "text-emerald-400"
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
                  <pre className="bg-background p-3 rounded border border-border text-[10px] text-emerald-400 overflow-x-auto whitespace-pre-wrap font-mono">
                    {JSON.stringify(selectedLog, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Drawer footer */}
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
    </SystemHealthWrapper>
  );
}

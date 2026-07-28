"use client";

import { useState, useMemo } from "react";
import { Button } from "@k2net/ui";
import {
  Terminal,
  Copy,
  Check,
  X,
  FileCode,
} from "lucide-react";
import { format } from "date-fns";
import { useAuditLogStream, AuditStreamEntry } from "@/hooks/use-audit-log-stream";
import { SystemHealthWrapper } from "@/components/page-guards/system-health-wrapper";
import { useLogsFilter } from "@/components/logs/logs-filter-context";
import { LogsTopHeader } from "@/components/logs/logs-top-header";
import { LogsHistogram, buildHistogramData } from "@/components/logs/logs-histogram";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Format a log entry's event_message in Supabase style:
 * actor | METHOD | STATUS | IP | req_id | /pathname | @service/message
 */
function getEventMessageDisplay(log: AuditStreamEntry): string {
  const parts: (string | undefined | null)[] = [
    log.actor,
    (log as any).method ?? null,
    (log as any).status ? String((log as any).status) : null,
    (log as any).ip ?? null,
    (log as any).requestId ? `req-${(log as any).requestId}` : null,
    (log as any).pathname ?? null,
    (log as any).service
      ? `@${(log as any).service}`
      : log.message ?? null,
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
  } = useLogsFilter();

  // Pass isPaused & selectedTypes into the hook so:
  // 1. Interval stops when paused → no wasted CPU/network
  // 2. Empty state shown when no types selected
  const { logs, totalCount, hasAnyTypeSelected, clearLogs } =
    useAuditLogStream("all", {
      isPaused: isLivePaused,
      selectedTypes,
    });

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Client-side free-text search filter
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;
    const q = searchQuery.toLowerCase();
    return logs.filter(
      (log) =>
        log.message?.toLowerCase().includes(q) ||
        log.action?.toLowerCase().includes(q) ||
        log.actor?.toLowerCase().includes(q) ||
        log.timestamp?.toLowerCase().includes(q)
    );
  }, [logs, searchQuery]);

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
            {/* Col 3: date ~160px */}
            <div className="w-40 shrink-0">Date</div>
            {/* Col 4: copy icon spacer */}
            <div className="w-7 shrink-0" />
            {/* divider */}
            <span className="text-muted-foreground/30 mr-3">—</span>
            {/* Col 5: event message */}
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

                    {/* Col 2: Level dot — own column per Supabase audit */}
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 mr-2 ${
                        isError
                          ? "bg-rose-500"
                          : isWarn
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                    />

                    {/* Col 3: Timestamp ~160px */}
                    <span className="w-40 shrink-0 text-muted-foreground text-[11px] font-mono">
                      {formattedDate}
                    </span>

                    {/* Col 4: Copy icon (visible on row hover) */}
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

                    {/* Col 5: Event Message (flex-1, truncated) */}
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

                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Timestamp</label>
                  <p className="text-foreground font-mono text-xs">{selectedLog.timestamp}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Event Message</label>
                  <p className="text-foreground bg-muted/30 p-2 rounded border border-border/50 text-[10px] break-all font-mono">
                    {getEventMessageDisplay(selectedLog)}
                  </p>
                </div>

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

import React, { useState, useMemo, Component, useEffect, useRef, useCallback, type ErrorInfo, type ReactNode } from "react";
import { Terminal, RefreshCcw, AlertTriangle, Loader2 } from "lucide-react";
import { useReactTable, getCoreRowModel, type VisibilityState } from "@tanstack/react-table";
import { type AuditStreamEntry } from "@/hooks/use-audit-log-stream";
import { useLogsFilter } from "@/components/logs/logs-filter-context";
import { LogsTopHeader } from "@/components/logs/logs-top-header";
import { LogsHistogram, buildHistogramData, useAuditAnalyticsSummary } from "@/components/logs/logs-histogram";
import { toast } from "sonner";
import { Button } from "@k2net/ui";
import { LOG_COLUMNS } from "./logs-utils";
import { LogsRowItem } from "./logs-row-item";
import { LogsDetailDrawer } from "./logs-detail-drawer";
import { LogsEmergencyAlertBanner } from "./logs-emergency-alert-banner";

interface LogsErrorBoundaryProps {
  children: ReactNode;
}

interface LogsErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class LogsErrorBoundary extends Component<LogsErrorBoundaryProps, LogsErrorBoundaryState> {
  constructor(props: LogsErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): LogsErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[LogsContainer] Unhandled React error caught by boundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full p-8 text-center bg-background font-sans">
          <div className="rounded-2xl border border-border bg-card/70 p-6 shadow-lg backdrop-blur max-w-md w-full space-y-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-foreground">Log Stream Issue</h2>
            <p className="text-xs text-muted-foreground">
              {this.state.error?.message || "An unexpected error occurred while processing log entries."}
            </p>
            <Button
              onClick={this.handleReset}
              className="w-full text-xs font-semibold gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              Reset & Retry Stream
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  date: true,
  source: true,
  status: true,
  method: true,
  pathname: true,
  message: true,
  severity: false,
  group: false,
  tenant: false,
  scope: false,
  project: false,
};

function LogsTableHeader({
  columnVisibility,
  isAllSelected,
  isSomeSelected,
  onToggleSelectAll,
}: {
  columnVisibility: VisibilityState;
  isAllSelected?: boolean;
  isSomeSelected?: boolean;
  onToggleSelectAll?: () => void;
}) {
  const columns = [
    { id: "date", label: "Timestamp", width: "w-[140px]" },
    { id: "source", label: "", width: "w-[24px]" },
    { id: "severity", label: "Severity", width: "w-[68px]" },
    { id: "group", label: "Group", width: "w-[80px]" },
    { id: "status", label: "", width: "w-[44px]", withSpacer: true },
    { id: "tenant", label: "Tenant", width: "w-[80px]" },
    { id: "scope", label: "Scope", width: "w-[64px]" },
    { id: "project", label: "Project", width: "w-[88px]" },
    { id: "method", label: "Method", width: "w-[48px]" },
    { id: "pathname", label: "Path / Resource", width: "w-[200px]" },
    { id: "message", label: "Event Message & Actor", width: "flex-1 min-w-0" },
  ];

  return (
    <div className="flex items-center px-4 py-2 bg-muted/40 border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0 font-mono">
      <div className="w-[32px] shrink-0 flex items-center">
        <input
          type="checkbox"
          checked={!!isAllSelected}
          ref={(el) => {
            if (el) {
              el.indeterminate = !!isSomeSelected;
            }
          }}
          onChange={onToggleSelectAll}
          className="w-3.5 h-3.5 rounded border-border text-primary accent-primary cursor-pointer"
          title="Toggle select all"
        />
      </div>
      <div className="w-[14px] mr-2 shrink-0" />
      {columns.map((col) => {
        if (columnVisibility[col.id] === false) return null;
        return (
          <React.Fragment key={col.id}>
            <div className={`${col.width} shrink-0 truncate`}>{col.label}</div>
            {col.withSpacer && <div className="w-6 shrink-0" />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function LogsStatusBar({
  isLivePaused,
  isHistoricalMode,
  filteredCount,
  totalCount,
  selectedCount,
  hasMore,
  isLoadingMore,
  onClearSelection,
  onCopySelected,
}: {
  isLivePaused: boolean;
  isHistoricalMode: boolean;
  filteredCount: number;
  totalCount: number;
  selectedCount: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  onClearSelection?: () => void;
  onCopySelected?: () => void;
}) {
  return (
    <div className="px-6 py-2 border-t border-border bg-muted/20 flex items-center justify-between text-[10px] text-muted-foreground font-mono shrink-0">
      <div className="flex items-center gap-3">
        <span>
          {isHistoricalMode
            ? `🔬 Forensic Range: ${filteredCount} of ${totalCount} events loaded ${hasMore ? "(Scroll for more)" : "(All loaded)"}`
            : isLivePaused
            ? `⏸ Paused — ${filteredCount} of ${totalCount} events buffered`
            : `● Live Tail — ${filteredCount} of ${totalCount} events matching`}
        </span>
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 pl-3 border-l border-border/60">
            <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold">
              {selectedCount} selected
            </span>
            <button
              type="button"
              onClick={onCopySelected}
              className="text-foreground hover:text-primary transition-colors underline cursor-pointer"
            >
              Copy Selected JSON
            </button>
            <button
              type="button"
              onClick={onClearSelection}
              className="text-muted-foreground hover:text-rose-400 transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isLoadingMore && (
          <span className="flex items-center gap-1.5 text-primary text-[10px]">
            <Loader2 className="w-3 h-3 animate-spin shrink-0" />
            <span>Loading older logs...</span>
          </span>
        )}
        {isHistoricalMode ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 font-sans font-medium text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span>Forensic Mode</span>
          </span>
        ) : isLivePaused ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-sans font-medium text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Live Stream Paused</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/10 text-primary font-sans font-medium text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>Live Tail Active</span>
          </span>
        )}
      </div>
    </div>
  );
}

function LogsContainerContent() {
  const {
    filteredLogs,
    rawLogs,
    totalCount,
    refresh,
    selectedLog,
    setSelectedLog,
    isLivePaused,
    setIsLivePaused,
    showHistogram,
    tenantFilter,
    projectFilter,
    scopeFilter,
    selectedSeverities,
    searchQuery,
    timeRange,
    setTimeRange,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
  } = useLogsFilter();

  const { summaryBuckets } = useAuditAnalyticsSummary(timeRange, tenantFilter);

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(DEFAULT_COLUMN_VISIBILITY);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [dismissedWideRange, setDismissedWideRange] = useState(false);
  const [dismissedIncidentIds, setDismissedIncidentIds] = useState<Set<string>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);

  // Active Critical Incident Tracker (P.11)
  const activeIncident = useMemo(() => {
    const list = rawLogs.length > 0 ? rawLogs : filteredLogs;
    for (const log of list) {
      if (
        log.severity === "CRITICAL" &&
        !dismissedIncidentIds.has(log.id) &&
        !log.action.includes("IMPERSONATION_STARTED") &&
        !log.action.includes("IMPERSONATION_ENDED")
      ) {
        return log;
      }
    }
    return null;
  }, [rawLogs, filteredLogs, dismissedIncidentIds]);

  // Identify Historical Mode (> 24 hours or custom date range)
  const isHistoricalMode = useMemo(() => {
    if (timeRange.startsWith("custom:")) return true;
    if (timeRange === "7d" || timeRange === "14d" || timeRange === "30d" || timeRange === "60d" || timeRange === "90d") {
      return true;
    }
    return false;
  }, [timeRange]);

  // Check if active time range is wide (> 30 days)
  const isWideRange = useMemo(() => {
    if (timeRange === "30d" || timeRange === "60d" || timeRange === "90d") return true;
    if (timeRange.startsWith("custom:")) {
      const raw = timeRange.replace("custom:", "");
      const parts = raw.includes("_") ? raw.split("_") : raw.split("..");
      if (parts.length === 2) {
        const start = new Date(parts[0]).getTime();
        const end = new Date(parts[1]).getTime();
        if (!isNaN(start) && !isNaN(end) && end - start > 30 * 24 * 60 * 60 * 1000) {
          return true;
        }
      }
    }
    return false;
  }, [timeRange]);

  // Reset advisory dismissal when timeRange changes
  useEffect(() => {
    setDismissedWideRange(false);
  }, [timeRange]);

  // Is query broad (no specific narrowing filter applied)?
  const isQueryBroad = useMemo(() => {
    return (
      !tenantFilter &&
      !projectFilter &&
      scopeFilter === "ALL" &&
      Object.values(selectedSeverities).filter(Boolean).length === 0 &&
      !searchQuery.trim()
    );
  }, [tenantFilter, projectFilter, scopeFilter, selectedSeverities, searchQuery]);

  const showBreadthAdvisory = isWideRange && isQueryBroad && !dismissedWideRange;

  // Auto-pause live ingestion when entering Historical Mode to avoid viewport disruption
  useEffect(() => {
    if (isHistoricalMode && !isLivePaused) {
      setIsLivePaused(true);
    }
  }, [isHistoricalMode, isLivePaused, setIsLivePaused]);

  // Infinite Scroll Trigger using IntersectionObserver
  useEffect(() => {
    const sentinel = bottomSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          loadMore();
        }
      },
      { root: scrollContainerRef.current, threshold: 0.1, rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoading, loadMore]);

  const isAllSelected = filteredLogs.length > 0 && filteredLogs.every((l) => selectedRowIds.has(l.id));
  const isSomeSelected = filteredLogs.some((l) => selectedRowIds.has(l.id)) && !isAllSelected;

  const handleToggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(filteredLogs.map((l) => l.id)));
    }
  }, [isAllSelected, filteredLogs]);

  const handleToggleSelectRow = useCallback((id: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleCopySelected = useCallback(() => {
    const selectedLogs = filteredLogs.filter((l) => selectedRowIds.has(l.id));
    if (selectedLogs.length === 0) return;
    navigator.clipboard.writeText(JSON.stringify(selectedLogs, null, 2));
    toast.success(`Copied ${selectedLogs.length} selected log events to clipboard.`);
  }, [filteredLogs, selectedRowIds]);

  const histogramData = useMemo(() => {
    if (summaryBuckets && summaryBuckets.length > 0) {
      return summaryBuckets;
    }
    return buildHistogramData(filteredLogs.length > 0 ? filteredLogs : rawLogs, timeRange);
  }, [summaryBuckets, filteredLogs, rawLogs, timeRange]);

  const table = useReactTable({
    data: filteredLogs,
    columns: LOG_COLUMNS,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleCopyLog = useCallback((log: AuditStreamEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopiedId(log.id);
    toast.success("Log JSON copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const visibleCols = useMemo(() => {
    return new Set(table.getAllLeafColumns().filter((c) => c.getIsVisible()).map((c) => c.id));
  }, [table]);

  return (
    <div className="flex flex-col h-full w-full bg-background font-mono text-xs overflow-hidden select-none">
      <LogsTopHeader
        filteredLogs={filteredLogs}
        onRefresh={refresh}
        table={table}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
      />

      {showHistogram && (
        <div className="bg-muted/20 border-b border-border/60 shrink-0">
          <LogsHistogram
            data={histogramData}
            onSelectRange={(startIso, endIso) => {
              setTimeRange(`custom:${startIso}_${endIso}`);
            }}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <LogsEmergencyAlertBanner
          incident={activeIncident}
          onInvestigate={(inc) => setSelectedLog(inc)}
          onDismiss={(id) => setDismissedIncidentIds((prev) => new Set(prev).add(id))}
        />

        {showBreadthAdvisory && (
          <div className="flex items-center justify-between px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-500 text-[11px] font-mono shrink-0 select-none">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
              <span className="truncate">
                <strong className="font-semibold text-amber-500">Wide Historical Range Active (&gt; 30d):</strong> Querying large time boundaries without filters may scan multiple database partitions. Consider filtering by Tenant, Project, or Severity for faster forensic investigation.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDismissedWideRange(true)}
              className="text-amber-500/70 hover:text-amber-500 px-2 py-0.5 text-[10px] rounded hover:bg-amber-500/20 transition-colors ml-2 shrink-0 cursor-pointer"
              title="Dismiss advisory"
            >
              Dismiss
            </button>
          </div>
        )}

        <LogsTableHeader
          columnVisibility={columnVisibility}
          isAllSelected={isAllSelected}
          isSomeSelected={isSomeSelected}
          onToggleSelectAll={handleToggleSelectAll}
        />

        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden divide-y divide-border/30 custom-scrollbar-thin"
        >
          {filteredLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
              {isLoading ? (
                <>
                  <Loader2 className="w-8 h-8 text-primary animate-spin opacity-80" />
                  <p className="font-semibold text-foreground text-xs font-sans">Loading audit partition records...</p>
                  <p className="text-[11px] text-muted-foreground/60 font-sans text-center max-w-[280px]">
                    Executing partitioned range query against PostgreSQL 17...
                  </p>
                </>
              ) : (
                <>
                  <Terminal className="w-10 h-10 opacity-20 text-primary" />
                  <p className="font-semibold text-foreground text-xs font-sans">No matching events</p>
                  <p className="text-[11px] text-muted-foreground/60 font-sans text-center max-w-[260px]">
                    {totalCount > 0
                      ? `${totalCount} raw event${totalCount !== 1 ? "s" : ""} exist — try adjusting the type, level, or time-range filter.`
                      : "No events received yet. Check your log sources or wait for new events."}
                  </p>
                </>
              )}
            </div>
          ) : (
            <>
              {filteredLogs.map((log: AuditStreamEntry) => (
                <LogsRowItem
                  key={log.id}
                  log={log}
                  isSelected={selectedLog?.id === log.id}
                  isRowSelected={selectedRowIds.has(log.id)}
                  onToggleSelectRow={handleToggleSelectRow}
                  visibleCols={visibleCols}
                  copiedId={copiedId}
                  onSelect={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                  onCopyLog={handleCopyLog}
                />
              ))}

              {/* Bottom Sentinel for Infinite Scroll */}
              <div ref={bottomSentinelRef} className="py-3 flex items-center justify-center text-center">
                {isLoadingMore ? (
                  <div className="flex items-center gap-2 text-primary text-xs font-sans py-2">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>Loading next page batch...</span>
                  </div>
                ) : hasMore ? (
                  <button
                    type="button"
                    onClick={() => loadMore()}
                    className="text-xs text-muted-foreground hover:text-foreground underline font-sans py-1 cursor-pointer"
                  >
                    Scroll or click to load more older events...
                  </button>
                ) : filteredLogs.length > 50 ? (
                  <p className="text-[11px] text-muted-foreground/50 font-sans">
                    — End of active audit records ({filteredLogs.length} events loaded) —
                  </p>
                ) : null}
              </div>
            </>
          )}
        </div>

        <LogsStatusBar
          isLivePaused={isLivePaused}
          isHistoricalMode={isHistoricalMode}
          filteredCount={filteredLogs.length}
          totalCount={totalCount}
          selectedCount={selectedRowIds.size}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onClearSelection={() => setSelectedRowIds(new Set())}
          onCopySelected={handleCopySelected}
        />

        {selectedLog && (
          <LogsDetailDrawer
            selectedLog={selectedLog}
            onClose={() => setSelectedLog(null)}
            onCopyLog={handleCopyLog}
          />
        )}
      </div>
    </div>
  );
}

export function LogsContainer() {
  return (
    <LogsErrorBoundary>
      <LogsContainerContent />
    </LogsErrorBoundary>
  );
}

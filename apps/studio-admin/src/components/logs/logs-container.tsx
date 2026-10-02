import React, { useState, useMemo, useEffect, Component, type ErrorInfo, type ReactNode } from "react";
import { Terminal, RefreshCcw, AlertTriangle } from "lucide-react";
import { useReactTable, getCoreRowModel, type VisibilityState } from "@tanstack/react-table";
import { useAuditLogStream, type AuditStreamEntry } from "@/hooks/use-audit-log-stream";
import { useLogsFilter } from "@/components/logs/logs-filter-context";
import { LogsTopHeader } from "@/components/logs/logs-top-header";
import { LogsHistogram, buildHistogramData, useAuditAnalyticsSummary } from "@/components/logs/logs-histogram";
import { toast } from "sonner";
import { Button } from "@k2net/ui";
import { LOG_COLUMNS, filterAuditLogs } from "./logs-utils";
import { LogsRowItem } from "./logs-row-item";
import { LogsDetailDrawer } from "./logs-detail-drawer";

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
    { id: "date", label: "Timestamp", width: "w-[148px]" },
    { id: "source", label: "Src", width: "w-[28px]" },
    { id: "severity", label: "Severity", width: "w-[72px]" },
    { id: "group", label: "Group", width: "w-[88px]" },
    { id: "status", label: "Status", width: "w-[52px]", withSpacer: true },
    { id: "tenant", label: "Tenant", width: "w-[88px]" },
    { id: "scope", label: "Scope", width: "w-[72px]" },
    { id: "project", label: "Project", width: "w-[96px]" },
    { id: "method", label: "Method", width: "w-[56px]" },
    { id: "pathname", label: "Target / Resource", width: "w-[140px]" },
    { id: "message", label: "Event Details & Actor", width: "flex-1 min-w-0" },
  ];

  return (
    <div className="flex items-center px-4 py-2 bg-muted/50 border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0 font-mono">
      <div className="w-[42px] shrink-0 flex items-center">
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
      <div className="w-[16px] mr-2 shrink-0" />
      {columns.map((col) => {
        if (columnVisibility[col.id] === false) return null;
        return (
          <React.Fragment key={col.id}>
            <div className={`${col.width} shrink-0`}>{col.label}</div>
            {col.withSpacer && <div className="w-7 shrink-0" />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function LogsStatusBar({
  isLivePaused,
  filteredCount,
  totalCount,
  selectedCount,
  onClearSelection,
  onCopySelected,
}: {
  isLivePaused: boolean;
  filteredCount: number;
  totalCount: number;
  selectedCount: number;
  onClearSelection?: () => void;
  onCopySelected?: () => void;
}) {
  return (
    <div className="px-6 py-2 border-t border-border bg-muted/20 flex items-center justify-between text-[10px] text-muted-foreground font-mono shrink-0">
      <div className="flex items-center gap-3">
        <span>
          {isLivePaused
            ? `⏸ Paused — ${filteredCount} of ${totalCount} events buffered`
            : `● Live — ${filteredCount} of ${totalCount} events matching`}
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
  );
}

function LogsContainerContent() {
  const {
    searchQuery,
    showHistogram,
    selectedLog,
    setSelectedLog,
    isLivePaused,
    selectedTypes,
    selectedLevels,
    selectedSeverities,
    scopeFilter,
    projectFilter,
    setLogTypeCounts,
    setLevelCounts,
    setSeverityCounts,
    tenantFilter,
    timeRange,
    advancedFilters,
  } = useLogsFilter();

  const { logs = [], rawLogs = [], timeFilteredLogs = [], totalCount = 0, clearLogs } = useAuditLogStream("all", {
    isPaused: isLivePaused,
    selectedTypes,
    timeRange,
  });

  const { summaryBuckets } = useAuditAnalyticsSummary(timeRange, tenantFilter);

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  const scopedSourceLogs = useMemo(() => {
    return (timeFilteredLogs && timeFilteredLogs.length > 0 ? timeFilteredLogs : rawLogs) || [];
  }, [timeFilteredLogs, rawLogs]);

  const { logTypeCounts, levelCounts, severityCounts } = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    const lvlCounts: Record<string, number> = { success: 0, warning: 0, error: 0 };
    const sevCounts: Record<string, number> = { CRITICAL: 0, ERROR: 0, WARN: 0, INFO: 0 };

    for (const log of scopedSourceLogs) {
      if (!log) continue;
      const lt = log.logType || "backend";
      typeCounts[lt] = (typeCounts[lt] ?? 0) + 1;
      const lvl = (log.severity === "ERROR" || log.severity === "CRITICAL" || log.status === 500)
        ? "error"
        : (log.severity === "WARN" || (typeof log.status === "number" && log.status >= 400 && log.status < 500))
        ? "warning"
        : "success";
      lvlCounts[lvl] = (lvlCounts[lvl] ?? 0) + 1;
      const sev = (log.severity || "INFO").toUpperCase();
      sevCounts[sev] = (sevCounts[sev] ?? 0) + 1;
    }
    return { logTypeCounts: typeCounts, levelCounts: lvlCounts, severityCounts: sevCounts };
  }, [scopedSourceLogs]);

  useEffect(() => {
    setLogTypeCounts(logTypeCounts);
    setLevelCounts(levelCounts);
    setSeverityCounts(severityCounts);
  }, [logTypeCounts, levelCounts, severityCounts, setLogTypeCounts, setLevelCounts, setSeverityCounts]);

  const filteredLogs = useMemo(
    () =>
      filterAuditLogs(logs, searchQuery, tenantFilter, selectedLevels, advancedFilters, {
        selectedSeverities,
        scopeFilter,
        projectFilter,
      }),
    [logs, searchQuery, tenantFilter, selectedLevels, advancedFilters, selectedSeverities, scopeFilter, projectFilter]
  );

  const isAllSelected = filteredLogs.length > 0 && filteredLogs.every((l) => selectedRowIds.has(l.id));
  const isSomeSelected = filteredLogs.some((l) => selectedRowIds.has(l.id)) && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(filteredLogs.map((l) => l.id)));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopySelected = () => {
    const selectedLogs = filteredLogs.filter((l) => selectedRowIds.has(l.id));
    if (selectedLogs.length === 0) return;
    navigator.clipboard.writeText(JSON.stringify(selectedLogs, null, 2));
    toast.success(`Copied ${selectedLogs.length} selected log events to clipboard.`);
  };

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

  const handleCopyLog = (log: AuditStreamEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopiedId(log.id);
    toast.success("Log JSON copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const visibleCols = useMemo(() => {
    return new Set(table.getAllLeafColumns().filter((c) => c.getIsVisible()).map((c) => c.id));
  }, [table]);

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
        <LogsTableHeader
          columnVisibility={columnVisibility}
          isAllSelected={isAllSelected}
          isSomeSelected={isSomeSelected}
          onToggleSelectAll={handleToggleSelectAll}
        />

        <div className="flex-1 overflow-y-auto overflow-x-hidden divide-y divide-border/30 custom-scrollbar-thin">
          {filteredLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
              <Terminal className="w-10 h-10 opacity-20 text-primary" />
              <p className="font-semibold text-foreground text-xs font-sans">No matching events</p>
              <p className="text-[11px] text-muted-foreground/60 font-sans text-center max-w-[260px]">
                {totalCount > 0
                  ? `${totalCount} raw event${totalCount !== 1 ? "s" : ""} exist — try adjusting the type, level, or time-range filter.`
                  : "No events received yet. Check your log sources or wait for new events."}
              </p>
            </div>
          ) : (
            filteredLogs.map((log: AuditStreamEntry) => (
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
            ))
          )}
        </div>

        <LogsStatusBar
          isLivePaused={isLivePaused}
          filteredCount={filteredLogs.length}
          totalCount={totalCount}
          selectedCount={selectedRowIds.size}
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

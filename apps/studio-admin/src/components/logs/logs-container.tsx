import React, { useState, useMemo, useEffect } from "react";
import { Terminal } from "lucide-react";
import { useReactTable, getCoreRowModel, type VisibilityState } from "@tanstack/react-table";
import { useAuditLogStream, type AuditStreamEntry } from "@/hooks/use-audit-log-stream";
import { useLogsFilter } from "@/components/logs/logs-filter-context";
import { LogsTopHeader } from "@/components/logs/logs-top-header";
import { LogsHistogram, buildHistogramData } from "@/components/logs/logs-histogram";
import { toast } from "sonner";
import { LOG_COLUMNS, filterAuditLogs } from "./logs-utils";
import { LogsRowItem } from "./logs-row-item";
import { LogsDetailDrawer } from "./logs-detail-drawer";

function LogsTableHeader({ columnVisibility }: { columnVisibility: VisibilityState }) {
  const columns = [
    { id: "date", label: "Date", width: "w-[148px]" },
    { id: "source", label: "", width: "w-[28px]" },
    { id: "status", label: "", width: "w-[52px]", withSpacer: true },
    { id: "tenant", label: "Tenant", width: "w-[88px]" },
    { id: "method", label: "Method", width: "w-[56px]" },
    { id: "pathname", label: "Pathname", width: "w-[140px]" },
    { id: "message", label: "Event Message", width: "flex-1 min-w-0" },
  ];

  return (
    <div className="flex items-center px-4 py-2 bg-muted/50 border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0 font-mono">
      <div className="w-[42px] shrink-0 flex items-center">
        <input type="checkbox" className="w-3.5 h-3.5 rounded border-border text-primary accent-primary cursor-pointer" />
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
}: {
  isLivePaused: boolean;
  filteredCount: number;
  totalCount: number;
}) {
  return (
    <div className="px-6 py-2 border-t border-border bg-muted/20 flex items-center justify-between text-[10px] text-muted-foreground font-mono shrink-0">
      <span>
        {isLivePaused
          ? `⏸ Paused — ${filteredCount} of ${totalCount} events buffered`
          : `● Live — ${filteredCount} of ${totalCount} events matching`}
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
  );
}

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

  const { logs, rawLogs, totalCount, hasAnyTypeSelected, clearLogs } = useAuditLogStream("all", {
    isPaused: isLivePaused,
    selectedTypes,
    timeRange,
  });

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const filteredLogs = useMemo(
    () => filterAuditLogs(logs, searchQuery, tenantFilter, selectedLevels, advancedFilters),
    [logs, searchQuery, tenantFilter, selectedLevels, advancedFilters]
  );

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
        <LogsTableHeader columnVisibility={columnVisibility} />

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

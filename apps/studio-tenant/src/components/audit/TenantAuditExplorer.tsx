import * as React from "react";
import {
  LogsTableGridShell,
  LogsHistogramCore,
  LogsStatusBar,
  type LogsTableColumn,
  buildHistogramDataFromLogs,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { useTenantAudit, type UseTenantAuditOptions } from "../../hooks/useTenantAudit";
import { TenantLogsFilterSidebar } from "./TenantLogsFilterSidebar";
import { TenantLogsTopHeader } from "./TenantLogsTopHeader";
import { TenantLogsRowItem } from "./TenantLogsRowItem";
import { TenantAuditDetailDrawer } from "./TenantAuditDetailDrawer";
import type { TenantAuditEvent, TenantAuditScope } from "../../types/tenant-audit";

interface TenantAuditExplorerProps {
  scope: TenantAuditScope;
  projectId?: string;
  initialCategory?: string;
  title?: string;
  description?: string;
}

const DEFAULT_COLUMN_VISIBILITY: Record<string, boolean> = {
  date: true,
  status: true,
  method: true,
  pathname: true,
  message: true,
  actor: true,
  severity: false,
  scope: false,
};

const LOG_TABLE_COLUMNS: LogsTableColumn[] = [
  { id: "date", label: "TIMESTAMP", width: "w-[140px]" },
  { id: "status", label: "", width: "w-[44px]", withSpacer: true },
  { id: "method", label: "METHOD", width: "w-[48px]" },
  { id: "pathname", label: "PATH / RESOURCE", width: "w-[200px]" },
  { id: "message", label: "EVENT MESSAGE & ACTOR", width: "flex-1 min-w-0" },
  { id: "actor", label: "", width: "w-[200px]" },
];

export function TenantAuditExplorer({
  scope,
  projectId,
  initialCategory,
}: TenantAuditExplorerProps) {
  const { t } = useTranslation();
  const [autoRefreshMs, setAutoRefreshMs] = React.useState<number>(30000);
  const [selectedEvent, setSelectedEvent] = React.useState<TenantAuditEvent | null>(null);
  const [timeRange, setTimeRange] = React.useState<string>("24h");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState<boolean>(false);
  const [showHistogram, setShowHistogram] = React.useState<boolean>(true);
  const [columnVisibility, setColumnVisibility] = React.useState<Record<string, boolean>>(DEFAULT_COLUMN_VISIBILITY);
  const [selectedRowIds, setSelectedRowIds] = React.useState<Set<string>>(new Set());
  const [selectedSeverities, setSelectedSeverities] = React.useState<Set<string>>(new Set());
  const [activePreset, setActivePreset] = React.useState<string | null>(null);

  const auditOptions: UseTenantAuditOptions = React.useMemo(
    () => ({
      scope,
      projectId,
      initialCategory,
      autoRefreshInterval: autoRefreshMs,
    }),
    [scope, projectId, initialCategory, autoRefreshMs]
  );

  const {
    events,
    stats,
    isLoading,
    isFetching,
    totalElements,
    filters,
    setFilters,
    resetFilters,
    refetch,
    exportCsv,
    isExporting,
  } = useTenantAudit(auditOptions);

  // Toggle Severity in Filter
  const handleToggleSeverity = (sev: string) => {
    setSelectedSeverities((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
      return next;
    });

    setFilters((prev) => {
      const isCurrentlySelected = selectedSeverities.has(sev);
      return {
        ...prev,
        severity: isCurrentlySelected ? "ALL" : sev,
        page: 0,
      };
    });
  };

  // Toggle Category
  const handleSelectCategory = (cat: string) => {
    setActivePreset(null);
    setFilters((prev) => ({
      ...prev,
      category: cat,
      page: 0,
    }));
  };

  // Apply Presets
  const handleApplyPreset = (presetKey: string) => {
    setActivePreset(presetKey);
    if (presetKey === "critical") {
      setSelectedSeverities(new Set(["CRITICAL", "ERROR"]));
      setFilters((prev) => ({ ...prev, severity: "CRITICAL", page: 0 }));
    } else if (presetKey === "impersonation") {
      setFilters((prev) => ({ ...prev, search: "impersonat", page: 0 }));
    } else if (presetKey === "iam") {
      setFilters((prev) => ({ ...prev, category: "IAM", page: 0 }));
    } else if (presetKey === "mfa") {
      setFilters((prev) => ({ ...prev, category: "SECURITY", page: 0 }));
    } else if (presetKey === "billing") {
      setFilters((prev) => ({ ...prev, category: "BILLING", page: 0 }));
    } else if (presetKey === "topology") {
      setFilters((prev) => ({ ...prev, category: "NETWORK", page: 0 }));
    } else if (presetKey === "fiber") {
      setFilters((prev) => ({ ...prev, category: "FIBER", page: 0 }));
    } else if (presetKey === "customer") {
      setFilters((prev) => ({ ...prev, category: "CUSTOMER", page: 0 }));
    } else if (presetKey === "tasks") {
      setFilters((prev) => ({ ...prev, category: "TASK", page: 0 }));
    }
  };

  // Reset All Filters
  const handleResetAll = () => {
    setSelectedSeverities(new Set());
    setActivePreset(null);
    setTimeRange("24h");
    resetFilters();
  };

  // Handle Time Range Change
  const handleTimeRangeChange = (val: string) => {
    setTimeRange(val);
    const now = Date.now();
    let from = new Date(now - 24 * 60 * 60 * 1000);
    let to = new Date(now);

    if (val.startsWith("custom:")) {
      const parts = val.substring(7).split("_");
      if (parts.length === 2) {
        from = new Date(parts[0]);
        to = new Date(parts[1]);
      }
    } else if (val === "15m") {
      from = new Date(now - 15 * 60 * 1000);
    } else if (val === "60m" || val === "1h") {
      from = new Date(now - 60 * 60 * 1000);
    } else if (val === "24h" || val === "1d") {
      from = new Date(now - 24 * 60 * 60 * 1000);
    } else if (val === "7d") {
      from = new Date(now - 7 * 24 * 60 * 60 * 1000);
    } else if (val === "30d") {
      from = new Date(now - 30 * 24 * 60 * 60 * 1000);
    }

    setFilters((prev) => ({
      ...prev,
      dateRange: { from, to },
      page: 0,
    }));
  };

  // Multi-select row handling
  const handleToggleSelectRow = (id: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isAllSelected = events.length > 0 && selectedRowIds.size === events.length;
  const isSomeSelected = selectedRowIds.size > 0 && selectedRowIds.size < events.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(events.map((e) => e.id)));
    }
  };

  // Convert raw logs to Histogram buckets
  const histogramBuckets = React.useMemo(() => {
    const rawForHistogram = events.map((e) => ({
      timestamp: e.occurredAt,
      severity: e.severity,
      status: e.severity === "ERROR" || e.severity === "CRITICAL" ? 500 : 200,
    }));
    return buildHistogramDataFromLogs(rawForHistogram, timeRange);
  }, [events, timeRange]);

  const isHistoricalMode = timeRange.startsWith("custom:") || timeRange === "7d" || timeRange === "30d";

  const selectedEventIndex = selectedEvent ? events.findIndex((e) => e.id === selectedEvent.id) : -1;
  const hasPrevLog = selectedEventIndex > 0;
  const hasNextLog = selectedEventIndex >= 0 && selectedEventIndex < events.length - 1;

  const handlePrevLog = () => {
    if (hasPrevLog) {
      setSelectedEvent(events[selectedEventIndex - 1]);
    }
  };

  const handleNextLog = () => {
    if (hasNextLog) {
      setSelectedEvent(events[selectedEventIndex + 1]);
    }
  };

  return (
    <div className="flex h-full w-full bg-background font-mono text-xs overflow-hidden select-none">
      {/* 1. Left Secondary Sidebar (Collapsible Filter Pane) */}
      <TenantLogsFilterSidebar
        scope={scope}
        projectId={projectId}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        timeRange={timeRange}
        onTimeRangeChange={handleTimeRangeChange}
        selectedSeverities={selectedSeverities}
        onToggleSeverity={handleToggleSeverity}
        selectedCategory={filters.category}
        onSelectCategory={handleSelectCategory}
        stats={stats}
        onResetAll={handleResetAll}
        onApplyPreset={handleApplyPreset}
        activePreset={activePreset}
      />

      {/* 2. Main Log Stream Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header Toolbar */}
        <TenantLogsTopHeader
          scope={scope}
          searchQuery={filters.search}
          onSearchChange={(q) => setFilters((prev) => ({ ...prev, search: q, page: 0 }))}
          timeRange={timeRange}
          onTimeRangeChange={handleTimeRangeChange}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(false)}
          showHistogram={showHistogram}
          onToggleHistogram={() => setShowHistogram(!showHistogram)}
          onRefresh={refetch}
          isFetching={isFetching}
          autoRefreshMs={autoRefreshMs}
          onAutoRefreshChange={setAutoRefreshMs}
          onExportCsv={exportCsv}
          isExporting={isExporting}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          selectedCategory={filters.category}
          onSelectCategory={handleSelectCategory}
          selectedSeverities={selectedSeverities}
          onToggleSeverity={handleToggleSeverity}
        />

        {/* Interactive Histogram Chart across the top */}
        {showHistogram && (
          <div className="bg-muted/20 border-b border-border/40 shrink-0">
            <LogsHistogramCore
              data={histogramBuckets}
              onSelectRange={(startIso, endIso) => {
                setFilters((prev) => ({
                  ...prev,
                  dateRange: { from: new Date(startIso), to: new Date(endIso) },
                  page: 0,
                }));
              }}
            />
          </div>
        )}

        {/* High-density Log Table Grid Shell */}
        <LogsTableGridShell
          columns={LOG_TABLE_COLUMNS}
          columnVisibility={columnVisibility}
          isAllSelected={isAllSelected}
          isSomeSelected={isSomeSelected}
          onToggleSelectAll={handleToggleSelectAll}
          className="flex-1 min-h-0 bg-card/40 border-none rounded-none overflow-hidden"
          statusBar={
            <LogsStatusBar
              isLivePaused={autoRefreshMs === 0}
              isHistoricalMode={isHistoricalMode}
              filteredCount={events.length}
              totalCount={totalElements}
              selectedCount={selectedRowIds.size}
              onClearSelection={() => setSelectedRowIds(new Set())}
            />
          }
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-16 space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-xs font-mono text-muted-foreground">
                {t("security.audit_loading_logs")}
              </span>
            </div>
          ) : events.length > 0 ? (
            <div className="divide-y divide-border/20">
              {events.map((event) => (
                <TenantLogsRowItem
                  key={event.id}
                  event={event}
                  isSelected={selectedEvent?.id === event.id}
                  isRowSelected={selectedRowIds.has(event.id)}
                  onToggleSelectRow={handleToggleSelectRow}
                  visibleCols={columnVisibility}
                  onSelect={() => setSelectedEvent(event)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-16 space-y-2.5 text-center">
              <h3 className="text-sm font-bold text-foreground">{t("security.audit_empty_title")}</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                {t("security.audit_empty_desc")}
              </p>
            </div>
          )}
        </LogsTableGridShell>

        {/* Forensic Detail Slide-Over Drawer */}
        <TenantAuditDetailDrawer
          event={selectedEvent}
          open={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          currentIndex={selectedEventIndex >= 0 ? selectedEventIndex + 1 : undefined}
          totalLogsCount={events.length}
          onPrevLog={handlePrevLog}
          onNextLog={handleNextLog}
          hasPrevLog={hasPrevLog}
          hasNextLog={hasNextLog}
        />
      </div>
    </div>
  );
}

import * as React from "react";
import {
  LogsTableGridShell,
  LogsHistogramCore,
  LogsStatusBar,
  LogsEmptyStateCore,
  LogsLoadingStateCore,
  type LogsTableColumn,
  buildHistogramDataFromLogs,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { toast } from "sonner";
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

interface AuditFilterCriteria {
  selectedCategories: Set<string>;
  selectedSeverities: Set<string>;
  selectedLevels: Set<string>;
  selectedMethods: Set<string>;
  pathnameFilter: string;
}

const DEFAULT_COLUMN_VISIBILITY: Record<string, boolean> = {
  date: true,
  source: true,
  status: true,
  method: true,
  pathname: true,
  message: true,
  severity: false,
  category: false,
  project: false,
};

const LOG_TABLE_COLUMNS: LogsTableColumn[] = [
  { id: "date", label: "Timestamp", width: "w-[140px]" },
  { id: "source", label: "", width: "w-[24px]" },
  { id: "status", label: "", width: "w-[44px]", withSpacer: true },
  { id: "severity", label: "Severity", width: "w-[68px]" },
  { id: "category", label: "Category", width: "w-[80px]" },
  { id: "project", label: "Project", width: "w-[88px]" },
  { id: "method", label: "Method", width: "w-[48px]" },
  { id: "pathname", label: "Path / Resource", width: "w-[200px]" },
  { id: "message", label: "Event Message & Actor", width: "flex-1 min-w-0" },
];

function matchesCategory(event: TenantAuditEvent, categories: Set<string>): boolean {
  return categories.size === 0 || categories.has(event.category);
}

function matchesSeverity(event: TenantAuditEvent, severities: Set<string>): boolean {
  return severities.size === 0 || severities.has((event.severity || "INFO").toUpperCase());
}

function matchesLevel(event: TenantAuditEvent, levels: Set<string>): boolean {
  if (levels.size === 0) return true;
  const s = (event.severity || "INFO").toUpperCase();
  const isError = s === "ERROR" || s === "CRITICAL";
  const isWarn = s === "WARN" || s === "WARNING";
  const isSuccess = !isError && !isWarn;
  return (
    (levels.has("success") && isSuccess) ||
    (levels.has("warning") && isWarn) ||
    (levels.has("error") && isError)
  );
}

function matchesMethod(event: TenantAuditEvent, methods: Set<string>): boolean {
  if (methods.size === 0) return true;
  const a = (event.action || "").toUpperCase();
  let m = "RPC";
  if (a.includes("CREATE") || a.includes("REGISTER") || a.includes("ADD")) m = "POST";
  else if (a.includes("UPDATE") || a.includes("EDIT") || a.includes("CHANGE")) m = "PUT";
  else if (a.includes("DELETE") || a.includes("REVOKE") || a.includes("REMOVE")) m = "DELETE";
  else if (a.includes("GET") || a.includes("VIEW") || a.includes("READ")) m = "GET";
  return methods.has(m);
}

function matchesPathname(event: TenantAuditEvent, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  const path = `${(event.resourceType || "").toLowerCase()}/${(event.resourceId || "").toLowerCase()}`;
  const resType = (event.resourceType || "").toLowerCase();
  const resId = (event.resourceId || "").toLowerCase();

  if (q.includes("*")) {
    const cleanPattern = q.replace(/\*/g, ".*");
    try {
      const reg = new RegExp(`^${cleanPattern}`, "i");
      return reg.test(path) || reg.test(resType) || reg.test(resId);
    } catch {
      // Fallback
    }
  }

  const cleanQ = q.replace(/\*$/, "");
  return (
    path.includes(cleanQ) ||
    resType.includes(cleanQ) ||
    resId.includes(cleanQ)
  );
}

function filterAuditEvents(events: TenantAuditEvent[], criteria: AuditFilterCriteria): TenantAuditEvent[] {
  return events.filter(
    (e) =>
      matchesCategory(e, criteria.selectedCategories) &&
      matchesSeverity(e, criteria.selectedSeverities) &&
      matchesLevel(e, criteria.selectedLevels) &&
      matchesMethod(e, criteria.selectedMethods) &&
      matchesPathname(e, criteria.pathnameFilter)
  );
}

function parseTimeRangeBounds(val: string): { from: Date; to: Date } {
  const now = Date.now();
  let from = new Date(now - 24 * 60 * 60 * 1000);
  const to = new Date(now);

  if (val.startsWith("custom:")) {
    const parts = val.substring(7).split("_");
    if (parts.length === 2) {
      from = new Date(parts[0]);
      return { from, to: new Date(parts[1]) };
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
  return { from, to };
}

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
  const [selectedCategories, setSelectedCategories] = React.useState<Set<string>>(
    initialCategory ? new Set([initialCategory]) : new Set()
  );
  const [selectedLevels, setSelectedLevels] = React.useState<Set<string>>(new Set());
  const [selectedMethods, setSelectedMethods] = React.useState<Set<string>>(new Set());
  const [pathnameFilter, setPathnameFilter] = React.useState<string>("");
  const [activePreset, setActivePreset] = React.useState<string | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

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
  } = useTenantAudit(auditOptions);

  const handleToggleSeverity = (sev: string) => {
    setSelectedSeverities((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
      return next;
    });
  };

  const handleToggleCategory = (cat: string) => {
    setActivePreset(null);
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleToggleLevel = (lvl: string) => {
    setSelectedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(lvl)) next.delete(lvl);
      else next.add(lvl);
      return next;
    });
  };

  const handleToggleMethod = (m: string) => {
    setSelectedMethods((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return next;
    });
  };

  const handleApplyPreset = (presetKey: string) => {
    setActivePreset(presetKey);
    const presetsMap: Record<string, () => void> = {
      critical: () => {
        setSelectedSeverities(new Set(["CRITICAL", "ERROR"]));
        setSelectedCategories(new Set());
      },
      impersonation: () => {
        setSelectedCategories(new Set(["IMPERSONATION"]));
        setFilters((prev) => ({ ...prev, search: "impersonat", page: 0 }));
      },
      iam: () => setSelectedCategories(new Set(["IAM"])),
      mfa: () => setSelectedCategories(new Set(["SECURITY"])),
      billing: () => setSelectedCategories(new Set(["BILLING"])),
      topology: () => setSelectedCategories(new Set(["GIS_NODE"])),
      fiber: () => setSelectedCategories(new Set(["GIS_CABLE", "FIBER_SPLICING"])),
      customer: () => setSelectedCategories(new Set(["CUSTOMER_HOMEPASS"])),
      tasks: () => setSelectedCategories(new Set(["FIELD_TASK"])),
    };
    if (presetsMap[presetKey]) {
      presetsMap[presetKey]();
    }
  };

  const handleResetAll = () => {
    setSelectedSeverities(new Set());
    setSelectedCategories(new Set());
    setSelectedLevels(new Set());
    setSelectedMethods(new Set());
    setPathnameFilter("");
    setActivePreset(null);
    setTimeRange("24h");
    resetFilters();
  };

  const handleTimeRangeChange = (val: string) => {
    setTimeRange(val);
    const { from, to } = parseTimeRangeBounds(val);
    setFilters((prev) => ({
      ...prev,
      dateRange: { from, to },
      page: 0,
    }));
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredEvents = React.useMemo(() => {
    return filterAuditEvents(events, {
      selectedCategories,
      selectedSeverities,
      selectedLevels,
      selectedMethods,
      pathnameFilter,
    });
  }, [events, selectedCategories, selectedSeverities, selectedLevels, selectedMethods, pathnameFilter]);

  const isAllSelected = filteredEvents.length > 0 && selectedRowIds.size === filteredEvents.length;
  const isSomeSelected = selectedRowIds.size > 0 && selectedRowIds.size < filteredEvents.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(filteredEvents.map((e) => e.id)));
    }
  };

  const handleCopyLog = (event: TenantAuditEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(event, null, 2));
    setCopiedId(event.id);
    toast.success(t("security.audit_copy_payload_success") || "Log copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopySelected = () => {
    const selectedEvents = filteredEvents.filter((e) => selectedRowIds.has(e.id));
    if (selectedEvents.length === 0) return;
    navigator.clipboard.writeText(JSON.stringify(selectedEvents, null, 2));
    toast.success(`Copied ${selectedEvents.length} selected audit events to clipboard.`);
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredEvents, null, 2));
    const a = document.createElement("a");
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `k2net-tenant-audit-${scope.toLowerCase()}-${Date.now()}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success(`Exported ${filteredEvents.length} audit events to JSON.`);
  };

  const histogramBuckets = React.useMemo(() => {
    const rawForHistogram = filteredEvents.map((e) => ({
      timestamp: e.occurredAt,
      severity: e.severity,
      status: e.severity === "ERROR" || e.severity === "CRITICAL" ? 500 : 200,
    }));
    return buildHistogramDataFromLogs(rawForHistogram, timeRange);
  }, [filteredEvents, timeRange]);

  const isHistoricalMode = timeRange.startsWith("custom:") || timeRange === "7d" || timeRange === "30d";
  const selectedEventIndex = selectedEvent ? filteredEvents.findIndex((e) => e.id === selectedEvent.id) : -1;
  const hasPrevLog = selectedEventIndex > 0;
  const hasNextLog = selectedEventIndex >= 0 && selectedEventIndex < filteredEvents.length - 1;

  const handlePrevLog = () => {
    if (hasPrevLog) setSelectedEvent(filteredEvents[selectedEventIndex - 1]);
  };

  const handleNextLog = () => {
    if (hasNextLog) setSelectedEvent(filteredEvents[selectedEventIndex + 1]);
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
        selectedCategories={selectedCategories}
        onToggleCategory={handleToggleCategory}
        selectedLevels={selectedLevels}
        onToggleLevel={handleToggleLevel}
        selectedMethods={selectedMethods}
        onToggleMethod={handleToggleMethod}
        pathnameFilter={pathnameFilter}
        onPathnameFilterChange={setPathnameFilter}
        stats={stats}
        onResetAll={handleResetAll}
        onApplyPreset={handleApplyPreset}
        activePreset={activePreset}
      />

      {/* 2. Main Log Stream Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
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
          onExportJson={handleExportJson}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          selectedCategories={selectedCategories}
          onToggleCategory={handleToggleCategory}
          selectedSeverities={selectedSeverities}
          onToggleSeverity={handleToggleSeverity}
          selectedLevels={selectedLevels}
          onToggleLevel={handleToggleLevel}
          selectedMethods={selectedMethods}
          onToggleMethod={handleToggleMethod}
          pathnameFilter={pathnameFilter}
          onPathnameFilterChange={setPathnameFilter}
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

        {/* High-density Log Table & Drawer Workspace (Relative Anchor) */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
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
                filteredCount={filteredEvents.length}
                totalCount={totalElements}
                selectedCount={selectedRowIds.size}
                onClearSelection={() => setSelectedRowIds(new Set())}
                onCopySelected={handleCopySelected}
                rightSlot={
                  isHistoricalMode ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-muted/40 text-muted-foreground border border-border/40 font-sans font-medium text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60" />
                      <span>Forensic Mode</span>
                    </span>
                  ) : autoRefreshMs === 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-muted/40 text-muted-foreground border border-border/40 font-sans font-medium text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                      <span>Stream Paused</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 font-sans font-medium text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      <span>Live Tail Mode</span>
                    </span>
                  )
                }
              />
            }
          >
            {isLoading ? (
              <LogsLoadingStateCore
                title={t("security.audit_loading_logs") || "Loading tenant audit partition records..."}
                description={t("security.audit_loading_desc") || "Executing partitioned range query against PostgreSQL 17..."}
              />
            ) : filteredEvents.length > 0 ? (
              <div className="divide-y divide-border/20">
                {filteredEvents.map((event) => (
                  <TenantLogsRowItem
                    key={event.id}
                    event={event}
                    scope={scope}
                    isSelected={selectedEvent?.id === event.id}
                    isRowSelected={selectedRowIds.has(event.id)}
                    onToggleSelectRow={handleToggleSelectRow}
                    visibleCols={columnVisibility}
                    copiedId={copiedId}
                    onSelect={() => setSelectedEvent(selectedEvent?.id === event.id ? null : event)}
                    onCopyLog={handleCopyLog}
                  />
                ))}
              </div>
            ) : (
              <LogsEmptyStateCore
                title={t("security.audit_empty_title") || "No matching events"}
                description={t("security.audit_empty_desc")}
                totalBufferCount={totalElements}
                onResetFilters={handleResetAll}
                onSetTimeRange={handleTimeRangeChange}
              />
            )}
          </LogsTableGridShell>

          {/* Forensic Detail Slide-Over Drawer */}
          {selectedEvent && (
            <TenantAuditDetailDrawer
              event={selectedEvent}
              open={!!selectedEvent}
              onClose={() => setSelectedEvent(null)}
              currentIndex={selectedEventIndex >= 0 ? selectedEventIndex : undefined}
              totalLogsCount={filteredEvents.length}
              onPrevLog={handlePrevLog}
              onNextLog={handleNextLog}
              hasPrevLog={hasPrevLog}
              hasNextLog={hasNextLog}
            />
          )}
        </div>
      </div>
    </div>
  );
}

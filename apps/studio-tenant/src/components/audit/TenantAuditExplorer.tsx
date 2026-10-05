import * as React from "react";
import {
  Search,
  RefreshCw,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
  Inbox,
  Clock,
  CheckCircle2,
} from "lucide-react";
import {
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  LogsDateRangePickerCore,
  LogsHistogramCore,
  LogsTableGridShell,
  type LogsTableColumn,
  buildHistogramDataFromLogs,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { useTenantAudit, type UseTenantAuditOptions } from "../../hooks/useTenantAudit";
import { TenantAuditStatsCards } from "./TenantAuditStatsCards";
import { TenantAuditRow } from "./TenantAuditRow";
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
  time: true,
  scope: true,
  action: true,
  resource: true,
  actor: true,
  severity: true,
};

export function TenantAuditExplorer({
  scope,
  projectId,
  initialCategory,
  title,
  description,
}: TenantAuditExplorerProps) {
  const { t } = useTranslation();
  const [autoRefreshMs, setAutoRefreshMs] = React.useState<number>(30000);
  const [selectedEvent, setSelectedEvent] = React.useState<TenantAuditEvent | null>(null);
  const [dateRangePickerValue, setDateRangePickerValue] = React.useState<string>("24h");

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
    totalPages,
    currentPage,
    filters,
    setFilters,
    setPage,
    resetFilters,
    refetch,
    exportCsv,
    isExporting,
  } = useTenantAudit(auditOptions);

  // Dynamic translated categories
  const categories = React.useMemo(() => {
    if (scope === "PROJECT") {
      return [
        { value: "ALL", label: t("security.audit_category_all") },
        { value: "NETWORK", label: t("security.audit_category_network") },
        { value: "FIBER", label: t("security.audit_category_fiber") },
        { value: "CUSTOMER", label: t("security.audit_category_customer") },
        { value: "TASK", label: t("security.audit_category_task") },
        { value: "GIS_SURVEY", label: t("security.audit_category_gis") },
      ];
    }
    return [
      { value: "ALL", label: t("security.audit_category_all") },
      { value: "IAM", label: t("security.audit_category_iam") },
      { value: "SETTINGS", label: t("security.audit_category_settings") },
      { value: "SECURITY", label: t("security.audit_category_security") },
      { value: "BILLING", label: t("security.audit_category_billing") },
      { value: "API_KEY", label: t("security.audit_category_apikey") },
      { value: "PROJECT_LIFECYCLE", label: t("security.audit_category_project_lc") },
    ];
  }, [scope, t]);

  const severityOptions = React.useMemo(
    () => [
      { value: "ALL", label: t("security.audit_severity_all") },
      { value: "INFO", label: "INFO" },
      { value: "WARN", label: "WARN" },
      { value: "ERROR", label: "ERROR" },
      { value: "CRITICAL", label: "CRITICAL" },
    ],
    [t]
  );

  const auditColumns: LogsTableColumn[] = React.useMemo(
    () => [
      { id: "time", label: t("security.audit_col_time"), width: "w-[130px]" },
      { id: "scope", label: t("security.audit_col_scope"), width: "w-[70px]" },
      { id: "action", label: t("security.audit_col_action"), width: "w-[140px]" },
      { id: "resource", label: t("security.audit_col_resource"), width: "w-[200px]" },
      { id: "actor", label: t("security.audit_col_actor"), width: "w-[180px]" },
      { id: "severity", label: t("security.audit_col_severity"), width: "w-[80px]" },
    ],
    [t]
  );

  // Handle Date Range Picker changes
  const handleDateRangeChange = (val: string) => {
    setDateRangePickerValue(val);
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

  // Convert raw logs to Histogram buckets
  const histogramBuckets = React.useMemo(() => {
    const rawForHistogram = events.map((e) => ({
      timestamp: e.occurredAt,
      severity: e.severity,
      status: e.severity === "ERROR" || e.severity === "CRITICAL" ? 500 : 200,
    }));
    return buildHistogramDataFromLogs(rawForHistogram, dateRangePickerValue);
  }, [events, dateRangePickerValue]);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* 1. Header Toolbar & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/60 border border-border/60 rounded-xl p-3.5 shadow-xs backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
            {scope === "PROJECT" ? <Layers className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              {title || (scope === "PROJECT" ? t("security.audit_proj_title") : t("security.audit_org_title"))}
            </h2>
            <p className="text-xs text-muted-foreground">
              {description ||
                (scope === "PROJECT"
                  ? t("security.audit_proj_desc")
                  : t("security.audit_org_desc"))}
            </p>
          </div>
        </div>

        {/* Live Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Auto Refresh Select */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <Select
              value={String(autoRefreshMs)}
              onValueChange={(val) => setAutoRefreshMs(Number(val))}
            >
              <SelectTrigger className="h-8 text-xs font-mono w-[120px] bg-background">
                <SelectValue placeholder={t("security.audit_live_polling")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t("security.audit_polling_off")}</SelectItem>
                <SelectItem value="15000">{t("security.audit_polling_15s")}</SelectItem>
                <SelectItem value="30000">{t("security.audit_polling_30s")}</SelectItem>
                <SelectItem value="60000">{t("security.audit_polling_60s")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Manual Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 px-2.5 text-xs gap-1.5 shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-primary" : ""}`} />
            {t("common.refresh")}
          </Button>

          {/* Export CSV Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            disabled={isExporting}
            className="h-8 px-2.5 text-xs gap-1.5 shadow-xs bg-muted/20 hover:bg-muted/50"
          >
            <Download className="h-3.5 w-3.5" />
            {isExporting ? t("security.audit_exporting") : t("common.download_csv")}
          </Button>
        </div>
      </div>

      {/* 2. Top Summary KPI Stats */}
      <TenantAuditStatsCards stats={stats} isLoading={isLoading} />

      {/* 3. Interactive Activity Histogram */}
      {histogramBuckets.length > 0 && (
        <div className="bg-card/60 border border-border/60 rounded-xl p-3 shadow-xs space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              {t("security.audit_distribution_title")}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {t("security.audit_range_label", { range: dateRangePickerValue, total: events.length })}
            </span>
          </div>
          <LogsHistogramCore
            data={histogramBuckets}
            className="pt-1"
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

      {/* 4. Filter Toolbar & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5 bg-card/40 border border-border/60 rounded-xl p-2.5 shadow-xs">
        {/* Search Query Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={
              scope === "PROJECT"
                ? t("security.audit_search_placeholder_proj")
                : t("security.audit_search_placeholder_org")
            }
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value, page: 0 }))
            }
            className="h-8 pl-8 text-xs bg-background"
          />
        </div>

        {/* Category Dropdown */}
        <Select
          value={filters.category}
          onValueChange={(val) =>
            setFilters((prev) => ({ ...prev, category: val, page: 0 }))
          }
        >
          <SelectTrigger className="h-8 text-xs w-full md:w-[190px] bg-background">
            <SelectValue placeholder={t("security.audit_filter_category_placeholder")} />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value} className="text-xs">
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Severity Dropdown */}
        <Select
          value={filters.severity}
          onValueChange={(val) =>
            setFilters((prev) => ({ ...prev, severity: val, page: 0 }))
          }
        >
          <SelectTrigger className="h-8 text-xs w-full md:w-[150px] bg-background">
            <SelectValue placeholder={t("security.audit_filter_severity_placeholder")} />
          </SelectTrigger>
          <SelectContent>
            {severityOptions.map((sev) => (
              <SelectItem key={sev.value} value={sev.value} className="text-xs">
                {sev.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Range Picker */}
        <div className="w-full md:w-[220px]">
          <LogsDateRangePickerCore
            value={dateRangePickerValue}
            onChange={handleDateRangeChange}
          />
        </div>

        {/* Reset Filter Button */}
        {(filters.search || filters.category !== "ALL" || filters.severity !== "ALL") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            <Filter className="h-3.5 w-3.5" />
            {t("security.audit_reset_filter")}
          </Button>
        )}
      </div>

      {/* 5. Virtualized Logs Table Grid Shell */}
      <LogsTableGridShell
        columns={auditColumns}
        columnVisibility={DEFAULT_COLUMN_VISIBILITY}
        className="flex-1 min-h-[360px] bg-card border border-border/60 rounded-xl overflow-hidden shadow-xs"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-16 space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-xs font-mono text-muted-foreground">
              {t("security.audit_loading_logs")}
            </span>
          </div>
        ) : events.length > 0 ? (
          <div className="divide-y divide-border/40">
            {events.map((event) => (
              <TenantAuditRow
                key={event.id}
                event={event}
                isSelected={selectedEvent?.id === event.id}
                onSelect={setSelectedEvent}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-16 space-y-2.5 text-center">
            <div className="p-3 rounded-full bg-muted/40 text-muted-foreground">
              <Inbox className="h-7 w-7" />
            </div>
            <h3 className="text-sm font-bold text-foreground">{t("security.audit_empty_title")}</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              {t("security.audit_empty_desc")}
            </p>
            {(filters.search || filters.category !== "ALL" || filters.severity !== "ALL") && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="mt-2 text-xs h-7.5"
              >
                {t("security.audit_clear_filters")}
              </Button>
            )}
          </div>
        )}
      </LogsTableGridShell>

      {/* 6. Pagination Footer */}
      {totalElements > 0 && (
        <div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
          <div className="font-mono">
            {t("security.audit_showing_events", { count: events.length, total: totalElements.toLocaleString() })}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0 || isLoading}
              className="h-7.5 px-2 text-xs gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {t("security.audit_prev_page")}
            </Button>
            <span className="font-mono text-xs">
              {t("security.audit_page_info", { current: currentPage + 1, total: Math.max(1, totalPages) })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1 || isLoading}
              className="h-7.5 px-2 text-xs gap-1"
            >
              {t("security.audit_next_page")}
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* 7. Slide-over Detail Drawer */}
      <TenantAuditDetailDrawer
        event={selectedEvent}
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}

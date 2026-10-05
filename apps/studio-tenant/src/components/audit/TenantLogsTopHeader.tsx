import * as React from "react";
import {
  Search,
  RefreshCw,
  Download,
  BarChart2,
  SlidersHorizontal,
  PanelLeft,
  Check,
} from "lucide-react";
import {
  Button,
  ActionTooltip,
  LogsTimeRangeInlinePillCore,
  LogsColumnPickerCore,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import type { TenantAuditScope } from "../../types/tenant-audit";

export interface TenantLogsTopHeaderProps {
  scope: TenantAuditScope;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  timeRange: string;
  onTimeRangeChange: (val: string) => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  showHistogram: boolean;
  onToggleHistogram: () => void;
  onRefresh: () => void;
  isFetching: boolean;
  autoRefreshMs: number;
  onAutoRefreshChange: (ms: number) => void;
  onExportCsv: () => void;
  isExporting: boolean;
  columnVisibility: Record<string, boolean>;
  onColumnVisibilityChange: (cols: Record<string, boolean>) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedSeverities: Set<string>;
  onToggleSeverity: (sev: string) => void;
}

const AVAILABLE_COLUMNS = [
  { id: "date", label: "Timestamp" },
  { id: "status", label: "Status / Code" },
  { id: "method", label: "Action / Method" },
  { id: "pathname", label: "Path / Resource" },
  { id: "message", label: "Event Message & Actor" },
  { id: "actor", label: "Actor / IP" },
  { id: "severity", label: "Severity" },
  { id: "scope", label: "Scope" },
];

export function TenantLogsTopHeader({
  scope,
  searchQuery,
  onSearchChange,
  timeRange,
  onTimeRangeChange,
  isSidebarCollapsed,
  onToggleSidebar,
  showHistogram,
  onToggleHistogram,
  onRefresh,
  isFetching,
  autoRefreshMs,
  onAutoRefreshChange,
  onExportCsv,
  isExporting,
  columnVisibility,
  onColumnVisibilityChange,
  selectedCategory,
  onSelectCategory,
  selectedSeverities,
  onToggleSeverity,
}: TenantLogsTopHeaderProps) {
  const { t } = useTranslation();
  const [showPalette, setShowPalette] = React.useState(false);
  const [showTopTimePicker, setShowTopTimePicker] = React.useState(false);
  const [showColumnPicker, setShowColumnPicker] = React.useState(false);
  const filterAnchorRef = React.useRef<HTMLDivElement>(null);
  const timeRangePillRef = React.useRef<HTMLDivElement>(null);
  const columnBtnRef = React.useRef<HTMLButtonElement>(null);

  const filterPaletteCategories = React.useMemo(() => {
    if (scope === "PROJECT") {
      return [
        { id: "ALL", label: t("security.audit_category_all") },
        { id: "NETWORK", label: t("security.audit_category_network") },
        { id: "FIBER", label: t("security.audit_category_fiber") },
        { id: "CUSTOMER", label: t("security.audit_category_customer") },
        { id: "TASK", label: t("security.audit_category_task") },
        { id: "GIS_SURVEY", label: t("security.audit_category_gis") },
      ];
    }
    return [
      { id: "ALL", label: t("security.audit_category_all") },
      { id: "IAM", label: t("security.audit_category_iam") },
      { id: "SETTINGS", label: t("security.audit_category_settings") },
      { id: "SECURITY", label: t("security.audit_category_security") },
      { id: "BILLING", label: t("security.audit_category_billing") },
      { id: "API_KEY", label: t("security.audit_category_apikey") },
      { id: "PROJECT_LIFECYCLE", label: t("security.audit_category_project_lc") },
    ];
  }, [scope, t]);

  const filterPaletteSeverities = [
    { id: "CRITICAL", label: "Critical" },
    { id: "ERROR", label: "Error" },
    { id: "WARN", label: "Warning" },
    { id: "INFO", label: "Info" },
  ];

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-card/60 backdrop-blur-xs select-none font-mono text-xs shrink-0">
      {/* Left: Collapse Button + Search + Inline Filters */}
      <div ref={filterAnchorRef} className="flex items-center gap-2 flex-1 min-w-0">
        {isSidebarCollapsed && (
          <ActionTooltip label="Buka Sidebar Filter" side="bottom">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          </ActionTooltip>
        )}

        {/* Search Input Bar with Embedded Time Range Pill */}
        <div className="flex items-center gap-2 flex-1 max-w-2xl px-2 py-1 rounded-md border border-border/70 bg-background/80 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all shadow-2xs">
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              scope === "PROJECT"
                ? t("security.audit_search_placeholder_proj")
                : t("security.audit_search_placeholder_org")
            }
            className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 outline-none border-none p-0 font-sans"
          />

          {/* Time Range Inline Pill */}
          <LogsTimeRangeInlinePillCore
            timeRange={timeRange}
            setTimeRange={onTimeRangeChange}
            showTopTimePicker={showTopTimePicker}
            setShowTopTimePicker={setShowTopTimePicker}
            filterAnchorRef={filterAnchorRef}
            timeRangePillRef={timeRangePillRef}
            translateFn={(key) => t(key)}
          />
        </div>

        {/* Add More Filters Trigger Popover */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPalette(!showPalette)}
            className="h-7.5 px-2 text-xs font-sans text-muted-foreground hover:text-foreground gap-1 border-dashed"
          >
            <SlidersHorizontal className="h-3 w-3" />
            <span>Filter</span>
          </Button>

          {showPalette && (
            <div className="absolute left-0 top-9 z-50 w-72 bg-popover border border-border rounded-lg shadow-xl p-3 space-y-3 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-1 border-b border-border/40">
                <span className="text-[11px] font-bold text-foreground font-sans">Filter Log Explorer</span>
                <button
                  type="button"
                  onClick={() => setShowPalette(false)}
                  className="text-muted-foreground hover:text-foreground text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Categories */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                  {t("security.audit_category_label")}
                </span>
                <div className="grid grid-cols-2 gap-1">
                  {filterPaletteCategories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onSelectCategory(c.id)}
                      className={`px-2 py-1 rounded text-[10px] font-sans text-left truncate transition-colors ${
                        selectedCategory === c.id
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "bg-muted/40 hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Severities */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                  {t("security.audit_filter_severity_placeholder")}
                </span>
                <div className="grid grid-cols-2 gap-1">
                  {filterPaletteSeverities.map((s) => {
                    const isChecked = selectedSeverities.has(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => onToggleSeverity(s.id)}
                        className={`px-2 py-1 rounded text-[10px] font-sans text-left flex items-center justify-between transition-colors ${
                          isChecked
                            ? "bg-primary/20 text-primary font-semibold border border-primary/30"
                            : "bg-muted/40 hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        <span>{s.label}</span>
                        {isChecked && <Check className="w-2.5 h-2.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions Toolbar */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Toggle Histogram Button */}
        <ActionTooltip label={showHistogram ? "Sembunyikan Grafik Histogram" : "Tampilkan Grafik Histogram"} side="bottom">
          <Button
            variant={showHistogram ? "secondary" : "ghost"}
            size="icon"
            onClick={onToggleHistogram}
            className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <BarChart2 className="h-3.5 w-3.5" />
          </Button>
        </ActionTooltip>

        {/* Columns Picker Trigger Button */}
        <ActionTooltip label="Pilih Kolom Tampilan" side="bottom">
          <Button
            ref={columnBtnRef}
            variant="ghost"
            size="icon"
            onClick={() => setShowColumnPicker(!showColumnPicker)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </Button>
        </ActionTooltip>

        {showColumnPicker && (
          <LogsColumnPickerCore
            columns={AVAILABLE_COLUMNS.map((col) => ({
              id: col.id,
              label: col.label,
              visible: columnVisibility[col.id] !== false,
            }))}
            onToggleColumn={(colId, visible) => {
              onColumnVisibilityChange({
                ...columnVisibility,
                [colId]: visible,
              });
            }}
            anchorRef={columnBtnRef}
            onClose={() => setShowColumnPicker(false)}
          />
        )}

        {/* Live Stream Polling Selector */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Select
            value={String(autoRefreshMs)}
            onValueChange={(val) => onAutoRefreshChange(Number(val))}
          >
            <SelectTrigger className="h-7 text-[11px] font-mono w-[115px] bg-background">
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
        <ActionTooltip label={t("common.refresh")} side="bottom">
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={isFetching}
            className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-primary" : ""}`} />
          </Button>
        </ActionTooltip>

        {/* Export CSV Button */}
        <ActionTooltip label={t("common.download_csv")} side="bottom">
          <Button
            variant="outline"
            size="sm"
            onClick={onExportCsv}
            disabled={isExporting}
            className="h-7 px-2 text-xs font-sans gap-1 text-muted-foreground hover:text-foreground"
          >
            <Download className="h-3 w-3" />
            <span className="hidden sm:inline">
              {isExporting ? t("security.audit_exporting") : "Export"}
            </span>
          </Button>
        </ActionTooltip>
      </div>
    </div>
  );
}

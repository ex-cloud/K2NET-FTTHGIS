import * as React from "react";
import {
  Search,
  X,
  RefreshCw,
  Download,
  BarChart2,
  SlidersHorizontal,
  PanelLeft,
  Columns3,
  FileSpreadsheet,
  FileCode,
  Play,
  Pause,
  Check,
} from "lucide-react";
import {
  Button,
  Badge,
  ActionTooltip,
  LogsTimeRangeInlinePillCore,
  LogsColumnPickerCore,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  cn,
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
  onRefresh: () => Promise<void> | void;
  isFetching: boolean;
  autoRefreshMs: number;
  onAutoRefreshChange: (ms: number) => void;
  onExportCsv: () => void;
  onExportJson?: () => void;
  isExporting?: boolean;
  columnVisibility: Record<string, boolean>;
  onColumnVisibilityChange: (cols: Record<string, boolean>) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedSeverities: Set<string>;
  onToggleSeverity: (sev: string) => void;
  resourceSearch?: string;
  onResourceSearchChange?: (val: string) => void;
}

const AVAILABLE_COLUMNS = [
  { id: "date", label: "Timestamp" },
  { id: "status", label: "Status / Code" },
  { id: "method", label: "Action / Method" },
  { id: "pathname", label: "Path / Resource" },
  { id: "message", label: "Event Message & Actor" },
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
  onExportJson,
  columnVisibility,
  onColumnVisibilityChange,
  selectedCategory,
  onSelectCategory,
  selectedSeverities,
  onToggleSeverity,
  resourceSearch = "",
  onResourceSearchChange,
}: TenantLogsTopHeaderProps) {
  const { t } = useTranslation();
  const [showPalette, setShowPalette] = React.useState(false);
  const [showTopTimePicker, setShowTopTimePicker] = React.useState(false);
  const [showColumnPicker, setShowColumnPicker] = React.useState(false);
  const filterAnchorRef = React.useRef<HTMLDivElement>(null);
  const timeRangePillRef = React.useRef<HTMLDivElement>(null);
  const columnBtnRef = React.useRef<HTMLButtonElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filterPaletteCategories = React.useMemo(() => {
    if (scope === "PROJECT") {
      return [
        { id: "ALL", label: t("security.audit_category_all") || "All Categories" },
        { id: "NETWORK", label: t("security.audit_category_network") || "Network Assets" },
        { id: "FIBER", label: t("security.audit_category_fiber") || "Fiber Cables" },
        { id: "CUSTOMER", label: t("security.audit_category_customer") || "Subscribers" },
        { id: "TASK", label: t("security.audit_category_task") || "Trouble Tasks" },
        { id: "GIS_SURVEY", label: t("security.audit_category_gis") || "GIS Survey" },
      ];
    }
    return [
      { id: "ALL", label: t("security.audit_category_all") || "All Categories" },
      { id: "IAM", label: t("security.audit_category_iam") || "Team & Roles (IAM)" },
      { id: "SETTINGS", label: t("security.audit_category_settings") || "Org Settings" },
      { id: "SECURITY", label: t("security.audit_category_security") || "Security & MFA" },
      { id: "BILLING", label: t("security.audit_category_billing") || "Billing & Sub" },
      { id: "API_KEY", label: t("security.audit_category_apikey") || "API & Webhooks" },
      { id: "PROJECT_LIFECYCLE", label: t("security.audit_category_project_lc") || "Project Lifecycle" },
    ];
  }, [scope, t]);

  const filterPaletteSeverities = [
    { id: "CRITICAL", label: "Critical" },
    { id: "ERROR", label: "Error" },
    { id: "WARN", label: "Warning" },
    { id: "INFO", label: "Info" },
  ];

  // Compute active pills inside search bar
  const activePills = React.useMemo(() => {
    const list: Array<{ id: string; label: string; kind: "category" | "severity" | "resource" }> = [];
    if (selectedCategory && selectedCategory !== "ALL") {
      const match = filterPaletteCategories.find((c) => c.id === selectedCategory);
      list.push({
        id: selectedCategory,
        label: `Category = ${match ? match.label : selectedCategory}`,
        kind: "category",
      });
    }
    selectedSeverities.forEach((sev) => {
      list.push({
        id: sev,
        label: `Severity = ${sev}`,
        kind: "severity",
      });
    });
    if (resourceSearch.trim()) {
      list.push({
        id: "resource",
        label: `Resource = ${resourceSearch.trim()}`,
        kind: "resource",
      });
    }
    return list;
  }, [selectedCategory, filterPaletteCategories, selectedSeverities, resourceSearch]);

  const hasActivePills = activePills.length > 0;

  const handleRemovePill = (pill: { id: string; kind: "category" | "severity" | "resource" }) => {
    if (pill.kind === "category") onSelectCategory("ALL");
    else if (pill.kind === "severity") onToggleSeverity(pill.id);
    else if (pill.kind === "resource") onResourceSearchChange?.("");
  };

  const isLiveActive = autoRefreshMs > 0;

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-groove-b bg-card/60 backdrop-blur-md shrink-0 h-12 w-full font-mono text-xs select-none">
      {/* 1. Sidebar Toggle Button */}
      <ActionTooltip
        label={isSidebarCollapsed ? (t("observability.open_filter_panel") || "Open filter panel") : (t("observability.toggle_filter_panel") || "Toggle filter panel")}
        shortcut="Alt+S"
      >
        <button
          onClick={onToggleSidebar}
          className="shrink-0 p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <PanelLeft className="w-3.5 h-3.5" />
        </button>
      </ActionTooltip>

      {/* 2. Unified Search Input Bar with Embedded Pills */}
      <div
        ref={filterAnchorRef}
        className="flex-1 flex items-center gap-1.5 bg-background border border-border/80 rounded-lg px-2.5 py-1 text-xs transition-colors overflow-hidden min-w-0 cursor-text shadow-2xs focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20"
        onClick={() => {
          if (!showTopTimePicker) {
            inputRef.current?.focus();
          }
        }}
      >
        <Search className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />

        <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto no-scrollbar py-0.5">
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

          {/* Active Filter Badges */}
          {activePills.map((pill) => (
            <Badge
              key={`${pill.kind}-${pill.id}`}
              className="h-5 text-[10px] font-mono bg-muted/90 text-foreground border border-border/70 gap-1 px-1.5 py-0 shrink-0 whitespace-nowrap leading-none flex items-center"
            >
              <span>{pill.label}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemovePill(pill);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer ml-0.5 font-medium"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </Badge>
          ))}

          {/* Search Input Field */}
          <div className="flex-1 flex items-center gap-1 min-w-[120px]">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={hasActivePills ? (t("observability.add_more_filters") || "Add more filters...") : (t("observability.filter_placeholder") || "Filter by action, user email, IP address, or ID...")}
              className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/50 text-xs font-mono min-w-[80px]"
            />

            <ActionTooltip label={t("observability.advanced_filter") || "Filter / Quick Palettes"} shortcut="Alt+F">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPalette((prev) => !prev);
                  inputRef.current?.focus();
                }}
                className={cn(
                  "shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] border transition-colors cursor-pointer",
                  showPalette
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "border-border/40 text-muted-foreground/60 hover:text-foreground hover:bg-muted/40"
                )}
              >
                <SlidersHorizontal className="w-3 h-3" />
              </button>
            </ActionTooltip>
          </div>
        </div>

        {searchQuery && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSearchChange("");
            }}
            className="shrink-0 text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* 3. Action Buttons Right Suite */}
      <div className="flex items-center gap-1.5 shrink-0 pl-1">
        {/* Refresh Button */}
        <ActionTooltip label={t("observability.refresh_logs") || "Refresh logs"} shortcut="R">
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              try {
                await onRefresh();
              } catch {
                // handled by parent
              }
            }}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-border/60 rounded-md transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-primary" : ""}`} />
          </Button>
        </ActionTooltip>

        {/* Toggle Histogram Button */}
        <ActionTooltip label={t("observability.toggle_histogram") || "Toggle Histogram"} shortcut="H">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleHistogram}
            className={`h-7 w-7 p-0 border rounded-md transition-colors cursor-pointer ${
              showHistogram
                ? "bg-muted text-foreground border-border"
                : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
          </Button>
        </ActionTooltip>

        {/* Column Picker Button */}
        <ActionTooltip label={t("observability.view_columns") || "Columns"} shortcut="C">
          <Button
            ref={columnBtnRef}
            variant="ghost"
            size="sm"
            onClick={() => setShowColumnPicker((prev) => !prev)}
            className={`h-7 w-7 p-0 border rounded-md transition-colors cursor-pointer ${
              showColumnPicker
                ? "bg-muted text-foreground border-border"
                : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <Columns3 className="w-3.5 h-3.5" />
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

        {/* Export Dropdown */}
        <DropdownMenu>
          <ActionTooltip label={t("common.export") || "Export logs"} shortcut="Alt+E">
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Export logs"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-border/60 rounded-md transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
          </ActionTooltip>
          <DropdownMenuContent align="end" className="w-52 font-mono text-xs p-1 shadow-xl border border-border bg-popover">
            <DropdownMenuItem
              onClick={onExportCsv}
              className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileSpreadsheet className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-[11px] text-foreground truncate">{t("common.download_csv") || "CSV Dataset"}</span>
              </div>
              <DropdownMenuShortcut className="text-[9px] opacity-70">Alt+S</DropdownMenuShortcut>
            </DropdownMenuItem>

            {onExportJson && (
              <DropdownMenuItem
                onClick={onExportJson}
                className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileCode className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-[11px] text-foreground truncate">JSON Telemetry</span>
                </div>
                <DropdownMenuShortcut className="text-[9px] opacity-70">Alt+E</DropdownMenuShortcut>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Live Stream Button */}
        <ActionTooltip
          label={isLiveActive ? (t("observability.pause_stream") || "Pause live stream") : (t("observability.resume_stream") || "Resume live stream")}
          shortcut="Space"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAutoRefreshChange(isLiveActive ? 0 : 30000)}
            className={`h-7 text-xs font-mono gap-1.5 rounded-md px-2.5 transition-all cursor-pointer ${
              !isLiveActive
                ? "bg-transparent text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted/40"
                : "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 shadow-2xs"
            }`}
          >
            {!isLiveActive ? (
              <Play className="w-3 h-3 text-muted-foreground" />
            ) : (
              <Pause className="w-3 h-3 text-primary" />
            )}
            <span className="font-medium text-xs">Live</span>
          </Button>
        </ActionTooltip>
      </div>

      {/* 4. Quick Filter Popover */}
      {showPalette && (
        <div className="absolute left-14 top-12 z-50 w-72 bg-popover border border-border rounded-lg shadow-xl p-3 space-y-3 animate-in fade-in zoom-in-95 duration-150 font-sans select-none">
          <div className="flex items-center justify-between pb-1 border-b border-border/40">
            <span className="text-[11px] font-bold text-foreground font-sans">
              {t("security.audit_quick_filters") || "Quick Filter Explorer"}
            </span>
            <button
              type="button"
              onClick={() => setShowPalette(false)}
              className="text-muted-foreground hover:text-foreground text-xs p-1"
            >
              ✕
            </button>
          </div>

          {/* Categories */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-muted-foreground block">
              {t("security.audit_category_label") || "Category Scope"}
            </span>
            <div className="grid grid-cols-2 gap-1">
              {filterPaletteCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onSelectCategory(c.id);
                    setShowPalette(false);
                  }}
                  className={`px-2 py-1 rounded text-[10px] font-sans text-left truncate transition-colors cursor-pointer ${
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
              {t("security.audit_filter_severity_placeholder") || "Severity Levels"}
            </span>
            <div className="grid grid-cols-2 gap-1">
              {filterPaletteSeverities.map((s) => {
                const isChecked = selectedSeverities.has(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onToggleSeverity(s.id)}
                    className={`px-2 py-1 rounded text-[10px] font-sans text-left flex items-center justify-between transition-colors cursor-pointer ${
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
  );
}

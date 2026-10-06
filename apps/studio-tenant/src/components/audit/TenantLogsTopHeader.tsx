import * as React from "react";
import {
  ActionTooltip,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  LogsTimeRangeInlinePillCore,
  LogsFilterPaletteCore,
  LogsColumnPickerCore,
  type FilterFieldConfig,
  type AppliedFilter,
  cn,
} from "@k2net/ui";
import {
  PanelLeft,
  Search,
  SlidersHorizontal,
  RefreshCw,
  BarChart2,
  Columns3,
  Download,
  Play,
  Pause,
  X,
  FileSpreadsheet,
  FileCode,
  Layers,
  Activity,
  AlertCircle,
  Shield,
  Globe,
  User,
} from "lucide-react";
import { useTranslation } from "@k2net/i18n";
import type { TenantAuditScope } from "../../types/tenant-audit";

interface TenantLogsTopHeaderProps {
  scope: TenantAuditScope;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  timeRange: string;
  onTimeRangeChange: (val: string) => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  showHistogram: boolean;
  onToggleHistogram: () => void;
  onRefresh: () => void | Promise<void>;
  isFetching: boolean;
  autoRefreshMs: number;
  onAutoRefreshChange: (ms: number) => void;
  onExportCsv: () => void;
  onExportJson?: () => void;
  columnVisibility: Record<string, boolean>;
  onColumnVisibilityChange: (cols: Record<string, boolean>) => void;
  selectedCategories: Set<string>;
  onToggleCategory: (cat: string) => void;
  selectedSeverities: Set<string>;
  onToggleSeverity: (sev: string) => void;
  selectedLevels: Set<string>;
  onToggleLevel: (lvl: string) => void;
  selectedMethods: Set<string>;
  onToggleMethod: (m: string) => void;
  pathnameFilter: string;
  onPathnameFilterChange: (path: string) => void;
}

const AVAILABLE_COLUMNS = [
  { id: "date", label: "Timestamp" },
  { id: "status", label: "Status" },
  { id: "method", label: "Method" },
  { id: "pathname", label: "Path / Resource" },
  { id: "message", label: "Event & Actor" },
];

const COMMON_OPERATORS = [
  {
    groupName: "Equality",
    operators: [
      { key: "eq", label: "equals (=)", symbol: "=" },
      { key: "neq", label: "not equals (!=)", symbol: "!=" },
    ],
  },
];

const STRING_OPERATORS = [
  {
    groupName: "Text Matching",
    operators: [
      { key: "contains", label: "contains (~)", symbol: "~" },
      { key: "eq", label: "equals (=)", symbol: "=" },
    ],
  },
];

function buildPaletteFields(scope: TenantAuditScope): FilterFieldConfig[] {
  const isProject = scope === "PROJECT";
  const categoryOptions = isProject
    ? [
        { label: "ODC & ODP Nodes", value: "GIS_NODE" },
        { label: "Fiber Cables & Spans", value: "GIS_CABLE" },
        { label: "Core Splicing & Trays", value: "FIBER_SPLICING" },
        { label: "Customer Homepass", value: "CUSTOMER_HOMEPASS" },
        { label: "Dispatch & Tickets", value: "FIELD_TASK" },
        { label: "Spatial File I/O", value: "SPATIAL_IO" },
        { label: "Project Team Access", value: "PROJECT_ACCESS" },
      ]
    : [
        { label: "Team & Roles (IAM)", value: "IAM" },
        { label: "Security & MFA", value: "SECURITY" },
        { label: "Super Admin Sessions", value: "IMPERSONATION" },
        { label: "API Keys & Webhooks", value: "API_INTEGRATION" },
        { label: "Billing & Subscriptions", value: "BILLING" },
        { label: "Project Lifecycle", value: "PROJECT_GOVERNANCE" },
      ];

  return [
    {
      key: "category",
      label: isProject ? "Log Type" : "Category",
      icon: isProject ? <Activity className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />,
      description: isProject ? "Filter by FTTH technical mutation log type" : "Filter by organization governance category",
      placeholder: "Select category...",
      defaultOperator: "eq",
      operatorGroups: COMMON_OPERATORS,
      quickOptions: categoryOptions,
    },
    {
      key: "severity",
      label: "Severity",
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      description: "Filter by event severity level",
      placeholder: "Select severity...",
      defaultOperator: "eq",
      operatorGroups: COMMON_OPERATORS,
      quickOptions: [
        { label: "Critical", value: "CRITICAL", colorDot: "bg-rose-500" },
        { label: "Error", value: "ERROR", colorDot: "bg-rose-400" },
        { label: "Warning", value: "WARN", colorDot: "bg-amber-400" },
        { label: "Info", value: "INFO", colorDot: "bg-muted-foreground/40" },
      ],
    },
    {
      key: "level",
      label: "Level",
      icon: <Shield className="w-3.5 h-3.5" />,
      description: "Filter by HTTP response status code group",
      placeholder: "Select level...",
      defaultOperator: "eq",
      operatorGroups: COMMON_OPERATORS,
      quickOptions: [
        { label: "Success (2xx)", value: "success", colorDot: "bg-muted-foreground/40" },
        { label: "Warning (4xx)", value: "warning", colorDot: "bg-amber-400" },
        { label: "Error (5xx)", value: "error", colorDot: "bg-rose-400" },
      ],
    },
    {
      key: "method",
      label: "Method",
      icon: <Globe className="w-3.5 h-3.5" />,
      description: "Filter by HTTP/RPC mutation action verb",
      placeholder: "Select method...",
      defaultOperator: "eq",
      operatorGroups: COMMON_OPERATORS,
      quickOptions: [
        { label: "GET", value: "GET" },
        { label: "POST", value: "POST" },
        { label: "PUT", value: "PUT" },
        { label: "DELETE", value: "DELETE" },
        { label: "RPC", value: "RPC" },
      ],
    },
    {
      key: "pathname",
      label: "Resource Path",
      icon: <Globe className="w-3.5 h-3.5" />,
      description: "Filter by resource identifier or endpoint",
      placeholder: isProject ? "e.g. odp/kot-bdg-01..." : "e.g. iam/users...",
      defaultOperator: "contains",
      operatorGroups: STRING_OPERATORS,
    },
    {
      key: "actor",
      label: "Actor",
      icon: <User className="w-3.5 h-3.5" />,
      description: "Filter by actor email, user ID, or IP",
      placeholder: "e.g. user@example.com...",
      defaultOperator: "contains",
      operatorGroups: STRING_OPERATORS,
    },
  ];
}

interface TopHeaderRightActionsProps {
  onRefresh: () => void | Promise<void>;
  isFetching: boolean;
  showHistogram: boolean;
  onToggleHistogram: () => void;
  showColumnPicker: boolean;
  setShowColumnPicker: React.Dispatch<React.SetStateAction<boolean>>;
  columnVisibility: Record<string, boolean>;
  onColumnVisibilityChange: (cols: Record<string, boolean>) => void;
  columnBtnRef: React.RefObject<HTMLButtonElement | null>;
  onExportCsv: () => void;
  onExportJson?: () => void;
  autoRefreshMs: number;
  onAutoRefreshChange: (ms: number) => void;
}

function TopHeaderRightActions({
  onRefresh,
  isFetching,
  showHistogram,
  onToggleHistogram,
  showColumnPicker,
  setShowColumnPicker,
  columnVisibility,
  onColumnVisibilityChange,
  columnBtnRef,
  onExportCsv,
  onExportJson,
  autoRefreshMs,
  onAutoRefreshChange,
}: TopHeaderRightActionsProps) {
  const { t } = useTranslation();
  const isLiveActive = autoRefreshMs > 0;

  return (
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
  );
}

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
  selectedCategories,
  onToggleCategory,
  selectedSeverities,
  onToggleSeverity,
  selectedLevels,
  onToggleLevel,
  selectedMethods,
  onToggleMethod,
  pathnameFilter,
  onPathnameFilterChange,
}: TenantLogsTopHeaderProps) {
  const { t } = useTranslation();
  const [showPalette, setShowPalette] = React.useState(false);
  const [showTopTimePicker, setShowTopTimePicker] = React.useState(false);
  const [showColumnPicker, setShowColumnPicker] = React.useState(false);
  const filterAnchorRef = React.useRef<HTMLDivElement>(null);
  const timeRangePillRef = React.useRef<HTMLDivElement>(null);
  const columnBtnRef = React.useRef<HTMLButtonElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const paletteFields = React.useMemo(() => buildPaletteFields(scope), [scope]);

  const handleApplyPaletteFilter = (f: AppliedFilter) => {
    if (f.field === "category") onToggleCategory(f.value);
    else if (f.field === "severity") onToggleSeverity(f.value.toUpperCase());
    else if (f.field === "level") onToggleLevel(f.value.toLowerCase());
    else if (f.field === "method") onToggleMethod(f.value.toUpperCase());
    else if (f.field === "pathname") onPathnameFilterChange(f.value);
    else if (f.field === "actor") onSearchChange(f.value);
    setShowPalette(false);
  };

  const activePills = React.useMemo(() => {
    const list: Array<{ id: string; label: string; kind: "category" | "severity" | "level" | "method" | "pathname" | "search" }> = [];

    selectedCategories.forEach((cat) => {
      list.push({
        id: cat,
        label: `${scope === "PROJECT" ? "Log Type" : "Category"} = ${cat}`,
        kind: "category",
      });
    });

    selectedSeverities.forEach((sev) => {
      list.push({
        id: sev,
        label: `Severity = ${sev}`,
        kind: "severity",
      });
    });

    selectedLevels.forEach((lvl) => {
      list.push({
        id: lvl,
        label: `Level = ${lvl}`,
        kind: "level",
      });
    });

    selectedMethods.forEach((m) => {
      list.push({
        id: m,
        label: `Method = ${m}`,
        kind: "method",
      });
    });

    if (pathnameFilter.trim()) {
      list.push({
        id: "pathname",
        label: `Path = ${pathnameFilter.trim()}`,
        kind: "pathname",
      });
    }

    if (searchQuery.trim()) {
      list.push({
        id: "search",
        label: `Search = "${searchQuery.trim()}"`,
        kind: "search",
      });
    }

    return list;
  }, [selectedCategories, selectedSeverities, selectedLevels, selectedMethods, pathnameFilter, searchQuery, scope]);

  const hasActivePills = activePills.length > 0;

  const handleRemovePill = (pill: { id: string; kind: "category" | "severity" | "level" | "method" | "pathname" | "search" }) => {
    if (pill.kind === "category") onToggleCategory(pill.id);
    else if (pill.kind === "severity") onToggleSeverity(pill.id);
    else if (pill.kind === "level") onToggleLevel(pill.id);
    else if (pill.kind === "method") onToggleMethod(pill.id);
    else if (pill.kind === "pathname") onPathnameFilterChange("");
    else if (pill.kind === "search") onSearchChange("");
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-groove-b bg-card/60 backdrop-blur-md shrink-0 h-12 w-full font-mono text-xs select-none">
      {/* 1. Sidebar Toggle Button */}
      {isSidebarCollapsed && (
        <ActionTooltip label={t("observability.open_filter_panel") || "Open filter panel"} shortcut="Alt+S">
          <button
            onClick={onToggleSidebar}
            className="shrink-0 p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <PanelLeft className="w-3.5 h-3.5" />
          </button>
        </ActionTooltip>
      )}

      {/* 2. Unified Search Input Bar with Embedded Pills */}
      <div
        ref={filterAnchorRef}
        className="flex-1 flex items-center gap-1.5 bg-background border border-border/80 rounded-lg px-2.5 py-1 text-xs transition-colors overflow-hidden min-w-0 cursor-text shadow-2xs focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20"
        onClick={() => {
          if (!showTopTimePicker) {
            inputRef.current?.focus();
            setShowPalette(true);
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
              onFocus={() => setShowPalette(true)}
              placeholder={hasActivePills ? (t("observability.add_more_filters") || "Add more filters...") : (t("observability.filter_placeholder") || "Filter by Category, Severity, Action, or Actor...")}
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
      <TopHeaderRightActions
        onRefresh={onRefresh}
        isFetching={isFetching}
        showHistogram={showHistogram}
        onToggleHistogram={onToggleHistogram}
        showColumnPicker={showColumnPicker}
        setShowColumnPicker={setShowColumnPicker}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={onColumnVisibilityChange}
        columnBtnRef={columnBtnRef}
        onExportCsv={onExportCsv}
        onExportJson={onExportJson}
        autoRefreshMs={autoRefreshMs}
        onAutoRefreshChange={onAutoRefreshChange}
      />

      {/* 4. Interactive Quick Filter Palette */}
      {showPalette && (
        <LogsFilterPaletteCore
          fields={paletteFields}
          anchorRef={filterAnchorRef}
          searchQuery={searchQuery}
          onSearchQueryChange={onSearchChange}
          onClose={() => setShowPalette(false)}
          onApplyFilter={handleApplyPaletteFilter}
          onSelectTimeRange={(val) => {
            if (val) onTimeRangeChange(val);
          }}
        />
      )}
    </div>
  );
}

import * as React from "react";
import {
  LogsTopHeaderShell,
  LogsColumnPickerCore,
  ActionTooltip,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  type FilterFieldConfig,
  type AppliedFilter,
} from "@k2net/ui";
import {
  RefreshCw,
  BarChart2,
  Columns3,
  Download,
  Play,
  Pause,
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
  { id: "date", label: "Date & Time" },
  { id: "source", label: "Category Icon" },
  { id: "status", label: "Status Code" },
  { id: "method", label: "Action Method" },
  { id: "pathname", label: "Path / Resource" },
  { id: "message", label: "Event & Actor" },
  { id: "severity", label: "Severity Level" },
  { id: "category", label: "Taxonomy Category" },
  { id: "project", label: "Project Target" },
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

export function TenantLogsTopHeader(props: TenantLogsTopHeaderProps) {
  const { t } = useTranslation();
  const [showColumnPicker, setShowColumnPicker] = React.useState(false);
  const columnBtnRef = React.useRef<HTMLButtonElement>(null);

  const paletteFields = React.useMemo(() => buildPaletteFields(props.scope), [props.scope]);

  const handleApplyPaletteFilter = (f: AppliedFilter) => {
    if (f.field === "category") props.onToggleCategory(f.value);
    else if (f.field === "severity") props.onToggleSeverity(f.value.toUpperCase());
    else if (f.field === "level") props.onToggleLevel(f.value.toLowerCase());
    else if (f.field === "method") props.onToggleMethod(f.value.toUpperCase());
    else if (f.field === "pathname") props.onPathnameFilterChange(f.value);
    else if (f.field === "actor") props.onSearchChange(f.value);
  };

  const activePills = React.useMemo(() => {
    const list: Array<{ id: string; label: string; onRemove: () => void }> = [];

    props.selectedCategories.forEach((cat) => {
      list.push({
        id: `category-${cat}`,
        label: `${props.scope === "PROJECT" ? "Log Type" : "Category"} = ${cat}`,
        onRemove: () => props.onToggleCategory(cat),
      });
    });

    props.selectedSeverities.forEach((sev) => {
      list.push({
        id: `sev-${sev}`,
        label: `Severity = ${sev}`,
        onRemove: () => props.onToggleSeverity(sev),
      });
    });

    props.selectedLevels.forEach((lvl) => {
      list.push({
        id: `lvl-${lvl}`,
        label: `Level = ${lvl}`,
        onRemove: () => props.onToggleLevel(lvl),
      });
    });

    props.selectedMethods.forEach((m) => {
      list.push({
        id: `method-${m}`,
        label: `Method = ${m}`,
        onRemove: () => props.onToggleMethod(m),
      });
    });

    if (props.pathnameFilter.trim()) {
      list.push({
        id: "pathname",
        label: `Path = ${props.pathnameFilter.trim()}`,
        onRemove: () => props.onPathnameFilterChange(""),
      });
    }

    if (props.searchQuery.trim()) {
      list.push({
        id: "search",
        label: `Search = "${props.searchQuery.trim()}"`,
        onRemove: () => props.onSearchChange(""),
      });
    }

    return list;
  }, [props]);

  const isLiveActive = props.autoRefreshMs > 0;

  const rightActions = (
    <div className="flex items-center gap-1.5 shrink-0 pl-1">
      {/* Refresh Button */}
      <ActionTooltip label={t("observability.refresh_logs") || "Refresh logs"} shortcut="R">
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            try {
              await props.onRefresh();
            } catch {
              // handled by parent
            }
          }}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-border/60 rounded-md transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${props.isFetching ? "animate-spin text-primary" : ""}`} />
        </Button>
      </ActionTooltip>

      {/* Toggle Histogram Button */}
      <ActionTooltip label={t("observability.toggle_histogram") || "Toggle Histogram"} shortcut="H">
        <Button
          variant="ghost"
          size="sm"
          onClick={props.onToggleHistogram}
          className={`h-7 w-7 p-0 border rounded-md transition-colors cursor-pointer ${
            props.showHistogram
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
            visible: props.columnVisibility[col.id] !== false,
          }))}
          onToggleColumn={(colId, visible) => {
            props.onColumnVisibilityChange({
              ...props.columnVisibility,
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
            onClick={props.onExportCsv}
            className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <FileSpreadsheet className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-[11px] text-foreground truncate">{t("common.download_csv") || "CSV Dataset"}</span>
            </div>
            <DropdownMenuShortcut className="text-[9px] opacity-70">Alt+S</DropdownMenuShortcut>
          </DropdownMenuItem>

          {props.onExportJson && (
            <DropdownMenuItem
              onClick={props.onExportJson}
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
          onClick={() => props.onAutoRefreshChange(isLiveActive ? 0 : 30000)}
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

  return (
    <LogsTopHeaderShell
      isSidebarCollapsed={props.isSidebarCollapsed}
      onToggleSidebar={props.onToggleSidebar}
      sidebarTooltipLabel={t("observability.open_filter_panel") || "Open filter panel"}
      searchQuery={props.searchQuery}
      onSearchChange={props.onSearchChange}
      searchPlaceholder={t("observability.filter_placeholder") || "Filter by Category, Severity, Action, or Actor..."}
      timeRange={props.timeRange}
      onTimeRangeChange={props.onTimeRangeChange}
      activePills={activePills}
      paletteFields={paletteFields}
      onApplyPaletteFilter={handleApplyPaletteFilter}
      rightActionsSlot={rightActions}
      translateFn={(k) => t(k)}
    />
  );
}

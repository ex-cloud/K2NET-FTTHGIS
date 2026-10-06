import * as React from "react";
import {
  SecondarySidebarHeader,
  ActionTooltip,
  Badge,
  Checkbox,
  Input,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  LogsDateRangePickerCore,
  LogsFacetSectionShell,
} from "@k2net/ui";
import {
  RotateCcw,
  Bookmark,
  ChevronDown,
  Plus,
  Search,
} from "lucide-react";
import { useTranslation } from "@k2net/i18n";
import type { TenantAuditScope, TenantAuditStats } from "../../types/tenant-audit";

interface TenantLogsFilterSidebarProps {
  scope: TenantAuditScope;
  projectId?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  timeRange: string;
  onTimeRangeChange: (val: string) => void;
  selectedSeverities: Set<string>;
  onToggleSeverity: (sev: string) => void;
  selectedCategories: Set<string>;
  onToggleCategory: (cat: string) => void;
  selectedLevels: Set<string>;
  onToggleLevel: (lvl: string) => void;
  selectedMethods: Set<string>;
  onToggleMethod: (m: string) => void;
  pathnameFilter: string;
  onPathnameFilterChange: (path: string) => void;
  stats?: TenantAuditStats | null;
  onResetAll: () => void;
  onApplyPreset: (presetKey: string) => void;
  activePreset: string | null;
}

const ORG_PRESETS = [
  { key: "critical", label: "Critical Security Alerts" },
  { key: "impersonation", label: "Super Admin Impersonation" },
  { key: "iam", label: "Team PBAC Changes" },
  { key: "mfa", label: "Security & MFA Policies" },
  { key: "billing", label: "Billing & Subscriptions" },
];

const PROJECT_PRESETS = [
  { key: "critical", label: "Critical Network Faults" },
  { key: "topology", label: "ODP / ODC Asset Mutations" },
  { key: "fiber", label: "Fiber Cables & Splicing" },
  { key: "customer", label: "Subscriber Port Bindings" },
  { key: "tasks", label: "Trouble Tickets & Dispatch" },
];

const SEVERITY_OPTIONS = [
  { key: "CRITICAL", label: "Critical", dot: "bg-rose-500" },
  { key: "ERROR", label: "Error", dot: "bg-rose-400" },
  { key: "WARN", label: "Warning", dot: "bg-amber-400" },
  { key: "INFO", label: "Info", dot: "bg-muted-foreground/40" },
];

const LEVEL_OPTIONS = [
  { key: "success", label: "Success (2xx)", badge: "2xx", dot: "bg-muted-foreground/40" },
  { key: "warning", label: "Warning (4xx)", badge: "4xx", dot: "bg-amber-400" },
  { key: "error", label: "Error (5xx)", badge: "5xx", dot: "bg-rose-400" },
];

const METHOD_OPTIONS = [
  { key: "GET", label: "GET", badge: "text-muted-foreground bg-muted border-border" },
  { key: "POST", label: "POST", badge: "text-sky-400 bg-sky-500/10 border-sky-500/30" },
  { key: "PUT", label: "PUT", badge: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  { key: "DELETE", label: "DELETE", badge: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
  { key: "RPC", label: "RPC", badge: "text-teal-400 bg-teal-500/10 border-teal-500/30" },
];

const ORG_QUICK_PATHS = [
  "iam/users",
  "settings/org",
  "security/mfa",
  "billing/invoices",
  "api-keys",
  "projects",
];

const PROJECT_QUICK_PATHS = [
  "odp/*",
  "odc/*",
  "cables/*",
  "splice/*",
  "tickets/*",
  "customers/*",
];

function SidebarPresetsSection({
  presets,
  activePreset,
  onApplyPreset,
}: {
  presets: Array<{ key: string; label: string }>;
  activePreset: string | null;
  onApplyPreset: (key: string) => void;
}) {
  return (
    <Collapsible defaultOpen className="w-full space-y-1 pt-2.5 border-groove-t">
      <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/80 uppercase tracking-widest hover:text-foreground group select-none">
        <span className="flex items-center gap-1.5">
          <Bookmark className="w-3 h-3 text-muted-foreground/70 group-hover:text-foreground dark:text-muted-foreground/80" />
          <span>SAVED PRESETS</span>
        </span>
        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className="text-[9px] font-mono px-1 py-0 h-3.5 border-border bg-muted/40 text-muted-foreground"
          >
            {presets.length}
          </Badge>
          <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180 text-muted-foreground/60 group-hover:text-foreground dark:text-muted-foreground/70" />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-1 mt-1">
        <div className="space-y-0.5 max-h-[220px] overflow-y-auto custom-scrollbar-thin pr-1 font-sans">
          {presets.map((preset) => {
            const isActive = activePreset === preset.key;
            return (
              <div
                key={preset.key}
                onClick={() => onApplyPreset(preset.key)}
                className={`flex items-center justify-between px-2 py-1.5 rounded-md transition-colors cursor-pointer group text-xs ${
                  isActive
                    ? "bg-muted text-foreground font-semibold"
                    : "hover:bg-muted/70 text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 pr-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 group-hover:bg-foreground/70 transition-colors shrink-0" />
                  <span
                    title={preset.label}
                    className="truncate font-medium text-[11px] group-hover:text-foreground transition-colors select-none"
                  >
                    {preset.label}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[9px] font-mono font-semibold px-1 py-0.5 rounded bg-muted/70 text-muted-foreground/70 border border-border/30">
                    SYS
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className="w-full flex items-center justify-center gap-1.5 py-1 px-2 mt-1 rounded-md border border-dashed border-border/80 text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/30 transition-colors cursor-pointer"
        >
          <Plus className="w-3 h-3 text-muted-foreground" />
          <span>Save Current Search</span>
        </button>
      </CollapsibleContent>
    </Collapsible>
  );
}

function SidebarSeveritySection({
  selectedSeverities,
  onToggleSeverity,
  stats,
}: {
  selectedSeverities: Set<string>;
  onToggleSeverity: (sev: string) => void;
  stats?: TenantAuditStats | null;
}) {
  const { t } = useTranslation();
  return (
    <LogsFacetSectionShell
      title={t("security.audit_filter_severity_placeholder") || "Severity"}
      activeLabel={selectedSeverities.size > 0 ? `× ${selectedSeverities.size}` : null}
      defaultOpen
    >
      <div className="rounded-md border border-border/70 bg-card/40 overflow-hidden divide-y divide-border/40 font-mono text-[11px] shadow-2xs mt-1">
        {SEVERITY_OPTIONS.map((sev) => {
          const isChecked = selectedSeverities.has(sev.key);
          const count = stats?.eventsBySeverity?.[sev.key] ?? 0;
          return (
            <label
              key={sev.key}
              className="flex items-center justify-between px-2.5 py-1.5 hover:bg-muted/40 cursor-pointer transition-colors select-none group/sev"
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => onToggleSeverity(sev.key)}
                  className="size-3.5 rounded-[3px]"
                />
                <span className="text-muted-foreground group-hover/sev:text-foreground transition-colors text-[11px] font-medium">
                  {sev.label}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className={`w-2 h-2 rounded-xs ${sev.dot}`} />
                <span className={`text-[10px] font-mono min-w-[14px] text-right font-medium ${count > 0 ? "text-foreground font-medium" : "text-muted-foreground/40"}`}>
                  {count}
                </span>
              </div>
            </label>
          );
        })}
      </div>
    </LogsFacetSectionShell>
  );
}

function SidebarCategorySection({
  facetTitle,
  categories,
  selectedCategories,
  onToggleCategory,
  stats,
  scope,
}: {
  facetTitle: string;
  categories: Array<{ key: string; label: string }>;
  selectedCategories: Set<string>;
  onToggleCategory: (cat: string) => void;
  stats?: TenantAuditStats | null;
  scope: TenantAuditScope;
}) {
  const [typeSearch, setTypeSearch] = React.useState("");
  const filtered = React.useMemo(() => {
    if (!typeSearch.trim()) return categories;
    const q = typeSearch.toLowerCase().trim();
    return categories.filter(
      (c) => c.label.toLowerCase().includes(q) || c.key.toLowerCase().includes(q)
    );
  }, [categories, typeSearch]);

  return (
    <LogsFacetSectionShell
      title={facetTitle}
      activeLabel={selectedCategories.size > 0 ? `× ${selectedCategories.size}` : null}
      defaultOpen
    >
      <div className="space-y-1.5 mt-1">
        <div className="relative">
          <Input
            type="text"
            value={typeSearch}
            onChange={(e) => setTypeSearch(e.target.value)}
            placeholder={scope === "PROJECT" ? "Search log types..." : "Search categories..."}
            className="bg-background border-border/60 text-foreground text-xs h-7 pl-7 font-mono focus:border-border focus-visible:ring-0"
          />
          <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
        </div>

        <div className="rounded-md border border-border/70 bg-card/40 overflow-hidden divide-y divide-border/40 font-mono text-[11px] shadow-2xs max-h-[260px] overflow-y-auto custom-scrollbar-thin">
          {filtered.map((item) => {
            const isChecked = selectedCategories.has(item.key);
            const count = stats?.eventsByCategory?.[item.key] ?? 0;
            return (
              <label
                key={item.key}
                className="flex items-center justify-between px-2.5 py-1.5 hover:bg-muted/40 cursor-pointer transition-colors select-none group/cat"
              >
                <div className="flex items-center gap-2 min-w-0 pr-1">
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => onToggleCategory(item.key)}
                    className="size-3.5 rounded-[3px] shrink-0"
                  />
                  <span className="text-muted-foreground group-hover/cat:text-foreground transition-colors truncate text-[11px] font-medium">
                    {item.label}
                  </span>
                </div>
                <span className={`text-[10px] font-mono min-w-[14px] text-right font-medium shrink-0 ${count > 0 ? "text-foreground font-medium" : "text-muted-foreground/40"}`}>
                  {count}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </LogsFacetSectionShell>
  );
}

function SidebarLevelSection({
  selectedLevels,
  onToggleLevel,
}: {
  selectedLevels: Set<string>;
  onToggleLevel: (lvl: string) => void;
}) {
  return (
    <LogsFacetSectionShell
      title="Level"
      activeLabel={selectedLevels.size > 0 ? `× ${selectedLevels.size}` : null}
      defaultOpen={false}
    >
      <div className="rounded-md border border-border/70 bg-card/40 overflow-hidden divide-y divide-border/40 font-mono text-[11px] shadow-2xs mt-1">
        {LEVEL_OPTIONS.map((lvl) => {
          const isChecked = selectedLevels.has(lvl.key);
          return (
            <label
              key={lvl.key}
              className="flex items-center justify-between px-2.5 py-1.5 hover:bg-muted/40 cursor-pointer transition-colors select-none group/lvl"
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => onToggleLevel(lvl.key)}
                  className="size-3.5 rounded-[3px]"
                />
                <span className="text-muted-foreground group-hover/lvl:text-foreground transition-colors text-[11px] font-medium">
                  {lvl.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/70">
                <span className={`w-2 h-2 rounded-xs ${lvl.dot}`} />
                <span>{lvl.badge}</span>
              </div>
            </label>
          );
        })}
      </div>
    </LogsFacetSectionShell>
  );
}

function SidebarMethodSection({
  selectedMethods,
  onToggleMethod,
}: {
  selectedMethods: Set<string>;
  onToggleMethod: (m: string) => void;
}) {
  return (
    <LogsFacetSectionShell
      title="Method"
      activeLabel={selectedMethods.size > 0 ? `× ${selectedMethods.size}` : null}
      defaultOpen={false}
    >
      <div className="rounded-md border border-border/70 bg-card/40 overflow-hidden divide-y divide-border/40 font-mono text-[11px] shadow-2xs mt-1">
        {METHOD_OPTIONS.map((m) => {
          const isChecked = selectedMethods.has(m.key);
          return (
            <label
              key={m.key}
              className="flex items-center justify-between px-2.5 py-1.5 hover:bg-muted/40 cursor-pointer transition-colors select-none group/m"
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => onToggleMethod(m.key)}
                  className="size-3.5 rounded-[3px]"
                />
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-medium border ${m.badge}`}>
                  {m.label}
                </span>
              </div>
            </label>
          );
        })}
      </div>
    </LogsFacetSectionShell>
  );
}

function SidebarPathnameSection({
  pathnameFilter,
  onPathnameFilterChange,
  quickPaths,
}: {
  pathnameFilter: string;
  onPathnameFilterChange: (path: string) => void;
  quickPaths: string[];
}) {
  return (
    <LogsFacetSectionShell
      title="Pathname"
      activeLabel={pathnameFilter.trim() || null}
      defaultOpen={false}
    >
      <div className="relative flex items-center mb-2">
        <Input
          type="text"
          value={pathnameFilter}
          onChange={(e) => onPathnameFilterChange(e.target.value)}
          placeholder="Search path, e.g. iam/users..."
          className="bg-background border-border/60 text-foreground text-xs h-7 font-mono focus:border-border focus-visible:ring-0 pr-6"
        />
        {pathnameFilter && (
          <button
            type="button"
            onClick={() => onPathnameFilterChange("")}
            className="absolute right-2 text-muted-foreground hover:text-rose-400 transition-colors text-xs font-mono font-medium cursor-pointer"
            title="Clear path filter"
          >
            ×
          </button>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-[9px] font-medium text-muted-foreground/70 uppercase tracking-wider">
          Quick Endpoints
        </div>
        <div className="flex flex-wrap gap-1">
          {quickPaths.map((path) => (
            <button
              key={path}
              type="button"
              onClick={() => onPathnameFilterChange(pathnameFilter === path ? "" : path)}
              className={`px-1.5 py-0.5 rounded text-[10px] border transition-colors truncate max-w-full font-mono cursor-pointer font-medium ${
                pathnameFilter === path
                  ? "bg-primary/15 border-primary/40 text-primary font-medium"
                  : "bg-muted/30 border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/60 font-medium"
              }`}
            >
              {path}
            </button>
          ))}
        </div>
      </div>
    </LogsFacetSectionShell>
  );
}

export function TenantLogsFilterSidebar({
  scope,
  isCollapsed,
  onToggleCollapse,
  timeRange,
  onTimeRangeChange,
  selectedSeverities,
  onToggleSeverity,
  selectedCategories,
  onToggleCategory,
  selectedLevels,
  onToggleLevel,
  selectedMethods,
  onToggleMethod,
  pathnameFilter,
  onPathnameFilterChange,
  stats,
  onResetAll,
  onApplyPreset,
  activePreset,
}: TenantLogsFilterSidebarProps) {
  const { t } = useTranslation();
  const presets = scope === "PROJECT" ? PROJECT_PRESETS : ORG_PRESETS;
  const quickPaths = scope === "PROJECT" ? PROJECT_QUICK_PATHS : ORG_QUICK_PATHS;

  const categoryDefinitions = React.useMemo(() => {
    if (scope === "PROJECT") {
      return [
        { key: "GIS_NODE", label: t("security.audit_log_type_gis_node") || "ODC & ODP Nodes" },
        { key: "GIS_CABLE", label: t("security.audit_log_type_gis_cable") || "Fiber Cables & Spans" },
        { key: "FIBER_SPLICING", label: t("security.audit_log_type_fiber_splicing") || "Core Splicing & Trays" },
        { key: "CUSTOMER_HOMEPASS", label: t("security.audit_log_type_customer") || "Customer Homepass" },
        { key: "FIELD_TASK", label: t("security.audit_log_type_dispatch") || "Dispatch & Tickets" },
        { key: "SPATIAL_IO", label: t("security.audit_log_type_spatial_io") || "Spatial File I/O" },
        { key: "PROJECT_ACCESS", label: t("security.audit_log_type_project_access") || "Project Team Access" },
      ];
    }
    return [
      { key: "IAM", label: t("security.audit_log_type_iam") || "Team & Roles (IAM)" },
      { key: "SECURITY", label: t("security.audit_log_type_security") || "Security & MFA" },
      { key: "IMPERSONATION", label: t("security.audit_log_type_impersonation") || "Super Admin Sessions" },
      { key: "API_INTEGRATION", label: t("security.audit_log_type_api") || "API Keys & Webhooks" },
      { key: "BILLING", label: t("security.audit_log_type_billing") || "Billing & Subscriptions" },
      { key: "PROJECT_GOVERNANCE", label: t("security.audit_log_type_project_gov") || "Project Lifecycle" },
    ];
  }, [scope, t]);

  const hasActiveFilters =
    timeRange !== "24h" ||
    selectedSeverities.size > 0 ||
    selectedCategories.size > 0 ||
    selectedLevels.size > 0 ||
    selectedMethods.size > 0 ||
    pathnameFilter.trim().length > 0 ||
    activePreset !== null;

  if (isCollapsed) return null;

  const facetTitle = scope === "PROJECT" ? (t("security.audit_log_type_label") || "LOG TYPE") : (t("security.audit_category_label") || "CATEGORY");

  return (
    <div className="flex flex-col h-full w-[240px] font-sans text-xs bg-sidebar select-none border-groove-r shrink-0">
      {/* 1. Header with Reset and Collapse */}
      <SecondarySidebarHeader
        title={scope === "PROJECT" ? (t("security.audit_proj_title") || "Project Audit Trail") : (t("security.audit_org_title") || "Organization Audit Trail")}
        onCollapse={onToggleCollapse}
        actions={
          hasActiveFilters ? (
            <ActionTooltip label={t("security.audit_reset_filter") || "Reset filter"}>
              <button
                type="button"
                onClick={onResetAll}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{t("common.reset") || "Reset"}</span>
              </button>
            </ActionTooltip>
          ) : null
        }
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar-thin p-3 space-y-4">
        {/* 2. TIME RANGE */}
        <div className="w-full space-y-1">
          <div className="flex items-center justify-between px-1 py-1">
            <span className="text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/80 uppercase tracking-widest">
              {t("security.audit_time_label") || "TIME RANGE"}
            </span>
          </div>
          <LogsDateRangePickerCore
            value={timeRange}
            onChange={onTimeRangeChange}
            translateFn={(key) => t(key)}
          />
        </div>

        {/* 3. SAVED PRESETS */}
        <SidebarPresetsSection
          presets={presets}
          activePreset={activePreset}
          onApplyPreset={onApplyPreset}
        />

        {/* 4. SEVERITY SECTION */}
        <SidebarSeveritySection
          selectedSeverities={selectedSeverities}
          onToggleSeverity={onToggleSeverity}
          stats={stats}
        />

        {/* 5. CATEGORY (Org Scope) / LOG TYPE (Project Scope) */}
        <SidebarCategorySection
          facetTitle={facetTitle}
          categories={categoryDefinitions}
          selectedCategories={selectedCategories}
          onToggleCategory={onToggleCategory}
          stats={stats}
          scope={scope}
        />

        {/* 6. LEVEL SECTION */}
        <SidebarLevelSection
          selectedLevels={selectedLevels}
          onToggleLevel={onToggleLevel}
        />

        {/* 7. METHOD SECTION */}
        <SidebarMethodSection
          selectedMethods={selectedMethods}
          onToggleMethod={onToggleMethod}
        />

        {/* 8. PATHNAME SECTION */}
        <SidebarPathnameSection
          pathnameFilter={pathnameFilter}
          onPathnameFilterChange={onPathnameFilterChange}
          quickPaths={quickPaths}
        />
      </div>
    </div>
  );
}

import * as React from "react";
import {
  Input,
  Checkbox,
  Badge,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  SecondarySidebarHeader,
  ActionTooltip,
  LogsDateRangePickerCore,
  LogsFacetSectionShell,
} from "@k2net/ui";
import {
  Bookmark,
  ChevronDown,
  RotateCcw,
  Plus,
  Layers,
  Radio,
  Network,
  User,
  Building,
  Key,
  CreditCard,
  Shield,
  History,
  Flame,
} from "lucide-react";
import { useTranslation } from "@k2net/i18n";
import type { TenantAuditScope, TenantAuditStats } from "../../types/tenant-audit";

export interface TenantLogsFilterSidebarProps {
  scope: TenantAuditScope;
  projectId?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  timeRange: string;
  onTimeRangeChange: (val: string) => void;
  selectedSeverities: Set<string>;
  onToggleSeverity: (sev: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  resourceSearch: string;
  onResourceSearchChange: (val: string) => void;
  stats: TenantAuditStats | null;
  onResetAll: () => void;
  onApplyPreset: (presetKey: string) => void;
  activePreset: string | null;
}

const ORG_PRESETS = [
  { key: "critical", label: "Critical Security Alerts", countKey: "critical" },
  { key: "impersonation", label: "Super Admin Impersonation", countKey: "impersonation" },
  { key: "iam", label: "Team PBAC Changes", countKey: "iam" },
  { key: "mfa", label: "Security & MFA Policies", countKey: "security" },
  { key: "billing", label: "Billing & Subscriptions", countKey: "billing" },
];

const PROJECT_PRESETS = [
  { key: "critical", label: "Critical Network Faults", countKey: "critical" },
  { key: "topology", label: "ODP / ODC Asset Mutations", countKey: "network" },
  { key: "fiber", label: "Fiber Cables & Splicing", countKey: "fiber" },
  { key: "customer", label: "Subscriber Port Bindings", countKey: "customer" },
  { key: "tasks", label: "Trouble Tickets & Dispatch", countKey: "task" },
];

export const SEVERITY_OPTIONS = [
  { key: "CRITICAL", label: "Critical", dot: "bg-rose-500" },
  { key: "ERROR", label: "Error", dot: "bg-rose-400" },
  { key: "WARN", label: "Warning", dot: "bg-amber-400" },
  { key: "INFO", label: "Info", dot: "bg-muted-foreground/40" },
];

export function TenantLogsFilterSidebar({
  scope,
  isCollapsed,
  onToggleCollapse,
  timeRange,
  onTimeRangeChange,
  selectedSeverities,
  onToggleSeverity,
  selectedCategory,
  onSelectCategory,
  resourceSearch,
  onResourceSearchChange,
  stats,
  onResetAll,
  onApplyPreset,
  activePreset,
}: TenantLogsFilterSidebarProps) {
  const { t } = useTranslation();
  const presets = scope === "PROJECT" ? PROJECT_PRESETS : ORG_PRESETS;

  // Category list based on scope
  const categories = React.useMemo(() => {
    if (scope === "PROJECT") {
      return [
        { key: "ALL", label: t("security.audit_category_all") || "All Categories", icon: Layers },
        { key: "NETWORK", label: t("security.audit_category_network") || "Network Assets", icon: Radio },
        { key: "FIBER", label: t("security.audit_category_fiber") || "Fiber & Splicing", icon: Network },
        { key: "CUSTOMER", label: t("security.audit_category_customer") || "Subscribers", icon: User },
        { key: "TASK", label: t("security.audit_category_task") || "Trouble Tasks", icon: Flame },
        { key: "GIS_SURVEY", label: t("security.audit_category_gis") || "GIS Survey", icon: Layers },
      ];
    }
    return [
      { key: "ALL", label: t("security.audit_category_all") || "All Categories", icon: Building },
      { key: "IAM", label: t("security.audit_category_iam") || "Team & Roles (IAM)", icon: User },
      { key: "SETTINGS", label: t("security.audit_category_settings") || "Org Settings", icon: Building },
      { key: "SECURITY", label: t("security.audit_category_security") || "Security & MFA", icon: Shield },
      { key: "BILLING", label: t("security.audit_category_billing") || "Billing & Sub", icon: CreditCard },
      { key: "API_KEY", label: t("security.audit_category_apikey") || "API & Webhooks", icon: Key },
      { key: "PROJECT_LIFECYCLE", label: t("security.audit_category_project_lc") || "Project Lifecycle", icon: History },
    ];
  }, [scope, t]);

  const hasActiveFilters =
    timeRange !== "24h" ||
    selectedSeverities.size > 0 ||
    selectedCategory !== "ALL" ||
    activePreset !== null ||
    resourceSearch.trim().length > 0;

  if (isCollapsed) return null;

  return (
    <div className="flex flex-col h-full w-[240px] font-sans text-xs bg-sidebar select-none border-groove-r shrink-0">
      {/* 1. Header with Reset and Collapse */}
      <SecondarySidebarHeader
        title={scope === "PROJECT" ? (t("security.audit_proj_title") || "Project Logs Explorer") : (t("security.audit_org_title") || "Audit Logs Explorer")}
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

        {/* 4. SEVERITY SECTION (Pixel-Perfect Checkbox & Count list) */}
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

        {/* 5. DOMAIN / CATEGORY / SCOPE FILTER SECTION (Segmented Control + Search) */}
        <LogsFacetSectionShell
          title={scope === "PROJECT" ? (t("security.audit_domain_scope") || "Project Domain & Category") : (t("security.audit_category_label") || "Organization Domain")}
          activeLabel={selectedCategory !== "ALL" ? selectedCategory : null}
          defaultOpen
        >
          <div className="grid grid-cols-2 gap-1 mb-2">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => onSelectCategory(cat.key)}
                  className={`px-2 py-1 rounded text-[10px] border transition-colors text-left truncate font-medium cursor-pointer ${
                    isSelected
                      ? "bg-muted/80 border-border text-foreground font-medium"
                      : "bg-muted/20 border-border/30 text-muted-foreground hover:text-foreground hover:bg-muted/40 font-medium"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-1">
            <div className="relative flex items-center">
              <Input
                type="text"
                value={resourceSearch}
                onChange={(e) => onResourceSearchChange(e.target.value)}
                placeholder={t("security.audit_filter_resource_placeholder") || "Filter resource or category..."}
                className="bg-background border-border/60 text-foreground text-xs h-7 font-mono focus:border-border focus-visible:ring-0 pr-6"
              />
              {resourceSearch && (
                <button
                  type="button"
                  onClick={() => onResourceSearchChange("")}
                  className="absolute right-2 text-muted-foreground hover:text-rose-400 transition-colors text-xs font-mono font-medium cursor-pointer"
                  title="Clear filter"
                >
                  ×
                </button>
              )}
            </div>
            <p className="text-[9px] text-muted-foreground/50 italic font-sans leading-tight">
              {t("security.audit_smart_resource_hint") || "Matches resource type, ID, or action"}
            </p>
          </div>
        </LogsFacetSectionShell>
      </div>
    </div>
  );
}

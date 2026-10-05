import * as React from "react";
import {
  SecondarySidebarHeader,
  ActionTooltip,
  LogsDateRangePickerCore,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@k2net/ui";
import {
  ChevronDown,
  RotateCcw,
  Shield,
  Layers,
  AlertTriangle,
  Flame,
  Radio,
  Network,
  User,
  Building,
  Key,
  CreditCard,
  History,
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
  stats: TenantAuditStats | null;
  onResetAll: () => void;
  onApplyPreset: (presetKey: string) => void;
  activePreset: string | null;
}

const ORG_PRESETS = [
  { key: "critical", label: "Critical Security Alerts", icon: AlertTriangle, countKey: "critical" },
  { key: "impersonation", label: "Super Admin Impersonation", icon: Shield, countKey: "impersonation" },
  { key: "iam", label: "Team PBAC Changes", icon: User, countKey: "iam" },
  { key: "mfa", label: "Security & MFA Policies", icon: Key, countKey: "security" },
  { key: "billing", label: "Billing & Subscriptions", icon: CreditCard, countKey: "billing" },
];

const PROJECT_PRESETS = [
  { key: "critical", label: "Critical Network Faults", icon: AlertTriangle, countKey: "critical" },
  { key: "topology", label: "ODP / ODC Asset Mutations", icon: Radio, countKey: "network" },
  { key: "fiber", label: "Fiber Cables & Splicing", icon: Network, countKey: "fiber" },
  { key: "customer", label: "Subscriber Port Bindings", icon: User, countKey: "customer" },
  { key: "tasks", label: "Trouble Tickets & Dispatch", icon: Flame, countKey: "task" },
];

const SEVERITIES = [
  { key: "CRITICAL", label: "Critical", dotColor: "bg-rose-500", textColor: "text-rose-400" },
  { key: "ERROR", label: "Error", dotColor: "bg-red-500", textColor: "text-red-400" },
  { key: "WARN", label: "Warning", dotColor: "bg-amber-500", textColor: "text-amber-400" },
  { key: "INFO", label: "Info", dotColor: "bg-primary", textColor: "text-primary" },
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
        { key: "ALL", label: t("security.audit_category_all"), icon: Layers },
        { key: "NETWORK", label: t("security.audit_category_network"), icon: Radio },
        { key: "FIBER", label: t("security.audit_category_fiber"), icon: Network },
        { key: "CUSTOMER", label: t("security.audit_category_customer"), icon: User },
        { key: "TASK", label: t("security.audit_category_task"), icon: Flame },
        { key: "GIS_SURVEY", label: t("security.audit_category_gis"), icon: Layers },
      ];
    }
    return [
      { key: "ALL", label: t("security.audit_category_all"), icon: Building },
      { key: "IAM", label: t("security.audit_category_iam"), icon: User },
      { key: "SETTINGS", label: t("security.audit_category_settings"), icon: Building },
      { key: "SECURITY", label: t("security.audit_category_security"), icon: Shield },
      { key: "BILLING", label: t("security.audit_category_billing"), icon: CreditCard },
      { key: "API_KEY", label: t("security.audit_category_apikey"), icon: Key },
      { key: "PROJECT_LIFECYCLE", label: t("security.audit_category_project_lc"), icon: History },
    ];
  }, [scope, t]);

  if (isCollapsed) return null;

  return (
    <aside className="w-[240px] border-r border-border/80 bg-sidebar h-full hidden md:flex flex-col shrink-0 select-none overflow-hidden font-mono text-xs">
      {/* 1. Header */}
      <SecondarySidebarHeader
        title={scope === "PROJECT" ? "Project Logs Explorer" : "Audit Logs Explorer"}
        onCollapse={onToggleCollapse}
        actions={
          <ActionTooltip label={t("security.audit_reset_filter")} side="bottom">
            <button
              type="button"
              onClick={onResetAll}
              className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </ActionTooltip>
        }
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-5 min-w-[240px]">
        {/* 2. TIME RANGE */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest block px-1">
            {t("security.audit_time_label")}
          </span>
          <div className="w-full">
            <LogsDateRangePickerCore
              value={timeRange}
              onChange={onTimeRangeChange}
              translateFn={(key) => t(key)}
            />
          </div>
        </div>

        {/* 3. SAVED PRESETS */}
        <Collapsible defaultOpen className="w-full space-y-1.5">
          <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-0.5 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group">
            <span>SAVED PRESETS</span>
            <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-0.5 pt-1">
            {presets.map((preset) => {
              const Icon = preset.icon;
              const isActive = activePreset === preset.key;
              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => onApplyPreset(preset.key)}
                  className={`w-full px-2 py-1.5 rounded-md flex items-center gap-2 text-[11px] transition-all cursor-pointer text-left ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate flex-1">{preset.label}</span>
                </button>
              );
            })}
          </CollapsibleContent>
        </Collapsible>

        {/* 4. SEVERITY */}
        <Collapsible defaultOpen className="w-full space-y-1.5">
          <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-0.5 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group">
            <span>{t("security.audit_filter_severity_placeholder")}</span>
            <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 pt-1">
            {SEVERITIES.map((sev) => {
              const isChecked = selectedSeverities.has(sev.key);
              const count = stats?.eventsBySeverity?.[sev.key] ?? 0;
              return (
                <div
                  key={sev.key}
                  onClick={() => onToggleSeverity(sev.key)}
                  className="flex items-center justify-between px-2 py-1 rounded hover:bg-muted/40 cursor-pointer text-[11px] group"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${sev.dotColor}`} />
                    <span className={isChecked ? "text-foreground font-semibold" : "text-muted-foreground group-hover:text-foreground"}>
                      {sev.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground/80 bg-muted/40 px-1.5 py-0.2 rounded">
                    {count}
                  </span>
                </div>
              );
            })}
          </CollapsibleContent>
        </Collapsible>

        {/* 5. CATEGORIES / LOG DOMAIN */}
        <Collapsible defaultOpen className="w-full space-y-1.5">
          <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-0.5 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group">
            <span>{t("security.audit_category_label")}</span>
            <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-0.5 pt-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.key;
              const count = cat.key === "ALL"
                ? stats?.totalEvents24h ?? 0
                : stats?.eventsByCategory?.[cat.key] ?? 0;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => onSelectCategory(cat.key)}
                  className={`w-full px-2 py-1.5 rounded-md flex items-center justify-between text-[11px] transition-all cursor-pointer text-left ${
                    isSelected
                      ? "bg-sidebar-accent text-foreground font-semibold border border-border/80"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Icon className="w-3.5 h-3.5 shrink-0 text-muted-foreground/70" />
                    <span className="truncate">{cat.label}</span>
                  </div>
                  {count > 0 && (
                    <span className="text-[10px] font-mono text-muted-foreground bg-muted/40 px-1.5 py-0.2 rounded shrink-0">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </aside>
  );
}

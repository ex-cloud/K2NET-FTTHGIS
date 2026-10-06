import * as React from "react";
import { LogsFilterSidebarShell } from "@k2net/ui";
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

interface CategoryMeta {
  key: string;
  i18nKey: string;
  defaultLabel: string;
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

const PROJECT_CATEGORIES: CategoryMeta[] = [
  { key: "GIS_NODE", i18nKey: "security.audit_log_type_gis_node", defaultLabel: "ODC & ODP Nodes" },
  { key: "GIS_CABLE", i18nKey: "security.audit_log_type_gis_cable", defaultLabel: "Fiber Cables & Spans" },
  { key: "FIBER_SPLICING", i18nKey: "security.audit_log_type_fiber_splicing", defaultLabel: "Core Splicing & Trays" },
  { key: "CUSTOMER_HOMEPASS", i18nKey: "security.audit_log_type_customer", defaultLabel: "Customer Homepass" },
  { key: "FIELD_TASK", i18nKey: "security.audit_log_type_dispatch", defaultLabel: "Dispatch & Tickets" },
  { key: "SPATIAL_IO", i18nKey: "security.audit_log_type_spatial_io", defaultLabel: "Spatial File I/O" },
  { key: "PROJECT_ACCESS", i18nKey: "security.audit_log_type_project_access", defaultLabel: "Project Team Access" },
];

const ORG_CATEGORIES: CategoryMeta[] = [
  { key: "IAM", i18nKey: "security.audit_log_type_iam", defaultLabel: "Team & Roles (IAM)" },
  { key: "SECURITY", i18nKey: "security.audit_log_type_security", defaultLabel: "Security & MFA" },
  { key: "IMPERSONATION", i18nKey: "security.audit_log_type_impersonation", defaultLabel: "Super Admin Sessions" },
  { key: "API_INTEGRATION", i18nKey: "security.audit_log_type_api", defaultLabel: "API Keys & Webhooks" },
  { key: "BILLING", i18nKey: "security.audit_log_type_billing", defaultLabel: "Billing & Subscriptions" },
  { key: "PROJECT_GOVERNANCE", i18nKey: "security.audit_log_type_project_gov", defaultLabel: "Project Lifecycle" },
];

const SEVERITY_CONFIG = [
  { key: "CRITICAL", label: "Critical", dot: "bg-rose-500" },
  { key: "ERROR", label: "Error", dot: "bg-rose-400" },
  { key: "WARN", label: "Warning", dot: "bg-amber-400" },
  { key: "INFO", label: "Info", dot: "bg-muted-foreground/40" },
];

const LEVEL_CONFIG = [
  { key: "success", label: "Success (2xx)", badge: "2xx", dot: "bg-muted-foreground/40" },
  { key: "warning", label: "Warning (4xx)", badge: "4xx", dot: "bg-amber-400" },
  { key: "error", label: "Error (5xx)", badge: "5xx", dot: "bg-rose-400" },
];

const METHOD_CONFIG = [
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

function buildCategoryFacetItems(
  metas: CategoryMeta[],
  t: (k: string) => string,
  stats?: TenantAuditStats | null
) {
  return metas.map((meta) => {
    const label = t(meta.i18nKey) || meta.defaultLabel;
    const count = stats?.eventsByCategory?.[meta.key] || 0;
    return { key: meta.key, label, count };
  });
}

export function TenantLogsFilterSidebar(props: TenantLogsFilterSidebarProps) {
  const { t } = useTranslation();
  const isProject = props.scope === "PROJECT";

  const facetTitle = isProject
    ? (t("security.audit_log_type_label") || "LOG TYPE")
    : (t("security.audit_category_label") || "CATEGORY");

  const title = isProject
    ? (t("security.audit_proj_title") || "Project Audit Trail")
    : (t("security.audit_org_title") || "Organization Audit Trail");

  const categoryDefinitions = React.useMemo(() => {
    const metas = isProject ? PROJECT_CATEGORIES : ORG_CATEGORIES;
    return buildCategoryFacetItems(metas, t, props.stats);
  }, [isProject, t, props.stats]);

  const severities = React.useMemo(() => {
    return SEVERITY_CONFIG.map((s) => ({
      ...s,
      count: props.stats?.eventsBySeverity?.[s.key] || 0,
    }));
  }, [props.stats]);

  const hasActiveFilters =
    props.timeRange !== "24h" ||
    props.selectedSeverities.size > 0 ||
    props.selectedCategories.size > 0 ||
    props.selectedLevels.size > 0 ||
    props.selectedMethods.size > 0 ||
    props.pathnameFilter.trim().length > 0 ||
    props.activePreset !== null;

  return (
    <LogsFilterSidebarShell
      title={title}
      isCollapsed={props.isCollapsed}
      onToggleCollapse={props.onToggleCollapse}
      hasActiveFilters={hasActiveFilters}
      onResetAll={props.onResetAll}
      resetTooltipLabel={t("security.audit_reset_filter") || "Reset filter"}
      timeRange={props.timeRange}
      onTimeRangeChange={props.onTimeRangeChange}
      timeRangeLabel={t("security.audit_time_label") || "TIME RANGE"}
      presets={isProject ? PROJECT_PRESETS : ORG_PRESETS}
      activePreset={props.activePreset}
      onApplyPreset={props.onApplyPreset}
      severities={severities}
      isSeveritySelected={(k) => props.selectedSeverities.has(k)}
      onToggleSeverity={props.onToggleSeverity}
      facetTitle={facetTitle}
      facetItems={categoryDefinitions}
      isFacetItemSelected={(k) => props.selectedCategories.has(k)}
      onToggleFacetItem={props.onToggleCategory}
      levels={LEVEL_CONFIG}
      isLevelSelected={(k) => props.selectedLevels.has(k)}
      onToggleLevel={props.onToggleLevel}
      methods={METHOD_CONFIG}
      isMethodSelected={(k) => props.selectedMethods.has(k)}
      onToggleMethod={props.onToggleMethod}
      pathnameFilter={props.pathnameFilter}
      onPathnameFilterChange={props.onPathnameFilterChange}
      quickPaths={isProject ? PROJECT_QUICK_PATHS : ORG_QUICK_PATHS}
      translateFn={(k) => t(k)}
    />
  );
}

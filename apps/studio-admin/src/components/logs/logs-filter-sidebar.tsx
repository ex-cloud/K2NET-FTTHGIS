import * as React from "react";
import { LogsFilterSidebarShell } from "@k2net/ui";
import { useLogsFilter } from "./logs-filter-context";
import { useTranslation } from "@k2net/i18n";
import {
  TenantScopeFilterSection,
  BenchmarkFilterSection,
  LEVEL_OPTIONS,
  SEVERITY_OPTIONS,
} from "./logs-filter-sections";
import { PresetsFilterSection } from "./logs-presets-section";

export interface SubFilterItem {
  key: string;
  label: string;
}

export interface LogTypeItem {
  key: string;
  label: string;
  subItems?: SubFilterItem[];
}

export const LOG_TYPE_DEFINITIONS: LogTypeItem[] = [
  {
    key: "edge",
    label: "API Gateway",
    subItems: [
      { key: "edge_auth", label: "Auth" },
      { key: "edge_storage", label: "Storage" },
      { key: "edge_tasks", label: "Tasks" },
      { key: "edge_network", label: "GIS Network" },
      { key: "edge_payment", label: "Payment" },
      { key: "edge_ai", label: "AI Copilot" },
    ],
  },
  {
    key: "postgres",
    label: "Postgres",
    subItems: [
      { key: "pg_core", label: "ftth_gis (Core)" },
      { key: "pg_keycloak", label: "Keycloak DB" },
      { key: "pg_spatial", label: "PostGIS Spatial" },
    ],
  },
  {
    key: "auth",
    label: "Auth & IAM",
  },
  {
    key: "storage",
    label: "Storage",
  },
  {
    key: "redis",
    label: "Redis Cache & Queue",
  },
  {
    key: "traefik",
    label: "Traefik Edge Proxy",
  },
  {
    key: "ai",
    label: "AI Copilot",
    subItems: [
      { key: "ai_rag", label: "RAG Search" },
      { key: "ai_audit", label: "Audit Analyzer" },
    ],
  },
  {
    key: "olt",
    label: "OLT Gateway",
    subItems: [
      { key: "olt_poller", label: "Poller SNMP" },
      { key: "olt_cli", label: "CLI Engine" },
      { key: "olt_syslog", label: "Syslog Stream" },
    ],
  },
  {
    key: "poller",
    label: "OLT Poller (SNMP)",
  },
  {
    key: "map",
    label: "Map Gateway",
  },
  {
    key: "martin",
    label: "Martin Tile Server",
  },
  {
    key: "task",
    label: "Task & Sync",
  },
  {
    key: "audit",
    label: "Audit Trail",
  },
  {
    key: "notification",
    label: "Notification Gateway",
  },
  {
    key: "payment",
    label: "Payment Gateway",
  },
  {
    key: "scheduler",
    label: "Scheduler & Backup",
  },
  {
    key: "export",
    label: "Export Gateway",
  },
  {
    key: "whatsapp",
    label: "WhatsApp Gateway",
  },
];

const METHOD_OPTIONS = [
  { key: "GET", label: "GET", badge: "text-muted-foreground bg-muted border-border" },
  { key: "POST", label: "POST", badge: "text-sky-400 bg-sky-500/10 border-sky-500/30" },
  { key: "PUT", label: "PUT", badge: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  { key: "DELETE", label: "DELETE", badge: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
  { key: "PATCH", label: "PATCH", badge: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
];

const ADMIN_QUICK_PATHS = [
  "api/v1/projects/*",
  "api/v1/network/*",
  "api/v1/customers/*",
  "api/v1/spatial/*",
  "api/v1/system/*",
];

export interface LogsFilterSidebarProps {
  onCollapse?: () => void;
}

export function LogsFilterSidebar(_props: LogsFilterSidebarProps) {
  const { t } = useTranslation();
  const {
    timeRange, setTimeRange,
    selectedTypes, toggleType,
    selectedLevels, toggleLevel,
    selectedSeverities, toggleSeverity,
    selectedMethods, toggleMethod,
    pathnameFilter, setPathnameFilter,
    scopeFilter, setScopeFilter,
    projectFilter,
    edgeSubFilters, toggleEdgeSubFilter,
    resetAllFilters,
    logTypeCounts,
    severityCounts,
    tenantFilter, setTenantFilter,
    includeBenchmark, setIncludeBenchmark,
    searchQuery,
    advancedFilters,
  } = useLogsFilter();

  const hasActiveFilters =
    timeRange !== "60m" ||
    Object.values(selectedTypes).some(Boolean) ||
    Object.values(selectedLevels).some(Boolean) ||
    Object.values(selectedSeverities).some(Boolean) ||
    Object.values(selectedMethods).some(Boolean) ||
    pathnameFilter.trim().length > 0 ||
    Object.values(edgeSubFilters).some(Boolean) ||
    scopeFilter !== "ALL" ||
    projectFilter.trim().length > 0 ||
    tenantFilter.trim().length > 0 ||
    includeBenchmark ||
    searchQuery.trim().length > 0 ||
    (advancedFilters && advancedFilters.length > 0);

  const facetItems = React.useMemo(() => {
    return LOG_TYPE_DEFINITIONS.map((item) => ({
      key: item.key,
      label: item.label,
      count: logTypeCounts[item.key] ?? 0,
      subItems: item.subItems?.map((s) => ({
        key: s.key,
        label: s.label,
        count: edgeSubFilters[s.key] ? 1 : 0,
      })),
    }));
  }, [logTypeCounts, edgeSubFilters]);

  const severities = React.useMemo(() => {
    return SEVERITY_OPTIONS.map((s) => ({
      ...s,
      count: severityCounts[s.key] ?? 0,
    }));
  }, [severityCounts]);

  const customSections = (
    <>
      <PresetsFilterSection />
      <TenantScopeFilterSection
        scopeFilter={scopeFilter}
        setScopeFilter={setScopeFilter}
        tenantFilter={tenantFilter}
        setTenantFilter={setTenantFilter}
      />
      <BenchmarkFilterSection
        includeBenchmark={includeBenchmark}
        setIncludeBenchmark={setIncludeBenchmark}
      />
    </>
  );

  return (
    <LogsFilterSidebarShell
      title={t("observability.logs_explorer")}
      isCollapsed={false}
      onToggleCollapse={_props.onCollapse || (() => {})}
      hasActiveFilters={hasActiveFilters}
      onResetAll={resetAllFilters}
      resetTooltipLabel={t("observability.reset_filter") || "Reset filter"}
      timeRange={timeRange}
      onTimeRangeChange={setTimeRange}
      timeRangeLabel={t("observability.time_range") || "TIME RANGE"}
      severities={severities}
      isSeveritySelected={(k) => !!selectedSeverities[k]}
      onToggleSeverity={toggleSeverity}
      facetTitle={t("observability.log_type") || "LOG TYPE"}
      facetItems={facetItems}
      isFacetItemSelected={(k) => !!selectedTypes[k]}
      onToggleFacetItem={toggleType}
      isSubFacetItemSelected={(subKey) => !!edgeSubFilters[subKey]}
      onToggleSubFacetItem={toggleEdgeSubFilter}
      levels={LEVEL_OPTIONS}
      isLevelSelected={(k) => !!selectedLevels[k]}
      onToggleLevel={toggleLevel}
      methods={METHOD_OPTIONS}
      isMethodSelected={(k) => !!selectedMethods[k]}
      onToggleMethod={toggleMethod}
      pathnameFilter={pathnameFilter}
      onPathnameFilterChange={setPathnameFilter}
      quickPaths={ADMIN_QUICK_PATHS}
      customSectionsSlot={customSections}
      translateFn={(k) => t(k)}
    />
  );
}

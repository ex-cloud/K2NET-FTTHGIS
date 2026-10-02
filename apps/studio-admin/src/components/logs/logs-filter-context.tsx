

import React, { createContext, useContext, useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "@/lib/navigation-compat";
import { type AuditStreamEntry, LOG_GROUPS, type LogGroupKey } from "@/hooks/use-audit-log-stream";

// Re-export so consumers can import from one place
export { LOG_GROUPS };
export type { LogGroupKey };

// ─── Advanced Filter Types ─────────────────────────────────────────────────────

export type AdvancedFilterField =
  | "status"
  | "method"
  | "pathname"
  | "actor"
  | "message"
  | "tenantSlug"
  | "serviceSource"
  | "logType"
  | "level"
  | "severity"
  | "scope"
  | "projectId";

export type AdvancedFilterOperator =
  | "eq"
  | "neq"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with";

export type AdvancedFilter = {
  id: string;
  field: AdvancedFilterField;
  operator: AdvancedFilterOperator;
  value: string;
};

export const FILTER_FIELD_LABELS: Record<AdvancedFilterField, string> = {
  status:        "Status",
  method:        "Method",
  pathname:      "Pathname",
  actor:         "Actor",
  message:       "Event message",
  tenantSlug:    "Tenant",
  serviceSource: "Source",
  logType:       "Log Type",
  level:         "Level",
  severity:      "Severity",
  scope:         "Scope",
  projectId:     "Project ID",
};


export const FILTER_OPERATOR_LABELS: Record<AdvancedFilterOperator, string> = {
  eq:           "Equals",
  neq:          "Not equal",
  contains:     "Contains",
  not_contains: "Not contains",
  starts_with:  "Starts with",
  ends_with:    "Ends with",
};

// ─── Log Type Definitions ─────────────────────────────────────────────────────

// K2NET Architecture — Real log source labels (aligned with running containers)
export const LOG_TYPES_LABELS: Record<string, string> = {
  // CORE GROUP
  edge:         "API Gateway (Kong)",
  auth:         "Auth & IAM (Keycloak)",
  postgres:     "Postgres & PostGIS",
  redis:        "Redis Queue & Cache",
  traefik:      "Traefik Edge Proxy",
  // OPERATIONS GROUP
  ai:           "AI Copilot (RAG)",
  task:         "Task & Project Sync",
  audit:        "Audit Trail",
  notification: "Notification Gateway",
  scheduler:    "Scheduler & Backup",
  storage:      "Storage Gateway (S3)",
  export:       "Export Gateway",
  payment:      "Payment Gateway",
  // NETWORK GROUP
  olt:          "OLT Gateway",
  poller:       "OLT Poller (SNMP)",
  map:          "Map Gateway",
  martin:       "Martin Tile Server",
  // MESSAGING GROUP
  whatsapp:     "WhatsApp Gateway",
};

export const DEFAULT_SELECTED_TYPES: Record<string, boolean> = {};

export const DEFAULT_SELECTED_GROUPS: Record<LogGroupKey, boolean> = {} as Record<LogGroupKey, boolean>;

export const DEFAULT_SELECTED_SEVERITIES: Record<string, boolean> = {};

// Kong API Gateway sub-filters
export const DEFAULT_EDGE_SUB_FILTERS: Record<string, boolean> = {};

// ─── Context Type ─────────────────────────────────────────────────────────────

export type LogFilterState = {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  timeRange: string;
  setTimeRange: (val: string) => void;
  isLivePaused: boolean;
  setIsLivePaused: React.Dispatch<React.SetStateAction<boolean>>;
  showHistogram: boolean;
  setShowHistogram: React.Dispatch<React.SetStateAction<boolean>>;
  selectedTypes: Record<string, boolean>;
  toggleType: (key: string) => void;
  setLogType: (key: string, enabled: boolean) => void;
  /** Group-level toggle — enables/disables all types within a group */
  selectedGroups: Record<LogGroupKey, boolean>;
  toggleGroup: (key: LogGroupKey) => void;
  selectedLevels: Record<string, boolean>;
  toggleLevel: (key: string) => void;
  /** Severity filter map (CRITICAL, ERROR, WARN, INFO) */
  selectedSeverities: Record<string, boolean>;
  toggleSeverity: (key: string) => void;
  /** Only show impersonated sessions (Step-up MFA / Super Admin impersonation) */
  impersonationOnly: boolean;
  setImpersonationOnly: React.Dispatch<React.SetStateAction<boolean>>;
  /** Scope filter: ALL, SYSTEM, ORGANIZATION, PROJECT */
  scopeFilter: string;
  setScopeFilter: (val: string) => void;
  /** Project ID / cluster filter */
  projectFilter: string;
  setProjectFilter: (val: string) => void;
  /** Nested sub-filter for edge (API Gateway) */
  edgeSubFilters: Record<string, boolean>;
  toggleEdgeSubFilter: (key: string) => void;
  selectedLog: AuditStreamEntry | null;
  setSelectedLog: (log: AuditStreamEntry | null) => void;
  resetAllFilters: () => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  logTypeCounts: Record<string, number>;
  setLogTypeCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  levelCounts: Record<string, number>;
  setLevelCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  severityCounts: Record<string, number>;
  setSeverityCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  /** Advanced filter rules (field + operator + value) */
  advancedFilters: AdvancedFilter[];
  addAdvancedFilter: (f: AdvancedFilter) => void;
  removeAdvancedFilter: (id: string) => void;
  clearAdvancedFilters: () => void;
  /** tenantSlug filter — empty string = all tenants */
  tenantFilter: string;
  setTenantFilter: (slug: string) => void;
};

const LogsFilterContext = createContext<LogFilterState | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

function LogsFilterProviderContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [timeRange, setTimeRange] = useState(searchParams.get("date") || "60m");
  const [isLivePaused, setIsLivePaused] = useState(
    searchParams.get("live") === "true" ? false : true
  );
  const [showHistogram, setShowHistogram] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditStreamEntry | null>(null);
  const [tenantFilter, setTenantFilter] = useState(searchParams.get("tenant") || "");
  const [impersonationOnly, setImpersonationOnly] = useState(searchParams.get("impersonated") === "true");
  const [scopeFilter, setScopeFilter] = useState(searchParams.get("scope") || "ALL");
  const [projectFilter, setProjectFilter] = useState(searchParams.get("project") || "");

  const isInternalUpdateRef = useRef(false);

  // Parse filters from URL on mount / external change
  const parseFiltersFromUrl = () => {
    const filterParams = searchParams.getAll("filter");
    const types: Record<string, boolean> = {};
    const levels: Record<string, boolean> = {};
    const groups: Record<LogGroupKey, boolean> = {} as Record<LogGroupKey, boolean>;
    const severities: Record<string, boolean> = {};

    filterParams.forEach((f) => {
      if (f.startsWith("log_type:eq:")) {
        const key = f.replace("log_type:eq:", "");
        if (key && key !== "none") types[key] = true;
      }
      if (f.startsWith("level:eq:")) {
        const key = f.replace("level:eq:", "");
        if (key && key !== "none") (levels as Record<string, boolean>)[key] = true;
      }
      if (f.startsWith("group:eq:")) {
        const key = f.replace("group:eq:", "") as LogGroupKey;
        if (key) (groups as Record<string, boolean>)[key] = true;
      }
      if (f.startsWith("severity:eq:")) {
        const key = f.replace("severity:eq:", "").toUpperCase();
        if (key && key !== "NONE") severities[key] = true;
      }
    });

    return { types, levels, groups, severities };
  };

  const { types: initialTypes, levels: initialLevels, groups: initialGroups, severities: initialSeverities } = parseFiltersFromUrl();
  const [selectedTypes, setSelectedTypes] = useState<Record<string, boolean>>(initialTypes);
  const [selectedLevels, setSelectedLevels] = useState<Record<string, boolean>>(initialLevels);
  const [selectedGroups, setSelectedGroups] = useState<Record<LogGroupKey, boolean>>(initialGroups as Record<LogGroupKey, boolean>);
  const [selectedSeverities, setSelectedSeverities] = useState<Record<string, boolean>>(initialSeverities);
  const [edgeSubFilters, setEdgeSubFilters] = useState<Record<string, boolean>>({});
  const [logTypeCounts, setLogTypeCounts] = useState<Record<string, number>>({});
  const [levelCounts, setLevelCounts] = useState<Record<string, number>>({});
  const [severityCounts, setSeverityCounts] = useState<Record<string, number>>({});
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilter[]>([]);

  const addAdvancedFilter = (f: AdvancedFilter) => {
    setAdvancedFilters((prev) => [...prev, f]);
  };

  const removeAdvancedFilter = (id: string) => {
    setAdvancedFilters((prev) => prev.filter((f) => f.id !== id));
  };

  const clearAdvancedFilters = () => {
    setAdvancedFilters([]);
  };

  // Sync URL → state (only when URL changed externally, not from internal state update)
  useEffect(() => {
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }

    const { types, levels, groups, severities } = parseFiltersFromUrl();

    setSelectedTypes(types);
    setSelectedLevels(levels);
    setSelectedGroups(groups as Record<LogGroupKey, boolean>);
    setSelectedSeverities(severities);

    const search = searchParams.get("search") || "";
    if (search !== searchQuery) setSearchQuery(search);

    const date = searchParams.get("date") || "60m";
    if (date !== timeRange) setTimeRange(date);

    const isLive = searchParams.get("live") === "true";
    if (!isLive !== isLivePaused) setIsLivePaused(!isLive);

    const tenant = searchParams.get("tenant") || "";
    if (tenant !== tenantFilter) setTenantFilter(tenant);

    const isImp = searchParams.get("impersonated") === "true";
    if (isImp !== impersonationOnly) setImpersonationOnly(isImp);

    const scope = searchParams.get("scope") || "ALL";
    if (scope !== scopeFilter) setScopeFilter(scope);

    const project = searchParams.get("project") || "";
    if (project !== projectFilter) setProjectFilter(project);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Sync state → URL
  const prevUrlRef = useRef<string | null>(null);
  useEffect(() => {
    if (pathname !== "/logs") return;
    const params = new URLSearchParams();

    // Log type filters
    Object.entries(selectedTypes)
      .filter(([, active]) => active)
      .forEach(([key]) => params.append("filter", `log_type:eq:${key}`));

    // Level filters
    Object.entries(selectedLevels)
      .filter(([, active]) => active)
      .forEach(([key]) => params.append("filter", `level:eq:${key}`));

    // Severity filters
    Object.entries(selectedSeverities)
      .filter(([, active]) => active)
      .forEach(([key]) => params.append("filter", `severity:eq:${key}`));

    // Impersonation filter
    if (impersonationOnly) params.set("impersonated", "true");

    // Scope & Project filter
    if (scopeFilter && scopeFilter !== "ALL") params.set("scope", scopeFilter);
    if (projectFilter.trim()) params.set("project", projectFilter);

    // Tenant & Search filter
    if (tenantFilter.trim()) params.set("tenant", tenantFilter);
    if (searchQuery.trim()) params.set("search", searchQuery);
    if (timeRange) params.set("date", timeRange);
    if (!isLivePaused) params.set("live", "true");

    const newUrl = params.size > 0 ? `/logs?${params.toString()}` : "/logs";

    if (newUrl === prevUrlRef.current) return;
    prevUrlRef.current = newUrl;
    isInternalUpdateRef.current = true;
    router.replace(newUrl, { scroll: false });
  }, [
    searchQuery,
    timeRange,
    selectedTypes,
    selectedLevels,
    selectedGroups,
    selectedSeverities,
    impersonationOnly,
    scopeFilter,
    projectFilter,
    tenantFilter,
    isLivePaused,
    router,
    pathname,
  ]);

  const toggleType = (key: string) => {
    isInternalUpdateRef.current = true;
    setSelectedTypes((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      return next;
    });
  };

  const setLogType = (key: string, enabled: boolean) => {
    isInternalUpdateRef.current = true;
    setSelectedTypes((prev) => {
      const next = { ...prev };
      if (enabled) {
        next[key] = true;
      } else {
        delete next[key];
      }
      return next;
    });
  };

  const toggleGroup = (key: LogGroupKey) => {
    isInternalUpdateRef.current = true;
    const group = LOG_GROUPS[key];
    const allCurrentlyChecked = group.types.length > 0 && group.types.every((t) => !!selectedTypes[t]);
    const shouldCheckAll = !allCurrentlyChecked;

    setSelectedGroups((prev) => ({ ...prev, [key]: shouldCheckAll }));
    setSelectedTypes((prev) => {
      const next = { ...prev };
      group.types.forEach((t) => {
        if (shouldCheckAll) {
          next[t] = true;
        } else {
          delete next[t];
        }
      });
      return next;
    });
  };

  const toggleLevel = (key: string) => {
    isInternalUpdateRef.current = true;
    setSelectedLevels((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      return next;
    });
  };

  const toggleSeverity = (key: string) => {
    isInternalUpdateRef.current = true;
    setSelectedSeverities((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      return next;
    });
  };

  const toggleEdgeSubFilter = (key: string) => {
    isInternalUpdateRef.current = true;
    setEdgeSubFilters((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      return next;
    });
  };

  const resetAllFilters = () => {
    isInternalUpdateRef.current = true;
    prevUrlRef.current = "/logs?date=60m";
    setSearchQuery("");
    setTimeRange("60m");
    setSelectedTypes({});
    setSelectedGroups({} as Record<LogGroupKey, boolean>);
    setSelectedLevels({});
    setSelectedSeverities({});
    setImpersonationOnly(false);
    setScopeFilter("ALL");
    setProjectFilter("");
    setEdgeSubFilters({});
    setSelectedLog(null);
    setTenantFilter("");
    setAdvancedFilters([]);
    router.replace("/logs?date=60m", { scroll: false });
  };

  return (
    <LogsFilterContext.Provider
      value={{
        searchQuery, setSearchQuery,
        timeRange, setTimeRange,
        isLivePaused, setIsLivePaused,
        showHistogram, setShowHistogram,
        selectedTypes, toggleType, setLogType,
        selectedGroups, toggleGroup,
        selectedLevels, toggleLevel,
        selectedSeverities, toggleSeverity,
        impersonationOnly, setImpersonationOnly,
        scopeFilter, setScopeFilter,
        projectFilter, setProjectFilter,
        edgeSubFilters, toggleEdgeSubFilter,
        selectedLog, setSelectedLog,
        resetAllFilters,
        isSidebarCollapsed, setIsSidebarCollapsed,
        logTypeCounts, setLogTypeCounts,
        levelCounts, setLevelCounts,
        severityCounts, setSeverityCounts,
        tenantFilter, setTenantFilter,
        advancedFilters, addAdvancedFilter, removeAdvancedFilter, clearAdvancedFilters,
      }}
    >
      {children}
    </LogsFilterContext.Provider>
  );
}

export function LogsFilterProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <LogsFilterProviderContent>{children}</LogsFilterProviderContent>
    </Suspense>
  );
}

const DEFAULT_CONTEXT: LogFilterState = {
  searchQuery: "", setSearchQuery: () => {},
  timeRange: "60m", setTimeRange: () => {},
  isLivePaused: true, setIsLivePaused: () => {},
  showHistogram: true, setShowHistogram: () => {},
  selectedTypes: { ...DEFAULT_SELECTED_TYPES }, toggleType: () => {}, setLogType: () => {},
  selectedGroups: { ...DEFAULT_SELECTED_GROUPS }, toggleGroup: () => {},
  selectedLevels: { success: true, warning: true, error: true }, toggleLevel: () => {},
  selectedSeverities: { ...DEFAULT_SELECTED_SEVERITIES }, toggleSeverity: () => {},
  impersonationOnly: false, setImpersonationOnly: () => {},
  scopeFilter: "ALL", setScopeFilter: () => {},
  projectFilter: "", setProjectFilter: () => {},
  edgeSubFilters: { ...DEFAULT_EDGE_SUB_FILTERS }, toggleEdgeSubFilter: () => {},
  selectedLog: null, setSelectedLog: () => {},
  resetAllFilters: () => {},
  isSidebarCollapsed: false, setIsSidebarCollapsed: () => {},
  logTypeCounts: {}, setLogTypeCounts: () => {},
  levelCounts: {}, setLevelCounts: () => {},
  severityCounts: {}, setSeverityCounts: () => {},
  tenantFilter: "", setTenantFilter: () => {},
  advancedFilters: [], addAdvancedFilter: () => {}, removeAdvancedFilter: () => {}, clearAdvancedFilters: () => {},
};

export function useLogsFilter() {
  const context = useContext(LogsFilterContext);
  return context ?? DEFAULT_CONTEXT;
}


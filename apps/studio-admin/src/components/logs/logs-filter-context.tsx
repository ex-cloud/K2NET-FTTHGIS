import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback, Suspense } from "react";
import { usePathname } from "@/lib/navigation-compat";
import {
  useAuditLogStream,
  type AuditStreamEntry,
  LOG_GROUPS,
  type LogGroupKey,
} from "@/hooks/use-audit-log-stream";
import { filterAuditLogs } from "./logs-utils";
import type { InvestigationPreset } from "./logs-presets-types";

// Re-export so consumers can import from one place
export { LOG_GROUPS };
export type { LogGroupKey, InvestigationPreset };

// ─── Advanced Filter Types ─────────────────────────────────────────────────────

export type AdvancedFilterField =
  | "timeRange"
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
  | "ilike"
  | "not_ilike"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "regex"
  | "gte"
  | "lte"
  | "gt"
  | "lt"
  | "in"
  | "not_in";

export type AdvancedFilter = {
  id: string;
  field: AdvancedFilterField;
  operator: AdvancedFilterOperator;
  value: string;
};

export const FILTER_FIELD_LABELS: Record<AdvancedFilterField, string> = {
  timeRange:     "Time Range",
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
  ilike:        "ILike",
  not_ilike:    "Not ILike",
  contains:     "Contains",
  not_contains: "Not contains",
  starts_with:  "Starts with",
  ends_with:    "Ends with",
  regex:        "Matches Regex",
  gte:          "Greater than or equal",
  lte:          "Less than or equal",
  gt:           "Greater than",
  lt:           "Less than",
  in:           "In list",
  not_in:       "Not in list",
};

export const OPERATOR_SYMBOLS: Record<AdvancedFilterOperator, string> = {
  eq:           "=",
  neq:          "<>",
  ilike:        "~*",
  not_ilike:    "!~*",
  contains:     "~",
  not_contains: "!~",
  starts_with:  "^=",
  ends_with:    "$=",
  regex:        "~",
  gte:          ">=",
  lte:          "<=",
  gt:           ">",
  lt:           "<",
  in:           "IN",
  not_in:       "NOT IN",
};

// ─── Log Type Definitions ─────────────────────────────────────────────────────

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
  /** includeBenchmark filter — false = filter out synthetic load-test data */
  includeBenchmark: boolean;
  setIncludeBenchmark: React.Dispatch<React.SetStateAction<boolean>>;

  /** Apply saved investigation preset */
  applyPreset: (preset: InvestigationPreset) => void;

  // Real-Time Log Stream Access & Keyset Cursor Pagination
  logs: AuditStreamEntry[];
  filteredLogs: AuditStreamEntry[];
  rawLogs: AuditStreamEntry[];
  timeFilteredLogs: AuditStreamEntry[];
  totalCount: number;
  clearLogs: () => void;
  streamStatus: "connecting" | "live" | "paused";
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
};

const LogsFilterContext = createContext<LogFilterState | undefined>(undefined);

// Helper to parse query parameters from window.location.search
function parseInitialFiltersFromLocation() {
  if (typeof window === "undefined") {
    return {
      types: {},
      levels: {},
      groups: {} as Record<LogGroupKey, boolean>,
      severities: {},
      search: "",
      date: "60m",
      live: false,
      tenant: "",
      scope: "ALL",
      project: "",
      benchmark: false,
    };
  }

  const sp = new URLSearchParams(window.location.search);
  const filterParams = sp.getAll("filter");
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
      if (key && key !== "none") levels[key] = true;
    }
    if (f.startsWith("group:eq:")) {
      const key = f.replace("group:eq:", "") as LogGroupKey;
      if (key) groups[key] = true;
    }
    if (f.startsWith("severity:eq:")) {
      const key = f.replace("severity:eq:", "").toUpperCase();
      if (key && key !== "NONE") severities[key] = true;
    }
  });

  return {
    types,
    levels,
    groups,
    severities,
    search: sp.get("search") || "",
    date: sp.get("date") || "60m",
    live: sp.get("live") === "true",
    tenant: sp.get("tenant") || "",
    scope: sp.get("scope") || "ALL",
    project: sp.get("project") || "",
    benchmark: sp.get("benchmark") === "true",
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

function LogsFilterProviderContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const initial = useMemo(() => parseInitialFiltersFromLocation(), []);

  const [searchQuery, setSearchQuery] = useState(initial.search);
  const [timeRange, setTimeRange] = useState(initial.date);
  const [isLivePaused, setIsLivePaused] = useState(!initial.live);
  const [showHistogram, setShowHistogram] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditStreamEntry | null>(null);
  const [tenantFilter, setTenantFilter] = useState(initial.tenant);
  const [scopeFilter, setScopeFilter] = useState(initial.scope);
  const [projectFilter, setProjectFilter] = useState(initial.project);
  const [includeBenchmark, setIncludeBenchmark] = useState<boolean>(Boolean(initial.benchmark));

  const [selectedTypes, setSelectedTypes] = useState<Record<string, boolean>>(initial.types);
  const [selectedLevels, setSelectedLevels] = useState<Record<string, boolean>>(initial.levels);
  const [selectedGroups, setSelectedGroups] = useState<Record<LogGroupKey, boolean>>(initial.groups);
  const [selectedSeverities, setSelectedSeverities] = useState<Record<string, boolean>>(initial.severities);
  const [edgeSubFilters, setEdgeSubFilters] = useState<Record<string, boolean>>({});
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilter[]>([]);

  // Stream audit logs directly in context provider
  const isLogsRoute = pathname === "/logs" || pathname.startsWith("/logs");
  const {
    logs = [],
    rawLogs = [],
    timeFilteredLogs = [],
    totalCount = 0,
    clearLogs,
    status: streamStatus,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh,
  } = useAuditLogStream("all", {
    isPaused: isLivePaused || !isLogsRoute,
    selectedTypes,
    timeRange,
    tenantSlug: tenantFilter,
    projectId: projectFilter,
    scope: scopeFilter,
    search: searchQuery,
    includeBenchmark,
  });

  // Calculate live counts safely via pure useMemo
  const scopedSourceLogs = useMemo(() => {
    return (timeFilteredLogs && timeFilteredLogs.length > 0 ? timeFilteredLogs : rawLogs) || [];
  }, [timeFilteredLogs, rawLogs]);

  const { logTypeCounts, levelCounts, severityCounts } = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    const lvlCounts: Record<string, number> = { success: 0, warning: 0, error: 0 };
    const sevCounts: Record<string, number> = { CRITICAL: 0, ERROR: 0, WARN: 0, INFO: 0 };

    for (const log of scopedSourceLogs) {
      if (!log) continue;
      const lt = log.logType || "backend";
      typeCounts[lt] = (typeCounts[lt] ?? 0) + 1;
      const lvl = (log.severity === "ERROR" || log.severity === "CRITICAL" || log.status === 500)
        ? "error"
        : (log.severity === "WARN" || (typeof log.status === "number" && log.status >= 400 && log.status < 500))
        ? "warning"
        : "success";
      lvlCounts[lvl] = (lvlCounts[lvl] ?? 0) + 1;
      const sev = (log.severity || "INFO").toUpperCase();
      sevCounts[sev] = (sevCounts[sev] ?? 0) + 1;
    }
    return { logTypeCounts: typeCounts, levelCounts: lvlCounts, severityCounts: sevCounts };
  }, [scopedSourceLogs]);

  // Compute filtered logs for table rendering
  const filteredLogs = useMemo(
    () =>
      filterAuditLogs(logs, searchQuery, tenantFilter, selectedLevels, advancedFilters, {
        selectedSeverities,
        scopeFilter,
        projectFilter,
      }),
    [logs, searchQuery, tenantFilter, selectedLevels, advancedFilters, selectedSeverities, scopeFilter, projectFilter]
  );

  const addAdvancedFilter = (f: AdvancedFilter) => {
    setAdvancedFilters((prev) => [...prev, f]);
  };

  const removeAdvancedFilter = (id: string) => {
    setAdvancedFilters((prev) => prev.filter((f) => f.id !== id));
  };

  const clearAdvancedFilters = () => {
    setAdvancedFilters([]);
  };

  // Sync state → Browser URL bar cleanly with history.replaceState (avoids router loop)
  const prevUrlRef = useRef<string | null>(null);
  useEffect(() => {
    if (pathname !== "/logs" || typeof window === "undefined") return;
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

    // Scope & Project filter
    if (scopeFilter && scopeFilter !== "ALL") params.set("scope", scopeFilter);
    if (projectFilter.trim()) params.set("project", projectFilter);

    // Tenant & Search filter
    if (tenantFilter.trim()) params.set("tenant", tenantFilter);
    if (searchQuery.trim()) params.set("search", searchQuery);
    if (timeRange) params.set("date", timeRange);
    if (!isLivePaused) params.set("live", "true");
    if (includeBenchmark) params.set("benchmark", "true");

    const newSearch = params.size > 0 ? `?${params.toString()}` : "";
    const newUrl = `/logs${newSearch}`;

    if (newUrl === prevUrlRef.current || newSearch === window.location.search) return;
    prevUrlRef.current = newUrl;
    window.history.replaceState(null, "", newUrl);
  }, [
    searchQuery,
    timeRange,
    selectedTypes,
    selectedLevels,
    selectedGroups,
    selectedSeverities,
    scopeFilter,
    projectFilter,
    tenantFilter,
    includeBenchmark,
    isLivePaused,
    pathname,
  ]);

  // Handle browser back/forward history traversal
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handlePopState = () => {
      const parsed = parseInitialFiltersFromLocation();
      setSelectedTypes(parsed.types);
      setSelectedLevels(parsed.levels);
      setSelectedGroups(parsed.groups);
      setSelectedSeverities(parsed.severities);
      setSearchQuery(parsed.search);
      setTimeRange(parsed.date);
      setIsLivePaused(!parsed.live);
      setTenantFilter(parsed.tenant);
      setScopeFilter(parsed.scope);
      setProjectFilter(parsed.project);
      setIncludeBenchmark(Boolean(parsed.benchmark));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const toggleType = (key: string) => {
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
    prevUrlRef.current = "/logs?date=60m";
    setSearchQuery("");
    setTimeRange("60m");
    setSelectedTypes({});
    setSelectedGroups({} as Record<LogGroupKey, boolean>);
    setSelectedLevels({});
    setSelectedSeverities({});
    setScopeFilter("ALL");
    setProjectFilter("");
    setEdgeSubFilters({});
    setSelectedLog(null);
    setTenantFilter("");
    setIncludeBenchmark(false);
    setAdvancedFilters([]);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/logs?date=60m");
    }
  };

  const applyPreset = useCallback((preset: InvestigationPreset) => {
    setTimeRange(preset.filters.timeRange || "60m");
    setSelectedTypes(preset.filters.selectedTypes ? { ...preset.filters.selectedTypes } : {});
    setSelectedLevels(preset.filters.selectedLevels ? { ...preset.filters.selectedLevels } : {});
    setSelectedSeverities(preset.filters.selectedSeverities ? { ...preset.filters.selectedSeverities } : {});
    setScopeFilter(preset.filters.scopeFilter || "ALL");
    setProjectFilter(preset.filters.projectFilter || "");
    setTenantFilter(preset.filters.tenantFilter || "");
    setSearchQuery(preset.filters.searchQuery || "");
    setIncludeBenchmark(preset.filters.includeBenchmark || false);
    setAdvancedFilters(preset.filters.advancedFilters ? [...preset.filters.advancedFilters] : []);
  }, []);

  // Setter shims for compatibility
  const dummySetCounts = () => {};

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
        scopeFilter, setScopeFilter,
        projectFilter, setProjectFilter,
        edgeSubFilters, toggleEdgeSubFilter,
        selectedLog, setSelectedLog,
        resetAllFilters,
        applyPreset,
        isSidebarCollapsed, setIsSidebarCollapsed,
        logTypeCounts, setLogTypeCounts: dummySetCounts as React.Dispatch<React.SetStateAction<Record<string, number>>>,
        levelCounts, setLevelCounts: dummySetCounts as React.Dispatch<React.SetStateAction<Record<string, number>>>,
        severityCounts, setSeverityCounts: dummySetCounts as React.Dispatch<React.SetStateAction<Record<string, number>>>,
        tenantFilter, setTenantFilter,
        includeBenchmark, setIncludeBenchmark,
        advancedFilters, addAdvancedFilter, removeAdvancedFilter, clearAdvancedFilters,

        // Real-Time Log Stream & Keyset Cursor Pagination
        logs,
        filteredLogs,
        rawLogs,
        timeFilteredLogs,
        totalCount,
        clearLogs,
        streamStatus,
        isLoading,
        isLoadingMore,
        hasMore,
        loadMore,
        refresh,
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
  scopeFilter: "ALL", setScopeFilter: () => {},
  projectFilter: "", setProjectFilter: () => {},
  edgeSubFilters: { ...DEFAULT_EDGE_SUB_FILTERS }, toggleEdgeSubFilter: () => {},
  selectedLog: null, setSelectedLog: () => {},
  resetAllFilters: () => {},
  applyPreset: () => {},
  isSidebarCollapsed: false, setIsSidebarCollapsed: () => {},
  logTypeCounts: {}, setLogTypeCounts: () => {},
  levelCounts: {}, setLevelCounts: () => {},
  severityCounts: {}, setSeverityCounts: () => {},
  tenantFilter: "", setTenantFilter: () => {},
  includeBenchmark: false, setIncludeBenchmark: () => {},
  advancedFilters: [], addAdvancedFilter: () => {}, removeAdvancedFilter: () => {}, clearAdvancedFilters: () => {},

  logs: [],
  filteredLogs: [],
  rawLogs: [],
  timeFilteredLogs: [],
  totalCount: 0,
  clearLogs: () => {},
  streamStatus: "paused",
  isLoading: false,
  isLoadingMore: false,
  hasMore: false,
  loadMore: async () => {},
  refresh: async () => {},
};

export function useLogsFilter() {
  const context = useContext(LogsFilterContext);
  return context ?? DEFAULT_CONTEXT;
}

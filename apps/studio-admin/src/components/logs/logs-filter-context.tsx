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
import {
  type AdvancedFilterField,
  type AdvancedFilterOperator,
  type AdvancedFilter,
  type LogFilterState,
  FILTER_FIELD_LABELS,
  FILTER_OPERATOR_LABELS,
  OPERATOR_SYMBOLS,
  LOG_TYPES_LABELS,
  DEFAULT_SELECTED_TYPES,
  DEFAULT_SELECTED_GROUPS,
  DEFAULT_SELECTED_SEVERITIES,
  DEFAULT_SELECTED_METHODS,
  DEFAULT_EDGE_SUB_FILTERS,
  DEFAULT_CONTEXT,
  parseInitialFiltersFromLocation,
} from "./logs-filter-types";

// Re-export types & constants for single-import convenience
export {
  LOG_GROUPS,
  FILTER_FIELD_LABELS,
  FILTER_OPERATOR_LABELS,
  OPERATOR_SYMBOLS,
  LOG_TYPES_LABELS,
  DEFAULT_SELECTED_TYPES,
  DEFAULT_SELECTED_GROUPS,
  DEFAULT_SELECTED_SEVERITIES,
  DEFAULT_SELECTED_METHODS,
  DEFAULT_EDGE_SUB_FILTERS,
};

export type {
  LogGroupKey,
  InvestigationPreset,
  AdvancedFilterField,
  AdvancedFilterOperator,
  AdvancedFilter,
  LogFilterState,
};

const LogsFilterContext = createContext<LogFilterState | undefined>(undefined);

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
  const [selectedMethods, setSelectedMethods] = useState<Record<string, boolean>>(initial.methods);
  const [pathnameFilter, setPathnameFilter] = useState<string>(initial.pathname);
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

  const { logTypeCounts, levelCounts, severityCounts, methodCounts } = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    const lvlCounts: Record<string, number> = { success: 0, warning: 0, error: 0 };
    const sevCounts: Record<string, number> = { CRITICAL: 0, ERROR: 0, WARN: 0, INFO: 0 };
    const mCounts: Record<string, number> = { GET: 0, POST: 0, PUT: 0, DELETE: 0, PATCH: 0, RPC: 0 };

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
      const m = (log.method || String(log.metadata?.method || "")).toUpperCase();
      if (m) {
        mCounts[m] = (mCounts[m] ?? 0) + 1;
      }
    }
    return { logTypeCounts: typeCounts, levelCounts: lvlCounts, severityCounts: sevCounts, methodCounts: mCounts };
  }, [scopedSourceLogs]);

  // Compute filtered logs for table rendering
  const filteredLogs = useMemo(
    () =>
      filterAuditLogs(logs, searchQuery, tenantFilter, selectedLevels, advancedFilters, {
        selectedSeverities,
        selectedMethods,
        pathnameFilter,
        scopeFilter,
        projectFilter,
      }),
    [logs, searchQuery, tenantFilter, selectedLevels, advancedFilters, selectedSeverities, selectedMethods, pathnameFilter, scopeFilter, projectFilter]
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

    // Method filters
    Object.entries(selectedMethods)
      .filter(([, active]) => active)
      .forEach(([key]) => params.append("filter", `method:eq:${key}`));

    // Scope & Project filter
    if (scopeFilter && scopeFilter !== "ALL") params.set("scope", scopeFilter);
    if (projectFilter.trim()) params.set("project", projectFilter);

    // Pathname filter
    if (pathnameFilter.trim()) params.set("path", pathnameFilter);

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
    selectedMethods,
    pathnameFilter,
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
      setSelectedMethods(parsed.methods);
      setPathnameFilter(parsed.pathname);
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

  const toggleMethod = (key: string) => {
    const normKey = key.toUpperCase();
    setSelectedMethods((prev) => {
      const next = { ...prev };
      if (next[normKey]) {
        delete next[normKey];
      } else {
        next[normKey] = true;
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
    setSelectedMethods({});
    setPathnameFilter("");
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
        selectedMethods, toggleMethod,
        pathnameFilter, setPathnameFilter,
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
        methodCounts, setMethodCounts: dummySetCounts as React.Dispatch<React.SetStateAction<Record<string, number>>>,
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

export function useLogsFilter() {
  const context = useContext(LogsFilterContext);
  return context ?? DEFAULT_CONTEXT;
}

"use client";

import React, { createContext, useContext, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { AuditStreamEntry, LOG_GROUPS, LogGroupKey } from "@/hooks/use-audit-log-stream";

// Re-export so consumers can import from one place
export { LOG_GROUPS };
export type { LogGroupKey };

// ─── Log Type Definitions ─────────────────────────────────────────────────────

// K2NET Architecture — Real log source labels (aligned with running containers)
export const LOG_TYPES_LABELS: Record<string, string> = {
  // CORE GROUP
  edge:         "API Gateway (Kong)",
  auth:         "Auth & Security",
  postgres:     "Postgres (Envers)",
  // OPERATIONS GROUP
  audit:        "Audit Trail",
  notification: "Notification",
  scheduler:    "Scheduler",
  storage:      "Storage Gateway",
  export:       "Export Gateway",
  payment:      "Payment Gateway",
  // NETWORK GROUP
  olt:          "OLT Gateway",
  poller:       "OLT Poller",
  map:          "Map Gateway",
  // MESSAGING GROUP
  whatsapp:     "WhatsApp Gateway",
};

export const DEFAULT_SELECTED_TYPES: Record<string, boolean> = {
  // CORE — on by default
  edge:         true,
  auth:         true,
  postgres:     false,
  // OPERATIONS — audit on by default
  audit:        true,
  notification: false,
  scheduler:    false,
  storage:      false,
  export:       false,
  payment:      false,
  // NETWORK — off by default
  olt:          false,
  poller:       false,
  map:          false,
  // MESSAGING — off by default
  whatsapp:     false,
};

export const DEFAULT_SELECTED_GROUPS: Record<LogGroupKey, boolean> = {
  CORE:       true,
  OPERATIONS: true,
  NETWORK:    false,
  MESSAGING:  false,
};

// Kong API Gateway sub-filters
export const DEFAULT_EDGE_SUB_FILTERS: Record<string, boolean> = {
  edge_api:     true,
  edge_webhook: true,
  edge_proxy:   true,
};

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
  /** Group-level toggle — enables/disables all types within a group */
  selectedGroups: Record<LogGroupKey, boolean>;
  toggleGroup: (key: LogGroupKey) => void;
  selectedLevels: Record<string, boolean>;
  toggleLevel: (key: string) => void;
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
  const [timeRange, setTimeRange] = useState(searchParams.get("date") || "1h");
  const [isLivePaused, setIsLivePaused] = useState(
    searchParams.get("live") === "true" ? false : true
  );
  const [showHistogram, setShowHistogram] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditStreamEntry | null>(null);
  const [tenantFilter, setTenantFilter] = useState(searchParams.get("tenant") || "");

  // Parse ?filter=log_type:eq:edge&filter=level:eq:success from URL on mount
  const parseFiltersFromUrl = () => {
    const filterParams = searchParams.getAll("filter");
    const types = { ...DEFAULT_SELECTED_TYPES };
    const levels = { success: true, warning: true, error: true };
    const groups = { ...DEFAULT_SELECTED_GROUPS };

    const hasTypeFilters = filterParams.some((f) => f.startsWith("log_type:eq:"));
    const hasLevelFilters = filterParams.some((f) => f.startsWith("level:eq:"));
    const hasGroupFilters = filterParams.some((f) => f.startsWith("group:eq:"));

    if (hasTypeFilters) Object.keys(types).forEach((k) => (types[k] = false));
    if (hasLevelFilters) Object.keys(levels).forEach((k) => ((levels as Record<string, boolean>)[k] = false));
    if (hasGroupFilters) Object.keys(groups).forEach((k) => ((groups as Record<string, boolean>)[k] = false));

    filterParams.forEach((f) => {
      if (f.startsWith("log_type:eq:")) {
        const key = f.replace("log_type:eq:", "");
        if (key in types) types[key] = true;
      }
      if (f.startsWith("level:eq:")) {
        const key = f.replace("level:eq:", "");
        if (key in levels) (levels as Record<string, boolean>)[key] = true;
      }
      if (f.startsWith("group:eq:")) {
        const key = f.replace("group:eq:", "");
        if (key in groups) (groups as Record<string, boolean>)[key] = true;
      }
    });

    return { types, levels, groups };
  };

  const { types: initialTypes, levels: initialLevels, groups: initialGroups } = parseFiltersFromUrl();
  const [selectedTypes, setSelectedTypes] = useState<Record<string, boolean>>(initialTypes);
  const [selectedLevels, setSelectedLevels] = useState<Record<string, boolean>>(initialLevels);
  const [selectedGroups, setSelectedGroups] = useState<Record<LogGroupKey, boolean>>(initialGroups as Record<LogGroupKey, boolean>);
  const [edgeSubFilters, setEdgeSubFilters] = useState<Record<string, boolean>>(DEFAULT_EDGE_SUB_FILTERS);
  const [logTypeCounts, setLogTypeCounts] = useState<Record<string, number>>({});

  // Sync URL → state
  useEffect(() => {
    const { types, levels, groups } = parseFiltersFromUrl();

    const typesChanged = Object.keys(types).some((k) => types[k] !== selectedTypes[k]);
    if (typesChanged) setSelectedTypes(types);

    const levelsChanged = Object.keys(levels).some((k) => (levels as Record<string, boolean>)[k] !== (selectedLevels as Record<string, boolean>)[k]);
    if (levelsChanged) setSelectedLevels(levels);

    const groupsChanged = Object.keys(groups).some((k) => (groups as Record<string, boolean>)[k] !== (selectedGroups as Record<string, boolean>)[k]);
    if (groupsChanged) setSelectedGroups(groups as Record<LogGroupKey, boolean>);

    const search = searchParams.get("search") || "";
    if (search !== searchQuery) setSearchQuery(search);

    const date = searchParams.get("date") || "1h";
    if (date !== timeRange) setTimeRange(date);

    const isLive = searchParams.get("live") === "true";
    if (!isLive !== isLivePaused) setIsLivePaused(!isLive);

    const tenant = searchParams.get("tenant") || "";
    if (tenant !== tenantFilter) setTenantFilter(tenant);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Sync state → URL
  useEffect(() => {
    if (pathname !== "/logs") return;
    const params = new URLSearchParams();

    // Log type filters
    const isTypesDefault = Object.keys(DEFAULT_SELECTED_TYPES).every(
      (k) => selectedTypes[k] === DEFAULT_SELECTED_TYPES[k]
    );
    if (!isTypesDefault) {
      const hasAnyTypeActive = Object.values(selectedTypes).some(Boolean);
      if (!hasAnyTypeActive) {
        params.append("filter", "log_type:eq:none");
      } else {
        Object.entries(selectedTypes)
          .filter(([, active]) => active)
          .forEach(([key]) => params.append("filter", `log_type:eq:${key}`));
      }
    }

    // Level filters
    const allLevelsActive = Object.values(selectedLevels).every(Boolean);
    if (!allLevelsActive) {
      const hasAnyLevelActive = Object.values(selectedLevels).some(Boolean);
      if (!hasAnyLevelActive) {
        params.append("filter", "level:eq:none");
      } else {
        Object.entries(selectedLevels)
          .filter(([, active]) => active)
          .forEach(([key]) => params.append("filter", `level:eq:${key}`));
      }
    }

    // Tenant filter
    if (tenantFilter.trim()) params.set("tenant", tenantFilter);
    if (searchQuery.trim()) params.set("search", searchQuery);
    if (timeRange && timeRange !== "1h") params.set("date", timeRange);
    if (!isLivePaused) params.set("live", "true");

    const newUrl = params.size > 0 ? `/logs?${params.toString()}` : "/logs";
    router.replace(newUrl, { scroll: false });
  }, [searchQuery, timeRange, selectedTypes, selectedLevels, selectedGroups, tenantFilter, isLivePaused, router, pathname]);

  const toggleType = (key: string) => {
    setSelectedTypes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  /**
   * Toggle a whole group — if currently all-on, turns all off. Otherwise turns all on.
   * Also cascades to selectedTypes so individual type checkboxes stay in sync.
   */
  const toggleGroup = (key: LogGroupKey) => {
    const group = LOG_GROUPS[key];
    const currentlyOn = selectedGroups[key];
    setSelectedGroups((prev) => ({ ...prev, [key]: !currentlyOn }));
    // Cascade: set all logTypes in this group to match the new group state
    setSelectedTypes((prev) => {
      const next = { ...prev };
      group.types.forEach((t) => { next[t] = !currentlyOn; });
      return next;
    });
  };

  const toggleLevel = (key: string) => {
    setSelectedLevels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleEdgeSubFilter = (key: string) => {
    setEdgeSubFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const resetAllFilters = () => {
    setSearchQuery("");
    setTimeRange("1h");
    setSelectedTypes({ ...DEFAULT_SELECTED_TYPES });
    setSelectedGroups({ ...DEFAULT_SELECTED_GROUPS });
    setSelectedLevels({ success: true, warning: true, error: true });
    setEdgeSubFilters({ ...DEFAULT_EDGE_SUB_FILTERS });
    setSelectedLog(null);
    setIsLivePaused(true);
    setTenantFilter("");
    router.replace("/logs", { scroll: false });
  };

  return (
    <LogsFilterContext.Provider
      value={{
        searchQuery, setSearchQuery,
        timeRange, setTimeRange,
        isLivePaused, setIsLivePaused,
        showHistogram, setShowHistogram,
        selectedTypes, toggleType,
        selectedGroups, toggleGroup,
        selectedLevels, toggleLevel,
        edgeSubFilters, toggleEdgeSubFilter,
        selectedLog, setSelectedLog,
        resetAllFilters,
        isSidebarCollapsed, setIsSidebarCollapsed,
        logTypeCounts, setLogTypeCounts,
        tenantFilter, setTenantFilter,
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
  timeRange: "1h", setTimeRange: () => {},
  isLivePaused: true, setIsLivePaused: () => {},
  showHistogram: true, setShowHistogram: () => {},
  selectedTypes: { ...DEFAULT_SELECTED_TYPES }, toggleType: () => {},
  selectedGroups: { ...DEFAULT_SELECTED_GROUPS }, toggleGroup: () => {},
  selectedLevels: { success: true, warning: true, error: true }, toggleLevel: () => {},
  edgeSubFilters: { ...DEFAULT_EDGE_SUB_FILTERS }, toggleEdgeSubFilter: () => {},
  selectedLog: null, setSelectedLog: () => {},
  resetAllFilters: () => {},
  isSidebarCollapsed: false, setIsSidebarCollapsed: () => {},
  logTypeCounts: {}, setLogTypeCounts: () => {},
  tenantFilter: "", setTenantFilter: () => {},
};

export function useLogsFilter() {
  const context = useContext(LogsFilterContext);
  return context ?? DEFAULT_CONTEXT;
}

"use client";

import React, { createContext, useContext, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuditStreamEntry } from "@/hooks/use-audit-log-stream";

// K2NET Architecture — Real log source labels
export const LOG_TYPES_LABELS: Record<string, string> = {
  edge:         "API Gateway (Kong)",
  auth:         "Auth & Security",
  audit:        "Audit Trail",
  notification: "Notification",
  poller:       "OLT Poller",
  scheduler:    "Scheduler",
  olt:          "OLT Gateway",
  postgres:     "Postgres (Envers)",
  storage:      "Storage Gateway",
  map:          "Map Gateway",
};

export const DEFAULT_SELECTED_TYPES: Record<string, boolean> = {
  edge:         true,
  auth:         true,
  audit:        true,
  notification: false,
  poller:       false,
  scheduler:    false,
  olt:          false,
  postgres:     false,
  storage:      false,
  map:          false,
};

// Kong API Gateway sub-filters (replaces Supabase edge sub-filters)
export const DEFAULT_EDGE_SUB_FILTERS: Record<string, boolean> = {
  edge_api:     true,   // REST API requests routed through Kong
  edge_webhook: true,   // Webhook callbacks (payment, etc)
  edge_proxy:   true,   // Proxied Go gateway calls
};

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
  selectedLevels: Record<string, boolean>;
  toggleLevel: (key: string) => void;
  // Nested sub-filter for edge (API Gateway)
  edgeSubFilters: Record<string, boolean>;
  toggleEdgeSubFilter: (key: string) => void;
  selectedLog: AuditStreamEntry | null;
  setSelectedLog: (log: AuditStreamEntry | null) => void;
  resetAllFilters: () => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  logTypeCounts: Record<string, number>;
  setLogTypeCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
};

const LogsFilterContext = createContext<LogFilterState | undefined>(undefined);

function LogsFilterProviderContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [timeRange, setTimeRange] = useState(searchParams.get("date") || "1h");
  const [isLivePaused, setIsLivePaused] = useState(
    searchParams.get("live") === "false" ? true : false
  );
  const [showHistogram, setShowHistogram] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditStreamEntry | null>(null);

  // Parse ?filter=log_type:eq:edge&filter=level:eq:success from URL on mount
  const parseFiltersFromUrl = () => {
    const filterParams = searchParams.getAll("filter");
    const types = { ...DEFAULT_SELECTED_TYPES };
    const levels = { success: true, warning: true, error: true };

    // If there are active filters in the URL, start from all-false then enable matched
    const hasTypeFilters = filterParams.some((f) => f.startsWith("log_type:eq:"));
    const hasLevelFilters = filterParams.some((f) => f.startsWith("level:eq:"));

    if (hasTypeFilters) {
      Object.keys(types).forEach((k) => (types[k] = false));
    }
    if (hasLevelFilters) {
      Object.keys(levels).forEach((k) => ((levels as Record<string, boolean>)[k] = false));
    }

    filterParams.forEach((f) => {
      if (f.startsWith("log_type:eq:")) {
        const key = f.replace("log_type:eq:", "");
        if (key in types) types[key] = true;
      }
      if (f.startsWith("level:eq:")) {
        const key = f.replace("level:eq:", "");
        if (key in levels) (levels as Record<string, boolean>)[key] = true;
      }
    });

    return { types, levels };
  };

  const { types: initialTypes, levels: initialLevels } = parseFiltersFromUrl();
  const [selectedTypes, setSelectedTypes] = useState<Record<string, boolean>>(initialTypes);
  const [selectedLevels, setSelectedLevels] = useState<Record<string, boolean>>(initialLevels);
  const [edgeSubFilters, setEdgeSubFilters] = useState<Record<string, boolean>>(
    DEFAULT_EDGE_SUB_FILTERS
  );
  // Counts per log type — updated reactively by page.tsx from raw log stream
  const [logTypeCounts, setLogTypeCounts] = useState<Record<string, number>>({});

  // Synchronize URL search params to React state dynamically (handles interactive link clicks)
  useEffect(() => {
    const { types, levels } = parseFiltersFromUrl();

    const typesRec = types as Record<string, boolean>;
    const selectedTypesRec = selectedTypes as Record<string, boolean>;
    const typesChanged = Object.keys(typesRec).some(
      (k) => typesRec[k] !== selectedTypesRec[k]
    );
    if (typesChanged) {
      setSelectedTypes(types);
    }

    const levelsRec = levels as Record<string, boolean>;
    const selectedLevelsRec = selectedLevels as Record<string, boolean>;
    const levelsChanged = Object.keys(levelsRec).some(
      (k) => levelsRec[k] !== selectedLevelsRec[k]
    );
    if (levelsChanged) {
      setSelectedLevels(levels);
    }

    const search = searchParams.get("search") || "";
    if (search !== searchQuery) {
      setSearchQuery(search);
    }

    const date = searchParams.get("date") || "1h";
    if (date !== timeRange) {
      setTimeRange(date);
    }

    const isPaused = searchParams.get("live") === "false";
    if (isPaused !== isLivePaused) {
      setIsLivePaused(isPaused);
    }
  }, [searchParams]);

  // Sync state → URL — only write log_type params when user has customised from defaults
  // This keeps the URL clean (/logs) when filter is at default state, so Reset visibly works.
  useEffect(() => {
    const params = new URLSearchParams();

    // Log type filters — skip if identical to DEFAULT to keep URL clean
    const isTypesDefault = Object.keys(DEFAULT_SELECTED_TYPES).every(
      (k) => selectedTypes[k] === DEFAULT_SELECTED_TYPES[k]
    );
    if (!isTypesDefault) {
      Object.entries(selectedTypes)
        .filter(([, active]) => active)
        .forEach(([key]) => params.append("filter", `log_type:eq:${key}`));
    }

    // Level filters (only if not all selected — skip if all true to keep URL clean)
    const allLevelsActive = Object.values(selectedLevels).every(Boolean);
    if (!allLevelsActive) {
      Object.entries(selectedLevels)
        .filter(([, active]) => active)
        .forEach(([key]) => params.append("filter", `level:eq:${key}`));
    }

    // Search query
    if (searchQuery.trim()) params.set("search", searchQuery);

    // Time range
    if (timeRange && timeRange !== "1h") params.set("date", timeRange);

    // Live mode
    if (isLivePaused) params.set("live", "false");

    const newUrl = params.size > 0 ? `/logs?${params.toString()}` : "/logs";
    router.replace(newUrl, { scroll: false });
  }, [searchQuery, timeRange, selectedTypes, selectedLevels, isLivePaused, router]);

  const toggleType = (key: string) => {
    setSelectedTypes((prev) => ({ ...prev, [key]: !prev[key] }));
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
    setSelectedLevels({ success: true, warning: true, error: true });
    setEdgeSubFilters({ ...DEFAULT_EDGE_SUB_FILTERS });
    setSelectedLog(null);
    router.replace("/logs", { scroll: false });
  };

  return (
    <LogsFilterContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        timeRange,
        setTimeRange,
        isLivePaused,
        setIsLivePaused,
        showHistogram,
        setShowHistogram,
        selectedTypes,
        toggleType,
        selectedLevels,
        toggleLevel,
        edgeSubFilters,
        toggleEdgeSubFilter,
        selectedLog,
        setSelectedLog,
        resetAllFilters,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        logTypeCounts,
        setLogTypeCounts,
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
  searchQuery: "",
  setSearchQuery: () => {},
  timeRange: "1h",
  setTimeRange: () => {},
  isLivePaused: false,
  setIsLivePaused: () => {},
  showHistogram: true,
  setShowHistogram: () => {},
  selectedTypes: { ...DEFAULT_SELECTED_TYPES },
  toggleType: () => {},
  selectedLevels: { success: true, warning: true, error: true },
  toggleLevel: () => {},
  edgeSubFilters: { ...DEFAULT_EDGE_SUB_FILTERS },
  toggleEdgeSubFilter: () => {},
  selectedLog: null,
  setSelectedLog: () => {},
  resetAllFilters: () => {},
  isSidebarCollapsed: false,
  setIsSidebarCollapsed: () => {},
  logTypeCounts: {},
  setLogTypeCounts: () => {},
};

export function useLogsFilter() {
  const context = useContext(LogsFilterContext);
  return context ?? DEFAULT_CONTEXT;
}

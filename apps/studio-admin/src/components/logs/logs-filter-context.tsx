"use client";

import React, { createContext, useContext, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuditStreamEntry } from "@/hooks/use-audit-log-stream";

// Supabase-aligned LOG_TYPES_LABELS (from UnifiedLogs.constants.tsx audit)
export const LOG_TYPES_LABELS: Record<string, string> = {
  edge:           "API Gateway",
  postgres:       "Postgres",
  postgrest:      "PostgREST",
  auth:           "Auth",
  storage:        "Storage",
  "edge function": "Edge Function",
  realtime:       "Realtime",
  supavisor:      "Supavisor",
  pgbouncer:      "PgBouncer",
  multigres:      "Multigres",
};

export const DEFAULT_SELECTED_TYPES: Record<string, boolean> = {
  edge:           true,
  postgres:       true,
  postgrest:      true,
  auth:           true,
  storage:        true,
  "edge function": false,
  realtime:       false,
  supavisor:      false,
  pgbouncer:      false,
  multigres:      false,
};

export const DEFAULT_EDGE_SUB_FILTERS: Record<string, boolean> = {
  edge_auth:      true,
  edge_storage:   true,
  edge_postgrest: true,
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

  // Sync state → URL (Supabase-style: ?filter=log_type:eq:edge&filter=level:eq:success)
  useEffect(() => {
    const params = new URLSearchParams();

    // Log type filters
    Object.entries(selectedTypes)
      .filter(([_, active]) => active)
      .forEach(([key]) => params.append("filter", `log_type:eq:${key}`));

    // Level filters (only if not all selected — skip if all true to keep URL clean)
    const allLevelsActive = Object.values(selectedLevels).every(Boolean);
    if (!allLevelsActive) {
      Object.entries(selectedLevels)
        .filter(([_, active]) => active)
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
};

export function useLogsFilter() {
  const context = useContext(LogsFilterContext);
  return context ?? DEFAULT_CONTEXT;
}

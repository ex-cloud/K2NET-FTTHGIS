

import { useSession } from "@/lib/auth-compat";
import { useState, useEffect, useCallback, useRef } from "react";

export interface SlowQuery {
  query: string;
  calls: number;
  totalTimeMs: number;
  meanTimeMs: number;
  minTimeMs: number;
  maxTimeMs: number;
  rows: number;
  role: string;
  cacheHitRate: number;
  totalTimePercent?: number;
}

export interface SpatialIndex {
  tableName: string;
  indexName: string;
  indexDef: string;
  status: string;
  size: string;
}

export interface DbPerfStats {
  slowQueriesCount: number;
  cacheHitRate: number;
  avgRowsPerCall: number;
}

const DEFAULT_STATS: DbPerfStats = {
  slowQueriesCount: 0,
  cacheHitRate: 100.0,
  avgRowsPerCall: 0.0,
};

// Helper to classify dashboard vs non-dashboard queries
const isDashboardQuery = (queryText: string): boolean => {
  const q = queryText.toLowerCase();

  // Non-dashboard patterns first (system/connection utilities)
  if (
    q.includes("pg_stat_statements") ||
    q.includes("pg_timezone_names") ||
    q.includes("pg_is_in_recovery") ||
    q.includes("pg_indexes") ||
    q.includes("pg_roles") ||
    q.includes("pg_catalog") ||
    q.includes("information_schema") ||
    q.includes("show transaction_read_only") ||
    q.includes("alter role") ||
    q.includes("pgbouncer") ||
    q.includes("discard all") ||
    q.includes("deallocate") ||
    q.startsWith("begin") ||
    q.startsWith("commit") ||
    q.startsWith("rollback") ||
    q.startsWith("set ") ||
    q.trim() === "select 1"
  ) {
    return false;
  }

  // Dashboard app tables/functions
  return (
    q.includes("projects") ||
    q.includes("nodes") ||
    q.includes("edges") ||
    q.includes("customers") ||
    q.includes("audit") ||
    q.includes("organization") ||
    q.includes("users") ||
    q.includes("roles") ||
    q.includes("permission") ||
    q.includes("settings") ||
    q.includes("members") ||
    q.includes("olt") ||
    q.includes("splice") ||
    q.includes("payment") ||
    q.includes("notification") ||
    q.includes("get_mvt_data") ||
    q.includes("fn_truncate_cache")
  );
};

export function useDbPerformance() {
  const { data: session } = useSession();
  const [slowQueries, setSlowQueries] = useState<SlowQuery[]>([]);
  const [spatialIndexes, setSpatialIndexes] = useState<SpatialIndex[]>([]);
  const [stats, setStats] = useState<DbPerfStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filters States
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("total_time");
  const [roleFilter, setRoleFilter] = useState("");
  const [minTotalTime, setMinTotalTime] = useState<number | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<"dashboard" | "nondashboard" | "">("");
  const limit = 20;

  const mounted = useRef(true);
  const offsetRef = useRef(0);
  const loadingMoreRef = useRef(false);

  // Skip initial run of the filter-change effect (mount fires initial load separately)
  const isFilterEffectMounted = useRef(false);

  const fetchData = useCallback(
    async (resetList = true) => {
      if (!session?.accessToken) {
        setLoading(false);
        return;
      }

      if (resetList) {
        setLoading(true);
        offsetRef.current = 0;
      } else {
        if (loadingMoreRef.current) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
      }

      try {
        const headers = { Authorization: `Bearer ${session.accessToken}` };
        const currentOffset = offsetRef.current;

        const minTimeParam =
          minTotalTime !== null ? `&minTotalTime=${minTotalTime}` : "";
        const slowQueriesUrl = `/api/v1/system/db-performance/slow-queries?limit=${limit}&offset=${currentOffset}&search=${encodeURIComponent(searchQuery)}&sort=${sortBy}&role=${roleFilter}${minTimeParam}`;

        // Concurrently fetch queries, indexes, and summary stats
        const [queriesRes, indexesRes, statsRes] = await Promise.all([
          fetch(slowQueriesUrl, { headers, cache: "no-store" }),
          fetch("/api/v1/system/db-performance/spatial-indexes", {
            headers,
            cache: "no-store",
          }),
          fetch("/api/v1/system/db-performance/stats", {
            headers,
            cache: "no-store",
          }),
        ]);

        if (!queriesRes.ok || !indexesRes.ok || !statsRes.ok) {
          throw new Error("Failed to fetch database performance metrics");
        }

        const queriesData = await queriesRes.json();
        const indexesData = await indexesRes.json();
        const statsData = await statsRes.json();

        if (mounted.current) {
          if (resetList) {
            setSlowQueries(queriesData);
            offsetRef.current = queriesData.length;
          } else {
            setSlowQueries((prev) => [...prev, ...queriesData]);
            offsetRef.current += queriesData.length;
          }

          setHasMore(queriesData.length === limit);
          setSpatialIndexes(indexesData);
          setStats(statsData);
          setError(null);
        }
      } catch (err) {
        if (mounted.current) {
          setError(
            err instanceof Error ? err.message : "Database API unavailable"
          );
        }
      } finally {
        if (mounted.current) {
          setLoading(false);
          setLoadingMore(false);
          loadingMoreRef.current = false;
        }
      }
    },
    [session?.accessToken, searchQuery, sortBy, roleFilter, minTotalTime]
  );

  // Always-current ref to the latest fetchData — avoids stale closure issues
  const fetchDataRef = useRef(fetchData);

  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  // Infinite scroll fetch
  const fetchMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    await fetchData(false);
  }, [fetchData, loading, loadingMore, hasMore]);

  // Stable refresh: never recreated, always calls the latest fetchData via ref.
  // This prevents the double-fetch bug where both the mount-effect and the
  // filter-effect used to fire on every filter change.
  const refresh = useCallback(() => {
    fetchDataRef.current(true);
  }, []);

  // Reset pg_stat_statements AND all UI filter states so the page is clean.
  const resetPerformanceStats = useCallback(async () => {
    if (!session?.accessToken) return false;
    try {
      const res = await fetch("/api/v1/system/db-performance/reset", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.accessToken}` },
        cache: "no-store",
      });
      if (res.ok) {
        // 1. Reset all server-side filter states (clears filter chips in UI)
        setSearchQuery("");
        setSortBy("total_time");
        setRoleFilter("");
        setMinTotalTime(null);
        setSelectedRoles([]);
        setSourceFilter("");
        // 2. Clear local data immediately so UI shows 0 queries right away
        setSlowQueries([]);
        setStats(DEFAULT_STATS);
        offsetRef.current = 0;
        setHasMore(false);
        setError(null);
        // Note: fetchData is NOT called here intentionally.
        // page.tsx will call refresh() via setTimeout after React processes
        // the state updates above, ensuring the new (empty) filter values
        // are used in the outgoing request.
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to reset database statistics:", err);
      return false;
    }
  }, [session?.accessToken]);

  // ─── Effects ────────────────────────────────────────────────────────────────

  // Initial data load — fires once on mount and again if the auth token changes.
  useEffect(() => {
    if (session?.accessToken) {
      fetchDataRef.current(true);
    }
  }, [session?.accessToken]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  // Filter / sort change → refresh (skip the first/mount run to avoid double-fetch).
  useEffect(() => {
    if (!isFilterEffectMounted.current) {
      isFilterEffectMounted.current = true;
      return;
    }
    if (session?.accessToken) {
      refresh();
    }
  }, [searchQuery, sortBy, roleFilter, minTotalTime, session?.accessToken, refresh]);

  // Client-side filter by role selection and source selection
  const filteredSlowQueries = slowQueries.filter((q) => {
    if (selectedRoles.length > 0 && !selectedRoles.includes(q.role))
      return false;
    if (sourceFilter) {
      const isDash = isDashboardQuery(q.query);
      if (sourceFilter === "dashboard" && !isDash) return false;
      if (sourceFilter === "nondashboard" && isDash) return false;
    }
    return true;
  });

  return {
    slowQueries: filteredSlowQueries,
    rawSlowQueries: slowQueries,
    spatialIndexes,
    stats,
    loading,
    loadingMore,
    hasMore,
    error,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    roleFilter,
    setRoleFilter,
    minTotalTime,
    setMinTotalTime,
    selectedRoles,
    setSelectedRoles,
    sourceFilter,
    setSourceFilter,
    fetchMore,
    refresh,
    resetPerformanceStats,
  };
}

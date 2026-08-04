"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";

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

export function useDbPerformance() {
  const { data: session } = useSession();
  const [slowQueries, setSlowQueries] = useState<SlowQuery[]>([]);
  const [spatialIndexes, setSpatialIndexes] = useState<SpatialIndex[]>([]);
  const [stats, setStats] = useState<DbPerfStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination & Filters States
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("total_time");
  const [roleFilter, setRoleFilter] = useState("");
  const limit = 20;

  const mounted = useRef(true);

  // Fetch initial data or stats/indexes (also triggers on filter change)
  const fetchData = useCallback(async (resetList = true) => {
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }

    if (resetList) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const headers = { Authorization: `Bearer ${session.accessToken}` };
      const currentOffset = resetList ? 0 : offset;
      
      const slowQueriesUrl = `/api/v1/system/db-performance/slow-queries?limit=${limit}&offset=${currentOffset}&search=${encodeURIComponent(searchQuery)}&sort=${sortBy}&role=${roleFilter}`;
      
      // Concurrently fetch queries, indexes, and summary stats
      const [queriesRes, indexesRes, statsRes] = await Promise.all([
        fetch(slowQueriesUrl, { headers, cache: "no-store" }),
        fetch("/api/v1/system/db-performance/spatial-indexes", { headers, cache: "no-store" }),
        fetch("/api/v1/system/db-performance/stats", { headers, cache: "no-store" })
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
          setOffset(queriesData.length);
        } else {
          setSlowQueries((prev) => [...prev, ...queriesData]);
          setOffset((prev) => prev + queriesData.length);
        }
        
        setHasMore(queriesData.length === limit);
        setSpatialIndexes(indexesData);
        setStats(statsData);
        setError(null);
      }
    } catch (err) {
      if (mounted.current) {
        setError(err instanceof Error ? err.message : "Database API unavailable");
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [session?.accessToken, offset, searchQuery, sortBy, roleFilter]);

  // Infinite Scroll fetch function
  const fetchMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    await fetchData(false);
  }, [fetchData, loading, loadingMore, hasMore]);

  // Reset performance statistics endpoint
  const resetPerformanceStats = useCallback(async () => {
    if (!session?.accessToken) return false;
    try {
      const headers = { Authorization: `Bearer ${session.accessToken}` };
      const res = await fetch("/api/v1/system/db-performance/reset", {
        method: "POST",
        headers,
        cache: "no-store",
      });
      if (res.ok) {
        // Clear local list and refresh stats
        setSlowQueries([]);
        setOffset(0);
        setHasMore(false);
        await fetchData(true);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to reset database statistics:", err);
      return false;
    }
  }, [session?.accessToken, fetchData]);

  // Refresh or trigger on query/filter/sort changes
  const refresh = useCallback(() => {
    setOffset(0);
    setHasMore(true);
    // Setting offset to 0 and doing fresh fetch
    if (session?.accessToken) {
      const headers = { Authorization: `Bearer ${session.accessToken}` };
      const slowQueriesUrl = `/api/v1/system/db-performance/slow-queries?limit=${limit}&offset=0&search=${encodeURIComponent(searchQuery)}&sort=${sortBy}&role=${roleFilter}`;
      
      Promise.all([
        fetch(slowQueriesUrl, { headers, cache: "no-store" }),
        fetch("/api/v1/system/db-performance/spatial-indexes", { headers, cache: "no-store" }),
        fetch("/api/v1/system/db-performance/stats", { headers, cache: "no-store" })
      ])
        .then(async ([qRes, iRes, sRes]) => {
          if (qRes.ok && iRes.ok && sRes.ok) {
            const qData = await qRes.json();
            const iData = await iRes.json();
            const sData = await sRes.json();
            if (mounted.current) {
              setSlowQueries(qData);
              setOffset(qData.length);
              setHasMore(qData.length === limit);
              setSpatialIndexes(iData);
              setStats(sData);
              setError(null);
            }
          }
        })
        .catch((err) => console.error("Filter refresh failed:", err));
    }
  }, [session?.accessToken, searchQuery, sortBy, roleFilter]);

  // Fetch initial on mount
  useEffect(() => {
    mounted.current = true;
    // Initial load
    if (session?.accessToken) {
      fetchData(true);
    }
    return () => {
      mounted.current = false;
    };
  }, [session?.accessToken, fetchData]); // Only run when token becomes available

  // Trigger refresh on filter or sort updates
  useEffect(() => {
    refresh();
  }, [searchQuery, sortBy, roleFilter, refresh]);

  return {
    slowQueries,
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
    fetchMore,
    refresh,
    resetPerformanceStats,
  };
}

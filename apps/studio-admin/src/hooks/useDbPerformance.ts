"use client";

import { useSession } from "next-auth/react";
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

export function useDbPerformance() {
  const { data: session } = useSession();
  const [slowQueries, setSlowQueries] = useState<SlowQuery[]>([]);
  const [spatialIndexes, setSpatialIndexes] = useState<SpatialIndex[]>([]);
  const [stats, setStats] = useState<DbPerfStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination & Filters States
  const [_offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("total_time");
  const [roleFilter, setRoleFilter] = useState("");
  const [minTotalTime, setMinTotalTime] = useState<number | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const limit = 20;

  const mounted = useRef(true);
  const offsetRef = useRef(0);
  const loadingMoreRef = useRef(false);

  // Fetch initial data or stats/indexes (also triggers on filter change)
  const fetchData = useCallback(async (resetList = true) => {
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }

    if (resetList) {
      setLoading(true);
      offsetRef.current = 0;
      setOffset(0);
    } else {
      if (loadingMoreRef.current) return;
      loadingMoreRef.current = true;
      setLoadingMore(true);
    }

    try {
      const headers = { Authorization: `Bearer ${session.accessToken}` };
      const currentOffset = offsetRef.current;
      
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
          offsetRef.current = queriesData.length;
          setOffset(queriesData.length);
        } else {
          setSlowQueries((prev) => [...prev, ...queriesData]);
          offsetRef.current += queriesData.length;
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
        loadingMoreRef.current = false;
      }
    }
  }, [session?.accessToken, searchQuery, sortBy, roleFilter]);

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
        offsetRef.current = 0;
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
    fetchData(true);
  }, [fetchData]);

  // Fetch initial on mount
  useEffect(() => {
    mounted.current = true;
    if (session?.accessToken) {
      fetchData(true);
    }
    return () => {
      mounted.current = false;
    };
  }, [session?.accessToken, fetchData]);

  // Trigger refresh on filter or sort updates
  useEffect(() => {
    refresh();
  }, [searchQuery, sortBy, roleFilter, refresh]);

  // Filter slowQueries based on client-side filters (minTotalTime & selectedRoles)
  const filteredSlowQueries = slowQueries.filter((q) => {
    if (minTotalTime !== null && q.totalTimeMs < minTotalTime) return false;
    if (selectedRoles.length > 0 && !selectedRoles.includes(q.role)) return false;
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
    fetchMore,
    refresh,
    resetPerformanceStats,
  };
}

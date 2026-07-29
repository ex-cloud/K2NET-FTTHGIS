"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";

export interface SlowQuery {
  query: string;
  calls: number;
  totalTimeMs: number;
  meanTimeMs: number;
}

export interface SpatialIndex {
  tableName: string;
  indexName: string;
  indexDef: string;
  status: string;
  size: string;
}

export function useDbPerformance() {
  const { data: session } = useSession();
  const [slowQueries, setSlowQueries] = useState<SlowQuery[]>([]);
  const [spatialIndexes, setSpatialIndexes] = useState<SpatialIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetchData = useCallback(async () => {
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${session.accessToken}` };
      
      const [queriesRes, indexesRes] = await Promise.all([
        fetch("/api/v1/system/db-performance/slow-queries", { headers, cache: "no-store" }),
        fetch("/api/v1/system/db-performance/spatial-indexes", { headers, cache: "no-store" })
      ]);

      if (!queriesRes.ok || !indexesRes.ok) {
        throw new Error("Failed to fetch database performance metrics");
      }

      const queriesData = await queriesRes.json();
      const indexesData = await indexesRes.json();

      if (mounted.current) {
        setSlowQueries(queriesData);
        setSpatialIndexes(indexesData);
        setError(null);
      }
    } catch (err) {
      if (mounted.current) {
        setError(err instanceof Error ? err.message : "Database API unavailable");
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [session?.accessToken]);

  useEffect(() => {
    mounted.current = true;
    fetchData();
    const interval = setInterval(fetchData, 60000); // Poll every 60s
    return () => {
      mounted.current = false;
      clearInterval(interval);
    };
  }, [fetchData]);

  return { slowQueries, spatialIndexes, loading, error, refresh: fetchData };
}

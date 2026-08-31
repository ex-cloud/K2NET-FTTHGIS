

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "@/lib/auth-compat";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChartPoint {
  time: string;
  [key: string]: string | number;
}

export interface DbSizes {
  ftthGisBytes: number;
  keycloakBytes: number;
  walBytes: number;
  totalBytes: number;
}

export interface DiskInfo {
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
}

export interface LargeObjectInfo {
  name: string;
  sizeBytes: number;
  type: "TABLE" | "INDEX";
}

export interface DbObservabilityData {
  dbSizes: DbSizes;
  diskInfo: DiskInfo;
  pgCacheHitRate: number;
  pgConnectionsByState: {
    active: number;
    idle: number;
    idleInTransaction: number;
  };
  largeObjects: LargeObjectInfo[];
}

export interface DbMetricsResponse {
  charts: {
    cpu: ChartPoint[];
    memory: ChartPoint[];
    network: ChartPoint[];
    iops: ChartPoint[];
    diskThroughput: ChartPoint[];
    connections: ChartPoint[];
  };
  dbObservability: DbObservabilityData;
  source: "real" | "prometheus-only";
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_DB_SIZES: DbSizes = {
  ftthGisBytes: 0,
  keycloakBytes: 0,
  walBytes: 0,
  totalBytes: 0,
};

const DEFAULT_DISK_INFO: DiskInfo = {
  totalBytes: 0,
  usedBytes: 0,
  freeBytes: 0,
};

const DEFAULT_OBSERVABILITY: DbObservabilityData = {
  dbSizes: DEFAULT_DB_SIZES,
  diskInfo: DEFAULT_DISK_INFO,
  pgCacheHitRate: 0,
  pgConnectionsByState: { active: 0, idle: 0, idleInTransaction: 0 },
  largeObjects: [],
};

import { memoryCache } from "@/lib/memoryCache";

const CACHE_KEY = "obs:db_metrics";

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDbObservability(pollIntervalMs = 30_000) {
  const { data: session } = useSession();
  const cached = memoryCache.get<DbMetricsResponse>(CACHE_KEY);
  const [data, setData] = useState<DbMetricsResponse | null>(cached);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(cached ? new Date() : null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMetrics = useCallback(async (isSilent = false) => {
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }
    if (!isSilent && !memoryCache.get(CACHE_KEY)) {
      setLoading(true);
    }
    try {
      const res = await fetch("/api/observability/db-metrics", {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: DbMetricsResponse = await res.json();
      memoryCache.set(CACHE_KEY, json);
      setData(json);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fetch failed");
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  // Initial fetch + polling
  useEffect(() => {
    if (memoryCache.isFresh(CACHE_KEY, 15_000)) {
      // Data is fresh, run a silent background revalidation
      fetchMetrics(true);
    } else {
      fetchMetrics(!!cached);
    }
    intervalRef.current = setInterval(() => fetchMetrics(true), pollIntervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchMetrics, pollIntervalMs, cached]);

  // Derived values with safe defaults
  const charts = data?.charts ?? {
    cpu: [],
    memory: [],
    network: [],
    iops: [],
    diskThroughput: [],
    connections: [],
  };
  const dbObservability = data?.dbObservability ?? DEFAULT_OBSERVABILITY;
  const source = data?.source ?? "prometheus-only";

  return {
    charts,
    dbObservability,
    source,
    loading,
    error,
    lastUpdated,
    refresh: () => fetchMetrics(false),
  };
}

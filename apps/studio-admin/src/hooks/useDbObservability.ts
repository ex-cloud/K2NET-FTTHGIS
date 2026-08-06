"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDbObservability(pollIntervalMs = 30_000) {
  const { data: session } = useSession();
  const [data, setData] = useState<DbMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/observability/db-metrics", {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: DbMetricsResponse = await res.json();
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
    fetchMetrics();
    intervalRef.current = setInterval(fetchMetrics, pollIntervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchMetrics, pollIntervalMs]);

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
    refresh: fetchMetrics,
  };
}

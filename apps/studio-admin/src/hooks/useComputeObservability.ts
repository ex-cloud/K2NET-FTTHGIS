

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "@/lib/auth-compat";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ComputeChartPoint {
  time: string;
  [key: string]: string | number;
}

export interface ServiceMemoryInfo {
  job: string;
  up: boolean;
  memoryBytes: number;
}

export interface LoadAvgInfo {
  load1: number;
  load5: number;
  load15: number;
}

export interface BucketStats {
  name: string;
  totalFiles: number;
  totalSize: number;
}

export interface DevOpsBackupInfo {
  lastBackupTime: string;
  nextBackupTime: string;
  status: "SUCCESS" | "FAILED" | "UNKNOWN" | string;
  minioStatus: "SUCCESS" | "UNKNOWN" | string;
  minioSyncTime: string;
  nextcloudStatus: "SUCCESS" | "UNKNOWN" | string;
  nextcloudSyncTime: string;
  dbBackups: BucketStats;
  codeBackups: BucketStats;
  dockerBackups: BucketStats;
}

export interface DevOpsStatsData {
  lastMigration: {
    version: string;
    description: string;
    installedOn: string;
    success: boolean;
  };
  lastBackup: DevOpsBackupInfo;
  compute: {
    tier: string;
    cpuCores: number;
    maxMemoryMb: number;
    usedMemoryMb: number;
    totalMemoryMb: number;
    javaVersion: string;
    osInfo: string;
    heapUsedMb: number;
    nonHeapUsedMb: number;
    heapMaxMb: number;
  };
}

export interface ComputeMetricsResponse {
  charts: {
    cpu: ComputeChartPoint[];
    memory: ComputeChartPoint[];
    http: ComputeChartPoint[];
  };
  loadAvg: LoadAvgInfo;
  services: ServiceMemoryInfo[];
  devOpsStats: DevOpsStatsData;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

import { memoryCache } from "@/lib/memoryCache";

const CACHE_KEY = "obs:compute_metrics";

export function useComputeObservability(pollIntervalMs = 30_000) {
  const { data: session } = useSession();
  const cached = memoryCache.get<ComputeMetricsResponse>(CACHE_KEY);
  const [data, setData] = useState<ComputeMetricsResponse | null>(cached);
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
      const res = await fetch("/api/observability/compute-metrics", {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ComputeMetricsResponse = await res.json();
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

  useEffect(() => {
    if (memoryCache.isFresh(CACHE_KEY, 15_000)) {
      fetchMetrics(true);
    } else {
      fetchMetrics(!!cached);
    }
    intervalRef.current = setInterval(() => fetchMetrics(true), pollIntervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchMetrics, pollIntervalMs, cached]);

  // Safe defaults
  const charts = data?.charts ?? { cpu: [], memory: [], http: [] };
  const loadAvg = data?.loadAvg ?? { load1: 0.0, load5: 0.0, load15: 0.0 };
  const services = data?.services ?? [];
  const devOpsStats = data?.devOpsStats ?? {
    lastMigration: { version: "—", description: "—", installedOn: "—", success: false },
    lastBackup: {
      lastBackupTime: "—",
      nextBackupTime: "—",
      status: "UNKNOWN",
      minioStatus: "UNKNOWN",
      minioSyncTime: "—",
      nextcloudStatus: "UNKNOWN",
      nextcloudSyncTime: "—",
      dbBackups: { name: "db-backups", totalFiles: 0, totalSize: 0 },
      codeBackups: { name: "code-backups", totalFiles: 0, totalSize: 0 },
      dockerBackups: { name: "docker-backups", totalFiles: 0, totalSize: 0 }
    },
    compute: {
      tier: "—",
      cpuCores: 0,
      maxMemoryMb: 0,
      usedMemoryMb: 0,
      totalMemoryMb: 0,
      javaVersion: "—",
      osInfo: "—",
      heapUsedMb: 0,
      nonHeapUsedMb: 0,
      heapMaxMb: 0
    }
  };

  return {
    charts,
    loadAvg,
    services,
    devOpsStats,
    loading,
    error,
    lastUpdated,
    refresh: () => fetchMetrics(false),
  };
}

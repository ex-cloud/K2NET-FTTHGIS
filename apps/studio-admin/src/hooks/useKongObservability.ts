"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { KongRouteDisplay } from "@/app/api/observability/kong-routes/route";
import type { KongTrafficPoint } from "@/app/api/observability/kong-traffic/route";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KongMetrics {
  totalRequests: number;
  activeConnections: number;
  dbReachable: boolean;
  configHash: string;
  workerCount: number;
  workerMemoryMiB: number;
  trafficHistory: KongTrafficPoint[];
  source: "kong-admin" | "unavailable";
  error?: string;
}

// ─── useKongRoutes ────────────────────────────────────────────────────────────

export function useKongRoutes() {
  const [routes, setRoutes] = useState<KongRouteDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetchRoutes = useCallback(async () => {
    try {
      const res = await fetch("/api/observability/kong-routes", { cache: "no-store" });
      const data = await res.json();
      if (mounted.current) {
        if (data.data?.length > 0) {
          setRoutes(data.data);
          setError(null);
        } else if (data.error) {
          setError(`Kong Admin: ${data.error}`);
          setRoutes([]);
        }
      }
    } catch (err) {
      if (mounted.current) {
        setError("Kong Admin API unreachable");
        setRoutes([]);
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    fetchRoutes();
    const interval = setInterval(fetchRoutes, 30_000);
    return () => {
      mounted.current = false;
      clearInterval(interval);
    };
  }, [fetchRoutes]);

  return { routes, loading, error, refresh: fetchRoutes };
}

// ─── useKongTraffic ───────────────────────────────────────────────────────────

export function useKongTraffic() {
  const [metrics, setMetrics] = useState<KongMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetchTraffic = useCallback(async () => {
    try {
      const res = await fetch("/api/observability/kong-traffic", { cache: "no-store" });
      const data: KongMetrics = await res.json();
      if (mounted.current) {
        setMetrics(data);
        setError(data.error ?? null);
      }
    } catch {
      if (mounted.current) {
        setError("Kong traffic API unavailable");
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    fetchTraffic();
    const interval = setInterval(fetchTraffic, 10_000); // 10s refresh for traffic
    return () => {
      mounted.current = false;
      clearInterval(interval);
    };
  }, [fetchTraffic]);

  return { metrics, loading, error, refresh: fetchTraffic };
}

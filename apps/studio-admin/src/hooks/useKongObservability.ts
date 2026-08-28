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

import { memoryCache } from "@/lib/memoryCache";

const CACHE_ROUTES_KEY = "obs:kong_routes";
const CACHE_TRAFFIC_KEY = "obs:kong_traffic";

// ─── useKongRoutes ────────────────────────────────────────────────────────────

export function useKongRoutes() {
  const cached = memoryCache.get<KongRouteDisplay[]>(CACHE_ROUTES_KEY);
  const [routes, setRoutes] = useState<KongRouteDisplay[]>(cached || []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetchRoutes = useCallback(async (isSilent = false) => {
    if (!isSilent && !memoryCache.get(CACHE_ROUTES_KEY)) setLoading(true);
    try {
      const res = await fetch("/api/observability/kong-routes", { cache: "no-store" });
      const data = await res.json();
      if (mounted.current) {
        if (data.data?.length > 0) {
          memoryCache.set(CACHE_ROUTES_KEY, data.data);
          setRoutes(data.data);
          setError(null);
        } else if (data.error) {
          setError(`Kong Admin: ${data.error}`);
          setRoutes([]);
        }
      }
    } catch {
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
    if (memoryCache.isFresh(CACHE_ROUTES_KEY, 15_000)) {
      fetchRoutes(true);
    } else {
      fetchRoutes(!!cached);
    }
    const interval = setInterval(() => fetchRoutes(true), 30_000);
    return () => {
      mounted.current = false;
      clearInterval(interval);
    };
  }, [fetchRoutes, cached]);

  return { routes, loading, error, refresh: () => fetchRoutes(false) };
}

// ─── useKongTraffic ───────────────────────────────────────────────────────────

export function useKongTraffic() {
  const cached = memoryCache.get<KongMetrics>(CACHE_TRAFFIC_KEY);
  const [metrics, setMetrics] = useState<KongMetrics | null>(cached);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetchTraffic = useCallback(async (isSilent = false) => {
    if (!isSilent && !memoryCache.get(CACHE_TRAFFIC_KEY)) setLoading(true);
    try {
      const res = await fetch("/api/observability/kong-traffic", { cache: "no-store" });
      const data: KongMetrics = await res.json();
      if (mounted.current) {
        memoryCache.set(CACHE_TRAFFIC_KEY, data);
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
    if (memoryCache.isFresh(CACHE_TRAFFIC_KEY, 10_000)) {
      fetchTraffic(true);
    } else {
      fetchTraffic(!!cached);
    }
    const interval = setInterval(() => fetchTraffic(true), 10_000);
    return () => {
      mounted.current = false;
      clearInterval(interval);
    };
  }, [fetchTraffic, cached]);

  return { metrics, loading, error, refresh: () => fetchTraffic(false) };
}

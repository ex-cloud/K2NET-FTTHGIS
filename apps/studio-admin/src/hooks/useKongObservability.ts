"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { KongRouteDisplay } from "@/app/api/observability/kong-routes/route";
import type { KongTrafficPoint } from "@/app/api/observability/kong-traffic/route";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KongMetrics {
  totalRequests: number;
  activeConnections: number;
  dbReachable: boolean;
  trafficHistory: KongTrafficPoint[];
  source: "kong-admin" | "unavailable";
  error?: string;
}

// ─── Fallback data (mock-compatible shape) ────────────────────────────────────
const FALLBACK_ROUTES: KongRouteDisplay[] = [
  { route: "/api/v1/wa",        routeId: "r1", upstream: "notification-gateway:5001", methods: "ALL", plugins: ["jwt", "rate-limiting"], status: "UP" },
  { route: "/api/v1/olt",       routeId: "r2", upstream: "olt-gateway:5005",          methods: "ALL", plugins: ["jwt", "rate-limiting"], status: "UP" },
  { route: "/api/v1/spatial",   routeId: "r3", upstream: "map-gateway:5003",          methods: "ALL", plugins: ["jwt", "rate-limiting"], status: "UP" },
  { route: "/api/v1/payment",   routeId: "r4", upstream: "payment-gateway:5002",      methods: "ALL", plugins: ["jwt", "rate-limiting"], status: "UP" },
  { route: "/api/v1/storage",   routeId: "r5", upstream: "storage-gateway:5004",      methods: "ALL", plugins: ["jwt", "rate-limiting"], status: "UP" },
  { route: "/api/v1/system",    routeId: "r6", upstream: "ftth-backend:9090",         methods: "ALL", plugins: ["jwt", "rate-limiting"], status: "UP" },
  { route: "/api/v1/audit",     routeId: "r7", upstream: "audit-gateway:5006",        methods: "ALL", plugins: ["jwt", "rate-limiting"], status: "UP" },
  { route: "/api/v1/scheduler", routeId: "r8", upstream: "scheduler-gateway:5007",    methods: "ALL", plugins: ["jwt", "rate-limiting"], status: "UP" },
];

// ─── useKongRoutes ────────────────────────────────────────────────────────────

export function useKongRoutes() {
  const [routes, setRoutes] = useState<KongRouteDisplay[]>(FALLBACK_ROUTES);
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
          // Keep fallback routes
        }
      }
    } catch (err) {
      if (mounted.current) {
        setError("Kong Admin API unreachable — showing last known config");
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

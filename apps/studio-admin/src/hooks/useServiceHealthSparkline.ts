"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { getDetailedServicesHealth, getSystemThroughput } from "@/lib/actions/health";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ServiceHealthRow {
  name: string;
  category: "gateways" | "core" | "observability" | "databases";
  key: string;
  unit: string;
  rps: number;
  bars: number[];
  status: "up" | "down" | "unknown";
  logType?: string;
}

// ─── Static config: all 25 containers in K2NET FTTH GIS stack ─────────────────
const SERVICE_CONFIG = [
  // 1. Core Services & Gateways
  { name: "Traefik Ingress Proxy",      key: "traefik",            category: "core",          unit: "req/min",      logType: "edge" },
  { name: "Cloudflare Tunnel",          key: "cloudflare-tunnel",  category: "core",          unit: "req/min",      logType: "edge" },
  { name: "API Gateway (Kong)",         key: "kong",               category: "core",          unit: "req/min",      logType: "edge" },
  { name: "Spring Boot Core",           key: "spring-boot",        category: "core",          unit: "req/min",      logType: "audit" },
  { name: "Studio Admin Dashboard",     key: "frontend-admin",     category: "core",          unit: "req/min",      logType: "audit" },
  { name: "Keycloak Auth",              key: "keycloak",           category: "core",          unit: "req/min",      logType: "auth" },

  // 2. Identity & Database Core
  { name: "Database (Postgres)",        key: "postgres",           category: "databases",     unit: "queries/min",  logType: "postgres" },
  { name: "Redis Cache",                key: "redis",              category: "databases",     unit: "ops/sec",      logType: "postgres" },
  { name: "MinIO Object Storage",       key: "minio",              category: "databases",     unit: "req/min",      logType: "storage" },
  { name: "Martin Tile Server",         key: "martin",             category: "databases",     unit: "req/min",      logType: "map" },

  // 3. Go Gateways (Microservices)
  { name: "Storage Go Gateway",         key: "storage-gateway",    category: "gateways",      unit: "req/min",      logType: "storage" },
  { name: "WhatsApp Gateway",           key: "whatsapp-gateway",   category: "gateways",      unit: "tasks/min",    logType: "notification" },
  { name: "OLT Gateway",                key: "olt-gateway",        category: "gateways",      unit: "req/min",      logType: "olt" },
  { name: "Scheduler Go Gateway",       key: "scheduler-gateway",  category: "gateways",      unit: "tasks/min",    logType: "scheduler" },
  { name: "Export Go Gateway",          key: "export-gateway",     category: "gateways",      unit: "tasks/min",    logType: "audit" },
  { name: "OLT Poller Service",         key: "go-poller",          category: "gateways",      unit: "tasks/min",    logType: "poller" },
  { name: "Audit Go Gateway",           key: "audit-gateway",      category: "gateways",      unit: "req/min",      logType: "audit" },
  { name: "Map Go Gateway",             key: "map-gateway",        category: "gateways",      unit: "req/min",      logType: "map" },
  { name: "Notification Gateway",       key: "notification-gateway", category: "gateways",    unit: "req/min",      logType: "notification" },
  { name: "Payment Go Gateway",         key: "payment-gateway",    category: "gateways",      unit: "req/min",      logType: "edge" },

  // 4. Telemetry & Monitoring (Observability)
  { name: "Prometheus Server",          key: "prometheus",         category: "observability", unit: "queries/min",  logType: "audit" },
  { name: "Alertmanager",               key: "alertmanager",       category: "observability", unit: "alerts/min",   logType: "notification" },
  { name: "Grafana Dashboards",         key: "grafana",            category: "observability", unit: "req/min",      logType: "audit" },
  { name: "Node Exporter",              key: "node-exporter",      category: "observability", unit: "scrapes/min",  logType: "audit" },
  { name: "SNMP Simulator",             key: "snmpsim",            category: "observability", unit: "pings/sec",    logType: "poller" },
] as const;

// ─── Helper: generate a stable sparkline from a single numeric seed ───────────
function seedSparkline(seed: number, length = 10): number[] {
  const bars: number[] = [];
  for (let i = 0; i < length; i++) {
    const jitter = (Math.sin(seed * (i + 1) * 13.37) * seed * 0.25);
    bars.push(Math.max(1, Math.round(seed + jitter)));
  }
  return bars;
}

// ─── Fallback seeds for initial load or offline states ───────────────────────
const SEEDS: Record<string, number> = {
  "traefik": 72, "cloudflare-tunnel": 72, "kong": 68, "postgres": 95, "redis": 140, "keycloak": 6,
  "minio": 12, "martin": 8, "spring-boot": 32, "frontend-admin": 8,
  "storage-gateway": 5, "whatsapp-gateway": 2, "olt-gateway": 14, "scheduler-gateway": 3,
  "export-gateway": 1, "go-poller": 25, "audit-gateway": 8, "map-gateway": 12,
  "notification-gateway": 6, "payment-gateway": 3,
  "prometheus": 15, "alertmanager": 1, "grafana": 3, "node-exporter": 30, "snmpsim": 25,
};

const RATIOS: Record<string, number> = {
  "traefik": 1.0, "cloudflare-tunnel": 1.0, "kong": 0.85, "postgres": 1.4, "redis": 2.2, "keycloak": 0.05,
  "minio": 0.12, "martin": 0.15, "spring-boot": 0.55, "frontend-admin": 0.2,
  "storage-gateway": 0.08, "whatsapp-gateway": 0.03, "olt-gateway": 0.18, "scheduler-gateway": 0.04,
  "export-gateway": 0.01, "go-poller": 0.35, "audit-gateway": 0.1, "map-gateway": 0.15,
  "notification-gateway": 0.06, "payment-gateway": 0.03,
  "prometheus": 0.08, "alertmanager": 0.01, "grafana": 0.05, "node-exporter": 0.42, "snmpsim": 0.35,
};

const FALLBACK_DATA: ServiceHealthRow[] = SERVICE_CONFIG.map((svc) => {
  const seed = SEEDS[svc.key] ?? 10;
  return {
    name: svc.name,
    category: svc.category,
    key: svc.key,
    unit: svc.unit,
    rps: seed,
    bars: seedSparkline(seed),
    status: "up",
    logType: svc.logType,
  };
});

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useServiceHealthSparkline() {
  const { data: session } = useSession();
  const [rows, setRows] = useState<ServiceHealthRow[]>(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetch_data = useCallback(async () => {
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }

    try {
      // Run the dynamic checks and fetch Prometheus throughput concurrently
      const [serviceMap, throughput] = await Promise.all([
        getDetailedServicesHealth(session.accessToken),
        getSystemThroughput(),
      ]);

      // Calculate latest total throughput
      const latestTotal = throughput.length > 0 ? throughput[throughput.length - 1].requests : 0;
      const allBars = throughput.map((p) => p.requests);

      const computed: ServiceHealthRow[] = SERVICE_CONFIG.map((svc) => {
        const ratio = RATIOS[svc.key] ?? 0.1;
        const seed = SEEDS[svc.key] ?? 10;

        // Calculate load metrics based on real throughput or fall back to seeds
        const rps = latestTotal > 0
          ? Math.max(1, Math.round(latestTotal * ratio))
          : seed;

        const bars = allBars.length >= 3
          ? allBars.map((b) => Math.max(1, Math.round(b * ratio)))
          : seedSparkline(seed);

        const status = serviceMap[svc.key] ?? "unknown";

        return {
          name: svc.name,
          category: svc.category,
          key: svc.key,
          unit: svc.unit,
          rps,
          bars,
          status,
          logType: svc.logType,
        };
      });

      if (mountedRef.current) {
        setRows(computed);
        setError(null);
      }
    } catch (err) {
      console.error("[useServiceHealthSparkline] Failed to fetch service health:", err);
      if (mountedRef.current) {
        setError("Telemetry fetch failed — displaying estimated workload trends");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    mountedRef.current = true;
    fetch_data();
    const interval = setInterval(fetch_data, 30_000); // Poll status every 30s
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetch_data]);

  return { rows, loading, error, refresh: fetch_data };
}

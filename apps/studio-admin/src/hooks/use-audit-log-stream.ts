"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { getBackendBaseUrl } from "@/lib/api-config";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuditStreamEntry {
  id: string;
  timestamp: string;
  /** K2NET log type key aligned with LOG_TYPES in logs-filter-context */
  logType: "edge" | "auth" | "audit" | "notification" | "poller" | "scheduler" | "olt" | "postgres" | "storage" | "map";
  /** Legacy category kept for backwards compat */
  category?: string;
  severity: "INFO" | "WARN" | "ERROR" | "CRITICAL";
  actor: string;
  action: string;
  message: string;
}

// ─── Fallback mock data aligned to K2NET real services ────────────────────────
// These show while waiting for a real SSE/REST connection.

const MOCK_INITIAL_LOGS: AuditStreamEntry[] = [
  {
    id: "evt-k01",
    timestamp: new Date(Date.now() - 3000).toISOString(),
    logType: "auth",
    severity: "INFO",
    actor: "superadmin@k2net.id",
    action: "KEYCLOAK_TOKEN_EXCHANGE",
    message: "Super admin session authenticated via Keycloak OIDC Realm",
  },
  {
    id: "evt-k02",
    timestamp: new Date(Date.now() - 8000).toISOString(),
    logType: "poller",
    severity: "WARN",
    actor: "ftth-poller",
    action: "OLT_SIGNAL_DEGRADATION",
    message: "Poller detected 2 minor signal degradation events on OLT-BDG-01",
  },
  {
    id: "evt-k03",
    timestamp: new Date(Date.now() - 15000).toISOString(),
    logType: "edge",
    severity: "INFO",
    actor: "system",
    action: "KONG_TENANT_HEADER",
    message: "Kong API Gateway decorated X-Tenant-ID header for 42 inbound requests",
  },
  {
    id: "evt-k04",
    timestamp: new Date(Date.now() - 25000).toISOString(),
    logType: "audit",
    severity: "INFO",
    actor: "superadmin@k2net.id",
    action: "TENANT_CREATED",
    message: "New tenant 'PT. Maju Bersama' created successfully via audit trail",
  },
  {
    id: "evt-k05",
    timestamp: new Date(Date.now() - 35000).toISOString(),
    logType: "notification",
    severity: "INFO",
    actor: "notification-gateway",
    action: "SMS_SENT",
    message: "Twilio SMS sent to +62812xxxx: Invoice payment reminder",
  },
  {
    id: "evt-k06",
    timestamp: new Date(Date.now() - 50000).toISOString(),
    logType: "auth",
    severity: "WARN",
    actor: "unknown@192.168.1.55",
    action: "AUTHORIZATION_FAILURE",
    message: "Access denied: missing permission 'network.write' on POST /api/v1/network/olt",
  },
  {
    id: "evt-k07",
    timestamp: new Date(Date.now() - 65000).toISOString(),
    logType: "poller",
    severity: "INFO",
    actor: "ftth-poller",
    action: "POLLER_HEALTH_SCRAPE",
    message: "Poller healthcheck scrape OK (ftth-poller:5010) — 24 devices polled",
  },
  {
    id: "evt-k08",
    timestamp: new Date(Date.now() - 80000).toISOString(),
    logType: "storage",
    severity: "INFO",
    actor: "storage-gateway",
    action: "MINIO_UPLOAD",
    message: "File uploaded to MinIO: tenant/logos/pt-maju-bersama.png (42KB)",
  },
  {
    id: "evt-k09",
    timestamp: new Date(Date.now() - 95000).toISOString(),
    logType: "scheduler",
    severity: "INFO",
    actor: "gateway-scheduler",
    action: "JOB_EXECUTED",
    message: "Scheduled job 'monthly-invoice-gen' executed successfully in 230ms",
  },
  {
    id: "evt-k10",
    timestamp: new Date(Date.now() - 110000).toISOString(),
    logType: "edge",
    severity: "ERROR",
    actor: "kong",
    action: "RATE_LIMIT_EXCEEDED",
    message: "Kong rate limit exceeded: 192.168.1.100 hit 100 req/min on /api/v1/network",
  },
];

// ─── Simulation ticker data (K2NET real services) ────────────────────────────

const SAMPLE_ACTIONS = [
  { logType: "auth" as const,         act: "KEYCLOAK_SESSION_REFRESH",  msg: "Token refresh request handled by ftth-keycloak",             sev: "INFO" as const },
  { logType: "poller" as const,       act: "POLLER_HEALTH_SCRAPE",      msg: "Poller healthcheck scrape OK (ftth-poller:5010)",            sev: "INFO" as const },
  { logType: "edge" as const,         act: "KONG_REQUEST_PROXIED",      msg: "Kong API Gateway proxied request to backend (9090)",         sev: "INFO" as const },
  { logType: "audit" as const,        act: "RESOURCE_UPDATED",          msg: "ODC asset updated by tenant operator — gateway-audit trail", sev: "INFO" as const },
  { logType: "scheduler" as const,    act: "JOB_TRIGGERED",             msg: "Scheduled job 'olt-health-report' triggered by cron",       sev: "INFO" as const },
  { logType: "notification" as const, act: "WHATSAPP_SENT",             msg: "WhatsApp message delivered via gateway-whatsapp (Twilio)",  sev: "INFO" as const },
  { logType: "auth" as const,         act: "RATE_LIMIT_EXCEEDED",       msg: "Rate limit exceeded for client IP 10.0.0.25",               sev: "WARN" as const },
  { logType: "olt" as const,          act: "ONT_PROVISIONED",           msg: "ONT serial HWTC1234A provisioned on OLT-SBY-02 port 4",    sev: "INFO" as const },
  { logType: "storage" as const,      act: "PRESIGNED_URL_GENERATED",   msg: "MinIO presigned URL generated for tenant asset download",    sev: "INFO" as const },
  { logType: "edge" as const,         act: "KONG_TENANT_HEADER",        msg: "Kong decorated X-Tenant-ID for 18 requests in last window", sev: "INFO" as const },
];

// ─── Hook Options ─────────────────────────────────────────────────────────────

export interface UseAuditLogStreamOptions {
  /** When true, stops adding new log entries (pauses the ticker & SSE) */
  isPaused?: boolean;
  /**
   * K2NET log type filter map.
   * If ALL values are false → no logs shown (empty state).
   * If ANY value is true  → show matching logs.
   */
  selectedTypes?: Record<string, boolean>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuditLogStream(
  filterCategory: string = "all",
  options?: UseAuditLogStreamOptions
) {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<AuditStreamEntry[]>(MOCK_INITIAL_LOGS);
  const [status, setStatus] = useState<"connecting" | "live" | "paused">("live");

  // Ref so interval closure always reads latest paused value without re-mounting
  const isPausedRef = useRef(options?.isPaused ?? false);

  // Sync ref + status inside an effect (never during render)
  useEffect(() => {
    isPausedRef.current = options?.isPaused ?? false;
    setStatus(options?.isPaused ? "paused" : "live");
  }, [options?.isPaused]);

  // ── Real data fetch + simulation ticker ──────────────────────────────────
  useEffect(() => {
    let eventSource: EventSource | null = null;

    // Attempt real SSE connection when authenticated (Spring Boot endpoint)
    if (session?.accessToken) {
      try {
        const baseUrl = getBackendBaseUrl();
        const streamUrl = `${baseUrl}/system/security/audit-logs/stream`;
        eventSource = new EventSource(streamUrl);

        eventSource.onopen = () => {
          setStatus("live");
        };

        eventSource.addEventListener("audit-log", (event: MessageEvent) => {
          if (isPausedRef.current) return;
          try {
            const raw = JSON.parse(event.data);
            // Map Spring Boot AuditLog fields → AuditStreamEntry
            const entry: AuditStreamEntry = {
              id: raw.id ?? `sse-${Date.now()}`,
              timestamp: raw.timestamp ?? new Date().toISOString(),
              logType: mapSpringEventTypeToLogType(raw.eventType),
              severity: (raw.severity as AuditStreamEntry["severity"]) ?? "INFO",
              actor: raw.username ?? raw.clientIp ?? "system",
              action: raw.eventType ?? "UNKNOWN",
              message: raw.details ?? raw.requestUri ?? "",
            };
            setLogs((prev) => [entry, ...prev].slice(0, 500));
          } catch {
            // Silently ignore malformed SSE events
          }
        });

        eventSource.onerror = () => {
          setStatus("connecting");
        };
      } catch {
        // SSE unavailable — fallback to simulation ticker below
      }
    }

    // Simulation ticker — fires every 4.5s, skips completely when paused
    const interval = setInterval(() => {
      if (isPausedRef.current) return;

      const pick = SAMPLE_ACTIONS[Math.floor(Math.random() * SAMPLE_ACTIONS.length)];
      const entry: AuditStreamEntry = {
        id: `sim-${Date.now()}`,
        timestamp: new Date().toISOString(),
        logType: pick.logType,
        severity: pick.sev,
        actor: "system-worker",
        action: pick.act,
        message: pick.msg,
      };
      setLogs((prev) => [entry, ...prev].slice(0, 300));
    }, 4500);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, [session?.accessToken]);

  // ── Per-type filter logic ─────────────────────────────────────────────────
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const selectedTypes = options?.selectedTypes ?? {};
  const hasAnyTypeSelected =
    Object.keys(selectedTypes).length === 0 ||
    Object.values(selectedTypes).some(Boolean);

  const filteredLogs = logs.filter((log) => {
    if (!hasAnyTypeSelected) return false;

    // If selectedTypes map exists and has any key set: filter by logType
    if (Object.keys(selectedTypes).length > 0) {
      const typeActive = selectedTypes[log.logType];
      if (typeActive === false) return false;
    }

    // Legacy filterCategory param (kept for backwards compat)
    if (filterCategory !== "all" && log.category && log.category !== filterCategory) return false;

    return true;
  });

  return {
    logs: filteredLogs,
    totalCount: logs.length,
    hasAnyTypeSelected,
    status,
    clearLogs,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Map Spring Boot AuditLog eventType → K2NET logType key */
function mapSpringEventTypeToLogType(
  eventType: string
): AuditStreamEntry["logType"] {
  switch (eventType) {
    case "AUTHORIZATION_FAILURE":
    case "AUTHENTICATION_FAILURE":
    case "RATE_LIMIT_EXCEEDED":
    case "LOGIN_FAILED":
    case "BRUTE_FORCE_ATTEMPT":
      return "auth";
    case "NETWORK_ASSET_CREATED":
    case "NETWORK_ASSET_UPDATED":
    case "NETWORK_ASSET_DELETED":
      return "audit";
    default:
      return "auth"; // Default security events to auth
  }
}

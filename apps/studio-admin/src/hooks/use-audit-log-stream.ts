"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { getAuditEvents } from "@/lib/actions/gateways";

// ─── Group Definitions ────────────────────────────────────────────────────────

export type LogGroupKey = "CORE" | "OPERATIONS" | "NETWORK" | "MESSAGING";

export const LOG_GROUPS: Record<LogGroupKey, {
  label: string;
  description: string;
  color: string;
  accentBg: string;
  types: string[];
}> = {
  CORE: {
    label: "Core System",
    description: "Kong, Keycloak, DB Audit — infrastruktur platform",
    color: "text-violet-400",
    accentBg: "bg-violet-500/10",
    types: ["edge", "auth", "postgres"],
  },
  OPERATIONS: {
    label: "Bisnis & Operasional",
    description: "Tenant, User, Payment, Notifikasi, Scheduler, Storage, Export",
    color: "text-sky-400",
    accentBg: "bg-sky-500/10",
    types: ["audit", "notification", "scheduler", "storage", "export", "payment"],
  },
  NETWORK: {
    label: "Jaringan GIS",
    description: "OLT gateway, Poller SNMP, Map/Geocoding",
    color: "text-emerald-400",
    accentBg: "bg-emerald-500/10",
    types: ["olt", "poller", "map"],
  },
  MESSAGING: {
    label: "Messaging",
    description: "WhatsApp, SMS, Email notifications",
    color: "text-amber-400",
    accentBg: "bg-amber-500/10",
    types: ["whatsapp"],
  },
};

/** Resolve logGroup from event metadata or resourceType */
export function resolveLogGroup(
  logType: string,
  resourceType?: string,
  metadata?: Record<string, any>
): LogGroupKey {
  // 1. Prefer explicit logGroup set by the emitting service
  if (metadata?.logGroup && metadata.logGroup in LOG_GROUPS) {
    return metadata.logGroup as LogGroupKey;
  }
  // 2. Resolve from logType membership
  for (const [key, group] of Object.entries(LOG_GROUPS)) {
    if (group.types.includes(logType)) return key as LogGroupKey;
  }
  // 3. Fallback from resourceType
  const rt = (resourceType ?? "").toUpperCase();
  if (["USER", "ROLE", "ORGANIZATION", "SYSTEM_SETTING", "KEYCLOAK"].includes(rt)) return "CORE";
  if (["OLT", "ODP", "ODC", "CABLE", "CUSTOMER", "FIBER"].includes(rt)) return "NETWORK";
  if (["WHATSAPP", "SMS"].includes(rt)) return "MESSAGING";
  return "OPERATIONS";
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuditStreamEntry {
  id: string;
  timestamp: string;
  /** K2NET log type key aligned with LOG_TYPES in logs-filter-context */
  logType: string;
  /** Log group — aggregates multiple logTypes into a business category */
  logGroup: LogGroupKey;
  /** The service that emitted this event (e.g. "backend", "gateway-olt", "kong") */
  serviceSource: string;
  /** Tenant slug for multi-tenant visibility in Super Admin view */
  tenantSlug?: string;
  /** Legacy category kept for backwards compat */
  category?: string;
  severity: "INFO" | "WARN" | "ERROR" | "CRITICAL";
  actor: string;
  action: string;
  message: string;
  resourceType?: string;
  method?: string;
  status?: string | number;
  pathname?: string;
  ip?: string;
}

// ─── Hook Options ─────────────────────────────────────────────────────────────

export interface UseAuditLogStreamOptions {
  /** When true, stops polling for new logs */
  isPaused?: boolean;
  /**
   * K2NET log type filter map.
   * If ALL values are false → no logs shown (empty state).
   * If ANY value is true  → show matching logs.
   */
  selectedTypes?: Record<string, boolean>;
  /** Optional group filter — if set, only show logs matching this group */
  selectedGroups?: Record<LogGroupKey, boolean>;
  /** Optional time range filter (relative e.g. "15m", "1h", "24h" or custom "custom:start_end") */
  timeRange?: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuditLogStream(
  filterCategory: string = "all",
  options?: UseAuditLogStreamOptions
) {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<AuditStreamEntry[]>([]);
  const [status, setStatus] = useState<"connecting" | "live" | "paused">("paused");

  const isPausedRef = useRef(options?.isPaused ?? true);
  const [now, setNow] = useState(() => Date.now());
  const timeRange = options?.timeRange;

  useEffect(() => {
    setNow(Date.now());
  }, [logs, timeRange]);

  // Sync ref + status inside an effect (never during render)
  useEffect(() => {
    isPausedRef.current = options?.isPaused ?? true;
    setStatus(options?.isPaused ? "paused" : "live");
  }, [options?.isPaused]);

  const fetchRealLogs = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const headers = { Authorization: `Bearer ${session.accessToken}` };

      // Fetch concurrently from all log sources
      const [auditEventsResult, alertsResult, keycloakResult, notifyResult] = await Promise.allSettled([
        getAuditEvents(),
        fetch("/api/v1/system/security/alerts", { headers, cache: "no-store" }).then(r => r.ok ? r.json() : []),
        fetch("/api/v1/system/keycloak/events", { headers, cache: "no-store" }).then(r => r.ok ? r.json() : []),
        fetch("/api/observability/notification-stats", { headers, cache: "no-store" }).then(r => r.ok ? r.json() : ({} as any)),
      ]);

      const combinedLogs: AuditStreamEntry[] = [];

      // 1. Audit events from Go gateway-audit (backend, Go microservices)
      if (auditEventsResult.status === "fulfilled" && Array.isArray(auditEventsResult.value)) {
        auditEventsResult.value.forEach((e: any) => {
          const metadata = e.metadata ?? {};
          // Determine logType from metadata.serviceSource if available
          const rawSource: string = metadata.serviceSource ?? e.serviceSource ?? "backend";
          const logType = metadata.logType ?? resolveLogTypeFromSource(rawSource, e.resourceType);
          const logGroup = resolveLogGroup(logType, e.resourceType, metadata);

          let method = metadata.method || (e.action && e.action.includes(":") ? e.action.split(":")[0] : undefined);
          if (!method && e.action) {
            const act = e.action.toUpperCase();
            if (act.includes("CREATE") || act.includes("ADD") || act.includes("POST")) {
              method = "POST";
            } else if (act.includes("UPDATE") || act.includes("EDIT") || act.includes("MODIFY") || act.includes("PUT") || act.includes("PATCH")) {
              method = "PUT";
            } else if (act.includes("DELETE") || act.includes("REMOVE")) {
              method = "DELETE";
            } else {
              method = "GET";
            }
          }
          const status = metadata.status || metadata.statusCode || (e.errorMessage ? 500 : 200);
          const pathname = e.resourceId || metadata.pathname || (e.action && e.action.includes(":") ? e.action.split(":")[1] : undefined);
          const ip = e.actorIp || metadata.ip || undefined;

          combinedLogs.push({
            id: e.id || `audit-${Date.now()}-${Math.random()}`,
            timestamp: e.occurredAt || e.createdAt || new Date().toISOString(),
            logType,
            logGroup,
            serviceSource: rawSource,
            tenantSlug: e.tenantSlug ?? metadata.tenantSlug ?? undefined,
            severity: e.status === "FAILED" ? "ERROR" : "INFO",
            actor: e.actorId || e.username || e.actor || "system",
            action: e.action || "UNKNOWN",
            resourceType: e.resourceType,
            message: e.errorMessage
              ? `Error: ${e.errorMessage}`
              : (e.resourceType
                ? `${e.action} on ${e.resourceType}${e.resourceId ? ` [${e.resourceId}]` : ""}`
                : `${e.action} completed`),
            method,
            status,
            pathname,
            ip,
          });
        });
      }

      // 2. Security alerts from Spring Boot security_events table
      if (alertsResult.status === "fulfilled" && Array.isArray(alertsResult.value)) {
        alertsResult.value.forEach((e: any) => {
          combinedLogs.push({
            id: String(e.id || `alert-${Date.now()}-${Math.random()}`),
            timestamp: e.createdAt || new Date().toISOString(),
            logType: "auth",
            logGroup: "CORE",
            serviceSource: "backend",
            tenantSlug: e.tenantSlug ?? undefined,
            severity: (e.severity as any) ?? "INFO",
            actor: e.username || "system",
            action: e.eventType || "SECURITY_ALERT",
            message: e.details || "",
          });
        });
      }

      // 3. Keycloak events from Keycloak Admin REST API (proxied via Spring Boot)
      if (keycloakResult.status === "fulfilled" && Array.isArray(keycloakResult.value)) {
        keycloakResult.value.forEach((e: any) => {
          const hasError = e.type?.includes("ERROR") || e.type?.includes("FAIL");
          combinedLogs.push({
            id: `keycloak-${e.time || Date.now()}-${Math.random()}`,
            timestamp: e.time ? new Date(e.time).toISOString() : new Date().toISOString(),
            logType: "auth",
            logGroup: "CORE",
            serviceSource: "keycloak",
            tenantSlug: e.realmId ?? undefined,
            severity: hasError ? "WARN" : "INFO",
            actor: e.userId || "user",
            action: e.type || "KEYCLOAK_EVENT",
            message: `Client: ${e.clientId || "—"}. IP: ${e.details?.ipAddress || "—"}`,
            status: hasError ? 400 : 200,
            ip: e.details?.ipAddress || undefined,
            pathname: e.details?.representation || undefined,
          });
        });
      }

      // 4. Notification logs from Redis recent queue
      if (notifyResult.status === "fulfilled" && notifyResult.value?.recent_queue) {
        const recent = notifyResult.value.recent_queue;
        if (Array.isArray(recent)) {
          recent.forEach((m: any) => {
            const channel: string = (m.channel ?? "").toUpperCase();
            const isWhatsapp = channel === "WHATSAPP";
            combinedLogs.push({
              id: String(m.id),
              timestamp: m.sentAt || new Date().toISOString(),
              logType: isWhatsapp ? "whatsapp" : "notification",
              logGroup: isWhatsapp ? "MESSAGING" : "OPERATIONS",
              serviceSource: "notification-gateway",
              tenantSlug: m.tenantSlug ?? undefined,
              severity: m.status === "failed" ? "ERROR" : "INFO",
              actor: "notification-gateway",
              action: channel ? `${channel}_SENT` : "NOTIFICATION_SENT",
              message: `${m.channel || "message"} to ${m.recipient || "—"}: ${m.subject || m.message || ""}`,
              status: m.status === "failed" ? 500 : 200,
            });
          });
        }
      }

      // Sort by timestamp descending
      combinedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setLogs(combinedLogs);
    } catch (err) {
      console.error("[useAuditLogStream] Failed to fetch real logs:", err);
    }
  }, [session?.accessToken]);

  // Handle data fetch and polling
  useEffect(() => {
    fetchRealLogs();

    const interval = setInterval(() => {
      if (isPausedRef.current) return;
      fetchRealLogs();
    }, 5000); // Poll every 5s if active

    return () => {
      clearInterval(interval);
    };
  }, [fetchRealLogs]);

  // ── Per-type + per-group filter logic ─────────────────────────────────────
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const selectedTypes = options?.selectedTypes ?? {};
  const selectedGroups = options?.selectedGroups;

  const hasAnyTypeSelected =
    Object.keys(selectedTypes).length === 0 ||
    Object.values(selectedTypes).some(Boolean);

  const filteredLogs = logs.filter((log) => {
    if (!hasAnyTypeSelected) return false;

    // Filter by logType
    if (Object.keys(selectedTypes).length > 0) {
      if (selectedTypes[log.logType] === false) return false;
    }

    // Filter by logGroup (if group filter is active)
    if (selectedGroups && Object.keys(selectedGroups).length > 0) {
      const hasAnyGroup = Object.values(selectedGroups).some(Boolean);
      if (hasAnyGroup && selectedGroups[log.logGroup] === false) return false;
    }

    // Filter by timeRange
    if (timeRange) {
      const logTime = new Date(log.timestamp).getTime();
      
      if (timeRange.startsWith("custom:")) {
        const parts = timeRange.substring(7).split("_");
        if (parts.length === 2) {
          const start = new Date(parts[0]).getTime();
          const end = new Date(parts[1]).getTime();
          if (logTime < start || logTime > end) return false;
        }
      } else {
        let durationMs = 0;
        const match = timeRange.match(/^(\d+)([mhd])$/);
        if (match) {
          const val = parseInt(match[1], 10);
          const unit = match[2];
          if (unit === "m") durationMs = val * 60 * 1000;
          else if (unit === "h") durationMs = val * 60 * 60 * 1000;
          else if (unit === "d") durationMs = val * 24 * 60 * 60 * 1000;
        }
        if (durationMs > 0 && logTime < now - durationMs) {
          return false;
        }
      }
    }

    // Legacy filterCategory param
    if (filterCategory !== "all" && log.category && log.category !== filterCategory) return false;

    return true;
  });

  return {
    logs: filteredLogs,
    rawLogs: logs,
    totalCount: logs.length,
    hasAnyTypeSelected,
    status,
    clearLogs,
  };
}

// ─── Helper — Resolve logType from service name ────────────────────────────

function resolveLogTypeFromSource(serviceSource: string, resourceType?: string): string {
  const src = serviceSource.toLowerCase();
  if (src.includes("notification")) return "notification";
  if (src.includes("payment")) return "audit"; // payment events go to audit trail
  if (src.includes("storage")) return "storage";
  if (src.includes("olt")) return "olt";
  if (src.includes("whatsapp")) return "whatsapp";
  if (src.includes("scheduler")) return "scheduler";
  if (src.includes("export")) return "export";
  if (src.includes("map")) return "map";
  if (src.includes("poller")) return "poller";
  if (src.includes("kong")) return "edge";
  if (src.includes("keycloak")) return "auth";
  return "audit"; // default for Spring Boot backend
}

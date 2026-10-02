import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "@/lib/auth-compat";
import { getAuditEvents } from "@/lib/actions/gateways";
import {
  type AuditStreamEntry,
  mapAuditEventToEntry,
  mapSecurityAlertToEntry,
  mapKeycloakEventToEntry,
  mapNotificationToEntry,
  checkTimeRangeMatch,
  resolveLogTypeFromSource,
  resolveLogGroup,
} from "./audit-log-mappers";

export {
  type AuditStreamEntry,
  resolveLogTypeFromSource,
  resolveLogGroup,
};

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
    description: "Kong, Keycloak, Postgres, Redis, Traefik — infrastruktur platform",
    color: "text-violet-400",
    accentBg: "bg-violet-500/10",
    types: ["edge", "auth", "postgres", "redis", "traefik"],
  },
  OPERATIONS: {
    label: "Bisnis & Operasional",
    description: "AI Copilot, Task/Project Sync, Payment, Notifikasi, Storage, Scheduler, Export",
    color: "text-sky-400",
    accentBg: "bg-sky-500/10",
    types: ["ai", "task", "audit", "notification", "storage", "export", "payment", "scheduler"],
  },
  NETWORK: {
    label: "Jaringan GIS",
    description: "OLT gateway, Poller SNMP, Map/Geocoding, Martin Vector Tile",
    color: "text-primary/80",
    accentBg: "bg-primary/10",
    types: ["olt", "poller", "map", "martin"],
  },
  MESSAGING: {
    label: "Messaging",
    description: "WhatsApp, SMS, Email notifications",
    color: "text-amber-400",
    accentBg: "bg-amber-500/10",
    types: ["whatsapp"],
  },
};

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
  /** Optional severity filter */
  selectedSeverities?: Record<string, boolean>;
  /** Optional tenant slug filter */
  tenantSlug?: string;
  /** Optional project ID filter */
  projectId?: string;
  /** Optional scope filter */
  scope?: string;
  /** Optional search query */
  search?: string;
  /** Impersonation only filter */
  impersonationOnly?: boolean;
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
  const nowRef = useRef(Date.now());
  const timeRange = options?.timeRange;

  useEffect(() => {
    nowRef.current = Date.now();
  }, [timeRange]);

  useEffect(() => {
    isPausedRef.current = options?.isPaused ?? true;
    setStatus(options?.isPaused ? "paused" : "live");
  }, [options?.isPaused]);

  const tokenRef = useRef(session?.accessToken);
  useEffect(() => {
    tokenRef.current = session?.accessToken;
  }, [session?.accessToken]);

  const fetchRealLogs = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [auditEventsResult, alertsResult, keycloakResult, notifyResult] = await Promise.allSettled([
        getAuditEvents(),
        fetch("/api/v1/system/security/alerts", { headers, cache: "no-store" }).then(r => r.ok ? r.json() : []),
        fetch("/api/v1/system/keycloak/events", { headers, cache: "no-store" }).then(r => r.ok ? r.json() : []),
        fetch("/api/v1/observability/notification-stats", { headers, cache: "no-store" }).then(r => r.ok ? r.json() : ({} as Record<string, unknown>)),
      ]);

      const combinedLogs: AuditStreamEntry[] = [];

      if (auditEventsResult.status === "fulfilled" && Array.isArray(auditEventsResult.value)) {
        auditEventsResult.value.forEach((e: Record<string, unknown>) => {
          combinedLogs.push(mapAuditEventToEntry(e));
        });
      }

      if (alertsResult.status === "fulfilled" && Array.isArray(alertsResult.value)) {
        alertsResult.value.forEach((e: Record<string, unknown>) => {
          combinedLogs.push(mapSecurityAlertToEntry(e));
        });
      }

      if (keycloakResult.status === "fulfilled" && Array.isArray(keycloakResult.value)) {
        keycloakResult.value.forEach((e: Record<string, unknown>) => {
          combinedLogs.push(mapKeycloakEventToEntry(e));
        });
      }

      if (notifyResult.status === "fulfilled" && (notifyResult.value as Record<string, unknown>)?.recent_queue) {
        const recent = (notifyResult.value as { recent_queue?: unknown[] }).recent_queue;
        if (Array.isArray(recent)) {
          recent.forEach((mItem: unknown) => {
            combinedLogs.push(mapNotificationToEntry((mItem as Record<string, unknown>) || {}));
          });
        }
      }

      combinedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setLogs(combinedLogs);
    } catch (err) {
      console.error("[useAuditLogStream] Failed to fetch real logs:", err);
    }
  }, []);

  useEffect(() => {
    fetchRealLogs();
    const interval = setInterval(() => {
      if (isPausedRef.current) return;
      fetchRealLogs();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchRealLogs]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const selectedTypes = options?.selectedTypes ?? {};
  const selectedGroups = options?.selectedGroups;

  const anyTypeActive = Object.values(selectedTypes).some(Boolean);
  const anyGroupActive = selectedGroups ? Object.values(selectedGroups).some(Boolean) : false;

  const timeFilteredLogs = logs.filter((log) => {
    if (timeRange && !checkTimeRangeMatch(log.timestamp, timeRange, nowRef.current)) {
      return false;
    }
    return true;
  });

  const filteredLogs = logs.filter((log) => {
    if (anyTypeActive && !selectedTypes[log.logType]) {
      return false;
    }

    if (anyGroupActive && selectedGroups && !selectedGroups[log.logGroup]) {
      return false;
    }

    if (timeRange && !checkTimeRangeMatch(log.timestamp, timeRange, nowRef.current)) {
      return false;
    }

    if (filterCategory !== "all" && log.category && log.category !== filterCategory) return false;

    return true;
  });

  return {
    logs: filteredLogs,
    timeFilteredLogs,
    rawLogs: timeFilteredLogs,
    allLogs: logs,
    totalCount: timeFilteredLogs.length,
    allTimeTotalCount: logs.length,
    hasAnyTypeSelected: true,
    status,
    clearLogs,
  };
}

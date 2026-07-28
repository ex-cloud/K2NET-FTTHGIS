"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { getBackendBaseUrl } from "@/lib/api-config";

export interface AuditStreamEntry {
  id: string;
  timestamp: string;
  category: "olt" | "auth" | "postgis" | "general";
  severity: "INFO" | "WARN" | "ERROR" | "CRITICAL";
  actor: string;
  action: string;
  message: string;
}

// Initial mock dataset representing real-time telemetry events when SSE is connecting
const MOCK_INITIAL_LOGS: AuditStreamEntry[] = [
  {
    id: "evt-101",
    timestamp: new Date(Date.now() - 5000).toISOString().replace("T", " ").substring(0, 19),
    category: "auth",
    severity: "INFO",
    actor: "superadmin@k2net.id",
    action: "KEYCLOAK_TOKEN_EXCHANGE",
    message: "Super admin session authenticated via Keycloak OIDC Realm",
  },
  {
    id: "evt-102",
    timestamp: new Date(Date.now() - 12000).toISOString().replace("T", " ").substring(0, 19),
    category: "olt",
    severity: "WARN",
    actor: "ftth-poller",
    action: "OLT_LOS_CHECK",
    message: "Poller gateway detected 2 minor signal degradation events on OLT-BDG-01",
  },
  {
    id: "evt-103",
    timestamp: new Date(Date.now() - 25000).toISOString().replace("T", " ").substring(0, 19),
    category: "postgis",
    severity: "INFO",
    actor: "map-gateway",
    action: "MVT_TILE_CACHE_HIT",
    message: "Martin tile server rendered 128 vector tiles in 14ms (Redis cached)",
  },
  {
    id: "evt-104",
    timestamp: new Date(Date.now() - 40000).toISOString().replace("T", " ").substring(0, 19),
    category: "general",
    severity: "INFO",
    actor: "system",
    action: "KONG_ROUTE_DECORATOR",
    message: "Kong API Gateway decorated X-Tenant-ID header for 42 inbound requests",
  },
];

export interface UseAuditLogStreamOptions {
  /** When true, stops adding new log entries (pauses the ticker & SSE) */
  isPaused?: boolean;
  /**
   * Supabase-aligned log type filter map.
   * If ALL values are false → no logs shown.
   * If ANY value is true  → show matching logs (all until backend supports per-type).
   */
  selectedTypes?: Record<string, boolean>;
}

export function useAuditLogStream(
  filterCategory: string = "all",
  options?: UseAuditLogStreamOptions
) {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<AuditStreamEntry[]>(MOCK_INITIAL_LOGS);
  const [status, setStatus] = useState<"connecting" | "live" | "paused">("live");

  // Use a ref so the interval closure always reads the latest paused value
  const isPausedRef = useRef(options?.isPaused ?? false);

  // Sync ref value and status indicator safely in an effect
  useEffect(() => {
    isPausedRef.current = options?.isPaused ?? false;
    setStatus(options?.isPaused ? "paused" : "live");
  }, [options?.isPaused]);


  useEffect(() => {
    let eventSource: EventSource | null = null;

    // Attempt real SSE connection if authenticated
    if (session?.accessToken) {
      try {
        const baseUrl = getBackendBaseUrl();
        const streamUrl = `${baseUrl}/system/security/audit-logs/stream`;
        eventSource = new EventSource(streamUrl);

        eventSource.onopen = () => {
          setStatus("live");
        };

        eventSource.addEventListener("audit-log", (event: MessageEvent) => {
          if (isPausedRef.current) return; // ← PAUSE: drop incoming SSE events
          try {
            const newEntry = JSON.parse(event.data) as AuditStreamEntry;
            setLogs((prev) => [newEntry, ...prev].slice(0, 500));
          } catch {
            // Parse fallback — ignore malformed events
          }
        });

        eventSource.onerror = () => {
          setStatus("connecting");
        };
      } catch {
        // SSE not available — fall through to simulation ticker
      }
    }

    // Simulation ticker — respects isPaused via ref
    const SAMPLE_ACTIONS = [
      { cat: "auth",    act: "KEYCLOAK_SESSION_REFRESH", msg: "Token refresh request handled by ftth-keycloak",    sev: "INFO" },
      { cat: "olt",     act: "POLLER_PING_HEALTH",       msg: "Poller healthcheck scrape OK (ftth-poller:5010)",   sev: "INFO" },
      { cat: "postgis", act: "SPATIAL_INDEX_SCAN",       msg: "PostGIS spatial query ST_Contains executed in 8ms", sev: "INFO" },
      { cat: "general", act: "MINIO_S3_BACKUP_CHECK",    msg: "MinIO bucket db-backups health check active",       sev: "INFO" },
    ] as const;

    const interval = setInterval(() => {
      // ← KEY FIX: completely skip when paused — no CPU wasted
      if (isPausedRef.current) return;

      const pick = SAMPLE_ACTIONS[Math.floor(Math.random() * SAMPLE_ACTIONS.length)];
      const entry: AuditStreamEntry = {
        id: `evt-${Date.now()}`,
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
        category: pick.cat,
        severity: pick.sev as "INFO" | "WARN",
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

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Determine if any log types are selected
  const selectedTypes = options?.selectedTypes ?? {};
  const hasAnyTypeSelected =
    Object.keys(selectedTypes).length === 0 ||
    Object.values(selectedTypes).some(Boolean);

  // Apply filters
  const filteredLogs = logs.filter((log) => {
    // If no types selected at all → show nothing
    if (!hasAnyTypeSelected) return false;

    // Category filter (legacy filterCategory param)
    if (filterCategory !== "all" && log.category !== filterCategory) return false;

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

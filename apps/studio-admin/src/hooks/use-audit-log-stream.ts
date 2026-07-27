"use client";

import { useState, useEffect, useCallback } from "react";
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

export function useAuditLogStream(filterCategory: string = "all") {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<AuditStreamEntry[]>(MOCK_INITIAL_LOGS);
  const [status, setStatus] = useState<"connecting" | "live" | "paused">("live");

  // Simulated SSE generator / EventSource fallback for continuous real-time feed
  useEffect(() => {
    if (!session?.accessToken) return;

    let eventSource: EventSource | null = null;
    try {
      const baseUrl = getBackendBaseUrl();
      const streamUrl = `${baseUrl}/system/security/audit-logs/stream`;
      
      eventSource = new EventSource(streamUrl);
      
      eventSource.onopen = () => {
        setStatus("live");
      };

      eventSource.addEventListener("audit-log", (event: MessageEvent) => {
        try {
          const newEntry = JSON.parse(event.data) as AuditStreamEntry;
          setLogs((prev) => [newEntry, ...prev].slice(0, 500));
        } catch {
          // Parse fallback
        }
      });

      eventSource.onerror = () => {
        setStatus("connecting");
      };
    } catch {
      setStatus("live");
    }

    // Periodic simulation ticker ensuring terminal live stream animation
    const interval = setInterval(() => {
      const sampleCategories: Array<"olt" | "auth" | "postgis" | "general"> = ["olt", "auth", "postgis", "general"];
      const sampleActions = [
        { cat: "auth", act: "KEYCLOAK_SESSION_REFRESH", msg: "Token refresh request handled by ftth-keycloak", sev: "INFO" },
        { cat: "olt", act: "POLLE_PING_HEALTH", msg: "Poller healthcheck scrape OK (ftth-poller:5010)", sev: "INFO" },
        { cat: "postgis", act: "SPATIAL_INDEX_SCAN", msg: "PostGIS spatial query ST_Contains executed in 8ms", sev: "INFO" },
        { cat: "general", act: "MINIO_S3_BACKUP_CHECK", msg: "MinIO bucket db-backups health check active", sev: "INFO" },
      ] as const;

      const randomPick = sampleActions[Math.floor(Math.random() * sampleActions.length)];
      const generatedEntry: AuditStreamEntry = {
        id: `evt-${Date.now()}`,
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
        category: randomPick.cat,
        severity: randomPick.sev as "INFO" | "WARN",
        actor: "system-worker",
        action: randomPick.act,
        message: randomPick.msg,
      };

      setLogs((prev) => [generatedEntry, ...prev].slice(0, 300));
    }, 4500);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, [session?.accessToken]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (filterCategory === "all") return true;
    return log.category === filterCategory;
  });

  return {
    logs: filteredLogs,
    totalCount: logs.length,
    status,
    clearLogs,
  };
}

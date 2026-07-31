"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { getAuditEvents } from "@/lib/actions/gateways";

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

  // Sync ref + status inside an effect (never during render)
  useEffect(() => {
    isPausedRef.current = options?.isPaused ?? true;
    setStatus(options?.isPaused ? "paused" : "live");
  }, [options?.isPaused]);

  const fetchRealLogs = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const headers = { Authorization: `Bearer ${session.accessToken}` };

      // Fetch concurrently
      const [auditEventsResult, alertsResult, keycloakResult, notifyResult] = await Promise.allSettled([
        getAuditEvents(),
        fetch("/api/v1/system/security/alerts", { headers, cache: "no-store" }).then(r => r.ok ? r.json() : []),
        fetch("/api/v1/system/keycloak/events", { headers, cache: "no-store" }).then(r => r.ok ? r.json() : []),
        fetch("/api/observability/notification-stats", { headers, cache: "no-store" }).then(r => r.ok ? r.json() : ({} as any)),
      ]);

      const combinedLogs: AuditStreamEntry[] = [];

      // 1. Audit events (from Go audit microservice)
      if (auditEventsResult.status === "fulfilled" && Array.isArray(auditEventsResult.value)) {
        auditEventsResult.value.forEach((e: any) => {
          combinedLogs.push({
            id: e.id || `audit-${Date.now()}-${Math.random()}`,
            timestamp: e.occurredAt || e.createdAt || new Date().toISOString(),
            logType: "audit",
            severity: e.status === "FAILED" ? "ERROR" : "INFO",
            actor: e.actorId || e.username || e.actor || "system",
            action: e.action || "UNKNOWN",
            message: e.errorMessage ? `Error: ${e.errorMessage}` : (e.resourceType ? `Action ${e.action} on ${e.resourceType} completed successfully` : `Action ${e.action} completed successfully`),
          });
        });
      }

      // 2. Security alerts (from Spring Boot security_events table)
      if (alertsResult.status === "fulfilled" && Array.isArray(alertsResult.value)) {
        alertsResult.value.forEach((e: any) => {
          combinedLogs.push({
            id: String(e.id || `alert-${Date.now()}-${Math.random()}`),
            timestamp: e.createdAt || new Date().toISOString(),
            logType: "auth",
            severity: (e.severity as any) ?? "INFO",
            actor: e.username || "system",
            action: e.eventType || "SECURITY_ALERT",
            message: e.details || "",
          });
        });
      }

      // 3. Keycloak events (from Keycloak realm events)
      if (keycloakResult.status === "fulfilled" && Array.isArray(keycloakResult.value)) {
        keycloakResult.value.forEach((e: any) => {
          combinedLogs.push({
            id: `keycloak-${e.time || Date.now()}-${Math.random()}`,
            timestamp: e.time ? new Date(e.time).toISOString() : new Date().toISOString(),
            logType: "auth",
            severity: e.type.includes("ERROR") || e.type.includes("FAIL") ? "WARN" : "INFO",
            actor: e.userId || "user",
            action: e.type || "KEYCLOAK_EVENT",
            message: `Client: ${e.clientId || "—"}. IP: ${e.details?.ipAddress || "—"}`,
          });
        });
      }

      // 4. Notification logs (from Redis list logs)
      if (notifyResult.status === "fulfilled" && notifyResult.value?.recent_queue) {
        const recent = notifyResult.value.recent_queue;
        if (Array.isArray(recent)) {
          recent.forEach((m: any) => {
            combinedLogs.push({
              id: String(m.id),
              timestamp: m.sentAt || new Date().toISOString(),
              logType: "notification",
              severity: m.status === "failed" ? "ERROR" : "INFO",
              actor: "notification-gateway",
              action: m.channel ? m.channel.toUpperCase() : "SEND",
              message: `${m.channel || "message"} sent to ${m.recipient || "—"}: ${m.subject || m.message || ""}`,
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

  // ── Per-type filter logic ─────────────────────────────────────────────────
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const selectedTypes = options?.selectedTypes ?? {};
  const hasAnyTypeSelected =
    Object.keys(selectedTypes).length === 0 ||
    Object.values(selectedTypes).some(Boolean);

  // filteredLogs: apply type and category filters on top of rawLogs
  const filteredLogs = logs.filter((log) => {
    if (!hasAnyTypeSelected) return false;

    // Filter by logType only when selectedTypes map has explicit entries
    if (Object.keys(selectedTypes).length > 0) {
      // If the key is explicitly set to false, exclude it.
      // If undefined (key not in map), show it.
      if (selectedTypes[log.logType] === false) return false;
    }

    // Legacy filterCategory param (kept for backwards compat)
    if (filterCategory !== "all" && log.category && log.category !== filterCategory) return false;

    return true;
  });

  return {
    logs: filteredLogs,
    rawLogs: logs,          // ← unfiltered stream for count computation in page.tsx
    totalCount: logs.length,
    hasAnyTypeSelected,
    status,
    clearLogs,
  };
}




import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "@/lib/auth-compat";
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
    color: "text-primary/80",
    accentBg: "bg-primary/10",
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

/** Resolve logGroup from event metadata or _resourceType */
export function resolveLogGroup(
  logType: string,
  _resourceType?: string,
  metadata?: Record<string, unknown>
): LogGroupKey {
  // 1. Prefer explicit logGroup set by the emitting service
  const metaLogGroup = typeof metadata?.logGroup === "string" ? metadata.logGroup : undefined;
  if (metaLogGroup && metaLogGroup in LOG_GROUPS) {
    return metaLogGroup as LogGroupKey;
  }
  // 2. Resolve from logType membership
  for (const [key, group] of Object.entries(LOG_GROUPS)) {
    if (group.types.includes(logType)) return key as LogGroupKey;
  }
  // 3. Fallback from _resourceType
  const rt = (_resourceType ?? "").toUpperCase();
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
  /** Scope: SYSTEM, ORGANIZATION, or PROJECT */
  scope?: "SYSTEM" | "ORGANIZATION" | "PROJECT" | string;
  /** Project ID for technical project-scoped logs */
  projectId?: string;
  /** Human-readable Project Name */
  projectName?: string;
  /** Impersonation flag */
  isImpersonated?: boolean;
  /** Real Super Admin Actor ID when impersonating */
  realActorId?: string;
  /** Impersonation session ID */
  impersonationSessionId?: string;
  /** Target tenant ID being impersonated */
  impersonatedTenantId?: string;
  /** Legacy category kept for backwards compat */
  category?: string;
  severity: "INFO" | "WARN" | "ERROR" | "CRITICAL";
  actor: string;
  action: string;
  message: string;
  _resourceType?: string;
  resourceId?: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
  traceId?: string;
  requestId?: string;
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

// ─── Entry Mappers ────────────────────────────────────────────────────

function resolveHttpMethod(metadataMethod?: string, actionStr?: string): string | undefined {
  if (metadataMethod) return metadataMethod;
  if (!actionStr) return undefined;
  if (actionStr.includes(":")) return actionStr.split(":")[0];

  const act = actionStr.toUpperCase();
  if (act.includes("CREATE") || act.includes("ADD") || act.includes("POST")) return "POST";
  if (act.includes("UPDATE") || act.includes("EDIT") || act.includes("MODIFY") || act.includes("PUT") || act.includes("PATCH")) return "PUT";
  if (act.includes("DELETE") || act.includes("REMOVE")) return "DELETE";
  return "GET";
}

function humanizeAction(actionStr?: string): string {
  if (!actionStr) return "Action";
  const act = actionStr.toUpperCase();
  if (act === "IMPERSONATION_STARTED") return "Step-Up MFA Impersonation Initiated";
  if (act === "IMPERSONATION_ENDED") return "Impersonation Session Terminated";
  if (act === "GLOBAL_SETTINGS_UPDATED") return "Global System Setting Updated";
  if (act === "TENANT_API_KEY_REGENERATED") return "Tenant API Key Regenerated";
  if (act === "ODP_PROVISIONED") return "ODP Asset Provisioned";
  if (act === "OLT_HEALTH_DEGRADED") return "OLT Health Degraded (Telemetry Alert)";
  return actionStr.replace(/_/g, " ");
}

function formatAuditMessage(
  actionStr?: string,
  resourceType?: string,
  resourceId?: string,
  errorMessage?: string,
  metadata?: Record<string, unknown>
): string {
  if (typeof metadata?.description === "string" && metadata.description.trim()) {
    return metadata.description;
  }
  if (typeof metadata?.reason === "string" && metadata.reason.trim()) {
    return `${humanizeAction(actionStr)}: ${metadata.reason}`;
  }
  if (typeof metadata?.errorReason === "string" && metadata.errorReason.trim()) {
    return `${humanizeAction(actionStr)}: ${metadata.errorReason}`;
  }
  if (errorMessage) return `Error: ${errorMessage}`;
  if (resourceType) return `${humanizeAction(actionStr)} on ${resourceType}${resourceId ? ` [${resourceId}]` : ""}`;
  return `${humanizeAction(actionStr)} completed`;
}

function resolveAuditStatus(
  metadata: Record<string, unknown>,
  errorMessage?: string,
  serviceSource?: string
): number | undefined {
  if (typeof metadata.status === "number") return metadata.status;
  if (typeof metadata.statusCode === "number") return metadata.statusCode;
  if (typeof metadata.httpStatus === "number") return metadata.httpStatus;
  if (errorMessage) return 500;
  if (serviceSource && (serviceSource.toLowerCase().includes("kong") || serviceSource.toLowerCase().includes("edge"))) {
    return 200;
  }
  return undefined;
}

function resolveAuditPathname(e: Record<string, unknown>, metadata: Record<string, unknown>, actionStr?: string): string | undefined {
  if (typeof e.resourceId === "string") return e.resourceId;
  if (typeof metadata.pathname === "string") return metadata.pathname;
  if (actionStr?.includes(":")) return actionStr.split(":")[1];
  return undefined;
}

function resolveEntrySeverity(
  metadata: Record<string, unknown>,
  e: Record<string, unknown>,
  status?: number
): "INFO" | "WARN" | "ERROR" | "CRITICAL" {
  const actionStr = String(e.action ?? metadata.action ?? "").toUpperCase();
  const rawSeverity = typeof metadata.severity === "string"
    ? metadata.severity.toUpperCase()
    : typeof e.severity === "string"
    ? e.severity.toUpperCase()
    : undefined;

  // Enforce taxonomy floor for critical security operations
  if (actionStr.includes("IMPERSONATION") || actionStr.includes("UNAUTHORIZED") || actionStr.includes("TAMPER") || actionStr.includes("BREACH")) {
    return "CRITICAL";
  }
  if (actionStr.includes("GLOBAL_SETTING") || actionStr.includes("API_KEY") || actionStr.includes("PASSWORD") || actionStr.includes("SECURITY_POLICY")) {
    return "WARN";
  }

  if (rawSeverity === "CRITICAL" || rawSeverity === "ERROR" || rawSeverity === "WARN" || rawSeverity === "INFO") {
    return rawSeverity as "INFO" | "WARN" | "ERROR" | "CRITICAL";
  }
  if (e.status === "FAILED" || (typeof status === "number" && status >= 500) || actionStr.includes("DEGRADED") || actionStr.includes("FAIL")) {
    return "ERROR";
  }
  if (typeof status === "number" && status >= 400) {
    return "WARN";
  }
  return "INFO";
}

function resolveEntryImpersonation(metadata: Record<string, unknown>, e: Record<string, unknown>) {
  const isImpersonated = Boolean(
    metadata.isImpersonated ||
    metadata.impersonatedBy ||
    metadata.realActorId ||
    (typeof e.actorId === "string" && e.actorId.startsWith("impersonated:"))
  );
  const realActorId = typeof metadata.realActorId === "string"
    ? metadata.realActorId
    : typeof metadata.impersonatedBy === "string"
    ? metadata.impersonatedBy
    : undefined;
  const impersonationSessionId = typeof metadata.impersonationSessionId === "string"
    ? metadata.impersonationSessionId
    : typeof metadata.sessionId === "string"
    ? metadata.sessionId
    : undefined;
  const impersonatedTenantId = typeof metadata.impersonatedTenantId === "string"
    ? metadata.impersonatedTenantId
    : undefined;

  return { isImpersonated, realActorId, impersonationSessionId, impersonatedTenantId };
}

function resolveEntryScope(metadata: Record<string, unknown>, tenantSlug?: string) {
  const scope = typeof metadata.scope === "string"
    ? metadata.scope.toUpperCase()
    : metadata.projectId
    ? "PROJECT"
    : tenantSlug
    ? "ORGANIZATION"
    : "SYSTEM";
  const projectId = typeof metadata.projectId === "string" ? metadata.projectId : undefined;
  const projectName = typeof metadata.projectName === "string" ? metadata.projectName : undefined;

  return { scope, projectId, projectName };
}

function resolveEntryDiff(metadata: Record<string, unknown>, e: Record<string, unknown>) {
  const oldValue = (e.oldValue as Record<string, unknown>) ?? (metadata.oldValue as Record<string, unknown>) ?? null;
  const newValue = (e.newValue as Record<string, unknown>) ?? (metadata.newValue as Record<string, unknown>) ?? null;
  return { oldValue, newValue };
}

function mapAuditEventToEntry(e: Record<string, unknown>): AuditStreamEntry {
  const metadata = (e.metadata as Record<string, unknown>) ?? {};
  const rawSource = String(metadata.serviceSource ?? e.serviceSource ?? "backend");
  const resourceType = typeof e.resourceType === "string" ? e.resourceType : typeof e._resourceType === "string" ? e._resourceType : undefined;
  const logType = String(metadata.logType ?? resolveLogTypeFromSource(rawSource, resourceType));
  const logGroup = resolveLogGroup(logType, resourceType, metadata);
  const actionStr = typeof e.action === "string" ? e.action : undefined;
  const method = resolveHttpMethod(typeof metadata.method === "string" ? metadata.method : undefined, actionStr);

  const errorMessage = typeof e.errorMessage === "string" ? e.errorMessage : undefined;
  const status = resolveAuditStatus(metadata, errorMessage, rawSource);
  const pathname = resolveAuditPathname(e, metadata, actionStr);
  const ip = typeof e.actorIp === "string" ? e.actorIp : typeof e.clientIp === "string" ? e.clientIp : typeof metadata.ip === "string" ? metadata.ip : undefined;
  const resourceId = typeof e.resourceId === "string" ? e.resourceId : undefined;
  const tenantSlug = typeof e.tenantSlug === "string" ? e.tenantSlug : typeof metadata.tenantSlug === "string" ? metadata.tenantSlug : undefined;

  const severity = resolveEntrySeverity(metadata, e, status);
  const impersonation = resolveEntryImpersonation(metadata, e);
  const scopeInfo = resolveEntryScope(metadata, tenantSlug);
  const diffInfo = resolveEntryDiff(metadata, e);

  return {
    id: String(e.id || `audit-${Date.now()}-${Math.random()}`),
    timestamp: String(e.occurredAt || e.createdAt || new Date().toISOString()),
    logType,
    logGroup,
    serviceSource: rawSource,
    tenantSlug,
    scope: scopeInfo.scope,
    projectId: scopeInfo.projectId,
    projectName: scopeInfo.projectName,
    isImpersonated: impersonation.isImpersonated,
    realActorId: impersonation.realActorId,
    impersonationSessionId: impersonation.impersonationSessionId,
    impersonatedTenantId: impersonation.impersonatedTenantId,
    severity,
    actor: String(e.actorId || e.username || e.actor || "system"),
    action: actionStr || "UNKNOWN",
    _resourceType: resourceType,
    resourceId,
    oldValue: diffInfo.oldValue,
    newValue: diffInfo.newValue,
    metadata,
    message: formatAuditMessage(actionStr, resourceType, resourceId, errorMessage, metadata),
    method,
    status,
    pathname,
    ip,
  };
}



function mapSecurityAlertToEntry(e: Record<string, unknown>): AuditStreamEntry {
  const rawSev = typeof e.severity === "string" ? e.severity : "INFO";
  const severity: "INFO" | "WARN" | "ERROR" | "CRITICAL" =
    rawSev === "CRITICAL" || rawSev === "ERROR" || rawSev === "WARN" ? rawSev : "INFO";
  return {
    id: String(e.id || `alert-${Date.now()}-${Math.random()}`),
    timestamp: String(e.createdAt || new Date().toISOString()),
    logType: "auth",
    logGroup: "CORE",
    serviceSource: "backend",
    tenantSlug: typeof e.tenantSlug === "string" ? e.tenantSlug : undefined,
    severity,
    actor: String(e.username || "system"),
    action: String(e.eventType || "SECURITY_ALERT"),
    message: String(e.details || ""),
  };
}

function mapKeycloakEventToEntry(e: Record<string, unknown>): AuditStreamEntry {
  const eventType = typeof e.type === "string" ? e.type : "";
  const hasError = eventType.includes("ERROR") || eventType.includes("FAIL");
  const details = (e.details as Record<string, unknown>) ?? {};
  return {
    id: `keycloak-${e.time || Date.now()}-${Math.random()}`,
    timestamp: e.time ? new Date(Number(e.time)).toISOString() : new Date().toISOString(),
    logType: "auth",
    logGroup: "CORE",
    serviceSource: "keycloak",
    tenantSlug: typeof e.realmId === "string" ? e.realmId : undefined,
    severity: hasError ? "WARN" : "INFO",
    actor: String(e.userId || "user"),
    action: eventType || "KEYCLOAK_EVENT",
    message: `Client: ${details.clientId || "—"}. IP: ${details.ipAddress || "—"}`,
    status: hasError ? 400 : 200,
    ip: typeof details.ipAddress === "string" ? details.ipAddress : undefined,
    pathname: typeof details.representation === "string" ? details.representation : undefined,
  };
}

function mapNotificationToEntry(m: Record<string, unknown>): AuditStreamEntry {
  const channel: string = String(m.channel ?? "").toUpperCase();
  const isWhatsapp = channel === "WHATSAPP";
  return {
    id: String(m.id),
    timestamp: String(m.sentAt || new Date().toISOString()),
    logType: isWhatsapp ? "whatsapp" : "notification",
    logGroup: isWhatsapp ? "MESSAGING" : "OPERATIONS",
    serviceSource: "notification-gateway",
    tenantSlug: typeof m.tenantSlug === "string" ? m.tenantSlug : undefined,
    severity: m.status === "failed" ? "ERROR" : "INFO",
    actor: "notification-gateway",
    action: channel ? `${channel}_SENT` : "NOTIFICATION_SENT",
    message: `${m.channel || "message"} to ${m.recipient || "—"}: ${m.subject || m.message || ""}`,
    status: m.status === "failed" ? 500 : 200,
  };
}

function checkTimeRangeMatch(timestamp: string, timeRange: string, nowMs: number): boolean {
  const logTime = new Date(timestamp).getTime();
  if (timeRange.startsWith("custom:")) {
    const parts = timeRange.substring(7).split("_");
    if (parts.length === 2) {
      const start = new Date(parts[0]).getTime();
      const end = new Date(parts[1]).getTime();
      return logTime >= start && logTime <= end;
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
    if (durationMs > 0 && logTime < nowMs - durationMs) {
      return false;
    }
  }
  return true;
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

  const filteredLogs = logs.filter((log) => {
    // If user explicitly checked any logTypes, only show checked types
    if (anyTypeActive && !selectedTypes[log.logType]) {
      return false;
    }

    // If user explicitly checked any logGroups, only show checked groups
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
    rawLogs: logs,
    totalCount: logs.length,
    hasAnyTypeSelected: true,
    status,
    clearLogs,
  };
}

// ─── Helper — Resolve logType from service name ────────────────────────────

function resolveLogTypeFromSource(serviceSource: string, _resourceType?: string): string {
  const src = serviceSource.toLowerCase();
  if (src.includes("notification")) return "notification";
  if (src.includes("payment")) return "audit";
  if (src.includes("storage")) return "storage";
  if (src.includes("olt")) return "olt";
  if (src.includes("whatsapp")) return "whatsapp";
  if (src.includes("scheduler")) return "scheduler";
  if (src.includes("export")) return "export";
  if (src.includes("map")) return "map";
  if (src.includes("poller")) return "poller";
  if (src.includes("kong")) return "edge";
  if (src.includes("keycloak")) return "auth";
  return "audit";
}

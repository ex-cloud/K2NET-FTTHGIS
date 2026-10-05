import type { LogGroupKey } from "./use-audit-log-stream";

export interface AuditStreamEntry {
  id: string;
  timestamp: string;
  logType: string;
  logGroup: LogGroupKey;
  serviceSource: string;
  tenantSlug?: string;
  tenantName?: string;
  scope?: string;
  projectId?: string;
  projectName?: string;
  targetResource?: string;
  isImpersonated?: boolean;
  realActorId?: string;
  impersonationSessionId?: string;
  impersonatedTenantId?: string;
  category?: string;
  traceId?: string;
  requestId?: string;
  severity: "INFO" | "WARN" | "ERROR" | "CRITICAL";
  actor: string;
  action: string;
  _resourceType?: string;
  resourceId?: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
  message: string;
  method?: string;
  status?: number;
  pathname?: string;
  ip?: string;
}

interface LogTypeSourceMatcher {
  type: string;
  match: (src: string, res: string) => boolean;
}

const LOG_TYPE_SOURCE_MATCHERS: LogTypeSourceMatcher[] = [
  { type: "ai", match: (s, r) => s.includes("ai") || s.includes("rag") || r.includes("knowledge") || r.includes("embedding") },
  { type: "task", match: (s, r) => s.includes("task") || s.includes("obsidian") || r.includes("task") || r.includes("project") },
  { type: "martin", match: (s, r) => s.includes("martin") || s.includes("tile") || r.includes("mvt") || r.includes("tile") },
  { type: "kong", match: (s) => s.includes("kong") || s.includes("edge") || s.includes("gateway-kong") },
  { type: "traefik", match: (s) => s.includes("traefik") || s.includes("proxy") },
  { type: "auth", match: (s) => s.includes("keycloak") || s.includes("iam") || s.includes("auth") },
  { type: "storage", match: (s) => s.includes("storage") || s.includes("minio") || s.includes("s3") },
  { type: "notification", match: (s) => s.includes("notification") || s.includes("email") || s.includes("sms") },
  { type: "whatsapp", match: (s) => s.includes("whatsapp") || s.includes("waba") },
  { type: "payment", match: (s) => s.includes("payment") || s.includes("xendit") || s.includes("billing") },
  { type: "export", match: (s) => s.includes("export") || s.includes("report") },
  { type: "scheduler", match: (s) => s.includes("scheduler") || s.includes("cron") || s.includes("job") },
  { type: "poller", match: (s) => s.includes("poller") || s.includes("snmp") || s.includes("device") },
  { type: "olt", match: (s) => s.includes("olt") || s.includes("gpon") || s.includes("pon") },
  { type: "map", match: (s) => s.includes("map") || s.includes("gis") || s.includes("spatial") },
  { type: "postgres", match: (s) => s.includes("postgres") || s.includes("db") || s.includes("sql") },
  { type: "redis", match: (s) => s.includes("redis") || s.includes("cache") || s.includes("queue") },
  { type: "backend", match: (s) => s.includes("backend") || s.includes("spring") || s.includes("api") },
];

export function resolveLogTypeFromSource(source: string, resourceType?: string): string {
  const s = source.toLowerCase();
  const r = (resourceType || "").toLowerCase();
  const found = LOG_TYPE_SOURCE_MATCHERS.find((m) => m.match(s, r));
  return found ? found.type : "backend";
}

export function resolveLogGroup(logType: string, _resourceType?: string, _metadata?: Record<string, unknown>): LogGroupKey {
  if (
    logType === "kong" ||
    logType === "traefik" ||
    logType === "edge" ||
    logType === "auth" ||
    logType === "postgres" ||
    logType === "redis" ||
    logType === "database"
  ) {
    return "CORE";
  }
  if (logType === "olt" || logType === "poller" || logType === "map" || logType === "martin") {
    return "NETWORK";
  }
  if (logType === "notification" || logType === "whatsapp") {
    return "MESSAGING";
  }
  if (
    logType === "payment" ||
    logType === "storage" ||
    logType === "export" ||
    logType === "scheduler" ||
    logType === "task" ||
    logType === "ai"
  ) {
    return "OPERATIONS";
  }
  return "CORE";
}

export function resolveHttpMethod(metadataMethod?: string, actionStr?: string): string | undefined {
  if (metadataMethod) return metadataMethod;
  if (!actionStr) return undefined;
  if (actionStr.includes(":")) return actionStr.split(":")[0];

  const act = actionStr.toUpperCase();
  if (act.includes("CREATE") || act.includes("ADD") || act.includes("POST")) return "POST";
  if (act.includes("UPDATE") || act.includes("EDIT") || act.includes("MODIFY") || act.includes("PUT") || act.includes("PATCH")) return "PUT";
  if (act.includes("DELETE") || act.includes("REMOVE")) return "DELETE";
  return "GET";
}

export function humanizeAction(actionStr?: string): string {
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

export function formatAuditMessage(
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

function parseNumericStatus(val: unknown): number | undefined {
  if (typeof val === "number" && !isNaN(val)) return val;
  if (typeof val === "string" && val.trim() !== "" && !isNaN(Number(val))) return Number(val);
  return undefined;
}

export function resolveAuditStatus(
  metadata: Record<string, unknown>,
  errorMessage?: string,
  _serviceSource?: string,
  e?: Record<string, unknown>,
  actionStr?: string
): number {
  const directStatus =
    parseNumericStatus(metadata.status) ??
    parseNumericStatus(metadata.statusCode) ??
    parseNumericStatus(metadata.httpStatus) ??
    parseNumericStatus(e?.status);

  if (directStatus !== undefined) {
    return directStatus;
  }

  const rawStatus = String(e?.status ?? "").toUpperCase();
  const act = String(actionStr ?? "").toUpperCase();

  if (errorMessage || rawStatus === "FAILED" || rawStatus === "ERROR" || act.includes("DEGRADED") || act.includes("FAIL")) {
    return 500;
  }
  if (rawStatus === "UNAUTHORIZED" || act.includes("UNAUTHORIZED")) return 401;
  if (rawStatus === "FORBIDDEN" || act.includes("FORBIDDEN")) return 403;
  if (rawStatus === "RATE_LIMITED" || act.includes("RATE_LIMIT")) return 429;
  if (act.includes("PROVISIONED") || act.includes("CREATED")) return 201;

  return 200;
}

export function resolveAuditPathname(e: Record<string, unknown>, metadata: Record<string, unknown>, actionStr?: string): string | undefined {
  if (typeof e.resourceId === "string") return e.resourceId;
  if (typeof metadata.pathname === "string") return metadata.pathname;
  if (actionStr?.includes(":")) return actionStr.split(":")[1];
  return undefined;
}

type Severity = "INFO" | "WARN" | "ERROR" | "CRITICAL";

/**
 * Severity taxonomy — two separate axes:
 *  - "Audit importance": every impersonation is still recorded in full (isImpersonated flag + dual identity).
 *  - "Needs real-time human response": only genuine violations are CRITICAL (banner + webhook).
 * A routine, MFA-verified impersonation session is a legitimate support workflow → INFO.
 */
const CRITICAL_ACTION_KEYWORDS = [
  "STEPUP_FAILED",
  "UNAUTHORIZED",
  "TAMPER",
  "BREACH",
  "BRUTE_FORCE",
  "FORCE_REVOKED",
  "DESTRUCTIVE_PURGE",
];
const ROUTINE_IMPERSONATION_KEYWORDS = ["IMPERSONATION_STARTED", "IMPERSONATION_ENDED", "IMPERSONATION_SESSION"];
const WARN_ACTION_KEYWORDS = ["GLOBAL_SETTING", "API_KEY", "PASSWORD", "SECURITY_POLICY"];
const ERROR_ACTION_KEYWORDS = ["DEGRADED", "FAIL"];
const VALID_SEVERITIES: ReadonlySet<string> = new Set(["CRITICAL", "ERROR", "WARN", "INFO"]);

const containsAny = (value: string, keywords: readonly string[]): boolean =>
  keywords.some((k) => value.includes(k));

function readRawSeverity(metadata: Record<string, unknown>, e: Record<string, unknown>): string | undefined {
  const raw = metadata.severity ?? e.severity;
  return typeof raw === "string" ? raw.toUpperCase() : undefined;
}

function severityFromStatus(e: Record<string, unknown>, actionStr: string, status?: number): Severity {
  const httpStatus = typeof status === "number" ? status : 0;
  if (e.status === "FAILED" || httpStatus >= 500 || containsAny(actionStr, ERROR_ACTION_KEYWORDS)) return "ERROR";
  if (httpStatus >= 400) return "WARN";
  return "INFO";
}

export function resolveEntrySeverity(
  metadata: Record<string, unknown>,
  e: Record<string, unknown>,
  status?: number
): Severity {
  const actionStr = String(e.action ?? metadata.action ?? "").toUpperCase();

  // 1. Genuine security violations always win → CRITICAL
  if (containsAny(actionStr, CRITICAL_ACTION_KEYWORDS)) return "CRITICAL";

  // 2. Routine authorized impersonation → INFO, even if the producer tagged it CRITICAL
  if (actionStr === "IMPERSONATION" || containsAny(actionStr, ROUTINE_IMPERSONATION_KEYWORDS)) return "INFO";

  // 3. Sensitive config mutations → WARN
  if (containsAny(actionStr, WARN_ACTION_KEYWORDS)) return "WARN";

  // 4. Trust explicit producer severity
  const rawSeverity = readRawSeverity(metadata, e);
  if (rawSeverity && VALID_SEVERITIES.has(rawSeverity)) return rawSeverity as Severity;

  // 5. Derive from status
  return severityFromStatus(e, actionStr, status);
}

/** Keyword tables for synthetic / simulation / load-test telemetry detection. */
const SYNTHETIC_CATEGORIES: ReadonlySet<string> = new Set(["BENCHMARK", "SYNTHETIC", "STRESS_TEST"]);
const SYNTHETIC_ACTOR_KEYWORDS = ["benchmark", "synthetic"];
const SYNTHETIC_RESOURCE_KEYWORDS = ["flapping", "benchmark", "synthetic", "mock", "sim-"];
const SYNTHETIC_ACTION_KEYWORDS = ["benchmark", "stress", "synthetic"];

const isTruthyFlag = (v: unknown): boolean => v === true || v === "true";

const lowerStr = (...candidates: unknown[]): string => {
  const found = candidates.find((c) => typeof c === "string" && c.length > 0);
  return typeof found === "string" ? found.toLowerCase() : "";
};

/**
 * Multi-vector detection of synthetic / simulation / benchmark telemetry.
 * Priority: explicit `is_synthetic` flag set at the source (authoritative) → category → naming heuristics
 * (actor, resource e.g. `olt-flapping-01`, action). Heuristics are a safety net for legacy producers only.
 */
export function isSyntheticOrBenchmarkEntry(e: Record<string, unknown> | AuditStreamEntry): boolean {
  const rec = e as Record<string, unknown>;
  const metadata = (rec.metadata as Record<string, unknown>) ?? {};

  if (isTruthyFlag(metadata.is_synthetic) || isTruthyFlag(metadata.isSynthetic)) return true;

  const category = lowerStr(metadata.category, rec.category).toUpperCase();
  if (SYNTHETIC_CATEGORIES.has(category)) return true;

  const actor = lowerStr(rec.actor, rec.actorId, rec.username);
  const resource = `${lowerStr(rec.resourceId)} ${lowerStr(rec.targetResource)}`;
  const action = lowerStr(rec.action);

  return (
    containsAny(actor, SYNTHETIC_ACTOR_KEYWORDS) ||
    containsAny(resource, SYNTHETIC_RESOURCE_KEYWORDS) ||
    containsAny(action, SYNTHETIC_ACTION_KEYWORDS)
  );
}

export function resolveEntryImpersonation(metadata: Record<string, unknown>, e: Record<string, unknown>) {
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

export function resolveEntryScope(metadata: Record<string, unknown>, tenantSlug?: string) {
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

export function resolveEntryDiff(metadata: Record<string, unknown>, e: Record<string, unknown>) {
  const oldValue = (e.oldValue as Record<string, unknown>) ?? (metadata.oldValue as Record<string, unknown>) ?? null;
  const newValue = (e.newValue as Record<string, unknown>) ?? (metadata.newValue as Record<string, unknown>) ?? null;
  return { oldValue, newValue };
}

export function mapAuditEventToEntry(e: Record<string, unknown>): AuditStreamEntry {
  const metadata = (e.metadata as Record<string, unknown>) ?? {};
  const rawSource = String(metadata.serviceSource ?? e.serviceSource ?? "backend");
  const resourceType = typeof e.resourceType === "string" ? e.resourceType : typeof e._resourceType === "string" ? e._resourceType : undefined;
  const logType = String(metadata.logType ?? resolveLogTypeFromSource(rawSource, resourceType));
  const logGroup = resolveLogGroup(logType, resourceType, metadata);
  const actionStr = typeof e.action === "string" ? e.action : undefined;
  const method = resolveHttpMethod(typeof metadata.method === "string" ? metadata.method : undefined, actionStr);

  const errorMessage = typeof e.errorMessage === "string" ? e.errorMessage : undefined;
  const status = resolveAuditStatus(metadata, errorMessage, rawSource, e, actionStr);
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

export function mapSecurityAlertToEntry(e: Record<string, unknown>): AuditStreamEntry {
  const rawSev = typeof e.severity === "string" ? e.severity : "INFO";
  const severity: "INFO" | "WARN" | "ERROR" | "CRITICAL" =
    rawSev === "CRITICAL" || rawSev === "ERROR" || rawSev === "WARN" ? rawSev : "INFO";
  const status = severity === "CRITICAL" || severity === "ERROR" ? 500 : 400;
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
    status,
  };
}

export function mapKeycloakEventToEntry(e: Record<string, unknown>): AuditStreamEntry {
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

export function mapNotificationToEntry(m: Record<string, unknown>): AuditStreamEntry {
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

export function checkTimeRangeMatch(timestamp: string, timeRange: string, nowMs: number): boolean {
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

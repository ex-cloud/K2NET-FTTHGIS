import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { getLogsSourceIcon, getDetailedTime } from "@k2net/ui";
import {
  type AuditStreamEntry,
  resolveLogTypeFromSource,
} from "@/hooks/use-audit-log-stream";

export { getDetailedTime };

export function getSourceIcon(source: string, className?: string) {
  return getLogsSourceIcon(source, className);
}

function resolveLogTenant(log: AuditStreamEntry): string {
  if (log.tenantSlug) return log.tenantSlug;
  if (log.tenantName) return log.tenantName;
  if (log.scope === "SYSTEM_CORE" || log.scope === "SYSTEM") return "system";
  return "global";
}

function resolveLogMethod(log: AuditStreamEntry): string {
  const m = log.method || (log.metadata?.method as string) || "RPC";
  return m.toUpperCase();
}

function resolveLogStatus(log: AuditStreamEntry): string {
  if (log.status !== undefined && log.status !== null) return String(log.status);
  if (log.metadata?.status) return String(log.metadata.status);
  if (log.metadata?.statusCode) return String(log.metadata.statusCode);
  return "200";
}

function resolveLogIp(log: AuditStreamEntry): string {
  if (log.ip) return log.ip;
  if (log.metadata?.ip) return String(log.metadata.ip);
  if (log.metadata?.client_ip) return String(log.metadata.client_ip);
  return "127.0.0.1";
}

function resolveLogTraceId(log: AuditStreamEntry): string {
  if (log.traceId) return log.traceId;
  if (log.requestId) return log.requestId;
  if (log.metadata?.traceId) return String(log.metadata.traceId);
  if (log.id) return `req-${log.id.slice(0, 8)}`;
  return "req-trace";
}

function resolveLogPathname(log: AuditStreamEntry): string {
  if (log.pathname) return log.pathname;
  if (log.targetResource) return log.targetResource;
  if (log.metadata?.pathname) return String(log.metadata.pathname);
  if (log.metadata?.path) return String(log.metadata.path);
  if (log.action) return `/${log.action.toLowerCase().replace(/_/g, "/")}`;
  return "/";
}

function resolveLogHost(log: AuditStreamEntry): string {
  if (log.metadata?.["context.host"]) return String(log.metadata["context.host"]);
  if (log.metadata?.host) return String(log.metadata.host);
  if (typeof window !== "undefined") return window.location.hostname;
  return "system.gis.kdua.net";
}

function resolveLogResponseTime(log: AuditStreamEntry): string {
  const m = log.metadata;
  if (m?.latencyMs !== undefined) return String(m.latencyMs);
  if (m?.responseTimeMs !== undefined) return String(m.responseTimeMs);
  if (m?.executionTimeMs !== undefined) return String(m.executionTimeMs);
  if (m?.mean_time_ms !== undefined) return String(m.mean_time_ms);
  return "2";
}

function resolveLogUserAgent(log: AuditStreamEntry): string {
  const custom = log.metadata?.userAgent || log.metadata?.user_agent || log.metadata?.client;
  if (custom) return String(custom);
  if (log.actor && log.actor !== "system") return `@${log.actor}`;
  return "@k2net-system/v1.0";
}

export function getEventMessageDisplay(log: AuditStreamEntry): string {
  const tenant = resolveLogTenant(log);
  const method = resolveLogMethod(log);
  const status = resolveLogStatus(log);
  const ip = resolveLogIp(log);
  const traceId = resolveLogTraceId(log);
  const pathname = resolveLogPathname(log);
  const userAgent = resolveLogUserAgent(log);

  return `${tenant} | ${method} | ${status} | ${ip} | ${traceId} | ${pathname} | ${userAgent}`;
}

interface ParsedLogContext {
  tenant: string;
  method: string;
  statusCode: string;
  ip: string;
  traceId: string;
  pathname: string;
  userAgent: string;
  host: string;
  responseTime: string;
}

function extractLogContext(log: AuditStreamEntry): ParsedLogContext {
  return {
    tenant: resolveLogTenant(log),
    method: resolveLogMethod(log),
    statusCode: resolveLogStatus(log),
    ip: resolveLogIp(log),
    traceId: resolveLogTraceId(log),
    pathname: resolveLogPathname(log),
    userAgent: resolveLogUserAgent(log),
    host: resolveLogHost(log),
    responseTime: resolveLogResponseTime(log),
  };
}

function buildLogAttributes(log: AuditStreamEntry, ctx: ParsedLogContext): Record<string, unknown> {
  const metadata = log.metadata || {};
  return {
    "context.type": (metadata["context.type"] as string) || "request",
    "context.host": metadata["context.host"] || metadata.host || ctx.host,
    "context.pid": metadata["context.pid"] || metadata.pid,
    appVersion: metadata.appVersion || metadata.version,
    region: metadata.region || metadata.cf_region,
    executionTime: ctx.responseTime,
    level: (log.severity || "INFO").toLowerCase(),
    project: log.projectId || log.projectName || ctx.tenant,
    tenantId: ctx.tenant,
    "req.method": ctx.method,
    "req.url": ctx.pathname,
    "req.traceId": ctx.traceId,
    "req.remoteAddress": ctx.ip,
    "req.hostname": ctx.host,
    "req.headers.host": ctx.host,
    "req.headers.user_agent": ctx.userAgent,
    "req.headers.cf_ray": metadata.cf_ray || metadata.cfRay,
    "req.headers.cf_ipcountry": metadata.client_country || metadata.cf_country,
    "res.statusCode": ctx.statusCode,
    responseTime: ctx.responseTime,
    resources: JSON.stringify([ctx.pathname]),
    ...metadata,
  };
}

function extractEdgeAttributes(metadata: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    cf_ray: metadata.cf_ray || metadata.cfRay || null,
    client_country: metadata.client_country || metadata.cf_country || null,
    client_city: metadata.client_city || null,
    client_region: metadata.client_region || metadata.cf_region || null,
    client_timezone: metadata.client_timezone || null,
  };
}

function extractComputeAttributes(metadata: Record<string, unknown> = {}, fallbackHost: string): Record<string, unknown> {
  return {
    region: metadata.region || metadata.cf_region || null,
    context_host: metadata["context.host"] || metadata.host || fallbackHost,
    context_pid: metadata["context.pid"] || metadata.pid || null,
    app_version: metadata.appVersion || metadata.version || null,
  };
}

function extractDatabaseAttributes(metadata: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    database_name: metadata.database_name || metadata.databaseName || metadata.dbName || null,
    query_id: metadata.query_id || metadata.queryId || null,
    sql_state_code: metadata.sql_state_code || metadata.sqlStateCode || null,
    query: metadata.query || null,
    mean_time_ms: metadata.mean_time_ms || metadata.meanTimeMs || null,
  };
}

function extractImpersonationAttributes(log: AuditStreamEntry): Record<string, unknown> {
  return {
    is_impersonated: log.isImpersonated ?? false,
    real_actor_id: log.realActorId || null,
    session_id: log.impersonationSessionId || null,
    old_value: log.oldValue || null,
    new_value: log.newValue || null,
  };
}

export function formatSupabaseLogPayload(log: AuditStreamEntry): Record<string, unknown> {
  const eventMessage = getEventMessageDisplay(log);
  const metadata = log.metadata || {};
  const ctx = extractLogContext(log);
  const logAttributes = buildLogAttributes(log, ctx);

  return {
    id: log.id,
    timestamp: log.timestamp,
    event_message: eventMessage,
    service_name: log.serviceSource || "ftth-backend",
    tenantId: ctx.tenant,
    project: log.projectId || log.projectName || ctx.tenant,
    level: (log.severity || "INFO").toLowerCase(),
    host: ctx.host,
    method: ctx.method,
    path: ctx.pathname,
    status_code: ctx.statusCode,
    client_ip: ctx.ip,
    headers_user_agent: ctx.userAgent,
    reqId: ctx.traceId,
    executionTime: ctx.responseTime,
    responseTime: ctx.responseTime,
    scope: log.scope || "SYSTEM_CORE",
    actor_id: log.actor,
    action: log.action,
    resource_type: log._resourceType || null,
    resource_id: log.resourceId || null,
    ...extractImpersonationAttributes(log),
    ...extractEdgeAttributes(metadata),
    ...extractComputeAttributes(metadata, ctx.host),
    ...extractDatabaseAttributes(metadata),
    metadata,
    raw_log_data: {
      id: log.id,
      timestamp: log.timestamp,
      source: log.serviceSource || "ftth-backend",
      severity_text: log.severity,
      event_message: eventMessage,
      log_attributes: logAttributes,
    },
  };
}

export function getLevel(log: AuditStreamEntry): "error" | "warning" | "success" {
  const s = log.severity?.toUpperCase();
  if (s === "ERROR" || s === "CRITICAL") return "error";
  if (s === "WARN" || s === "WARNING") return "warning";
  return "success";
}

const columnHelper = createColumnHelper<AuditStreamEntry>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const LOG_COLUMNS: ColumnDef<AuditStreamEntry, any>[] = [
  columnHelper.accessor("timestamp", {
    id: "date",
    meta: { label: "Timestamp" },
    enableHiding: true,
  }),
  columnHelper.accessor("serviceSource", {
    id: "source",
    meta: { label: "Src" },
    enableHiding: true,
  }),
  columnHelper.accessor("status", {
    id: "status",
    meta: { label: "Status" },
    enableHiding: true,
  }),
  columnHelper.accessor("method", {
    id: "method",
    meta: { label: "Method" },
    enableHiding: true,
  }),
  columnHelper.accessor("pathname", {
    id: "pathname",
    meta: { label: "Pathname" },
    enableHiding: true,
  }),
  columnHelper.accessor("message", {
    id: "message",
    meta: { label: "Event Message" },
    enableHiding: true,
  }),
];

const FIELD_EXTRACTORS: Record<string, (log: AuditStreamEntry) => string> = {
  logType: (log) => log.logType || resolveLogTypeFromSource(log.serviceSource || "", log.targetResource),
  level: (log) => getLevel(log),
  severity: (log) => (log.severity || "INFO").toUpperCase(),
  logGroup: (log) => log.logGroup || "",
  scope: (log) => (log.scope || "ALL").toUpperCase(),
  projectId: (log) => log.projectId || log.projectName || "",
  tenantSlug: (log) => log.tenantSlug || log.tenantName || log.impersonatedTenantId || "",
  pathname: (log) =>
    log.pathname ||
    log.targetResource ||
    String(log.metadata?.pathname || log.metadata?.path || log.metadata?.uri || log.metadata?.url || ""),
  message: (log) => `${log.message || ""} ${log.action || ""}`.trim(),
  actor: (log) => log.actor || log.realActorId || String(log.metadata?.actor || log.metadata?.user || ""),
  serviceSource: (log) => log.serviceSource || String(log.metadata?.source || ""),
  method: (log) => (log.method || String(log.metadata?.method || "")).toUpperCase(),
  status: (log) => {
    if (log.status !== undefined && log.status !== null) return String(log.status);
    if (log.metadata?.status !== undefined) return String(log.metadata.status);
    if (log.metadata?.statusCode !== undefined) return String(log.metadata.statusCode);
    return "";
  },
  ip: (log) => log.ip || String(log.metadata?.ip || log.metadata?.client_ip || ""),
  cf_ray: (log) => String(log.metadata?.cf_ray || log.metadata?.cfRay || ""),
  client_country: (log) => String(log.metadata?.client_country || log.metadata?.cf_country || ""),
  client_city: (log) => String(log.metadata?.client_city || ""),
  region: (log) => String(log.metadata?.region || log.metadata?.cf_region || ""),
  "context.host": (log) => String(log.metadata?.["context.host"] || log.metadata?.host || ""),
  "context.pid": (log) => String(log.metadata?.["context.pid"] || log.metadata?.pid || ""),
  database_name: (log) => String(log.metadata?.database_name || log.metadata?.databaseName || log.metadata?.dbName || ""),
  query_id: (log) => String(log.metadata?.query_id || log.metadata?.queryId || ""),
  sql_state_code: (log) => String(log.metadata?.sql_state_code || log.metadata?.sqlStateCode || ""),
};

export function extractFieldValue(log: AuditStreamEntry, field: string): string {
  if (!log) return "";
  const extractor = FIELD_EXTRACTORS[field];
  if (extractor) return extractor(log);
  
  const topVal = (log as unknown as Record<string, unknown>)[field];
  if (topVal !== undefined && topVal !== null) return String(topVal);

  const metaVal = log.metadata?.[field];
  if (metaVal !== undefined && metaVal !== null) return String(metaVal);

  return "";
}

function compareNumeric(numVal: number, numTarget: number, op: string): boolean {
  if (op === "eq") return numVal === numTarget;
  if (op === "neq") return numVal !== numTarget;
  if (op === "gte") return numVal >= numTarget;
  if (op === "lte") return numVal <= numTarget;
  if (op === "gt") return numVal > numTarget;
  if (op === "lt") return numVal < numTarget;
  return false;
}

function comparePattern(raw: string, val: string, target: string, op: string): boolean {
  if (op === "ilike" || op === "contains") return val.includes(target);
  if (op === "not_ilike" || op === "not_contains") return !val.includes(target);
  if (op === "starts_with") return val.startsWith(target);
  if (op === "ends_with") return val.endsWith(target);
  if (op === "regex") {
    try {
      return new RegExp(target, "i").test(raw);
    } catch {
      return val.includes(target);
    }
  }
  return true;
}

function compareSet(val: string, target: string, isNumeric: boolean, numVal: number, op: string): boolean {
  const list = target
    .split(/[,|\s]+/)
    .map((s) => s.trim().replace(/^['"(]|['")]$/g, "").toLowerCase())
    .filter(Boolean);
  const found = list.includes(val) || (isNumeric && list.some((item) => parseFloat(item) === numVal));
  return op === "in" ? found : !found;
}

export function checkAdvancedFilter(
  log: AuditStreamEntry,
  field: string,
  operator: string,
  filterValue: string
): boolean {
  const raw = extractFieldValue(log, field);
  const val = raw.toLowerCase().trim();
  const target = filterValue.toLowerCase().trim();

  const numVal = parseFloat(val);
  const numTarget = parseFloat(target);
  const isBothNumeric = !isNaN(numVal) && !isNaN(numTarget) && !val.includes(" ") && !target.includes(" ");

  if (operator === "in" || operator === "not_in") {
    return compareSet(val, target, isBothNumeric, numVal, operator);
  }

  if (isBothNumeric && ["eq", "neq", "gte", "lte", "gt", "lt"].includes(operator)) {
    return compareNumeric(numVal, numTarget, operator);
  }

  if (operator === "eq") return val === target;
  if (operator === "neq") return val !== target;

  return comparePattern(raw, val, target, operator);
}

export interface FilterAuditLogsOptions {
  searchQuery?: string;
  tenantFilter?: string;
  selectedLevels?: Record<string, boolean>;
  selectedSeverities?: Record<string, boolean>;
  selectedMethods?: Record<string, boolean>;
  pathnameFilter?: string;
  impersonationOnly?: boolean;
  scopeFilter?: string;
  projectFilter?: string;
  advancedFilters?: Array<{ field: string; operator: string; value: string }>;
}

function matchesTenant(log: AuditStreamEntry, tenantFilter?: string): boolean {
  if (!tenantFilter || !tenantFilter.trim()) return true;
  const tf = tenantFilter.toLowerCase().trim();
  const values = [
    log?.tenantSlug,
    log?.tenantName,
    log?.projectId,
    log?.projectName,
    log?.targetResource,
  ];
  return values.some((v) => typeof v === "string" && v.toLowerCase().includes(tf));
}

function matchesScope(log: AuditStreamEntry, scopeFilter?: string): boolean {
  if (!scopeFilter || scopeFilter === "ALL") return true;
  return (log?.scope ?? "").toUpperCase() === scopeFilter.toUpperCase();
}

function matchesProject(log: AuditStreamEntry, projectFilter?: string): boolean {
  if (!projectFilter || !projectFilter.trim()) return true;
  const pf = projectFilter.toLowerCase().trim();
  return (
    (log?.projectId ?? "").toLowerCase().includes(pf) ||
    (log?.projectName ?? "").toLowerCase().includes(pf)
  );
}

function matchesImpersonation(log: AuditStreamEntry, impersonationOnly?: boolean): boolean {
  if (!impersonationOnly) return true;
  return Boolean(log?.isImpersonated || log?.realActorId);
}

function matchesSeverity(log: AuditStreamEntry, selectedSeverities?: Record<string, boolean>): boolean {
  if (!selectedSeverities) return true;
  const anySeverityActive = Object.values(selectedSeverities).some(Boolean);
  if (!anySeverityActive) return true;
  const sev = (log.severity || "INFO").toUpperCase();
  return Boolean(selectedSeverities[sev]);
}

function matchesMethod(log: AuditStreamEntry, selectedMethods?: Record<string, boolean>): boolean {
  if (!selectedMethods) return true;
  const anyMethodActive = Object.values(selectedMethods).some(Boolean);
  if (!anyMethodActive) return true;
  const m = (log.method || String(log.metadata?.method || "")).toUpperCase();
  return Boolean(selectedMethods[m]);
}

function matchesPathname(log: AuditStreamEntry, pathnameFilter?: string): boolean {
  if (!pathnameFilter || !pathnameFilter.trim()) return true;
  const pf = pathnameFilter.toLowerCase().trim();
  const p = (
    log.pathname ||
    log.targetResource ||
    String(log.metadata?.pathname || log.metadata?.path || log.metadata?.uri || log.metadata?.url || "")
  ).toLowerCase();
  return p.includes(pf);
}

function matchesSearch(log: AuditStreamEntry, searchQuery?: string): boolean {
  if (!searchQuery || !searchQuery.trim()) return true;
  const q = searchQuery.toLowerCase().trim();
  const values = [
    log?.message,
    log?.action,
    log?.actor,
    log?.timestamp,
    log?.tenantSlug,
    log?.serviceSource,
    log?.realActorId,
    log?.projectId,
    log?.projectName,
  ];
  return values.some((v) => typeof v === "string" && v.toLowerCase().includes(q));
}

function matchesLevel(log: AuditStreamEntry, selectedLevels?: Record<string, boolean>): boolean {
  if (!selectedLevels) return true;
  const anyLevelActive = Object.values(selectedLevels).some(Boolean);
  if (!anyLevelActive) return true;
  const level = getLevel(log);
  return Boolean(selectedLevels[level]);
}

export function filterAuditLogs(
  logs: AuditStreamEntry[] = [],
  searchQuery: string = "",
  tenantFilter: string = "",
  selectedLevels: Record<string, boolean> = {},
  advancedFilters: Array<{ field: string; operator: string; value: string }> = [],
  options?: {
    selectedSeverities?: Record<string, boolean>;
    selectedMethods?: Record<string, boolean>;
    pathnameFilter?: string;
    impersonationOnly?: boolean;
    scopeFilter?: string;
    projectFilter?: string;
  }
): AuditStreamEntry[] {
  const baseLogs = Array.isArray(logs) ? logs : [];
  if (baseLogs.length === 0) return [];

  return baseLogs.filter((log) => {
    if (!matchesTenant(log, tenantFilter)) return false;
    if (!matchesScope(log, options?.scopeFilter)) return false;
    if (!matchesProject(log, options?.projectFilter)) return false;
    if (!matchesImpersonation(log, options?.impersonationOnly)) return false;
    if (!matchesSeverity(log, options?.selectedSeverities)) return false;
    if (!matchesMethod(log, options?.selectedMethods)) return false;
    if (!matchesPathname(log, options?.pathnameFilter)) return false;
    if (!matchesSearch(log, searchQuery)) return false;
    if (!matchesLevel(log, selectedLevels)) return false;

    for (const f of advancedFilters) {
      if (!checkAdvancedFilter(log, f.field, f.operator, f.value)) {
        return false;
      }
    }

    return true;
  });
}

function buildLogCsvRow(log: AuditStreamEntry, escapeCsv: (val: unknown) => string): string[] {
  const m = log.metadata || {};
  return [
    escapeCsv(log.timestamp),
    escapeCsv(log.severity),
    escapeCsv(log.logGroup),
    escapeCsv(log.serviceSource),
    escapeCsv(log.tenantSlug ?? ""),
    escapeCsv(log.scope ?? ""),
    escapeCsv(log.projectId ?? ""),
    escapeCsv(log.projectName ?? ""),
    escapeCsv(log.actor),
    escapeCsv(log.isImpersonated ? "YES" : "NO"),
    escapeCsv(log.realActorId ?? ""),
    escapeCsv(log.impersonationSessionId ?? ""),
    escapeCsv(log.action),
    escapeCsv(log.status ?? ""),
    escapeCsv(log.method ?? ""),
    escapeCsv(log.pathname ?? ""),
    escapeCsv(log.ip ?? ""),
    escapeCsv(m.cf_ray || m.cfRay || ""),
    escapeCsv(m.client_country || m.cf_country || ""),
    escapeCsv(m.region || m.client_region || ""),
    escapeCsv(m["context.host"] || m.host || ""),
    escapeCsv(log.message),
  ];
}

/**
 * RFC-4180 Compliant CSV Export Streamer
 * Properly handles quotes, commas, CRLF newlines and multi-tenant audit properties
 */
export function exportLogsToCsv(logs: AuditStreamEntry[], filename?: string): void {
  const escapeCsv = (val: unknown): string => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes("\n") || str.includes("\r") || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = [
    "Timestamp",
    "Severity",
    "LogGroup",
    "Source",
    "Tenant",
    "Scope",
    "ProjectId",
    "ProjectName",
    "Actor",
    "IsImpersonated",
    "RealActorId",
    "SessionId",
    "Action",
    "Status",
    "Method",
    "Pathname",
    "IP",
    "TraceRayId",
    "Country",
    "Region",
    "Host",
    "Message",
  ];

  const rows = logs.map((log) => buildLogCsvRow(log, escapeCsv));

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename || `k2net-audit-logs-${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


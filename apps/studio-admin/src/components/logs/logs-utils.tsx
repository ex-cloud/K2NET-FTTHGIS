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

export function getEventMessageDisplay(log: AuditStreamEntry): string {
  if (log.message && log.message.trim()) {
    return log.message;
  }
  if (log.action && log.action.trim()) {
    return log.action.replace(/_/g, " ");
  }
  return "Audit Event Recorded";
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
};

export function extractFieldValue(log: AuditStreamEntry, field: string): string {
  if (!log) return "";
  const extractor = FIELD_EXTRACTORS[field];
  if (extractor) return extractor(log);
  return String((log as unknown as Record<string, unknown>)[field] ?? "");
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
    "Message",
  ];

  const rows = logs.map((log) => [
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
    escapeCsv(log.message),
  ]);

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


import React from "react";
import {
  Globe,
  Shield,
  Send,
  Database,
  Server,
  Cpu,
  Sparkles,
  FolderKanban,
  MapPin,
  Radio,
  Wifi,
  CreditCard,
  HardDrive,
  FileOutput,
  CalendarClock,
  Map,
} from "lucide-react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import {
  type AuditStreamEntry,
  resolveLogTypeFromSource,
} from "@/hooks/use-audit-log-stream";

interface SourceIconMatcher {
  match: (src: string) => boolean;
  IconComponent: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const SOURCE_ICON_MATCHERS: SourceIconMatcher[] = [
  { match: (s) => s.includes("ai") || s.includes("rag"), IconComponent: Sparkles },
  { match: (s) => s.includes("task") || s.includes("obsidian"), IconComponent: FolderKanban },
  { match: (s) => s.includes("martin") || s.includes("tile"), IconComponent: MapPin },
  { match: (s) => s.includes("poller"), IconComponent: Radio },
  { match: (s) => s.includes("olt"), IconComponent: Wifi },
  { match: (s) => s.includes("map"), IconComponent: Map },
  { match: (s) => s.includes("payment"), IconComponent: CreditCard },
  { match: (s) => s.includes("storage") || s.includes("minio"), IconComponent: HardDrive },
  { match: (s) => s.includes("export"), IconComponent: FileOutput },
  { match: (s) => s.includes("scheduler"), IconComponent: CalendarClock },
  { match: (s) => s.includes("kong") || s.includes("edge") || s.includes("traefik"), IconComponent: Globe },
  { match: (s) => s.includes("keycloak") || s.includes("auth"), IconComponent: Shield },
  { match: (s) => s.includes("notification") || s.includes("whatsapp") || s.includes("sms"), IconComponent: Send },
  { match: (s) => s.includes("db") || s.includes("postgres") || s.includes("redis"), IconComponent: Database },
  { match: (s) => s.includes("backend"), IconComponent: Server },
];

export function getSourceIcon(source: string, className?: string) {
  const src = source.toLowerCase();
  const matched = SOURCE_ICON_MATCHERS.find((m) => m.match(src));
  const IconComp = matched ? matched.IconComponent : Cpu;
  return (
    <IconComp
      className={className || "w-2.5 h-2.5 text-muted-foreground/60 shrink-0"}
      strokeWidth={1.5}
    />
  );
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

export function getDetailedTime(timestampStr: string) {
  const d = new Date(timestampStr);
  if (isNaN(d.getTime())) {
    return { utc: "—", local: "—", tzName: "Local", relative: "—", timestamp: "—" };
  }

  const utcFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
  const utcStr = utcFormatter.format(d).replace(",", "");

  const localFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const localStr = localFormatter.format(d).replace(",", "");

  let tzName = "Local";
  try {
    tzName = Intl.DateTimeFormat().resolvedOptions().timeZone || "Local";
  } catch {
    // ignore
  }

  let relativeStr = "";
  const diffMs = Date.now() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 5) {
    relativeStr = "just now";
  } else if (diffSecs < 60) {
    relativeStr = `${diffSecs} seconds ago`;
  } else if (diffMins < 60) {
    relativeStr = `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  } else if (diffHours < 24) {
    relativeStr = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  } else {
    relativeStr = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  }

  return {
    utc: utcStr,
    local: localStr,
    tzName,
    relative: relativeStr,
    timestamp: String(d.getTime()),
  };
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
  columnHelper.accessor("severity", {
    id: "severity",
    meta: { label: "Severity" },
    enableHiding: true,
  }),
  columnHelper.accessor("logGroup", {
    id: "group",
    meta: { label: "Group" },
    enableHiding: true,
  }),
  columnHelper.accessor("status", {
    id: "status",
    meta: { label: "Status" },
    enableHiding: true,
  }),
  columnHelper.accessor("tenantSlug", {
    id: "tenant",
    meta: { label: "Tenant" },
    enableHiding: true,
  }),
  columnHelper.accessor("scope", {
    id: "scope",
    meta: { label: "Scope" },
    enableHiding: true,
  }),
  columnHelper.accessor("projectId", {
    id: "project",
    meta: { label: "Project" },
    enableHiding: true,
  }),
  columnHelper.accessor("method", {
    id: "method",
    meta: { label: "Method" },
    enableHiding: true,
  }),
  columnHelper.accessor("pathname", {
    id: "pathname",
    meta: { label: "Path / Resource" },
    enableHiding: true,
  }),
  columnHelper.accessor("message", {
    id: "message",
    meta: { label: "Event Message & Actor" },
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
  impersonationOnly?: boolean;
  scopeFilter?: string;
  projectFilter?: string;
  advancedFilters?: Array<{ field: string; operator: string; value: string }>;
}

export function filterAuditLogs(
  logs: AuditStreamEntry[] = [],
  searchQuery: string = "",
  tenantFilter: string = "",
  selectedLevels: Record<string, boolean> = {},
  advancedFilters: Array<{ field: string; operator: string; value: string }> = [],
  options?: {
    selectedSeverities?: Record<string, boolean>;
    impersonationOnly?: boolean;
    scopeFilter?: string;
    projectFilter?: string;
  }
): AuditStreamEntry[] {
  let result = Array.isArray(logs) ? logs : [];

  if (tenantFilter && tenantFilter.trim()) {
    const tf = tenantFilter.toLowerCase().trim();
    result = result.filter(
      (log) =>
        (log?.tenantSlug ?? "").toLowerCase().includes(tf) ||
        (log?.tenantName ?? "").toLowerCase().includes(tf) ||
        (log?.projectId ?? "").toLowerCase().includes(tf) ||
        (log?.projectName ?? "").toLowerCase().includes(tf) ||
        (log?.targetResource ?? "").toLowerCase().includes(tf)
    );
  }

  if (options?.scopeFilter && options.scopeFilter !== "ALL") {
    const targetScope = options.scopeFilter.toUpperCase();
    result = result.filter((log) => (log?.scope ?? "").toUpperCase() === targetScope);
  }

  if (options?.projectFilter && options.projectFilter.trim()) {
    const pf = options.projectFilter.toLowerCase().trim();
    result = result.filter(
      (log) =>
        (log?.projectId ?? "").toLowerCase().includes(pf) ||
        (log?.projectName ?? "").toLowerCase().includes(pf)
    );
  }

  if (options?.impersonationOnly) {
    result = result.filter((log) => Boolean(log?.isImpersonated || log?.realActorId));
  }

  if (options?.selectedSeverities) {
    const anySeverityActive = Object.values(options.selectedSeverities).some(Boolean);
    if (anySeverityActive) {
      result = result.filter((log) => {
        const sev = (log.severity || "INFO").toUpperCase();
        return Boolean(options.selectedSeverities?.[sev]);
      });
    }
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter(
      (log) =>
        log.message?.toLowerCase().includes(q) ||
        log.action?.toLowerCase().includes(q) ||
        log.actor?.toLowerCase().includes(q) ||
        log.timestamp?.toLowerCase().includes(q) ||
        log.tenantSlug?.toLowerCase().includes(q) ||
        log.serviceSource?.toLowerCase().includes(q) ||
        log.realActorId?.toLowerCase().includes(q) ||
        log.projectId?.toLowerCase().includes(q) ||
        log.projectName?.toLowerCase().includes(q)
    );
  }

  if (selectedLevels) {
    const anyLevelActive = Object.values(selectedLevels).some(Boolean);
    if (anyLevelActive) {
      result = result.filter((log) => {
        const level = getLevel(log);
        return Boolean(selectedLevels[level]);
      });
    }
  }

  for (const f of advancedFilters) {
    result = result.filter((log) => checkAdvancedFilter(log, f.field, f.operator, f.value));
  }

  return result;
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


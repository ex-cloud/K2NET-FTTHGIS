import React from "react";
import { Globe, Shield, Send, Database, Server, Cpu } from "lucide-react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { AuditStreamEntry } from "@/hooks/use-audit-log-stream";

export function getSourceIcon(source: string) {
  const src = source.toLowerCase();
  if (src.includes("kong") || src.includes("edge")) {
    return <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
  }
  if (src.includes("keycloak") || src.includes("auth")) {
    return <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
  }
  if (src.includes("notification") || src.includes("whatsapp") || src.includes("sms")) {
    return <Send className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
  }
  if (src.includes("db") || src.includes("postgres")) {
    return <Database className="w-3.5 h-3.5 text-primary/80 shrink-0" />;
  }
  if (src.includes("backend")) {
    return <Server className="w-3.5 h-3.5 text-violet-400 shrink-0" />;
  }
  return <Cpu className="w-3.5 h-3.5 text-muted-foreground shrink-0" />;
}

export function getEventMessageDisplay(log: AuditStreamEntry): string {
  const parts: (string | undefined | null)[] = [
    log.actor !== "system" ? log.actor : null,
    log.ip ? `IP:${log.ip}` : null,
    log.message ?? null,
  ];
  return parts.filter(Boolean).join(" | ");
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
    meta: { label: "Date" },
    enableHiding: true,
  }),
  columnHelper.accessor("serviceSource", {
    id: "source",
    meta: { label: "Source" },
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

function checkAdvancedFilter(
  log: AuditStreamEntry,
  field: string,
  operator: string,
  filterValue: string
): boolean {
  let raw = "";
  if (field === "logType") {
    raw = log.logType;
  } else if (field === "level") {
    raw = getLevel(log);
  } else {
    raw = String(log[field as keyof AuditStreamEntry] ?? "");
  }
  const val = raw.toLowerCase();
  const target = filterValue.toLowerCase();

  switch (operator) {
    case "eq": return val === target;
    case "neq": return val !== target;
    case "contains": return val.includes(target);
    case "not_contains": return !val.includes(target);
    case "starts_with": return val.startsWith(target);
    case "ends_with": return val.endsWith(target);
    default: return true;
  }
}

export function filterAuditLogs(
  logs: AuditStreamEntry[],
  searchQuery: string,
  tenantFilter: string,
  selectedLevels: Record<string, boolean>,
  advancedFilters: Array<{ field: string; operator: string; value: string }>
): AuditStreamEntry[] {
  let result = logs;

  if (tenantFilter.trim()) {
    const tf = tenantFilter.toLowerCase().trim();
    result = result.filter((log) => (log.tenantSlug ?? "").toLowerCase().includes(tf));
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
        log.serviceSource?.toLowerCase().includes(q)
    );
  }

  const allLevelsActive = Object.values(selectedLevels).every(Boolean);
  if (!allLevelsActive) {
    result = result.filter((log) => {
      const level = getLevel(log);
      return Boolean(selectedLevels[level]);
    });
  }

  for (const f of advancedFilters) {
    result = result.filter((log) => checkAdvancedFilter(log, f.field, f.operator, f.value));
  }

  return result;
}

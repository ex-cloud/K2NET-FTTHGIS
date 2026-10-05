import type { AuditStreamEntry, LogGroupKey } from "@/hooks/use-audit-log-stream";
import type { InvestigationPreset } from "./logs-presets-types";

// ─── Advanced Filter Types ─────────────────────────────────────────────────────

export type AdvancedFilterField =
  | "timeRange"
  | "status"
  | "method"
  | "pathname"
  | "actor"
  | "message"
  | "tenantSlug"
  | "serviceSource"
  | "logType"
  | "level"
  | "severity"
  | "scope"
  | "projectId";

export type AdvancedFilterOperator =
  | "eq"
  | "neq"
  | "ilike"
  | "not_ilike"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "regex"
  | "gte"
  | "lte"
  | "gt"
  | "lt"
  | "in"
  | "not_in";

export type AdvancedFilter = {
  id: string;
  field: AdvancedFilterField;
  operator: AdvancedFilterOperator;
  value: string;
};

export const FILTER_FIELD_LABELS: Record<AdvancedFilterField, string> = {
  timeRange:     "Time Range",
  status:        "Status",
  method:        "Method",
  pathname:      "Pathname",
  actor:         "Actor",
  message:       "Event message",
  tenantSlug:    "Tenant",
  serviceSource: "Source",
  logType:       "Log Type",
  level:         "Level",
  severity:      "Severity",
  scope:         "Scope",
  projectId:     "Project ID",
};

export const FILTER_OPERATOR_LABELS: Record<AdvancedFilterOperator, string> = {
  eq:           "Equals",
  neq:          "Not equal",
  ilike:        "ILike",
  not_ilike:    "Not ILike",
  contains:     "Contains",
  not_contains: "Not contains",
  starts_with:  "Starts with",
  ends_with:    "Ends with",
  regex:        "Matches Regex",
  gte:          "Greater than or equal",
  lte:          "Less than or equal",
  gt:           "Greater than",
  lt:           "Less than",
  in:           "In list",
  not_in:       "Not in list",
};

export const OPERATOR_SYMBOLS: Record<AdvancedFilterOperator, string> = {
  eq:           "=",
  neq:          "<>",
  ilike:        "~*",
  not_ilike:    "!~*",
  contains:     "~",
  not_contains: "!~",
  starts_with:  "^=",
  ends_with:    "$=",
  regex:        "~",
  gte:          ">=",
  lte:          "<=",
  gt:           ">",
  lt:           "<",
  in:           "IN",
  not_in:       "NOT IN",
};

// ─── Log Type Definitions ─────────────────────────────────────────────────────

export const LOG_TYPES_LABELS: Record<string, string> = {
  // CORE GROUP
  edge:         "API Gateway (Kong)",
  auth:         "Auth & IAM (Keycloak)",
  postgres:     "Postgres & PostGIS",
  redis:        "Redis Queue & Cache",
  traefik:      "Traefik Edge Proxy",
  // OPERATIONS GROUP
  ai:           "AI Copilot (RAG)",
  task:         "Task & Project Sync",
  audit:        "Audit Trail",
  notification: "Notification Gateway",
  scheduler:    "Scheduler & Backup",
  storage:      "Storage Gateway (S3)",
  export:       "Export Gateway",
  payment:      "Payment Gateway",
  // NETWORK GROUP
  olt:          "OLT Gateway",
  poller:       "OLT Poller (SNMP)",
  map:          "Map Gateway",
  martin:       "Martin Tile Server",
  // MESSAGING GROUP
  whatsapp:     "WhatsApp Gateway",
};

export const DEFAULT_SELECTED_TYPES: Record<string, boolean> = {};
export const DEFAULT_SELECTED_GROUPS: Record<LogGroupKey, boolean> = {} as Record<LogGroupKey, boolean>;
export const DEFAULT_SELECTED_SEVERITIES: Record<string, boolean> = {};
export const DEFAULT_SELECTED_METHODS: Record<string, boolean> = {};
export const DEFAULT_EDGE_SUB_FILTERS: Record<string, boolean> = {};

// ─── Context State Type ───────────────────────────────────────────────────────

export type LogFilterState = {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  timeRange: string;
  setTimeRange: (val: string) => void;
  isLivePaused: boolean;
  setIsLivePaused: React.Dispatch<React.SetStateAction<boolean>>;
  showHistogram: boolean;
  setShowHistogram: React.Dispatch<React.SetStateAction<boolean>>;
  selectedTypes: Record<string, boolean>;
  toggleType: (key: string) => void;
  setLogType: (key: string, enabled: boolean) => void;
  /** Group-level toggle — enables/disables all types within a group */
  selectedGroups: Record<LogGroupKey, boolean>;
  toggleGroup: (key: LogGroupKey) => void;
  selectedLevels: Record<string, boolean>;
  toggleLevel: (key: string) => void;
  /** Severity filter map (CRITICAL, ERROR, WARN, INFO) */
  selectedSeverities: Record<string, boolean>;
  toggleSeverity: (key: string) => void;
  /** Method filter map (GET, POST, PUT, DELETE, PATCH, RPC) */
  selectedMethods: Record<string, boolean>;
  toggleMethod: (key: string) => void;
  /** Pathname filter string */
  pathnameFilter: string;
  setPathnameFilter: (val: string) => void;
  /** Scope filter: ALL, SYSTEM, ORGANIZATION, PROJECT */
  scopeFilter: string;
  setScopeFilter: (val: string) => void;
  /** Project ID / cluster filter */
  projectFilter: string;
  setProjectFilter: (val: string) => void;
  /** Nested sub-filter for edge (API Gateway) */
  edgeSubFilters: Record<string, boolean>;
  toggleEdgeSubFilter: (key: string) => void;
  selectedLog: AuditStreamEntry | null;
  setSelectedLog: (log: AuditStreamEntry | null) => void;
  resetAllFilters: () => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  logTypeCounts: Record<string, number>;
  setLogTypeCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  levelCounts: Record<string, number>;
  setLevelCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  severityCounts: Record<string, number>;
  setSeverityCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  methodCounts: Record<string, number>;
  setMethodCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  /** Advanced filter rules (field + operator + value) */
  advancedFilters: AdvancedFilter[];
  addAdvancedFilter: (f: AdvancedFilter) => void;
  removeAdvancedFilter: (id: string) => void;
  clearAdvancedFilters: () => void;
  /** tenantSlug filter — empty string = all tenants */
  tenantFilter: string;
  setTenantFilter: (slug: string) => void;
  /** includeBenchmark filter — false = filter out synthetic load-test data */
  includeBenchmark: boolean;
  setIncludeBenchmark: React.Dispatch<React.SetStateAction<boolean>>;

  /** Apply saved investigation preset */
  applyPreset: (preset: InvestigationPreset) => void;

  // Real-Time Log Stream Access & Keyset Cursor Pagination
  logs: AuditStreamEntry[];
  filteredLogs: AuditStreamEntry[];
  rawLogs: AuditStreamEntry[];
  timeFilteredLogs: AuditStreamEntry[];
  totalCount: number;
  clearLogs: () => void;
  streamStatus: "connecting" | "live" | "paused";
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
};

// ─── Initial URL Parameter Parser ─────────────────────────────────────────────

export function parseInitialFiltersFromLocation() {
  if (typeof window === "undefined") {
    return {
      types: {},
      levels: {},
      groups: {} as Record<LogGroupKey, boolean>,
      severities: {},
      methods: {},
      pathname: "",
      search: "",
      date: "60m",
      live: false,
      tenant: "",
      scope: "ALL",
      project: "",
      benchmark: false,
    };
  }

  const sp = new URLSearchParams(window.location.search);
  const filterParams = sp.getAll("filter");
  const types: Record<string, boolean> = {};
  const levels: Record<string, boolean> = {};
  const groups: Record<LogGroupKey, boolean> = {} as Record<LogGroupKey, boolean>;
  const severities: Record<string, boolean> = {};
  const methods: Record<string, boolean> = {};

  filterParams.forEach((f) => {
    if (f.startsWith("log_type:eq:")) {
      const key = f.replace("log_type:eq:", "");
      if (key && key !== "none") types[key] = true;
    }
    if (f.startsWith("level:eq:")) {
      const key = f.replace("level:eq:", "");
      if (key && key !== "none") levels[key] = true;
    }
    if (f.startsWith("group:eq:")) {
      const key = f.replace("group:eq:", "") as LogGroupKey;
      if (key) groups[key] = true;
    }
    if (f.startsWith("severity:eq:")) {
      const key = f.replace("severity:eq:", "").toUpperCase();
      if (key && key !== "NONE") severities[key] = true;
    }
    if (f.startsWith("method:eq:")) {
      const key = f.replace("method:eq:", "").toUpperCase();
      if (key) methods[key] = true;
    }
  });

  return {
    types,
    levels,
    groups,
    severities,
    methods,
    pathname: sp.get("path") || sp.get("pathname") || "",
    search: sp.get("search") || "",
    date: sp.get("date") || "60m",
    live: sp.get("live") === "true",
    tenant: sp.get("tenant") || "",
    scope: sp.get("scope") || "ALL",
    project: sp.get("project") || "",
    benchmark: sp.get("benchmark") === "true",
  };
}

export const DEFAULT_CONTEXT: LogFilterState = {
  searchQuery: "", setSearchQuery: () => {},
  timeRange: "60m", setTimeRange: () => {},
  isLivePaused: true, setIsLivePaused: () => {},
  showHistogram: true, setShowHistogram: () => {},
  selectedTypes: { ...DEFAULT_SELECTED_TYPES }, toggleType: () => {}, setLogType: () => {},
  selectedGroups: { ...DEFAULT_SELECTED_GROUPS }, toggleGroup: () => {},
  selectedLevels: { success: true, warning: true, error: true }, toggleLevel: () => {},
  selectedSeverities: { ...DEFAULT_SELECTED_SEVERITIES }, toggleSeverity: () => {},
  selectedMethods: { ...DEFAULT_SELECTED_METHODS }, toggleMethod: () => {},
  pathnameFilter: "", setPathnameFilter: () => {},
  scopeFilter: "ALL", setScopeFilter: () => {},
  projectFilter: "", setProjectFilter: () => {},
  edgeSubFilters: { ...DEFAULT_EDGE_SUB_FILTERS }, toggleEdgeSubFilter: () => {},
  selectedLog: null, setSelectedLog: () => {},
  resetAllFilters: () => {},
  applyPreset: () => {},
  isSidebarCollapsed: false, setIsSidebarCollapsed: () => {},
  logTypeCounts: {}, setLogTypeCounts: () => {},
  levelCounts: {}, setLevelCounts: () => {},
  severityCounts: {}, setSeverityCounts: () => {},
  methodCounts: {}, setMethodCounts: () => {},
  tenantFilter: "", setTenantFilter: () => {},
  includeBenchmark: false, setIncludeBenchmark: () => {},
  advancedFilters: [], addAdvancedFilter: () => {}, removeAdvancedFilter: () => {}, clearAdvancedFilters: () => {},

  logs: [],
  filteredLogs: [],
  rawLogs: [],
  timeFilteredLogs: [],
  totalCount: 0,
  clearLogs: () => {},
  streamStatus: "paused",
  isLoading: false,
  isLoadingMore: false,
  hasMore: false,
  loadMore: async () => {},
  refresh: async () => {},
};

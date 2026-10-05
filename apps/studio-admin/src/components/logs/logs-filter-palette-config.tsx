import * as React from "react";
import {
  CalendarClock,
  Layers,
  Activity,
  AlertTriangle,
  Hash,
  Globe,
  Compass,
  MessageSquare,
  User,
  Building2,
  FolderGit2,
  Cpu,
  Target,
} from "lucide-react";

import {
  type AdvancedFilterField,
  type AdvancedFilterOperator,
  FILTER_FIELD_LABELS,
  OPERATOR_SYMBOLS,
} from "./logs-filter-context";

// ─── Field Definitions & Categorized Operator Metadata ────────────────────────

export interface QuickOption {
  value: string;
  label: string;
  badgeClass?: string;
  colorDot?: string;
}

export interface OperatorItem {
  key: AdvancedFilterOperator;
  label: string;
  symbol: string;
}

export interface OperatorGroup {
  groupName: string;
  operators: OperatorItem[];
}

export interface FilterFieldConfig {
  key: AdvancedFilterField;
  label: string;
  icon: React.ReactNode;
  description: string;
  operatorGroups: OperatorGroup[];
  defaultOperator: AdvancedFilterOperator;
  quickOptions?: QuickOption[];
  placeholder: string;
}

const OP_EQUALS: OperatorItem = { key: "eq", label: "Equals", symbol: "=" };
const OP_NOT_EQUALS: OperatorItem = { key: "neq", label: "Not equal", symbol: "<>" };
const OP_ILIKE: OperatorItem = { key: "ilike", label: "ILike", symbol: "~*" };
const OP_NOT_ILIKE: OperatorItem = { key: "not_ilike", label: "Not ILike", symbol: "!~*" };
const OP_STARTS_WITH: OperatorItem = { key: "starts_with", label: "Starts with", symbol: "^=" };
const OP_ENDS_WITH: OperatorItem = { key: "ends_with", label: "Ends with", symbol: "$=" };
const OP_REGEX: OperatorItem = { key: "regex", label: "Regex Match", symbol: "~" };

const OP_GTE: OperatorItem = { key: "gte", label: "Greater than or equal", symbol: ">=" };
const OP_LTE: OperatorItem = { key: "lte", label: "Less than or equal", symbol: "<=" };
const OP_GT: OperatorItem = { key: "gt", label: "Greater than", symbol: ">" };
const OP_LT: OperatorItem = { key: "lt", label: "Less than", symbol: "<" };

const OP_IN: OperatorItem = { key: "in", label: "In list", symbol: "IN" };
const OP_NOT_IN: OperatorItem = { key: "not_in", label: "Not in list", symbol: "NOT IN" };

const STRING_OPERATOR_GROUPS: OperatorGroup[] = [
  { groupName: "COMPARISON", operators: [OP_EQUALS, OP_NOT_EQUALS] },
  { groupName: "PATTERN MATCHING", operators: [OP_ILIKE, OP_NOT_ILIKE, OP_STARTS_WITH, OP_ENDS_WITH, OP_REGEX] },
];

const NUMERIC_OPERATOR_GROUPS: OperatorGroup[] = [
  { groupName: "COMPARISON", operators: [OP_EQUALS, OP_NOT_EQUALS] },
  { groupName: "RANGE & ORDER", operators: [OP_GTE, OP_LTE, OP_GT, OP_LT] },
  { groupName: "SET MEMBERSHIP", operators: [OP_IN, OP_NOT_IN] },
];

const ENUM_OPERATOR_GROUPS: OperatorGroup[] = [
  { groupName: "COMPARISON", operators: [OP_EQUALS, OP_NOT_EQUALS] },
  { groupName: "SET MEMBERSHIP", operators: [OP_IN, OP_NOT_IN] },
];

const SIMPLE_ENUM_GROUPS: OperatorGroup[] = [
  { groupName: "COMPARISON", operators: [OP_EQUALS, OP_NOT_EQUALS] },
];

export const FILTER_FIELD_CONFIGS: FilterFieldConfig[] = [
  {
    key: "logType",
    label: "Log Type",
    icon: <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />,
    description: "Microservice gateway source",
    operatorGroups: ENUM_OPERATOR_GROUPS,
    defaultOperator: "eq",
    quickOptions: [
      { value: "edge", label: "API Gateway (Kong)" },
      { value: "auth", label: "Auth & IAM (Keycloak)" },
      { value: "postgres", label: "Postgres & PostGIS" },
      { value: "redis", label: "Redis Queue & Cache" },
      { value: "traefik", label: "Traefik Edge Proxy" },
      { value: "ai", label: "AI Copilot (RAG)" },
      { value: "audit", label: "Audit Trail" },
      { value: "notification", label: "Notification Gateway" },
      { value: "scheduler", label: "Scheduler & Backup" },
      { value: "storage", label: "Storage Gateway (S3)" },
      { value: "export", label: "Export Gateway" },
      { value: "payment", label: "Payment Gateway" },
      { value: "olt", label: "OLT Gateway" },
      { value: "poller", label: "OLT Poller (SNMP)" },
      { value: "map", label: "Map Gateway" },
      { value: "whatsapp", label: "WhatsApp Gateway" },
    ],
    placeholder: "e.g. edge, auth, postgres...",
  },
  {
    key: "status",
    label: "Status",
    icon: <Hash className="w-3.5 h-3.5 text-cyan-400 shrink-0" />,
    description: "HTTP response code / status",
    operatorGroups: NUMERIC_OPERATOR_GROUPS,
    defaultOperator: "eq",
    quickOptions: [
      { value: "200", label: "200 OK", badgeClass: "text-primary border-primary/30 bg-primary/10" },
      { value: "201", label: "201 Created", badgeClass: "text-primary border-primary/30 bg-primary/10" },
      { value: "204", label: "204 No Content", badgeClass: "text-primary border-primary/30 bg-primary/10" },
      { value: "400", label: "400 Bad Request", badgeClass: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
      { value: "401", label: "401 Unauthorized", badgeClass: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
      { value: "403", label: "403 Forbidden", badgeClass: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
      { value: "404", label: "404 Not Found", badgeClass: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
      { value: "429", label: "429 Rate Limited", badgeClass: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
      { value: "500", label: "500 Server Error", badgeClass: "text-rose-400 border-rose-500/30 bg-rose-500/10" },
      { value: "502", label: "502 Bad Gateway", badgeClass: "text-rose-400 border-rose-500/30 bg-rose-500/10" },
      { value: "503", label: "503 Service Unavailable", badgeClass: "text-rose-400 border-rose-500/30 bg-rose-500/10" },
    ],
    placeholder: "e.g. 200, 404, 500 or type custom code...",
  },
  {
    key: "method",
    label: "Method",
    icon: <Globe className="w-3.5 h-3.5 text-sky-400 shrink-0" />,
    description: "HTTP request method verb",
    operatorGroups: ENUM_OPERATOR_GROUPS,
    defaultOperator: "eq",
    quickOptions: [
      { value: "GET", label: "GET", badgeClass: "text-sky-400 bg-sky-500/10 border-sky-500/30 font-bold" },
      { value: "POST", label: "POST", badgeClass: "text-primary bg-primary/10 border-primary/30 font-bold" },
      { value: "PUT", label: "PUT", badgeClass: "text-amber-400 bg-amber-500/10 border-amber-500/30 font-bold" },
      { value: "PATCH", label: "PATCH", badgeClass: "text-purple-400 bg-purple-500/10 border-purple-500/30 font-bold" },
      { value: "DELETE", label: "DELETE", badgeClass: "text-rose-400 bg-rose-500/10 border-rose-500/30 font-bold" },
      { value: "OPTIONS", label: "OPTIONS", badgeClass: "text-muted-foreground bg-muted/40 border-border font-bold" },
      { value: "HEAD", label: "HEAD", badgeClass: "text-muted-foreground bg-muted/40 border-border font-bold" },
    ],
    placeholder: "e.g. GET, POST, PUT, DELETE...",
  },
  {
    key: "pathname",
    label: "Pathname",
    icon: <Compass className="w-3.5 h-3.5 text-primary shrink-0" />,
    description: "Endpoint route or target URI",
    operatorGroups: STRING_OPERATOR_GROUPS,
    defaultOperator: "ilike",
    quickOptions: [
      { value: "/api/v1/auth", label: "/api/v1/auth" },
      { value: "/api/v1/customers", label: "/api/v1/customers" },
      { value: "/api/v1/network", label: "/api/v1/network" },
      { value: "/api/v1/invoices", label: "/api/v1/invoices" },
      { value: "/api/v1/system", label: "/api/v1/system" },
      { value: "/oauth2/token", label: "/oauth2/token" },
      { value: "/actuator/health", label: "/actuator/health" },
    ],
    placeholder: "e.g. /api/v1/auth/login or /actuator...",
  },
  {
    key: "severity",
    label: "Severity",
    icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />,
    description: "Syslog severity category",
    operatorGroups: ENUM_OPERATOR_GROUPS,
    defaultOperator: "eq",
    quickOptions: [
      { value: "CRITICAL", label: "CRITICAL", colorDot: "bg-rose-600", badgeClass: "text-rose-400 bg-rose-500/15 border-rose-500/30" },
      { value: "ERROR", label: "ERROR", colorDot: "bg-rose-500", badgeClass: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
      { value: "WARN", label: "WARN", colorDot: "bg-amber-500", badgeClass: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
      { value: "INFO", label: "INFO", colorDot: "bg-sky-500", badgeClass: "text-sky-400 bg-sky-500/10 border-sky-500/30" },
      { value: "DEBUG", label: "DEBUG", colorDot: "bg-muted-foreground/60", badgeClass: "text-muted-foreground bg-muted/40 border-border/60" },
    ],
    placeholder: "CRITICAL, ERROR, WARN, INFO...",
  },
  {
    key: "level",
    label: "Level",
    icon: <Activity className="w-3.5 h-3.5 text-primary shrink-0" />,
    description: "Event outcome classification",
    operatorGroups: SIMPLE_ENUM_GROUPS,
    defaultOperator: "eq",
    quickOptions: [
      {
        value: "success",
        label: "success (OK / 2xx)",
        colorDot: "bg-primary",
        badgeClass: "text-primary bg-primary/10 border-primary/30",
      },
      {
        value: "warning",
        label: "warning (Warn / 4xx)",
        colorDot: "bg-amber-500",
        badgeClass: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      },
      {
        value: "error",
        label: "error (Fail / 5xx)",
        colorDot: "bg-rose-500",
        badgeClass: "text-rose-400 bg-rose-500/10 border-rose-500/30",
      },
    ],
    placeholder: "success, warning, or error...",
  },
  {
    key: "scope",
    label: "Scope",
    icon: <Target className="w-3.5 h-3.5 text-pink-400 shrink-0" />,
    description: "Platform permission boundary",
    operatorGroups: SIMPLE_ENUM_GROUPS,
    defaultOperator: "eq",
    quickOptions: [
      { value: "ALL", label: "ALL" },
      { value: "SYSTEM", label: "SYSTEM" },
      { value: "ORGANIZATION", label: "ORGANIZATION" },
      { value: "PROJECT", label: "PROJECT" },
    ],
    placeholder: "ALL, SYSTEM, ORGANIZATION, PROJECT...",
  },
  {
    key: "tenantSlug",
    label: "Tenant",
    icon: <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />,
    description: "Tenant organization slug",
    operatorGroups: STRING_OPERATOR_GROUPS,
    defaultOperator: "eq",
    quickOptions: [
      { value: "default", label: "default" },
      { value: "k2net-demo", label: "k2net-demo" },
      { value: "k2net-jkt", label: "k2net-jkt" },
      { value: "k2net-sub", label: "k2net-sub" },
    ],
    placeholder: "e.g. k2net-demo or tenant slug...",
  },
  {
    key: "projectId",
    label: "Project",
    icon: <FolderGit2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
    description: "Project ID or infrastructure cluster",
    operatorGroups: STRING_OPERATOR_GROUPS,
    defaultOperator: "eq",
    quickOptions: [
      { value: "proj-default", label: "proj-default" },
      { value: "cluster-jkt-01", label: "cluster-jkt-01" },
      { value: "core-infra", label: "core-infra" },
    ],
    placeholder: "e.g. proj-default or cluster id...",
  },
  {
    key: "serviceSource",
    label: "Source",
    icon: <Cpu className="w-3.5 h-3.5 text-indigo-400 shrink-0" />,
    description: "Underlying container / process name",
    operatorGroups: STRING_OPERATOR_GROUPS,
    defaultOperator: "ilike",
    quickOptions: [
      { value: "kong-gateway", label: "kong-gateway" },
      { value: "keycloak", label: "keycloak" },
      { value: "backend", label: "backend" },
      { value: "gateway-audit", label: "gateway-audit" },
      { value: "gateway-notification", label: "gateway-notification" },
      { value: "gateway-storage", label: "gateway-storage" },
      { value: "gateway-payment", label: "gateway-payment" },
      { value: "gateway-map", label: "gateway-map" },
      { value: "ftth-poller", label: "ftth-poller" },
    ],
    placeholder: "e.g. kong-gateway, keycloak...",
  },
  {
    key: "actor",
    label: "Actor / User",
    icon: <User className="w-3.5 h-3.5 text-violet-400 shrink-0" />,
    description: "Username, email, or principal identity",
    operatorGroups: STRING_OPERATOR_GROUPS,
    defaultOperator: "ilike",
    quickOptions: [
      { value: "super_admin", label: "super_admin" },
      { value: "admin", label: "admin" },
      { value: "system", label: "system" },
      { value: "anonymous", label: "anonymous" },
      { value: "service-account", label: "service-account" },
    ],
    placeholder: "e.g. super_admin or user@domain.com...",
  },
  {
    key: "message",
    label: "Event message",
    icon: <MessageSquare className="w-3.5 h-3.5 text-sky-400 shrink-0" />,
    description: "Audit log message or action description",
    operatorGroups: STRING_OPERATOR_GROUPS,
    defaultOperator: "ilike",
    quickOptions: [
      { value: "login failed", label: "login failed" },
      { value: "unauthorized", label: "unauthorized" },
      { value: "timeout", label: "timeout" },
      { value: "token refreshed", label: "token refreshed" },
      { value: "rate limit exceeded", label: "rate limit exceeded" },
      { value: "impersonation", label: "impersonation" },
      { value: "created", label: "created" },
      { value: "deleted", label: "deleted" },
    ],
    placeholder: "e.g. login failed, timeout, created...",
  },
  {
    key: "timeRange",
    label: "Time Range",
    icon: <CalendarClock className="w-3.5 h-3.5 text-primary shrink-0" />,
    description: "Preset or custom timestamp interval",
    operatorGroups: [],
    defaultOperator: "eq",
    quickOptions: [
      { value: "15m", label: "Last 15 minutes" },
      { value: "30m", label: "Last 30 minutes" },
      { value: "1h", label: "Last 1 hour" },
      { value: "3h", label: "Last 3 hours" },
      { value: "6h", label: "Last 6 hours" },
      { value: "12h", label: "Last 12 hours" },
      { value: "24h", label: "Last 24 hours" },
      { value: "3d", label: "Last 3 days" },
      { value: "7d", label: "Last 7 days" },
      { value: "30d", label: "Last 30 days" },
      { value: "today", label: "Today" },
      { value: "yesterday", label: "Yesterday" },
    ],
    placeholder: "e.g. 15m, 1h, 24h, today...",
  },
];

// ─── Smart Auto-Parse Engine ──────────────────────────────────────────────────

export interface SmartParseResult {
  isValid: boolean;
  field?: AdvancedFilterField;
  operator?: AdvancedFilterOperator;
  value?: string;
  displayLabel?: string;
  isTimeRange?: boolean;
  isSearchQuery?: boolean;
}

const FIELD_ALIAS_MAP: Record<string, AdvancedFilterField> = {
  time: "timeRange", timerange: "timeRange", range: "timeRange", t: "timeRange",
  method: "method", m: "method", verb: "method",
  level: "level", lvl: "level", l: "level",
  status: "status", code: "status", http: "status", sc: "status",
  severity: "severity", sev: "severity", s: "severity",
  path: "pathname", pathname: "pathname", url: "pathname", route: "pathname", uri: "pathname",
  msg: "message", message: "message", event: "message", action: "message",
  actor: "actor", user: "actor", usr: "actor", username: "actor", email: "actor",
  tenant: "tenantSlug", org: "tenantSlug", slug: "tenantSlug",
  project: "projectId", proj: "projectId",
  source: "serviceSource", src: "serviceSource", service: "serviceSource",
  type: "logType", logtype: "logType",
  scope: "scope",
};

const OPERATOR_TOKEN_MAP: Record<string, AdvancedFilterOperator> = {
  "~*": "ilike", ilike: "ilike", "~": "ilike",
  "!~*": "not_ilike", "!~": "not_ilike", "!ilike": "not_ilike", "not ilike": "not_ilike",
  "^=": "starts_with", "$=": "ends_with",
  ">=": "gte", "<=": "lte", "!=": "neq", "<>": "neq",
  ">": "gt", "<": "lt", in: "in", "not in": "not_in",
};

function resolveOperator(rawOp: string, field: AdvancedFilterField): AdvancedFilterOperator {
  const norm = rawOp.toLowerCase().trim();
  if (OPERATOR_TOKEN_MAP[norm]) return OPERATOR_TOKEN_MAP[norm];
  const conf = FILTER_FIELD_CONFIGS.find((c) => c.key === field);
  return conf?.defaultOperator ?? "eq";
}

export function parseSmartFilter(rawInput: string): SmartParseResult {
  const text = rawInput.trim();
  if (!text) return { isValid: false };

  const match = text.match(/^([a-zA-Z_-]+)\s*(not\s+ilike|!~|!~*|~|~*|ilike|not\s+in|in|>=|<=|!=|<>|\^=|\$=|>|<|:|=)\s*(.+)$/i);
  if (!match) {
    return { isValid: true, isSearchQuery: true, value: text, displayLabel: `Search logs for "${text}"` };
  }

  const field = FIELD_ALIAS_MAP[match[1].toLowerCase()];
  if (!field) {
    return { isValid: true, isSearchQuery: true, value: text, displayLabel: `Search logs for "${text}"` };
  }

  const rawVal = match[3].trim().replace(/^["'(]|["')]$/g, "").trim();
  const operator = resolveOperator(match[2], field);

  if (field === "timeRange") {
    return { isValid: true, isTimeRange: true, field: "timeRange", value: rawVal, displayLabel: `Time Range = ${rawVal}` };
  }

  const fieldLabel = FILTER_FIELD_LABELS[field];
  const opSymbol = OPERATOR_SYMBOLS[operator] ?? operator;
  return { isValid: true, field, operator, value: rawVal, displayLabel: `${fieldLabel} ${opSymbol} ${rawVal}` };
}

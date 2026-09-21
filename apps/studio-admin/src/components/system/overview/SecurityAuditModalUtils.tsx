import React from "react";
import {
  Globe,
  Shield,
  Send,
  Database,
  Server,
  Cpu,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  UserCheck,
  Trash2,
  Building,
  RotateCcw,
  Download,
  RefreshCw,
  Sparkles,
  Bot,
  AlertTriangle,
  Lock,
  Settings,
  Activity,
  FileCode,
  CheckSquare,
  Flame,
} from "lucide-react";
import type { SecurityAuditItem } from "./recent-operations-types";

export const LOG_GROUPS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  CORE: {
    label: "Core System",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
  },
  OPERATIONS: {
    label: "Bisnis & Operasional",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
  },
  NETWORK: {
    label: "Jaringan GIS",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  MESSAGING: {
    label: "Messaging",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
};

export const ACTION_PATTERNS: { keywords: string[]; label: string; icon: React.ReactNode }[] = [
  { keywords: ["IMPERSONATION_STARTED"], label: "Impersonasi Dimulai", icon: <UserCheck className="size-3.5 text-amber-400 shrink-0" /> },
  { keywords: ["IMPERSONATION_ENDED"], label: "Impersonasi Diakhiri", icon: <ShieldCheck className="size-3.5 text-sky-400 shrink-0" /> },
  { keywords: ["NUCLEAR", "TENANT_NUCLEAR_DELETED"], label: "Hapus Tenant Permanen (Nuke)", icon: <Trash2 className="size-3.5 text-rose-400 shrink-0" /> },
  { keywords: ["TENANT_CREATED"], label: "Pendaftaran Tenant Baru", icon: <Building className="size-3.5 text-primary shrink-0" /> },
  { keywords: ["TENANT_RESTORED"], label: "Pemulihan Tenant (Restore)", icon: <RotateCcw className="size-3.5 text-primary shrink-0" /> },
  { keywords: ["TENANT_IMPORTED"], label: "Impor Backup Tenant", icon: <Download className="size-3.5 text-primary shrink-0" /> },
  { keywords: ["TOKEN_REVOKED", "SCOPED_TOKEN_REVOKED"], label: "Token Akses Dicabut", icon: <KeyRound className="size-3.5 text-amber-400 shrink-0" /> },
  { keywords: ["TOKEN_CREATED", "SCOPED_TOKEN_CREATED"], label: "Token Akses Dibuat", icon: <KeyRound className="size-3.5 text-primary shrink-0" /> },
  { keywords: ["WEBHOOK", "SECRET_ROLLED"], label: "Webhook Secret Dirotasi", icon: <RefreshCw className="size-3.5 text-amber-400 shrink-0" /> },
  { keywords: ["API_KEY"], label: "API Key Dibuat Ulang", icon: <RefreshCw className="size-3.5 text-amber-400 shrink-0" /> },
  { keywords: ["AI_SOP_GENERATE"], label: "AI Generate SOP", icon: <Sparkles className="size-3.5 text-primary shrink-0" /> },
  { keywords: ["AI_", "CHAT"], label: "AI Fiber Copilot Session", icon: <Bot className="size-3.5 text-indigo-400 shrink-0" /> },
  { keywords: ["RATE_LIMIT"], label: "Rate Limit Gateway", icon: <AlertTriangle className="size-3.5 text-amber-400 shrink-0" /> },
  { keywords: ["LOGIN_SUCCESS", "LOGIN"], label: "User Login Sukses", icon: <ShieldCheck className="size-3.5 text-primary shrink-0" /> },
  { keywords: ["LOGIN_FAILED", "LOGIN_ERROR"], label: "Gagal Autentikasi", icon: <ShieldAlert className="size-3.5 text-rose-400 shrink-0" /> },
  { keywords: ["PASSWORD_RESET"], label: "Reset Password Akun", icon: <Lock className="size-3.5 text-amber-400 shrink-0" /> },
  { keywords: ["GLOBAL_SETTINGS", "SETTINGS"], label: "Konfigurasi Sistem Diperbarui", icon: <Settings className="size-3.5 text-sky-400 shrink-0" /> },
  { keywords: ["OBSIDIAN"], label: "Sinkronisasi Obsidian Vault", icon: <FileCode className="size-3.5 text-primary shrink-0" /> },
  { keywords: ["TASK"], label: "Manajemen Task & Work Order", icon: <CheckSquare className="size-3.5 text-primary shrink-0" /> },
  { keywords: ["CACHE", "PURGE"], label: "Purge Cache Gateway", icon: <Flame className="size-3.5 text-amber-400 shrink-0" /> },
  { keywords: ["SERVICE"], label: "Status Layanan Sistem", icon: <Activity className="size-3.5 text-sky-400 shrink-0" /> },
];

export function formatActionDisplay(action: string): { label: string; icon: React.ReactNode } {
  const a = (action ?? "").toUpperCase();
  const matched = ACTION_PATTERNS.find((pattern) => pattern.keywords.some((k) => a.includes(k)));
  if (matched) {
    return { label: matched.label, icon: matched.icon };
  }

  const cleanLabel = action
    .replace(/^(POST|PUT|DELETE|GET):/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return { label: cleanLabel, icon: <Activity className="size-3.5 text-muted-foreground shrink-0" /> };
}

export function getSourceIcon(source?: string) {
  const src = (source ?? "").toLowerCase();
  if (src.includes("kong") || src.includes("edge")) {
    return <Globe className="size-3.5 text-indigo-400 shrink-0" />;
  }
  if (src.includes("keycloak") || src.includes("auth")) {
    return <Shield className="size-3.5 text-amber-400 shrink-0" />;
  }
  if (src.includes("notification") || src.includes("whatsapp") || src.includes("sms")) {
    return <Send className="size-3.5 text-sky-400 shrink-0" />;
  }
  if (src.includes("db") || src.includes("postgres")) {
    return <Database className="size-3.5 text-primary shrink-0" />;
  }
  if (src.includes("backend")) {
    return <Server className="size-3.5 text-violet-400 shrink-0" />;
  }
  return <Cpu className="size-3.5 text-muted-foreground shrink-0" />;
}

export function getSeverityBadge(severity: string) {
  const s = (severity ?? "").toUpperCase();
  if (s === "CRITICAL") {
    return {
      label: "Critical",
      dot: "bg-rose-500 shadow-rose-500/50 shadow-xs animate-pulse",
      badge: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    };
  }
  if (s === "WARNING" || s === "WARN") {
    return {
      label: "Warning",
      dot: "bg-amber-400 shadow-amber-400/50 shadow-xs",
      badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    };
  }
  return {
    label: "Success",
    dot: "bg-primary shadow-primary/50 shadow-xs",
    badge: "bg-primary/15 text-primary border-primary/30",
  };
}

export function resolveHttpMethod(action: string, method?: string): string {
  if (method) return method;
  if (action.includes("DELETE") || action.includes("NUCLEAR")) return "DELETE";
  if (action.includes("CREATE") || action.includes("ADD")) return "POST";
  if (action.includes("UPDATE")) return "PUT";
  return "GET";
}

export interface JsonPayloadParams {
  audit: SecurityAuditItem;
  actionName: string;
  rawActor: string;
  tenant: string;
  timestamp: string;
  message: string;
  httpMethod: string;
  httpStatus: number | string;
  httpPath: string;
  ip: string;
  logGroupKey: string;
  serviceSource: string;
}

export function buildJsonPayloadString(p: JsonPayloadParams): string {
  if (p.audit.rawJsonPayload) return p.audit.rawJsonPayload;
  return JSON.stringify(
    {
      id: p.audit.id,
      timestamp: p.timestamp,
      logType: p.audit.logType || "audit",
      logGroup: p.logGroupKey,
      serviceSource: p.serviceSource,
      tenantSlug: p.audit.tenantSlug || undefined,
      severity: p.audit.severity,
      actor: p.rawActor,
      action: p.actionName,
      message: p.message,
      _resourceType: p.audit.resourceType || undefined,
      resourceId: p.audit.resourceId || undefined,
      method: p.httpMethod,
      status: p.httpStatus,
      pathname: p.httpPath,
      ip: p.ip,
      details: p.audit.details,
    },
    null,
    2
  );
}

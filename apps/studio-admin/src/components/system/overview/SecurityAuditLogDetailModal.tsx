import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  Button,
} from "@k2net/ui";
import {
  FileCode,
  Copy,
  Check,
  Building2,
  User,
  Clock,
  Globe,
  Shield,
  Send,
  Database,
  Server,
  Cpu,
  Layers,
  Activity,
  Terminal,
  Network,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { SecurityAuditItem } from "./recent-operations-types";

interface SecurityAuditLogDetailModalProps {
  audit: SecurityAuditItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const LOG_GROUPS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
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

function getSourceIcon(source?: string) {
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

function getSeverityBadge(severity: string) {
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

function resolveHttpMethod(action: string, method?: string): string {
  if (method) return method;
  if (action.includes("DELETE") || action.includes("NUCLEAR")) return "DELETE";
  if (action.includes("CREATE") || action.includes("ADD")) return "POST";
  if (action.includes("UPDATE")) return "PUT";
  return "GET";
}

interface JsonPayloadParams {
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

function buildJsonPayloadString(p: JsonPayloadParams): string {
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

function ModalHeader({
  eventId,
  severityMeta,
  groupMeta,
}: {
  eventId: string;
  severityMeta: { label: string; dot: string; badge: string };
  groupMeta: { label: string; color: string; bg: string; border: string };
}) {
  return (
    <div className="p-4 sm:p-5 border-b border-border/80 bg-muted/30 flex items-start justify-between gap-3 shrink-0">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
          <FileCode className="size-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
              Log Details
            </DialogTitle>
            <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold tracking-wider uppercase", severityMeta.badge)}>
              <span className={cn("size-1.5 rounded-full", severityMeta.dot)} />
              <span>{severityMeta.label}</span>
            </span>
            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-mono font-semibold", groupMeta.bg, groupMeta.color, groupMeta.border)}>
              <Layers className="size-3" />
              <span>{groupMeta.label}</span>
            </span>
          </div>
          <DialogDescription className="text-xs text-muted-foreground font-mono mt-1 flex items-center gap-1.5">
            <span>EVENT ID:</span>
            <span className="text-foreground/90 font-semibold">{eventId}</span>
          </DialogDescription>
        </div>
      </div>
    </div>
  );
}

function KeyPropertiesGrid({
  actionName,
  rawActor,
  tenant,
  serviceSource,
}: {
  actionName: string;
  rawActor: string;
  tenant: string;
  serviceSource: string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
      <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1">
        <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-muted-foreground block">Action / Type</span>
        <p className="text-xs font-mono font-bold text-primary break-all">{actionName}</p>
      </div>

      <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1">
        <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-muted-foreground block">Actor</span>
        <div className="flex items-center gap-1.5 min-w-0">
          <User className="size-3.5 text-muted-foreground shrink-0" />
          <p className="text-xs font-mono font-medium text-foreground truncate" title={rawActor}>{rawActor}</p>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1">
        <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-muted-foreground block">Tenant</span>
        <div className="flex items-center gap-1.5 min-w-0">
          <Building2 className="size-3.5 text-primary shrink-0" />
          <p className="text-xs font-mono font-medium text-foreground truncate" title={tenant}>{tenant}</p>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1">
        <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-muted-foreground block">Service Source</span>
        <div className="flex items-center gap-1.5">
          {getSourceIcon(serviceSource)}
          <p className="text-xs font-mono font-medium text-foreground capitalize">{serviceSource}</p>
        </div>
      </div>
    </div>
  );
}

function TimestampEventIdRow({
  timestamp,
  localTimestamp,
  eventId,
  copiedId,
  onCopyId,
}: {
  timestamp: string;
  localTimestamp?: string;
  eventId: string;
  copiedId: boolean;
  onCopyId: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex items-start gap-2.5">
        <Clock className="size-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="space-y-0.5 min-w-0">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-muted-foreground block">Timestamp</span>
          <p className="text-xs font-mono text-foreground font-medium break-all">{timestamp}</p>
          {localTimestamp && localTimestamp !== timestamp && (
            <p className="text-[10px] font-mono text-muted-foreground/80">Waktu lokal: {localTimestamp}</p>
          )}
        </div>
      </div>

      <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex items-start justify-between gap-2">
        <div className="space-y-0.5 min-w-0">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-muted-foreground block">Event ID</span>
          <p className="text-xs font-mono text-foreground font-semibold break-all">{eventId}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopyId}
          className="h-7 px-2 text-[11px] font-mono text-muted-foreground hover:text-primary gap-1 shrink-0"
          title="Salin Event ID"
        >
          {copiedId ? <Check className="size-3 text-primary" /> : <Copy className="size-3" />}
          <span className="hidden sm:inline">{copiedId ? "Tersalin" : "Copy"}</span>
        </Button>
      </div>
    </div>
  );
}

function HttpRequestSection({
  method,
  status,
  path,
  ip,
}: {
  method: string;
  status: number | string;
  path: string;
  ip: string;
}) {
  const methodClass =
    method === "POST"
      ? "text-sky-400 bg-sky-500/10 border-sky-500/20"
      : method === "DELETE"
      ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
      : method === "PUT" || method === "PATCH"
      ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
      : "text-primary bg-primary/10 border-primary/20";

  const statusClass =
    Number(status) >= 500
      ? "text-rose-400"
      : Number(status) >= 400
      ? "text-amber-400"
      : "text-primary";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
        <Network className="size-3 text-primary" />
        <span>HTTP Request</span>
      </div>
      <div className="p-3 rounded-xl bg-muted/30 border border-border/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="space-y-1">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-mono">Method</span>
          <span className={cn("inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold border", methodClass)}>
            {method}
          </span>
        </div>
        <div className="space-y-1">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-mono">Status</span>
          <span className={cn("inline-block font-mono text-xs font-bold", statusClass)}>{status}</span>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-mono">Path / Resource</span>
          <p className="font-mono text-xs text-foreground break-all" title={path}>
            {path}
          </p>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-mono">Client IP</span>
          <p className="font-mono text-xs text-foreground">{ip}</p>
        </div>
      </div>
    </div>
  );
}

function JsonPayloadSection({
  payload,
  copied,
  onCopy,
}: {
  payload: string;
  copied: boolean;
  onCopy: (e?: React.MouseEvent) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
          <Terminal className="size-3 text-primary" />
          <span>Raw JSON Payload</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopy}
          className="h-6 px-2 text-[10px] font-mono text-muted-foreground hover:text-primary gap-1"
        >
          {copied ? <Check className="size-3 text-primary" /> : <Copy className="size-3" />}
          <span>{copied ? "JSON Tersalin!" : "Copy JSON"}</span>
        </Button>
      </div>
      <div className="relative rounded-xl border border-border bg-background/90 overflow-hidden shadow-inner">
        <pre className="p-3.5 text-[11px] font-mono text-foreground/90 overflow-x-auto max-h-56 custom-scrollbar leading-relaxed">
          {payload}
        </pre>
      </div>
    </div>
  );
}

export function SecurityAuditLogDetailModal({
  audit,
  isOpen,
  onClose,
}: SecurityAuditLogDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  if (!audit) return null;

  const severityMeta = getSeverityBadge(audit.severity);
  const logGroupKey = (audit.logGroup ?? "OPERATIONS").toUpperCase();
  const groupMeta = LOG_GROUPS_META[logGroupKey] || LOG_GROUPS_META.OPERATIONS;
  const serviceSource = audit.serviceSource || "backend";
  const actionName = audit.rawAction || audit.action;
  const rawActor = audit.rawActor || audit.actor;
  const tenant = audit.tenantSlug || audit.targetTenant || "system";
  const timestamp = audit.rawTimestamp || audit.timestamp;
  const message = audit.eventMessage || audit.details || `${actionName} completed`;

  const httpMethod = resolveHttpMethod(actionName, audit.httpMethod);
  const httpStatus = audit.httpStatus || 200;
  const httpPath = audit.requestPath || audit.resourceId || (audit.tenantSlug ? `/api/v1/tenants/${audit.tenantSlug}` : "/api/v1/system");
  const ip = audit.ipAddress || "Kong Ingress";

  const jsonPayloadString = buildJsonPayloadString({
    audit,
    actionName,
    rawActor,
    tenant,
    timestamp,
    message,
    httpMethod,
    httpStatus,
    httpPath,
    ip,
    logGroupKey,
    serviceSource,
  });

  const handleCopyJson = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await navigator.clipboard.writeText(jsonPayloadString);
      setCopied(true);
      toast.success("Raw Event JSON berhasil disalin ke clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin JSON ke clipboard");
    }
  };

  const handleCopyId = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(audit.id);
      setCopiedId(true);
      toast.success("Event ID disalin!");
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      toast.error("Gagal menyalin Event ID");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton
        className="w-full max-w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-card/95 backdrop-blur-2xl border-border rounded-2xl shadow-2xl"
      >
        <ModalHeader eventId={audit.id} severityMeta={severityMeta} groupMeta={groupMeta} />

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
          <KeyPropertiesGrid
            actionName={actionName}
            rawActor={rawActor}
            tenant={tenant}
            serviceSource={serviceSource}
          />

          <TimestampEventIdRow
            timestamp={timestamp}
            localTimestamp={audit.timestamp}
            eventId={audit.id}
            copiedId={copiedId}
            onCopyId={handleCopyId}
          />

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
              <Activity className="size-3 text-primary" />
              <span>Event Message</span>
            </div>
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs font-mono text-foreground leading-relaxed break-all">
              {message}
            </div>
          </div>

          <HttpRequestSection method={httpMethod} status={httpStatus} path={httpPath} ip={ip} />

          <JsonPayloadSection payload={jsonPayloadString} copied={copied} onCopy={handleCopyJson} />
        </div>

        <div className="p-3.5 sm:p-4 border-t border-border/80 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyJson}
            className="w-full sm:w-auto h-8 text-xs font-mono gap-1.5 border-border hover:border-primary/40 cursor-pointer"
          >
            {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
            <span>Copy Raw Event JSON</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="w-full sm:w-auto h-8 text-xs font-medium cursor-pointer"
          >
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

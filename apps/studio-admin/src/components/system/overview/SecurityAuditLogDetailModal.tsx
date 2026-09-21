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
  Shield,
  Layers,
  Terminal,
  Network,
  Info,
  Box,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { SecurityAuditItem } from "./recent-operations-types";
import {
  LOG_GROUPS_META,
  formatActionDisplay,
  getSourceIcon,
  getSeverityBadge,
  resolveHttpMethod,
  buildJsonPayloadString,
} from "./SecurityAuditModalUtils";

interface SecurityAuditLogDetailModalProps {
  audit: SecurityAuditItem | null;
  isOpen: boolean;
  onClose: () => void;
}

function ModalHeader({
  eventId,
  friendlyAction,
  severityMeta,
  groupMeta,
}: {
  eventId: string;
  friendlyAction: { label: string; icon: React.ReactNode };
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
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/80 border border-border text-[10px] font-medium text-foreground">
              {friendlyAction.icon}
              <span>{friendlyAction.label}</span>
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
  friendlyAction,
  rawAction,
  actor,
  targetTenant,
  serviceSource,
}: {
  friendlyAction: { label: string; icon: React.ReactNode };
  rawAction: string;
  actor: string;
  targetTenant: string;
  serviceSource: string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
      {/* Aksi Keamanan */}
      <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1">
        <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-muted-foreground block">
          Aksi Keamanan
        </span>
        <div className="flex items-center gap-1.5 min-w-0">
          {friendlyAction.icon}
          <span className="text-xs font-semibold text-foreground truncate" title={friendlyAction.label}>
            {friendlyAction.label}
          </span>
        </div>
        <p className="text-[10px] font-mono font-bold text-primary truncate" title={rawAction}>
          {rawAction}
        </p>
      </div>

      {/* Aktor / Akun */}
      <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1">
        <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-muted-foreground block">
          Aktor / Akun
        </span>
        <div className="flex items-center gap-1.5 min-w-0">
          <User className="size-3.5 text-muted-foreground shrink-0" />
          <p className="text-xs font-mono font-medium text-foreground truncate" title={actor}>
            {actor}
          </p>
        </div>
      </div>

      {/* Target Tenant */}
      <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1">
        <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-muted-foreground block">
          Target Tenant
        </span>
        <div className="flex items-center gap-1.5 min-w-0">
          <Building2 className="size-3.5 text-primary shrink-0" />
          <p className="text-xs font-mono font-medium text-foreground truncate" title={targetTenant}>
            {targetTenant}
          </p>
        </div>
      </div>

      {/* Service Source */}
      <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1">
        <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-muted-foreground block">
          Service Source
        </span>
        <div className="flex items-center gap-1.5">
          {getSourceIcon(serviceSource)}
          <p className="text-xs font-mono font-medium text-foreground capitalize">
            {serviceSource}
          </p>
        </div>
      </div>
    </div>
  );
}

function SecurityActionDetailsSection({
  friendlyAction,
  details,
  eventMessage,
}: {
  friendlyAction: { label: string; icon: React.ReactNode };
  details?: string;
  eventMessage: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
        <Shield className="size-3 text-primary" />
        <span>Keterangan & Detail Aksi Keamanan</span>
      </div>
      <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-2">
        <div className="flex items-center gap-2">
          {friendlyAction.icon}
          <span className="text-xs font-bold text-foreground font-sans">
            {friendlyAction.label}
          </span>
        </div>
        {details && (
          <div className="p-2.5 rounded-lg bg-card border border-border/70 text-xs font-mono text-foreground leading-relaxed break-all flex items-start gap-2">
            <Info className="size-3.5 text-sky-400 mt-0.5 shrink-0" />
            <span>{details}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
          <span className="text-muted-foreground/60">Event Message:</span>
          <span className="text-foreground/90 font-medium">{eventMessage}</span>
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
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-muted-foreground block">
            Timestamp
          </span>
          <p className="text-xs font-mono text-foreground font-medium break-all">{timestamp}</p>
          {localTimestamp && localTimestamp !== timestamp && (
            <p className="text-[10px] font-mono text-muted-foreground/80">Waktu lokal: {localTimestamp}</p>
          )}
        </div>
      </div>

      <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex items-start justify-between gap-2">
        <div className="space-y-0.5 min-w-0">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-muted-foreground block">
            Event ID
          </span>
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
  resourceType,
  resourceId,
}: {
  method: string;
  status: number | string;
  path: string;
  ip: string;
  resourceType?: string;
  resourceId?: string;
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
        <span>HTTP Request & Target Entity</span>
      </div>
      <div className="p-3 rounded-xl bg-muted/30 border border-border/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Method */}
        <div className="space-y-1">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-mono">Method</span>
          <span className={cn("inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold border", methodClass)}>
            {method}
          </span>
        </div>

        {/* Status */}
        <div className="space-y-1">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-mono">Status</span>
          <span className={cn("inline-block font-mono text-xs font-bold", statusClass)}>{status}</span>
        </div>

        {/* Endpoint / REST Path */}
        <div className="space-y-1 sm:col-span-2">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-mono">Endpoint / API Path</span>
          <p className="font-mono text-xs text-primary font-semibold break-all" title={path}>
            {path}
          </p>
        </div>

        {/* Target Entity */}
        {(resourceType || resourceId) && (
          <div className="space-y-1 sm:col-span-2">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-mono">Target Resource Entity</span>
            <div className="flex items-center gap-2 flex-wrap">
              {resourceType && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/80 border border-border text-[10px] font-mono font-bold text-foreground">
                  <Box className="size-3 text-primary" />
                  <span>{resourceType}</span>
                </span>
              )}
              {resourceId && (
                <span className="font-mono text-[11px] text-foreground/90 break-all" title={resourceId}>
                  ID: {resourceId}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Client IP */}
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
  const friendlyAction = formatActionDisplay(actionName);
  const rawActor = audit.rawActor || audit.actor;
  const targetTenant = audit.targetTenant || audit.tenantSlug || "Platform Wide";
  const timestamp = audit.rawTimestamp || audit.timestamp;
  const message = audit.eventMessage || `${actionName} completed`;

  const httpMethod = resolveHttpMethod(actionName, audit.httpMethod);
  const httpStatus = audit.httpStatus || 200;
  const httpPath = audit.requestPath || (audit.resourceId ? `/api/v1/organizations/${audit.resourceId}` : "/api/v1/system/security");
  const ip = audit.ipAddress || "Kong Ingress";

  const jsonPayloadString = buildJsonPayloadString({
    audit,
    actionName,
    rawActor,
    tenant: targetTenant,
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
        className="w-full max-w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-card/95 backdrop-blur-2xl border-border rounded-2xl shadow-xl"
      >
        <ModalHeader
          eventId={audit.id}
          friendlyAction={friendlyAction}
          severityMeta={severityMeta}
          groupMeta={groupMeta}
        />

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
          <KeyPropertiesGrid
            friendlyAction={friendlyAction}
            rawAction={actionName}
            actor={audit.actor || rawActor}
            targetTenant={targetTenant}
            serviceSource={serviceSource}
          />

          <SecurityActionDetailsSection
            friendlyAction={friendlyAction}
            details={audit.details}
            eventMessage={message}
          />

          <TimestampEventIdRow
            timestamp={timestamp}
            localTimestamp={audit.timestamp}
            eventId={audit.id}
            copiedId={copiedId}
            onCopyId={handleCopyId}
          />

          <HttpRequestSection
            method={httpMethod}
            status={httpStatus}
            path={httpPath}
            ip={ip}
            resourceType={audit.resourceType}
            resourceId={audit.resourceId}
          />

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

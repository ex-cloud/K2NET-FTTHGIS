import React from "react";
import { FileCode, X, Copy, Building2, FolderKanban, Layers, History, ShieldCheck } from "lucide-react";
import { Button } from "@k2net/ui";
import { type AuditStreamEntry, LOG_GROUPS } from "@/hooks/use-audit-log-stream";
import { getSourceIcon, getLevel } from "./logs-utils";
import { useTranslation } from "@k2net/i18n";


interface LogsDetailDrawerProps {
  selectedLog: AuditStreamEntry;
  onClose: () => void;
  onCopyLog: (log: AuditStreamEntry, e: React.MouseEvent) => void;
}

function CryptographicIntegritySection({ log }: { log: AuditStreamEntry }) {
  const hash = log.metadata?.hash as string | undefined;
  const prevHash = log.metadata?.prevHash as string | undefined;
  if (!hash && !prevHash) return null;

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5 space-y-2 font-mono text-[11px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-primary font-bold text-[10px] uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Tamper-Proof Integrity (SHA-256)</span>
        </div>
        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary border border-primary/30">
          VERIFIED ✓
        </span>
      </div>
      <div className="space-y-1.5 text-[10px]">
        {hash && (
          <div>
            <span className="text-muted-foreground block text-[9px]">Current SHA-256 Hash:</span>
            <span className="text-foreground font-mono break-all bg-background/50 p-1 rounded border border-border/40 block mt-0.5">
              {hash}
            </span>
          </div>
        )}
        {prevHash && (
          <div>
            <span className="text-muted-foreground block text-[9px]">Previous Hash Chain:</span>
            <span className="text-muted-foreground font-mono break-all bg-background/30 p-1 rounded border border-border/30 block mt-0.5">
              {prevHash}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ImpersonationBanner({ log }: { log: AuditStreamEntry }) {
  if (!log.isImpersonated && !log.realActorId) return null;

  return (
    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 space-y-2 font-mono">
      <div className="flex items-center gap-1.5 text-purple-400 font-bold text-xs">
        <span>🎭</span>
        <span>Dual-Identity Impersonation Session</span>
      </div>
      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Real Actor:</span>
          <span className="text-foreground font-semibold">{log.realActorId || log.actor}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Impersonated Org:</span>
          <span className="text-foreground font-semibold">{log.impersonatedTenantId || log.tenantSlug || "N/A"}</span>
        </div>
        {log.impersonationSessionId && (
          <div className="flex justify-between gap-2 pt-1 border-t border-purple-500/20 text-[10px]">
            <span className="text-muted-foreground">Session ID:</span>
            <span className="text-purple-300 font-mono break-all">{log.impersonationSessionId}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ScopeAndProjectSection({ log }: { log: AuditStreamEntry }) {
  if (!log.scope && !log.projectId && !log.projectName) return null;

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5 space-y-1.5 font-mono text-[11px]">
      <div className="flex items-center gap-1.5 text-primary font-bold text-[10px] uppercase tracking-wider">
        <FolderKanban className="w-3.5 h-3.5" />
        <span>Scope & Topology Context</span>
      </div>
      <div className="space-y-1">
        {log.scope && (
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Scope:</span>
            <span className="text-foreground font-semibold">{log.scope}</span>
          </div>
        )}
        {log.projectName && (
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Project Name:</span>
            <span className="text-foreground font-semibold">{log.projectName}</span>
          </div>
        )}
        {log.projectId && (
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Project ID:</span>
            <span className="text-foreground font-mono text-[10px] break-all">{log.projectId}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function JsonDiffViewer({ oldValue, newValue }: { oldValue?: Record<string, unknown> | null; newValue?: Record<string, unknown> | null }) {
  if (!oldValue && !newValue) return null;

  return (
    <div className="space-y-2">
      <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5">
        <History className="w-3.5 h-3.5 text-primary" />
        <span>Data Mutation Diff (Old vs New)</span>
      </label>
      <div className="grid grid-cols-1 gap-2 font-mono text-[10px]">
        {oldValue && (
          <div className="bg-rose-500/10 border border-rose-500/25 rounded p-2.5 space-y-1">
            <div className="text-rose-400 font-bold text-[9px] uppercase tracking-wider">
              - Old Value (Before Change)
            </div>
            <pre className="text-rose-300 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(oldValue, null, 2)}
            </pre>
          </div>
        )}
        {newValue && (
          <div className="bg-primary/10 border border-primary/25 rounded p-2.5 space-y-1">
            <div className="text-primary font-bold text-[9px] uppercase tracking-wider">
              + New Value (After Change)
            </div>
            <pre className="text-foreground overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(newValue, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function MetadataInspector({ metadata }: { metadata?: Record<string, unknown> }) {
  if (!metadata || Object.keys(metadata).length === 0) return null;

  // Filter out internal duplicate keys already shown elsewhere
  const displayEntries = Object.entries(metadata).filter(
    ([k]) => !["oldValue", "newValue", "isImpersonated", "realActorId", "impersonationSessionId", "impersonatedTenantId", "scope", "projectId", "projectName", "severity", "logGroup"].includes(k)
  );

  if (displayEntries.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5">
        <Layers className="w-3.5 h-3.5 text-primary" />
        <span>Extended Metadata</span>
      </label>
      <div className="bg-muted/30 p-2.5 rounded border border-border/50 space-y-1 font-mono text-[10px]">
        {displayEntries.map(([key, val]) => (
          <div key={key} className="flex items-start justify-between gap-2 py-0.5 border-b border-border/30 last:border-0">
            <span className="text-muted-foreground font-semibold shrink-0">{key}:</span>
            <span className="text-foreground text-right break-all">
              {typeof val === "object" && val !== null ? JSON.stringify(val) : String(val)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HttpRequestSection({ log }: { log: AuditStreamEntry }) {
  const { t } = useTranslation();
  if (!log.method && !log.status && !log.pathname && !log.ip) return null;

  return (
    <div className="space-y-2">
      <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
        {t("observability.http_request")}
      </label>
      <div className="bg-muted/30 p-2 rounded border border-border/50 space-y-1.5">
        {log.method && (
          <div className="flex items-center gap-2">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground w-16 shrink-0">{t("observability.method")}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
              log.method === "POST" ? "text-sky-400 bg-sky-500/10 border-sky-500/20"
              : log.method === "DELETE" ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
              : log.method === "PUT" || log.method === "PATCH" ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
              : "text-primary/80 bg-primary/10 border-primary/20"
            }`}>{log.method}</span>
          </div>
        )}
        {log.status && (
          <div className="flex items-center gap-2">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground w-16 shrink-0">{t("observability.http_status")}</span>
            <span className={`font-mono text-[11px] font-semibold ${
              Number(log.status) >= 500 ? "text-rose-400"
              : Number(log.status) >= 400 ? "text-amber-400"
              : "text-primary/80"
            }`}>{log.status}</span>
          </div>
        )}
        {log.pathname && (
          <div className="flex items-start gap-2">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground w-16 shrink-0 mt-0.5">{t("observability.pathname")}</span>
            <span className="font-mono text-[10px] text-foreground break-all">{log.pathname}</span>
          </div>
        )}
        {log.ip && (
          <div className="flex items-center gap-2">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground w-16 shrink-0">{t("observability.client_ip")}</span>
            <span className="font-mono text-[10px] text-foreground">{log.ip}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function LogsDetailDrawer({ selectedLog, onClose, onCopyLog }: LogsDetailDrawerProps) {
  const { t } = useTranslation();
  const level = getLevel(selectedLog);
  const isCritical = (selectedLog.severity || "").toUpperCase() === "CRITICAL";

  return (
    <div className="absolute right-0 top-0 h-full w-[420px] max-w-full bg-card border-l border-border flex flex-col z-20 shadow-xl animate-in slide-in-from-right duration-250">
      <div className="p-3 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-primary" />
          <span className="font-bold text-foreground font-sans text-sm">{t("observability.log_details")}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <ImpersonationBanner log={selectedLog} />

        <ScopeAndProjectSection log={selectedLog} />

        <CryptographicIntegritySection log={selectedLog} />

        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{t("observability.event_id")}</label>
          <p className="text-foreground bg-muted/40 p-2 rounded border border-border/50 text-[10px] break-all font-mono">
            {selectedLog.id}
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Severity & Level</label>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isCritical ? "bg-rose-500 animate-pulse" : level === "error" ? "bg-rose-500" : level === "warning" ? "bg-amber-500" : "bg-primary/70"
              }`}
            />
            <span className="text-foreground font-bold text-xs font-mono">
              {selectedLog.severity || level.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{t("observability.action_type")}</label>
          <p className="text-primary font-bold text-xs font-mono">{selectedLog.action}</p>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{t("observability.col_actor")}</label>
          <p className="text-foreground text-xs font-mono">{selectedLog.actor}</p>
        </div>

        {selectedLog.tenantSlug && (
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{t("observability.tenant")}</label>
            <p className="text-foreground font-mono text-xs inline-flex items-center gap-1.5">
              <Building2 className="w-3 h-3 text-primary" />
              {selectedLog.tenantSlug}
            </p>
          </div>
        )}

        {selectedLog.serviceSource && (
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{t("observability.service_source")}</label>
            <p className="text-foreground font-mono text-xs inline-flex items-center gap-1.5">
              {getSourceIcon(selectedLog.serviceSource)}
              {selectedLog.serviceSource}
            </p>
          </div>
        )}

        {selectedLog.logGroup && (
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{t("observability.log_group")}</label>
            <p className={`font-mono text-xs font-semibold ${LOG_GROUPS[selectedLog.logGroup]?.color ?? "text-muted-foreground"}`}>
              {LOG_GROUPS[selectedLog.logGroup]?.label ?? selectedLog.logGroup}
            </p>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{t("observability.timestamp")}</label>
          <p className="text-foreground font-mono text-xs">{selectedLog.timestamp}</p>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{t("observability.event_message")}</label>
          <p className="text-foreground bg-muted/30 p-2 rounded border border-border/50 text-[10px] break-all font-mono">
            {selectedLog.message}
          </p>
        </div>

        <HttpRequestSection log={selectedLog} />

        <JsonDiffViewer oldValue={selectedLog.oldValue} newValue={selectedLog.newValue} />

        <MetadataInspector metadata={selectedLog.metadata} />

        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{t("observability.raw_json_payload")}</label>
          <pre className="bg-background p-3 rounded border border-border text-[10px] text-foreground/80 overflow-x-auto whitespace-pre-wrap font-mono max-h-60 custom-scrollbar-thin">
            {JSON.stringify(selectedLog, null, 2)}
          </pre>
        </div>
      </div>

      <div className="p-3 border-t border-border bg-muted/20 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => onCopyLog(selectedLog, e)}
          className="w-full text-xs font-mono gap-1.5 h-8"
        >
          <Copy className="w-3.5 h-3.5" /> {t("observability.copy_raw_event_json")}
        </Button>
      </div>
    </div>
  );
}


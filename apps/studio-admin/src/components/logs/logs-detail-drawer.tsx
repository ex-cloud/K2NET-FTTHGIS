import React from "react";
import { FileCode, X, Copy, Building2 } from "lucide-react";
import { Button } from "@k2net/ui";
import { type AuditStreamEntry, LOG_GROUPS } from "@/hooks/use-audit-log-stream";
import { getSourceIcon, getLevel } from "./logs-utils";

interface LogsDetailDrawerProps {
  selectedLog: AuditStreamEntry;
  onClose: () => void;
  onCopyLog: (log: AuditStreamEntry, e: React.MouseEvent) => void;
}

function HttpRequestSection({ log }: { log: AuditStreamEntry }) {
  if (!log.method && !log.status && !log.pathname && !log.ip) return null;

  return (
    <div className="space-y-2">
      <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
        HTTP Request
      </label>
      <div className="bg-muted/30 p-2 rounded border border-border/50 space-y-1.5">
        {log.method && (
          <div className="flex items-center gap-2">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground w-16 shrink-0">Method</span>
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
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground w-16 shrink-0">Status</span>
            <span className={`font-mono text-[11px] font-semibold ${
              Number(log.status) >= 500 ? "text-rose-400"
              : Number(log.status) >= 400 ? "text-amber-400"
              : "text-primary/80"
            }`}>{log.status}</span>
          </div>
        )}
        {log.pathname && (
          <div className="flex items-start gap-2">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground w-16 shrink-0 mt-0.5">Path</span>
            <span className="font-mono text-[10px] text-foreground break-all">{log.pathname}</span>
          </div>
        )}
        {log.ip && (
          <div className="flex items-center gap-2">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground w-16 shrink-0">IP</span>
            <span className="font-mono text-[10px] text-foreground">{log.ip}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function LogsDetailDrawer({ selectedLog, onClose, onCopyLog }: LogsDetailDrawerProps) {
  const level = getLevel(selectedLog);

  return (
    <div className="absolute right-0 top-0 h-full w-96 bg-card border-l border-border flex flex-col z-20 shadow-2xl animate-in slide-in-from-right duration-250">
      <div className="p-3 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-primary" />
          <span className="font-bold text-foreground font-sans text-sm">Log Details</span>
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
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Event ID</label>
          <p className="text-foreground bg-muted/40 p-2 rounded border border-border/50 text-[10px] break-all font-mono">
            {selectedLog.id}
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Level</label>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                level === "error" ? "bg-rose-500" : level === "warning" ? "bg-amber-500" : "bg-primary/70"
              }`}
            />
            <span className="text-foreground capitalize text-xs font-mono">{level}</span>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Action / Type</label>
          <p className="text-primary font-bold text-xs font-mono">{selectedLog.action}</p>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Actor</label>
          <p className="text-foreground text-xs font-mono">{selectedLog.actor}</p>
        </div>

        {selectedLog.tenantSlug && (
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Tenant</label>
            <p className="text-foreground font-mono text-xs inline-flex items-center gap-1.5">
              <Building2 className="w-3 h-3 text-primary" />
              {selectedLog.tenantSlug}
            </p>
          </div>
        )}

        {selectedLog.serviceSource && (
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Service Source</label>
            <p className="text-foreground font-mono text-xs inline-flex items-center gap-1.5">
              {getSourceIcon(selectedLog.serviceSource)}
              {selectedLog.serviceSource}
            </p>
          </div>
        )}

        {selectedLog.logGroup && (
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Log Group</label>
            <p className={`font-mono text-xs font-semibold ${LOG_GROUPS[selectedLog.logGroup]?.color ?? "text-muted-foreground"}`}>
              {LOG_GROUPS[selectedLog.logGroup]?.label ?? selectedLog.logGroup}
            </p>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Timestamp</label>
          <p className="text-foreground font-mono text-xs">{selectedLog.timestamp}</p>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Event Message</label>
          <p className="text-foreground bg-muted/30 p-2 rounded border border-border/50 text-[10px] break-all font-mono">
            {selectedLog.message}
          </p>
        </div>

        <HttpRequestSection log={selectedLog} />

        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Raw JSON Payload</label>
          <pre className="bg-background p-3 rounded border border-border text-[10px] text-foreground/80 overflow-x-auto whitespace-pre-wrap font-mono">
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
          <Copy className="w-3.5 h-3.5" /> Copy Raw Event JSON
        </Button>
      </div>
    </div>
  );
}

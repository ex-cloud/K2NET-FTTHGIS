import React from "react";
import { format } from "date-fns";
import { Copy, Check, Sparkles, FileCode, Globe } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  UniversalContextMenu,
  type ContextMenuGroupConfig,
} from "@k2net/ui";
import { type AuditStreamEntry, LOG_GROUPS } from "@/hooks/use-audit-log-stream";
import {
  getSourceIcon,
  getEventMessageDisplay,
  getLevel,
  getDetailedTime,
} from "./logs-utils";

interface LogsRowItemProps {
  log: AuditStreamEntry;
  isSelected: boolean;
  visibleCols: Set<string>;
  copiedId: string | null;
  onSelect: () => void;
  onCopyLog: (log: AuditStreamEntry, e: React.MouseEvent) => void;
}

function getStatusColor(statusNum?: number) {
  if (!statusNum) return "text-muted-foreground/30";
  if (statusNum >= 500) return "text-rose-400";
  if (statusNum >= 400) return "text-amber-400";
  if (statusNum >= 200) return "text-primary/80";
  return "text-muted-foreground/50";
}

function getMethodColor(method?: string) {
  if (method === "POST") return "text-sky-400 bg-sky-500/10 border-sky-500/20";
  if (method === "PUT" || method === "PATCH") return "text-amber-400 bg-amber-500/10 border-amber-500/20";
  if (method === "DELETE") return "text-rose-400 bg-rose-500/10 border-rose-500/20";
  if (method === "GET") return "text-primary/80 bg-primary/10 border-primary/20";
  return "text-muted-foreground/60 bg-muted/20 border-border/30";
}

function buildContextMenuGroups(
  log: AuditStreamEntry,
  isSelected: boolean,
  onSelect: () => void
): ContextMenuGroupConfig[] {
  return [
    {
      items: [
        {
          label: "Tanya AI Analisis Log Ini",
          icon: Sparkles,
          shortcut: "Ctrl+J",
          onClick: () => {
            window.dispatchEvent(
              new CustomEvent("k2net-ai-prompt-input", {
                detail: {
                  prompt: `Analisis event log [${log.serviceSource || "system"}] ${log.method || ""} ${log.pathname || ""}: "${log.message || log.action || ""}". Status: ${log.status || "-"}, Tenant: ${log.tenantSlug || "global"}. Identifikasi potensi masalah atau anomali.`,
                },
              })
            );
            window.dispatchEvent(new CustomEvent("k2net-toggle-ai-assistant"));
          },
        },
        {
          label: isSelected ? "Tutup Detail Panel" : "Buka Detail Panel",
          icon: FileCode,
          shortcut: "Enter",
          onClick: onSelect,
        },
      ],
    },
    {
      items: [
        {
          label: "Salin Log JSON",
          icon: Copy,
          shortcut: "Ctrl+C",
          onClick: () => {
            navigator.clipboard.writeText(JSON.stringify(log, null, 2));
            toast.success("Log event JSON disalin ke clipboard!");
          },
        },
        {
          label: "Salin Event ID / Trace ID",
          icon: Copy,
          shortcut: "Alt+C",
          onClick: () => {
            const id = log.traceId || log.requestId || log.id || "";
            navigator.clipboard.writeText(id);
            toast.success(`ID ${id} disalin ke clipboard!`);
          },
        },
        {
          label: "Salin Pathname URL",
          icon: Globe,
          shortcut: "Alt+P",
          onClick: () => {
            if (log.pathname) {
              navigator.clipboard.writeText(log.pathname);
              toast.success(`Path ${log.pathname} disalin!`);
            }
          },
          disabled: !log.pathname,
        },
      ],
    },
  ];
}

function DateCell({ timestamp }: { timestamp?: string }) {
  let formattedDate = timestamp ?? "";
  try {
    formattedDate = format(new Date(timestamp || ""), "dd MMM yy HH:mm:ss");
  } catch {
    // ignore
  }
  const timeDetails = getDetailedTime(timestamp ?? "");

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="w-[148px] shrink-0 text-muted-foreground text-[11px] font-mono flex items-center cursor-default outline-none select-none">
            {formattedDate}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="z-50 p-3 bg-popover border border-border text-foreground font-mono text-[10px] rounded-lg shadow-xl w-[260px] select-none [&_svg]:!hidden">
          <div className="space-y-1.5">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground font-semibold">UTC</span>
              <span className="text-right font-medium">{timeDetails.utc}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground font-semibold">{timeDetails.tzName}</span>
              <span className="text-right font-medium">{timeDetails.local}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground font-semibold">Relative</span>
              <span className="text-right font-medium">{timeDetails.relative}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground font-semibold">Timestamp</span>
              <span className="text-right font-medium">{timeDetails.timestamp}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function SourceCell({ source, logGroup }: { source?: string; logGroup?: string }) {
  if (!source) return <span className="text-muted-foreground/20">—</span>;

  const groupInfo = logGroup ? LOG_GROUPS[logGroup as keyof typeof LOG_GROUPS] : null;
  const colorClass = groupInfo ? `${groupInfo.color} ${groupInfo.accentBg} border-current/20` : "text-muted-foreground/60 bg-muted/20 border-border/30";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex items-center justify-center cursor-default outline-none select-none">
            {getSourceIcon(source)}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-[11px] font-mono px-2 py-1.5 bg-popover border border-border text-foreground [&_svg]:!hidden">
          <span className="flex items-center gap-1.5">
            {getSourceIcon(source)}
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${colorClass}`}>
              {source}
            </span>
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function StatusCell({
  status,
  log,
  copiedId,
  onCopyLog,
}: {
  status?: string | number;
  log: AuditStreamEntry;
  copiedId: string | null;
  onCopyLog: (log: AuditStreamEntry, e: React.MouseEvent) => void;
}) {
  const statusNum = typeof status === "number" ? status : status ? parseInt(String(status)) : undefined;

  return (
    <React.Fragment>
      <div className="w-[52px] shrink-0">
        {statusNum ? (
          <span className={`font-mono text-[11px] font-semibold ${getStatusColor(statusNum)}`}>{statusNum}</span>
        ) : (
          <span className="text-muted-foreground/20">—</span>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => onCopyLog(log, e)}
        title="Copy Log JSON"
        className="w-7 shrink-0 flex items-center justify-center p-0.5 rounded hover:bg-muted/80 text-muted-foreground/60 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copiedId === log.id ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </React.Fragment>
  );
}

export function LogsRowItem({
  log,
  isSelected,
  visibleCols,
  copiedId,
  onSelect,
  onCopyLog,
}: LogsRowItemProps) {
  const level = getLevel(log);
  const isError = level === "error";
  const isWarn = level === "warning";

  return (
    <UniversalContextMenu groups={buildContextMenuGroups(log, isSelected, onSelect)}>
      <div
        onClick={onSelect}
        className={`flex items-center px-4 py-1.5 font-mono text-[11px] transition-colors cursor-pointer group ${
          isSelected
            ? "bg-primary/10 text-foreground border-l-2 border-primary"
            : "hover:bg-muted/30 text-muted-foreground hover:text-foreground"
        }`}
      >
        <div className="w-[42px] shrink-0 flex items-center">
          <input
            type="checkbox"
            onClick={(e) => e.stopPropagation()}
            className="w-3.5 h-3.5 rounded border-border text-primary accent-primary cursor-pointer"
          />
        </div>

        <div className="w-[16px] mr-2 shrink-0 flex items-center justify-center">
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              isError ? "bg-rose-500" : isWarn ? "bg-amber-500" : "bg-primary/70"
            }`}
          />
        </div>

        {visibleCols.has("date") && <DateCell timestamp={log.timestamp} />}

        {visibleCols.has("source") && (
          <div className="w-[28px] shrink-0 flex items-center justify-center">
            <SourceCell source={log.serviceSource} logGroup={log.logGroup} />
          </div>
        )}

        {visibleCols.has("status") && (
          <StatusCell status={log.status} log={log} copiedId={copiedId} onCopyLog={onCopyLog} />
        )}

        {visibleCols.has("tenant") && (
          <div className="w-[88px] shrink-0 font-mono text-[10px] truncate">
            {log.tenantSlug ? (
              <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary/80 font-mono text-[9px] border border-primary/20">
                {log.tenantSlug}
              </span>
            ) : (
              <span className="text-muted-foreground/20">—</span>
            )}
          </div>
        )}

        {visibleCols.has("method") && (
          <div className="w-[56px] shrink-0">
            {log.method ? (
              <span className={`px-1 py-0.5 rounded text-[9px] font-mono font-bold border ${getMethodColor(log.method)}`}>
                {log.method}
              </span>
            ) : (
              <span className="text-muted-foreground/20">—</span>
            )}
          </div>
        )}

        {visibleCols.has("pathname") && (
          <div className="w-[140px] shrink-0 font-mono text-[10px] truncate text-muted-foreground/80">
            {log.pathname ? <span title={log.pathname}>{log.pathname}</span> : <span className="text-muted-foreground/20">—</span>}
          </div>
        )}

        {visibleCols.has("message") && (
          <div className="flex-1 min-w-0 truncate font-mono text-[11px]">
            <span className={isError ? "text-rose-400" : isWarn ? "text-amber-400" : "text-foreground/90"}>
              {getEventMessageDisplay(log)}
            </span>
          </div>
        )}
      </div>
    </UniversalContextMenu>
  );
}

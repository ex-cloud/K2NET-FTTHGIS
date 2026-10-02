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
import { useTranslation } from "@k2net/i18n";
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
  onSelect: () => void,
  t: ReturnType<typeof useTranslation>["t"]
): ContextMenuGroupConfig[] {
  return [
    {
      items: [
        {
          label: t("observability.ask_ai_analyze_log"),
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
          label: isSelected ? t("observability.close_detail_panel") : t("observability.open_detail_panel"),
          icon: FileCode,
          shortcut: "Enter",
          onClick: onSelect,
        },
      ],
    },
    {
      items: [
        {
          label: t("observability.copy_log_json"),
          icon: Copy,
          shortcut: "Ctrl+C",
          onClick: () => {
            navigator.clipboard.writeText(JSON.stringify(log, null, 2));
            toast.success(t("observability.log_copied"));
          },
        },
        {
          label: t("observability.copy_trace_id"),
          icon: Copy,
          shortcut: "Alt+C",
          onClick: () => {
            const id = log.traceId || log.requestId || log.id || "";
            navigator.clipboard.writeText(id);
            toast.success(t("common.copied_id", { id }));
          },
        },
        {
          label: t("observability.copy_pathname"),
          icon: Globe,
          shortcut: "Alt+P",
          onClick: () => {
            if (log.pathname) {
              navigator.clipboard.writeText(log.pathname);
              toast.success(t("observability.path_copied", { path: log.pathname }));
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
  const isHttpEdge = log.serviceSource.toLowerCase().includes("kong") || log.serviceSource.toLowerCase().includes("edge");
  const isFailed = log.severity === "CRITICAL" || log.severity === "ERROR" || log.status === "FAILED";

  const renderBadge = () => {
    if (statusNum && (isHttpEdge || statusNum >= 400)) {
      return (
        <span className={`font-mono text-[11px] font-semibold ${getStatusColor(statusNum)}`}>
          {statusNum}
        </span>
      );
    }
    if (isFailed) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/20">
          FAIL
        </span>
      );
    }
    if (log.severity === "WARN") {
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          WARN
        </span>
      );
    }
    if (statusNum === 200 || log.action) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-primary/10 text-primary/80 border border-primary/20">
          OK
        </span>
      );
    }
    return <span className="text-muted-foreground/20">—</span>;
  };

  return (
    <React.Fragment>
      <div className="w-[52px] shrink-0 flex items-center">
        {renderBadge()}
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

function SeverityBadge({ severity }: { severity: string }) {
  const s = severity.toUpperCase();
  if (s === "CRITICAL") {
    return (
      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse inline-flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
        CRITICAL
      </span>
    );
  }
  if (s === "ERROR") {
    return (
      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
        ERROR
      </span>
    );
  }
  if (s === "WARN" || s === "WARNING") {
    return (
      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
        WARN
      </span>
    );
  }
  return (
    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
      INFO
    </span>
  );
}

function ImpersonationPill({ log }: { log: AuditStreamEntry }) {
  const realActor = log.realActorId || "Super Admin";
  const targetTenant = log.impersonatedTenantId || log.tenantSlug || "Target Org";
  const session = log.impersonationSessionId || "active";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 font-mono text-[9px] border border-purple-500/30 mr-1.5 shrink-0 cursor-help select-none">
            <span>🎭</span>
            <span className="font-semibold">Impersonated: {realActor}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="z-50 p-2.5 bg-popover border border-border text-foreground font-mono text-[10px] rounded-lg shadow-xl max-w-[320px] select-none [&_svg]:!hidden">
          <div className="space-y-1">
            <div className="font-bold text-purple-400 flex items-center gap-1">
              <span>🎭 Dual-Identity Security Session</span>
            </div>
            <div className="text-muted-foreground text-[9px] leading-tight">
              Action executed by <strong className="text-foreground">{realActor}</strong> on behalf of organization <strong className="text-foreground">{targetTenant}</strong>.
            </div>
            {log.impersonationSessionId && (
              <div className="text-[9px] text-muted-foreground/80 font-mono pt-1 border-t border-border/50">
                Session: {session}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ProjectPill({ log }: { log: AuditStreamEntry }) {
  const label = log.projectName || log.projectId;
  if (!label) return null;

  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary/90 font-mono text-[9px] border border-primary/20 mr-1.5 shrink-0 select-none">
      <span>📁</span>
      <span className="truncate max-w-[120px]">{label}</span>
    </span>
  );
}

function GroupCell({ logGroup }: { logGroup?: string }) {
  if (!logGroup) return <span className="text-muted-foreground/20">—</span>;
  const groupInfo = LOG_GROUPS[logGroup as keyof typeof LOG_GROUPS];
  return (
    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${
      groupInfo?.color ?? "text-muted-foreground"
    } ${groupInfo?.accentBg ?? "bg-muted/20"}`}>
      {groupInfo?.label ?? logGroup}
    </span>
  );
}

function TenantCell({ tenantSlug }: { tenantSlug?: string }) {
  if (!tenantSlug) return <span className="text-muted-foreground/20">—</span>;
  return (
    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary/80 font-mono text-[9px] border border-primary/20">
      {tenantSlug}
    </span>
  );
}

function ScopeCell({ scope }: { scope?: string }) {
  if (!scope) return <span className="text-muted-foreground/20">—</span>;
  return (
    <span className="px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground font-mono text-[9px] border border-border/50">
      {scope}
    </span>
  );
}

function ProjectCell({ projectId, projectName }: { projectId?: string; projectName?: string }) {
  const label = projectName || projectId;
  if (!label) return <span className="text-muted-foreground/20">—</span>;
  return (
    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary/80 font-mono text-[9px] border border-primary/20">
      {label}
    </span>
  );
}

function MethodCell({ method }: { method?: string }) {
  if (!method) return <span className="text-muted-foreground/20">—</span>;
  return (
    <span className={`px-1 py-0.5 rounded text-[9px] font-mono font-bold border ${getMethodColor(method)}`}>
      {method}
    </span>
  );
}

function MessageCell({
  log,
  isCritical,
  isError,
  isWarn,
  showProjectPill,
}: {
  log: AuditStreamEntry;
  isCritical: boolean;
  isError: boolean;
  isWarn: boolean;
  showProjectPill: boolean;
}) {
  const colorClass = isCritical
    ? "text-rose-400 font-semibold"
    : isError
    ? "text-rose-400"
    : isWarn
    ? "text-amber-400"
    : "text-foreground/90";

  const actorLabel = log.actor !== "system" ? log.actor : null;

  return (
    <div className="flex-1 min-w-0 font-mono text-[11px] flex items-center justify-between gap-3">
      <div className="flex items-center gap-1.5 min-w-0 truncate">
        {(log.isImpersonated || log.realActorId) && <ImpersonationPill log={log} />}
        {showProjectPill && <ProjectPill log={log} />}
        <span className={`truncate ${colorClass}`} title={log.message || log.action}>
          {getEventMessageDisplay(log)}
        </span>
      </div>
      {actorLabel && (
        <span className="text-muted-foreground/60 text-[10px] shrink-0 font-mono hidden md:inline-flex items-center gap-1">
          <span>by</span>
          <span className="text-muted-foreground/90 font-medium">{actorLabel}</span>
          {log.ip && <span className="text-muted-foreground/40 text-[9px]">({log.ip})</span>}
        </span>
      )}
    </div>
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
  const { t } = useTranslation();
  const level = getLevel(log);
  const isCritical = (log.severity || "").toUpperCase() === "CRITICAL";
  const isError = level === "error" || isCritical;
  const isWarn = level === "warning";

  const dotColorClass = isCritical
    ? "bg-rose-500 animate-ping"
    : isError
    ? "bg-rose-500"
    : isWarn
    ? "bg-amber-500"
    : "bg-primary/70";

  return (
    <UniversalContextMenu groups={buildContextMenuGroups(log, isSelected, onSelect, t)}>
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
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColorClass}`} />
        </div>

        {visibleCols.has("date") && <DateCell timestamp={log.timestamp} />}

        {visibleCols.has("source") && (
          <div className="w-[28px] shrink-0 flex items-center justify-center">
            <SourceCell source={log.serviceSource} logGroup={log.logGroup} />
          </div>
        )}

        {visibleCols.has("severity") && (
          <div className="w-[72px] shrink-0">
            <SeverityBadge severity={log.severity || "INFO"} />
          </div>
        )}

        {visibleCols.has("group") && (
          <div className="w-[88px] shrink-0 font-mono text-[10px] truncate">
            <GroupCell logGroup={log.logGroup} />
          </div>
        )}

        {visibleCols.has("status") && (
          <StatusCell status={log.status} log={log} copiedId={copiedId} onCopyLog={onCopyLog} />
        )}

        {visibleCols.has("tenant") && (
          <div className="w-[88px] shrink-0 font-mono text-[10px] truncate">
            <TenantCell tenantSlug={log.tenantSlug} />
          </div>
        )}

        {visibleCols.has("scope") && (
          <div className="w-[72px] shrink-0 font-mono text-[10px] truncate">
            <ScopeCell scope={log.scope} />
          </div>
        )}

        {visibleCols.has("project") && (
          <div className="w-[96px] shrink-0 font-mono text-[10px] truncate">
            <ProjectCell projectId={log.projectId} projectName={log.projectName} />
          </div>
        )}

        {visibleCols.has("method") && (
          <div className="w-[56px] shrink-0">
            <MethodCell method={log.method} />
          </div>
        )}

        {visibleCols.has("pathname") && (
          <div className="w-[140px] shrink-0 font-mono text-[10px] truncate text-muted-foreground/80">
            {log.pathname ? <span title={log.pathname}>{log.pathname}</span> : <span className="text-muted-foreground/20">—</span>}
          </div>
        )}

        {visibleCols.has("message") && (
          <MessageCell
            log={log}
            isCritical={isCritical}
            isError={isError}
            isWarn={isWarn}
            showProjectPill={log.scope === "PROJECT" && !visibleCols.has("project")}
          />
        )}
      </div>
    </UniversalContextMenu>
  );
}



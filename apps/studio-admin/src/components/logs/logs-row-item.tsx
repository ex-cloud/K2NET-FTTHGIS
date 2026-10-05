import React from "react";
import { format } from "date-fns";
import { Copy, Check, Sparkles, FileCode, Globe, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  UniversalContextMenu,
  type ContextMenuGroupConfig,
  Checkbox,
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
  isRowSelected?: boolean;
  onToggleSelectRow?: (id: string) => void;
  visibleCols: Set<string>;
  copiedId: string | null;
  onSelect: () => void;
  onCopyLog: (log: AuditStreamEntry, e: React.MouseEvent) => void;
}

function getStatusColor(statusNum?: number) {
  if (!statusNum) return "text-muted-foreground/40";
  if (statusNum >= 500) return "text-rose-400 font-semibold";
  if (statusNum >= 400) return "text-amber-400 font-medium";
  if (statusNum >= 200 && statusNum < 300) return "text-muted-foreground";
  return "text-muted-foreground/60";
}

function normalizeMethodDisplay(method?: string): { display: string; fullMethod: string } {
  if (!method) return { display: "—", fullMethod: "" };
  const m = method.trim();
  const upper = m.toUpperCase();
  const httpVerbs = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];
  if (httpVerbs.includes(upper)) {
    return { display: upper, fullMethod: upper };
  }
  if (m.includes(".") || m.length > 7) {
    return { display: "RPC", fullMethod: m };
  }
  return { display: upper, fullMethod: m };
}

function getMethodColor(displayMethod: string) {
  const m = displayMethod.toUpperCase();
  if (m === "POST" || m === "PUT" || m === "PATCH") return "text-sky-400 font-semibold";
  if (m === "DELETE") return "text-rose-400 font-semibold";
  if (m === "GET") return "text-muted-foreground font-medium";
  if (m === "RPC" || m === "EXEC") return "text-muted-foreground/70 font-semibold";
  return "text-muted-foreground/60";
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
    formattedDate = format(new Date(timestamp || ""), "dd MMM HH:mm:ss");
  } catch {
    // ignore
  }
  const timeDetails = getDetailedTime(timestamp ?? "");

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="w-[140px] shrink-0 text-muted-foreground/80 text-[11px] font-mono flex items-center cursor-default outline-none select-none">
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
  if (!source) return <span className="text-muted-foreground/20 select-none text-[10px]">—</span>;

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
            {getSourceIcon(source, "w-3 h-3 text-muted-foreground/80 shrink-0")}
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
  const statusNum =
    typeof status === "number"
      ? status
      : status && !isNaN(Number(status))
      ? parseInt(String(status), 10)
      : undefined;

  const renderBadge = () => {
    if (statusNum) {
      return (
        <span className={`font-mono text-[11px] tracking-tight ${getStatusColor(statusNum)}`}>
          {statusNum}
        </span>
      );
    }
    if (typeof status === "string" && status.trim() && status !== "OK" && status !== "FAIL" && status !== "WARN") {
      return (
        <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[48px]">
          {status}
        </span>
      );
    }
    return <span className="text-muted-foreground/30 font-mono text-[11px] select-none">—</span>;
  };

  return (
    <React.Fragment>
      <div className="w-[44px] shrink-0 flex items-center">
        {renderBadge()}
      </div>
      <button
        type="button"
        onClick={(e) => onCopyLog(log, e)}
        title="Copy Log JSON"
        className="w-6 shrink-0 flex items-center justify-center p-0.5 rounded hover:bg-muted/80 text-muted-foreground/40 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
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
      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 inline-flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
        CRITICAL
      </span>
    );
  }
  if (s === "ERROR") {
    return (
      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
        ERROR
      </span>
    );
  }
  if (s === "WARN" || s === "WARNING") {
    return (
      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        WARN
      </span>
    );
  }
  return (
    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono text-muted-foreground bg-muted/20 border border-border/30">
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
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-mono text-[9px] border border-purple-500/20 mr-1.5 shrink-0 cursor-help select-none">
            <span>🎭</span>
            <span className="font-semibold">{realActor}</span>
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

function BenchmarkPill() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-mono text-[9px] font-semibold border border-amber-500/20 mr-1.5 shrink-0 cursor-help select-none">
            <span>⚡</span>
            <span>TEST</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="z-50 p-2.5 bg-popover border border-border text-foreground font-mono text-[10px] rounded-lg shadow-xl max-w-[280px] select-none [&_svg]:!hidden">
          <div className="space-y-1">
            <div className="font-bold text-amber-500 flex items-center gap-1">
              <span>⚡ Synthetic Test Data</span>
            </div>
            <div className="text-muted-foreground text-[9px] leading-tight">
              This event was generated during a system stress-test or synthetic benchmark run (worker-benchmark).
            </div>
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
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground font-mono text-[9px] border border-border/50 mr-1.5 shrink-0 select-none">
      <span className="truncate max-w-[120px]">{label}</span>
    </span>
  );
}

function GroupCell({ logGroup }: { logGroup?: string }) {
  if (!logGroup) return <span className="text-muted-foreground/20">—</span>;
  const groupInfo = LOG_GROUPS[logGroup as keyof typeof LOG_GROUPS];
  return (
    <span className="text-muted-foreground/70 font-mono text-[10px] truncate" title={logGroup}>
      {groupInfo?.label ?? logGroup}
    </span>
  );
}

function TenantCell({ tenantSlug }: { tenantSlug?: string }) {
  if (!tenantSlug) return <span className="text-muted-foreground/20">—</span>;
  return (
    <span className="text-muted-foreground/80 font-mono text-[10px] truncate" title={tenantSlug}>
      {tenantSlug}
    </span>
  );
}

function ScopeCell({ scope }: { scope?: string }) {
  if (!scope) return <span className="text-muted-foreground/20">—</span>;
  return (
    <span className="text-muted-foreground/60 font-mono text-[10px] truncate" title={scope}>
      {scope}
    </span>
  );
}

function ProjectCell({ projectId, projectName }: { projectId?: string; projectName?: string }) {
  const label = projectName || projectId;
  if (!label) return <span className="text-muted-foreground/20">—</span>;
  return (
    <span className="text-muted-foreground/80 font-mono text-[10px] truncate" title={label}>
      {label}
    </span>
  );
}

function MethodCell({ method }: { method?: string }) {
  const { display, fullMethod } = normalizeMethodDisplay(method);
  if (display === "—") return <span className="text-muted-foreground/20 font-mono text-[10px] select-none">—</span>;
  return (
    <span
      className={`text-[10px] font-mono truncate block max-w-[48px] ${getMethodColor(display)}`}
      title={fullMethod !== display ? `Service Method: ${fullMethod}` : undefined}
    >
      {display}
    </span>
  );
}

function isBenchmarkEvent(log: AuditStreamEntry): boolean {
  if (log.actor && log.actor.startsWith("worker-benchmark-")) return true;
  if (log.category === "BENCHMARK") return true;
  if (log.metadata?.category === "BENCHMARK" || log.metadata?.benchmark === true) return true;
  if (log.action && log.action.includes("STRESS")) return true;
  if (log.message && log.message.includes("STRESS EVENT")) return true;
  return false;
}

function MessageCell({
  log,
  showProjectPill,
}: {
  log: AuditStreamEntry;
  showProjectPill: boolean;
}) {
  const actorLabel = log.actor !== "system" ? log.actor : null;
  const hasHashChain = Boolean(log.metadata?.hash || log.metadata?.prevHash);
  const isBenchmark = isBenchmarkEvent(log);

  return (
    <div className="flex-1 min-w-0 font-mono text-[11px] flex items-center justify-between gap-3">
      <div className="flex items-center gap-1.5 min-w-0 truncate">
        {hasHashChain && (
          <span
            title="Cryptographic Hash Chain Verified (SHA-256)"
            className="inline-flex items-center text-muted-foreground/40 shrink-0 select-none"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
          </span>
        )}
        {isBenchmark && <BenchmarkPill />}
        {(log.isImpersonated || log.realActorId) && <ImpersonationPill log={log} />}
        {showProjectPill && <ProjectPill log={log} />}
        <span className="truncate text-foreground/90 font-mono" title={log.message || log.action}>
          {getEventMessageDisplay(log)}
        </span>
      </div>
      {actorLabel && (
        <span className="text-muted-foreground/50 text-[10px] shrink-0 font-mono hidden md:inline-flex items-center gap-1 select-none">
          <span>by</span>
          <span className="text-muted-foreground/80 font-medium">{actorLabel}</span>
          {log.ip && <span className="text-muted-foreground/30 text-[9px]">({log.ip})</span>}
        </span>
      )}
    </div>
  );
}

function PathnameCell({ pathname, targetResource }: { pathname?: string; targetResource?: string }) {
  const path = pathname || targetResource;
  return (
    <div className="w-[200px] max-w-[200px] shrink-0 font-mono text-[11px] overflow-hidden truncate text-muted-foreground/80 pr-3">
      {path ? (
        <span className="truncate block" title={path}>
          {path}
        </span>
      ) : (
        <span className="text-muted-foreground/20 select-none">—</span>
      )}
    </div>
  );
}

function RowLeadingSlot({
  isRowSelected,
  logId,
  onToggleSelectRow,
  isCritical,
  isError,
  isWarn,
}: {
  isRowSelected?: boolean;
  logId: string;
  onToggleSelectRow?: (id: string) => void;
  isCritical: boolean;
  isError: boolean;
  isWarn: boolean;
}) {
  const dotColorClass = isCritical
    ? "bg-rose-500 animate-ping"
    : isError
    ? "bg-rose-500"
    : isWarn
    ? "bg-amber-500"
    : "bg-muted-foreground/40";

  return (
    <div
      className="w-[20px] mr-2.5 shrink-0 flex items-center justify-center"
      onClick={(e) => e.stopPropagation()}
    >
      <div className={isRowSelected ? "block" : "hidden group-hover:block"}>
        <Checkbox
          checked={!!isRowSelected}
          onCheckedChange={() => onToggleSelectRow?.(logId)}
          className="size-3.5 rounded-[3px]"
          aria-label="Select row"
        />
      </div>
      {!isRowSelected && (
        <span className={`w-1.5 h-1.5 rounded-full block group-hover:hidden transition-colors ${dotColorClass}`} />
      )}
    </div>
  );
}

function RowOptionalCells({
  log,
  visibleCols,
  copiedId,
  onCopyLog,
}: {
  log: AuditStreamEntry;
  visibleCols: Set<string>;
  copiedId: string | null;
  onCopyLog: (log: AuditStreamEntry, e: React.MouseEvent) => void;
}) {
  return (
    <>
      {visibleCols.has("date") && <DateCell timestamp={log.timestamp} />}

      {visibleCols.has("source") && (
        <div className="w-[20px] shrink-0 flex items-center justify-center">
          <SourceCell source={log.serviceSource} logGroup={log.logGroup} />
        </div>
      )}

      {visibleCols.has("status") && (
        <StatusCell status={log.status} log={log} copiedId={copiedId} onCopyLog={onCopyLog} />
      )}

      {visibleCols.has("severity") && (
        <div className="w-[68px] shrink-0">
          <SeverityBadge severity={log.severity || "INFO"} />
        </div>
      )}

      {visibleCols.has("group") && (
        <div className="w-[80px] shrink-0 font-mono text-[10px] truncate">
          <GroupCell logGroup={log.logGroup} />
        </div>
      )}

      {visibleCols.has("tenant") && (
        <div className="w-[80px] shrink-0 font-mono text-[10px] truncate">
          <TenantCell tenantSlug={log.tenantSlug} />
        </div>
      )}

      {visibleCols.has("scope") && (
        <div className="w-[64px] shrink-0 font-mono text-[10px] truncate">
          <ScopeCell scope={log.scope} />
        </div>
      )}

      {visibleCols.has("project") && (
        <div className="w-[88px] shrink-0 font-mono text-[10px] truncate">
          <ProjectCell projectId={log.projectId} projectName={log.projectName} />
        </div>
      )}

      {visibleCols.has("method") && (
        <div className="w-[48px] shrink-0">
          <MethodCell method={log.method} />
        </div>
      )}

      {visibleCols.has("pathname") && (
        <PathnameCell pathname={log.pathname} targetResource={log.targetResource} />
      )}
    </>
  );
}

export function LogsRowItem({
  log,
  isSelected,
  isRowSelected,
  onToggleSelectRow,
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

  const rowBgClass = isSelected
    ? "bg-primary/10 text-foreground border-l-2 border-primary"
    : isRowSelected
    ? "bg-primary/5 text-foreground"
    : "hover:bg-muted/30 text-muted-foreground hover:text-foreground";

  return (
    <UniversalContextMenu groups={buildContextMenuGroups(log, isSelected, onSelect, t)}>
      <div
        onClick={onSelect}
        className={`flex items-center px-4 py-1.5 font-mono text-[11px] transition-colors cursor-pointer group ${rowBgClass}`}
      >
        <RowLeadingSlot
          isRowSelected={isRowSelected}
          logId={log.id}
          onToggleSelectRow={onToggleSelectRow}
          isCritical={isCritical}
          isError={isError}
          isWarn={isWarn}
        />

        <RowOptionalCells
          log={log}
          visibleCols={visibleCols}
          copiedId={copiedId}
          onCopyLog={onCopyLog}
        />

        {visibleCols.has("message") && (
          <MessageCell
            log={log}
            showProjectPill={log.scope === "PROJECT" && !visibleCols.has("project")}
          />
        )}
      </div>
    </UniversalContextMenu>
  );
}


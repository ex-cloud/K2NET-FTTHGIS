import * as React from "react";
import { format } from "date-fns";
import {
  Copy,
  Check,
  Sparkles,
  FileCode,
  ShieldCheck,
  Users,
  Shield,
  CreditCard,
  Box,
  Network,
  Home,
  Wrench,
  Globe,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  UniversalContextMenu,
  type ContextMenuGroupConfig,
  Checkbox,
  getDetailedTime,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import type { TenantAuditEvent, TenantAuditScope } from "../../types/tenant-audit";

export interface TenantLogsRowItemProps {
  event: TenantAuditEvent;
  scope?: TenantAuditScope;
  isSelected: boolean;
  isRowSelected?: boolean;
  onToggleSelectRow?: (id: string) => void;
  visibleCols: Record<string, boolean>;
  copiedId: string | null;
  onSelect: () => void;
  onCopyLog: (event: TenantAuditEvent, e: React.MouseEvent) => void;
}

function getStatusColor(statusNum?: number) {
  if (!statusNum) return "text-muted-foreground/40";
  if (statusNum >= 500) return "text-rose-400 font-semibold";
  if (statusNum >= 400) return "text-amber-400 font-medium";
  if (statusNum >= 200 && statusNum < 300) return "text-muted-foreground";
  return "text-muted-foreground/60";
}

function getStatusCodeText(event: TenantAuditEvent): number {
  const s = (event.severity || "INFO").toUpperCase();
  if (s === "CRITICAL" || s === "ERROR") return 500;
  if (s === "WARN") return 400;
  if (event.action.includes("CREATE") || event.action.includes("REGISTER") || event.action.includes("ADD")) return 201;
  return 200;
}

function normalizeMethodDisplay(action?: string): string {
  if (!action) return "RPC";
  const a = action.toUpperCase();
  if (a.includes("CREATE") || a.includes("REGISTER") || a.includes("ADD")) return "POST";
  if (a.includes("UPDATE") || a.includes("EDIT") || a.includes("CHANGE")) return "PUT";
  if (a.includes("DELETE") || a.includes("REVOKE") || a.includes("REMOVE")) return "DEL";
  if (a.includes("GET") || a.includes("VIEW") || a.includes("READ")) return "GET";
  return "RPC";
}

function getMethodColor(displayMethod: string) {
  const m = displayMethod.toUpperCase();
  if (m === "POST" || m === "PUT" || m === "PATCH") return "text-sky-400";
  if (m === "DEL" || m === "DELETE") return "text-rose-400";
  if (m === "GET") return "text-muted-foreground";
  if (m === "RPC" || m === "EXEC") return "text-muted-foreground/70";
  return "text-muted-foreground/60";
}

function getCategorySourceIcon(category: string) {
  const cat = (category || "").toUpperCase();
  if (cat === "IAM" || cat === "PROJECT_ACCESS") return Users;
  if (cat === "SECURITY" || cat === "IMPERSONATION") return Shield;
  if (cat === "BILLING") return CreditCard;
  if (cat === "GIS_NODE") return Box;
  if (cat === "GIS_CABLE" || cat === "FIBER_SPLICING") return Network;
  if (cat === "CUSTOMER_HOMEPASS") return Home;
  if (cat === "FIELD_TASK") return Wrench;
  if (cat === "SPATIAL_IO" || cat === "API_INTEGRATION") return Globe;
  return Activity;
}

function buildContextMenuGroups(
  event: TenantAuditEvent,
  isSelected: boolean,
  onSelect: () => void,
  t: ReturnType<typeof useTranslation>["t"]
): ContextMenuGroupConfig[] {
  return [
    {
      items: [
        {
          label: t("observability.ask_ai_analyze_log") || "Ask AI to analyze log",
          icon: Sparkles,
          shortcut: "Ctrl+J",
          onClick: () => {
            window.dispatchEvent(
              new CustomEvent("k2net-ai-prompt-input", {
                detail: {
                  prompt: `Analisis tenant audit log [${event.category}] ${event.action} pada resource ${event.resourceType} [${event.resourceId}]. Severity: ${event.severity}, Actor: ${event.actorEmail || event.actorId}.`,
                },
              })
            );
            window.dispatchEvent(new CustomEvent("k2net-toggle-ai-assistant"));
          },
        },
        {
          label: isSelected
            ? (t("observability.close_detail_panel") || "Close detail panel")
            : (t("observability.open_detail_panel") || "Open detail panel"),
          icon: FileCode,
          shortcut: "Enter",
          onClick: onSelect,
        },
      ],
    },
    {
      items: [
        {
          label: t("observability.copy_log_json") || "Copy log JSON",
          icon: Copy,
          shortcut: "Ctrl+C",
          onClick: () => {
            navigator.clipboard.writeText(JSON.stringify(event, null, 2));
            toast.success(t("security.audit_copy_payload_success") || "Log copied to clipboard");
          },
        },
        {
          label: t("common.copy_id") || "Copy resource ID",
          icon: Copy,
          shortcut: "Alt+C",
          onClick: () => {
            const id = event.resourceId || event.id;
            navigator.clipboard.writeText(id);
            toast.success(t("common.copied_id", { id }) || `Copied ID: ${id}`);
          },
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

function SourceCell({ category }: { category?: string }) {
  if (!category) return <span className="text-muted-foreground/20 select-none text-xs">—</span>;

  const IconComp = getCategorySourceIcon(category);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex items-center justify-center cursor-default outline-none select-none">
            <IconComp className="w-4 h-4 text-muted-foreground/80 hover:text-foreground transition-colors shrink-0" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs font-mono px-2 py-1.5 bg-popover border border-border text-foreground [&_svg]:!hidden">
          <span className="flex items-center gap-1.5">
            <IconComp className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0" />
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono border border-border bg-muted/40 text-foreground">
              {category}
            </span>
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function StatusCell({
  statusNum,
  event,
  copiedId,
  onCopyLog,
}: {
  statusNum: number;
  event: TenantAuditEvent;
  copiedId: string | null;
  onCopyLog: (event: TenantAuditEvent, e: React.MouseEvent) => void;
}) {
  return (
    <React.Fragment>
      <div className="w-[44px] shrink-0 flex items-center">
        <span className={`font-mono text-xs tracking-tight ${getStatusColor(statusNum)}`}>
          {statusNum}
        </span>
      </div>
      <button
        type="button"
        onClick={(e) => onCopyLog(event, e)}
        title="Copy Log JSON"
        className="w-6 shrink-0 flex items-center justify-center p-0.5 rounded hover:bg-muted/80 text-muted-foreground/40 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
      >
        {copiedId === event.id ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
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

function MethodCell({ method }: { method: string }) {
  return (
    <span
      className={`text-[10px] font-mono font-medium truncate block max-w-[48px] ${getMethodColor(method)}`}
    >
      {method}
    </span>
  );
}

function PathnameCell({ pathname }: { pathname: string }) {
  return (
    <div className="w-[200px] max-w-[200px] shrink-0 font-mono text-[11px] overflow-hidden truncate text-muted-foreground/80 pr-3">
      {pathname ? (
        <span className="truncate block" title={pathname}>
          {pathname}
        </span>
      ) : (
        <span className="text-muted-foreground/20 select-none">—</span>
      )}
    </div>
  );
}

function ImpersonationPill({ event }: { event: TenantAuditEvent }) {
  const realActor = String(event.metadata?.impersonatedBy || event.metadata?.realActor || "Super Admin");
  const session = String(event.metadata?.impersonationSessionId || "active");

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
              Action executed by <strong className="text-foreground">{realActor}</strong> under Super Admin Impersonation.
            </div>
            {Boolean(event.metadata?.impersonationSessionId) && (
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

function ProjectPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground font-mono text-[9px] border border-border/50 mr-1.5 shrink-0 select-none">
      <span className="truncate max-w-[120px]">{label}</span>
    </span>
  );
}

function MessageCell({
  event,
  showProjectPill,
}: {
  event: TenantAuditEvent;
  showProjectPill: boolean;
}) {
  const actorLabel = event.actorEmail || (event.actorId !== "system" ? event.actorId : null);
  const isImpersonated =
  Boolean(event.metadata?.impersonatedBy) ||
  Boolean(event.metadata?.superAdmin) ||
  event.actorRole === "super_admin";
  const hasHashChain = Boolean(event.metadata?.hash || event.metadata?.prevHash);

  const rawAction = (event.action || "EVENT").replace(/_/g, " ").toUpperCase();
  const rawResType = (event.resourceType || "RESOURCE").toUpperCase();
  const rawResId = event.resourceId ? `[${event.resourceId}]` : "";
  const displayMsg = `${rawAction} ON ${rawResType} ${rawResId}`.trim();

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
        {isImpersonated && <ImpersonationPill event={event} />}
        {showProjectPill && (event.projectName || event.projectId) && (
          <ProjectPill label={event.projectName || event.projectId || ""} />
        )}
        <span className="truncate text-foreground/90 font-mono" title={displayMsg}>
          {displayMsg}
        </span>
      </div>
      {actorLabel && (
        <span className="text-muted-foreground/50 text-[10px] shrink-0 font-mono hidden md:inline-flex items-center gap-1 select-none">
          <span>by</span>
          <span className="text-muted-foreground/80 font-medium">{actorLabel}</span>
          {event.actorIp && <span className="text-muted-foreground/30 text-[9px]">({event.actorIp})</span>}
        </span>
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

export function TenantLogsRowItem({
  event,
  scope,
  isSelected,
  isRowSelected = false,
  onToggleSelectRow,
  visibleCols,
  copiedId,
  onSelect,
  onCopyLog,
}: TenantLogsRowItemProps) {
  const { t } = useTranslation();

  const severity = (event.severity || "INFO").toUpperCase();
  const isCritical = severity === "CRITICAL";
  const isError = severity === "ERROR" || isCritical;
  const isWarn = severity === "WARN" || severity === "WARNING";

  const statusCode = getStatusCodeText(event);
  const method = normalizeMethodDisplay(event.action);
  const path = `${event.resourceType.toLowerCase()}/${event.resourceId || ""}`;

  const rowBgClass = isSelected
    ? "bg-primary/10 text-foreground border-l-2 border-primary"
    : isRowSelected
    ? "bg-primary/5 text-foreground"
    : "hover:bg-muted/30 text-muted-foreground hover:text-foreground";

  return (
    <UniversalContextMenu groups={buildContextMenuGroups(event, isSelected, onSelect, t)}>
      <div
        onClick={onSelect}
        className={`flex items-center px-4 py-1.5 font-mono text-[11px] transition-colors cursor-pointer group ${rowBgClass}`}
      >
        <RowLeadingSlot
          isRowSelected={isRowSelected}
          logId={event.id}
          onToggleSelectRow={onToggleSelectRow}
          isCritical={isCritical}
          isError={isError}
          isWarn={isWarn}
        />

        {visibleCols.date !== false && <DateCell timestamp={event.occurredAt} />}

        {visibleCols.source !== false && (
          <div className="w-[24px] shrink-0 flex items-center justify-center">
            <SourceCell category={event.category} />
          </div>
        )}

        {visibleCols.status !== false && (
          <StatusCell
            statusNum={statusCode}
            event={event}
            copiedId={copiedId}
            onCopyLog={onCopyLog}
          />
        )}

        {visibleCols.severity === true && (
          <div className="w-[68px] shrink-0">
            <SeverityBadge severity={event.severity || "INFO"} />
          </div>
        )}

        {visibleCols.category === true && (
          <div className="w-[80px] shrink-0 font-mono text-[10px] truncate text-muted-foreground/80" title={event.category}>
            {event.category}
          </div>
        )}

        {visibleCols.project === true && (
          <div className="w-[88px] shrink-0 font-mono text-[10px] truncate text-muted-foreground/80" title={event.projectName || event.projectId}>
            {event.projectName || event.projectId || "—"}
          </div>
        )}

        {visibleCols.method !== false && (
          <div className="w-[48px] shrink-0">
            <MethodCell method={method} />
          </div>
        )}

        {visibleCols.pathname !== false && <PathnameCell pathname={path} />}

        {visibleCols.message !== false && (
          <MessageCell
            event={event}
            showProjectPill={scope === "ORGANIZATION" && Boolean(event.projectName || event.projectId)}
          />
        )}
      </div>
    </UniversalContextMenu>
  );
}

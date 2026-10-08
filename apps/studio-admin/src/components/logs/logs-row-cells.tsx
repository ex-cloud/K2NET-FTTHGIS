import React from "react";
import { format } from "date-fns";
import { Copy, Check } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@k2net/ui";
import { type AuditStreamEntry, LOG_GROUPS } from "@/hooks/use-audit-log-stream";
import {
  getSourceIcon,
  getDetailedTime,
} from "./logs-utils";

export function getStatusColor(statusNum?: number) {
  if (!statusNum) return "text-muted-foreground/40 font-mono";
  return "text-foreground font-mono font-semibold";
}

export function normalizeMethodDisplay(method?: string): { display: string; fullMethod: string } {
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

export function getMethodColor(displayMethod: string) {
  const m = displayMethod.toUpperCase();
  if (m === "POST" || m === "PUT" || m === "PATCH") return "text-sky-400";
  if (m === "DELETE" || m === "DEL") return "text-rose-400";
  if (m === "GET") return "text-muted-foreground";
  if (m === "RPC" || m === "EXEC") return "text-teal-400";
  return "text-muted-foreground/70";
}

export function DateCell({ timestamp }: { timestamp?: string }) {
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
          <span className="w-[140px] shrink-0 text-foreground text-xs font-mono flex items-center cursor-default outline-none select-none">
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

export function SourceCell({ source, logGroup }: { source?: string; logGroup?: string }) {
  if (!source) return <span className="text-muted-foreground/20 font-mono select-none text-xs">—</span>;

  const groupInfo = logGroup ? LOG_GROUPS[logGroup as keyof typeof LOG_GROUPS] : null;
  const colorClass = groupInfo ? `${groupInfo.color} ${groupInfo.accentBg} border-current/20` : "text-muted-foreground/60 bg-muted/20 border-border/30";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex items-center justify-center cursor-default outline-none select-none">
            {getSourceIcon(source, "w-3.5 h-3.5 text-muted-foreground/80 hover:text-foreground transition-colors shrink-0")}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs font-mono px-2 py-1.5 bg-popover border border-border text-foreground [&_svg]:!hidden">
          <span className="flex items-center gap-1.5">
            {getSourceIcon(source, "w-3.5 h-3.5 text-muted-foreground/80 shrink-0")}
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${colorClass}`}>
              {source}
            </span>
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function StatusCell({
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
        <span className={`font-mono text-xs font-semibold tracking-tight ${getStatusColor(statusNum)}`}>
          {statusNum}
        </span>
      );
    }
    if (typeof status === "string" && status.trim() && status !== "OK" && status !== "FAIL" && status !== "WARN") {
      return (
        <span className="font-mono text-xs font-semibold text-foreground truncate max-w-[48px]">
          {status}
        </span>
      );
    }
    return <span className="text-muted-foreground/30 font-mono text-xs select-none">—</span>;
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

export function SeverityBadge({ severity }: { severity: string }) {
  const s = severity.toUpperCase();
  if (s === "CRITICAL") {
    return (
      <span className="text-xs font-mono font-bold text-rose-500 inline-flex items-center gap-1 truncate">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
        CRITICAL
      </span>
    );
  }
  if (s === "ERROR") {
    return (
      <span className="text-xs font-mono font-semibold text-rose-400 truncate block">
        ERROR
      </span>
    );
  }
  if (s === "WARN" || s === "WARNING") {
    return (
      <span className="text-xs font-mono font-semibold text-amber-400 truncate block">
        WARN
      </span>
    );
  }
  return (
    <span className="text-xs font-mono font-medium text-muted-foreground truncate block">
      INFO
    </span>
  );
}

export function ImpersonationPill({ log }: { log: AuditStreamEntry }) {
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

export function BenchmarkPill() {
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

export function ProjectPill({ log }: { log: AuditStreamEntry }) {
  const label = log.projectName || log.projectId;
  if (!label) return null;

  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground font-mono text-[9px] border border-border/50 mr-1.5 shrink-0 select-none">
      <span className="truncate max-w-[120px]">{label}</span>
    </span>
  );
}

export function GroupCell({ logGroup }: { logGroup?: string }) {
  if (!logGroup) return <span className="text-muted-foreground/20 font-mono select-none text-xs">—</span>;
  const groupInfo = LOG_GROUPS[logGroup as keyof typeof LOG_GROUPS];
  return (
    <span className="text-foreground font-mono text-xs truncate block" title={logGroup}>
      {groupInfo?.label ?? logGroup}
    </span>
  );
}

export function TenantCell({ tenantSlug, tenantName }: { tenantSlug?: string; tenantName?: string }) {
  if (!tenantSlug && !tenantName) return <span className="text-muted-foreground/20 font-mono select-none text-xs">—</span>;
  const isSystem = tenantSlug === "system" || tenantName === "System Core";
  const displayName = isSystem ? "System Core" : (tenantName || tenantSlug);
  const textColor = isSystem ? "text-violet-400" : "text-sky-400";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-[90px] max-w-[90px] shrink-0 pr-2">
            <span className={`font-mono text-xs font-medium truncate block cursor-default select-none ${textColor}`}>
              {displayName}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="z-50 p-2 bg-popover border border-border text-foreground font-mono text-[10px] rounded shadow-lg select-none [&_svg]:!hidden">
          <div className="font-semibold text-foreground">{tenantName || tenantSlug}</div>
          {tenantSlug && tenantSlug !== tenantName && (
            <div className="text-[9px] text-muted-foreground">Slug: @{tenantSlug}</div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ScopeCell({ scope }: { scope?: string }) {
  if (!scope) return <span className="text-muted-foreground/20 font-mono select-none text-xs">—</span>;
  const s = scope.toUpperCase();
  let label = scope;
  let textColor = "text-muted-foreground font-medium";

  if (s === "SYSTEM_CORE" || s === "SYSTEM") {
    label = "SYSTEM";
    textColor = "text-purple-400 font-semibold";
  } else if (s === "TENANT_ADMIN" || s === "ORGANIZATION") {
    label = "TENANT";
    textColor = "text-sky-400 font-semibold";
  } else if (s === "PROJECT_WORKSPACE" || s === "PROJECT") {
    label = "PROJECT";
    textColor = "text-amber-400 font-semibold";
  } else if (s === "NETWORK_GIS" || s === "GIS" || s === "NETWORK") {
    label = "GIS NET";
    textColor = "text-primary font-semibold";
  } else if (s === "BILLING_SUBSCRIPTION" || s === "BILLING") {
    label = "BILLING";
    textColor = "text-indigo-400 font-semibold";
  }

  return (
    <div className="w-[72px] max-w-[72px] shrink-0 pr-2">
      <span className={`font-mono text-xs truncate block select-none ${textColor}`} title={`Scope: ${scope}`}>
        {label}
      </span>
    </div>
  );
}

export function ProjectCell({ projectId, projectName }: { projectId?: string; projectName?: string }) {
  const label = projectName || projectId;
  if (!label) return <span className="text-muted-foreground/20 font-mono select-none text-xs">—</span>;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-[100px] max-w-[100px] shrink-0 pr-2">
            <span
              className="text-foreground font-mono text-xs truncate block cursor-default select-none"
              title={label}
            >
              {label}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="z-50 p-2.5 bg-popover border border-border text-foreground font-mono text-[10px] rounded-lg shadow-xl max-w-[300px] select-none [&_svg]:!hidden"
        >
          <div className="space-y-1">
            <div className="text-muted-foreground font-semibold">Project:</div>
            {projectName && (
              <div className="font-bold text-foreground text-[11px]">{projectName}</div>
            )}
            {projectId && (
              <div className="text-[9px] text-muted-foreground/80 font-mono break-all pt-0.5 border-t border-border/40">
                ID: {projectId}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function MethodCell({ method }: { method?: string }) {
  const { display, fullMethod } = normalizeMethodDisplay(method);
  if (display === "—") return <span className="text-muted-foreground/20 font-mono text-xs select-none">—</span>;
  return (
    <span
      className={`text-xs font-mono font-medium truncate block ${getMethodColor(display)}`}
      title={fullMethod !== display ? `Service Method: ${fullMethod}` : undefined}
    >
      {display}
    </span>
  );
}

export function PathnameCell({
  pathname,
  targetResource,
}: {
  pathname?: string;
  targetResource?: string;
}) {
  const path = pathname || targetResource;

  if (!path) {
    return (
      <div className="w-[240px] max-w-[240px] shrink-0 font-mono text-xs pr-3 flex items-center">
        <span className="text-muted-foreground/20 font-mono select-none">—</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-[240px] max-w-[240px] shrink-0 font-mono text-xs overflow-hidden pr-3 flex items-center cursor-default select-none">
            <span className="truncate text-foreground/90 font-mono block">
              {path}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="z-50 p-2.5 bg-popover border border-border text-foreground font-mono text-[10px] rounded-lg shadow-xl max-w-[380px] select-none [&_svg]:!hidden"
        >
          <div className="space-y-1">
            <div className="space-y-0.5">
              <div className="text-muted-foreground font-semibold">Pathname:</div>
              <div className="text-foreground/90 break-all text-[10px] bg-muted/40 p-1 rounded border border-border/40">
                {path}
              </div>
            </div>
            {targetResource && targetResource !== path && (
              <div className="text-[9px] text-muted-foreground pt-1 border-t border-border/40">
                Target Resource: {targetResource}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

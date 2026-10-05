import {
  ShieldAlert,
  User,
  Layers,
  Building,
  Radio,
  FileCode,
  Network,
} from "lucide-react";
import { Badge, LogsRowContainer } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import type { TenantAuditEvent } from "../../types/tenant-audit";

interface TenantAuditRowProps {
  event: TenantAuditEvent;
  isSelected?: boolean;
  onSelect: (event: TenantAuditEvent) => void;
}

function getCategoryIcon(category: string, resourceType: string) {
  const cat = (category || "").toUpperCase();
  const res = (resourceType || "").toUpperCase();

  if (res === "ODP" || res === "ODC") return <Radio className="h-3 w-3" />;
  if (res.includes("CABLE") || res.includes("FIBER")) return <Network className="h-3 w-3" />;
  if (cat === "IAM" || cat === "TEAM" || res === "USER") return <User className="h-3 w-3" />;
  if (cat === "SECURITY") return <ShieldAlert className="h-3 w-3" />;
  if (cat === "NETWORK" || res === "PROJECT") return <Layers className="h-3 w-3" />;
  return <Building className="h-3 w-3" />;
}

function getSeverityBadge(severity: string) {
  const sev = (severity || "INFO").toUpperCase();
  switch (sev) {
    case "CRITICAL":
      return (
        <Badge variant="outline" className="text-[9px] font-mono bg-destructive/10 text-destructive border-destructive/30 uppercase">
          CRITICAL
        </Badge>
      );
    case "ERROR":
      return (
        <Badge variant="outline" className="text-[9px] font-mono bg-destructive/10 text-destructive border-destructive/20 uppercase">
          ERROR
        </Badge>
      );
    case "WARN":
      return (
        <Badge variant="outline" className="text-[9px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 uppercase">
          WARN
        </Badge>
      );
    case "INFO":
    default:
      return (
        <Badge variant="outline" className="text-[9px] font-mono bg-primary/10 text-primary border-primary/20 uppercase">
          INFO
        </Badge>
      );
  }
}

export function TenantAuditRow({ event, isSelected, onSelect }: TenantAuditRowProps) {
  const { t, formatDate } = useTranslation();

  const isImpersonated =
    !!event.metadata?.impersonatedBy ||
    !!event.metadata?.superAdmin ||
    event.actorRole === "super_admin";

  const dateObj = new Date(event.occurredAt);
  const formattedTime = dateObj.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const formattedDate = formatDate(dateObj);

  return (
    <LogsRowContainer
      isSelected={isSelected}
      onClick={() => onSelect(event)}
      className="cursor-pointer hover:bg-muted/40 transition-colors border-b border-border/40 text-xs py-2 px-3"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
        {/* Left Side: Time, Scope, Action, Resource */}
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          {/* Timestamp */}
          <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground whitespace-nowrap min-w-[130px]">
            <span className="font-semibold text-foreground/80">{formattedTime}</span>
            <span className="text-[10px] opacity-75">{formattedDate}</span>
          </div>

          {/* Scope Badge */}
          {event.scope === "PROJECT" ? (
            <Badge
              variant="outline"
              className="text-[9px] font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 px-1.5 py-0"
            >
              PROJ{event.projectName ? `: ${event.projectName}` : ""}
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-[9px] font-mono bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 px-1.5 py-0"
            >
              ORG
            </Badge>
          )}

          {/* Action Badge */}
          <Badge
            variant="outline"
            className="text-[10px] font-mono font-semibold bg-muted/60 text-foreground border-border/60 px-2 py-0.5"
          >
            {event.action}
          </Badge>

          {/* Resource Icon & Identifier */}
          <div className="flex items-center gap-1.5 text-xs text-foreground/90 font-mono truncate max-w-xs">
            <span className="text-muted-foreground">
              {getCategoryIcon(event.category, event.resourceType)}
            </span>
            <span className="text-muted-foreground text-[11px]">{event.resourceType}:</span>
            <span className="font-semibold text-foreground truncate">{event.resourceId}</span>
          </div>

          {/* Impersonation Indicator */}
          {isImpersonated && (
            <Badge
              variant="outline"
              className="text-[9px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 gap-1 animate-pulse"
            >
              {t("security.audit_impersonated_badge")}
            </Badge>
          )}
        </div>

        {/* Right Side: Actor, Severity */}
        <div className="flex items-center gap-3 shrink-0 ml-auto sm:ml-0">
          {/* Actor Info */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground max-w-[200px] truncate">
            <User className="h-3 w-3 shrink-0 text-muted-foreground/70" />
            <span className="truncate text-foreground/80">
              {event.actorEmail || event.actorId}
            </span>
            {event.actorRole && (
              <span className="text-[9px] px-1 py-0.2 rounded bg-muted text-muted-foreground border border-border/40">
                {event.actorRole}
              </span>
            )}
          </div>

          {/* Severity Badge */}
          {getSeverityBadge(event.severity)}

          {/* Details Pill */}
          <div className="text-muted-foreground hover:text-foreground">
            <FileCode className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </LogsRowContainer>
  );
}

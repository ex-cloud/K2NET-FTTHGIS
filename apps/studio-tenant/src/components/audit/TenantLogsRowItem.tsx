import * as React from "react";
import { format } from "date-fns";
import { Copy, Radio, Network, User, Building, Shield, Check } from "lucide-react";
import { Checkbox } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { toast } from "sonner";
import type { TenantAuditEvent } from "../../types/tenant-audit";

export interface TenantLogsRowItemProps {
  event: TenantAuditEvent;
  isSelected: boolean;
  isRowSelected?: boolean;
  onToggleSelectRow?: (id: string) => void;
  visibleCols: Record<string, boolean>;
  onSelect: () => void;
}

function getCategoryIcon(category: string, resourceType: string) {
  const cat = (category || "").toUpperCase();
  const res = (resourceType || "").toUpperCase();

  if (res === "ODP" || res === "ODC") return <Radio className="h-3 w-3 text-sky-400" />;
  if (res.includes("CABLE") || res.includes("FIBER")) return <Network className="h-3 w-3 text-emerald-400" />;
  if (cat === "IAM" || cat === "TEAM" || res === "USER") return <User className="h-3 w-3 text-purple-400" />;
  if (cat === "SECURITY") return <Shield className="h-3 w-3 text-amber-400" />;
  return <Building className="h-3 w-3 text-muted-foreground" />;
}

function getSeverityDot(severity?: string) {
  const s = (severity || "INFO").toUpperCase();
  if (s === "CRITICAL") return "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse";
  if (s === "ERROR") return "bg-red-500";
  if (s === "WARN") return "bg-amber-500";
  return "bg-primary";
}

function getStatusCodeColor(severity?: string) {
  const s = (severity || "INFO").toUpperCase();
  if (s === "CRITICAL" || s === "ERROR") return "text-rose-400 bg-rose-500/10 border-rose-500/20";
  if (s === "WARN") return "text-amber-400 bg-amber-500/10 border-amber-500/20";
  return "text-muted-foreground bg-muted/40 border-border/40";
}

function getStatusCodeText(event: TenantAuditEvent) {
  const s = (event.severity || "INFO").toUpperCase();
  if (s === "CRITICAL" || s === "ERROR") return 500;
  if (s === "WARN") return 400;
  if (event.action.includes("CREATE") || event.action.includes("REGISTER")) return 201;
  return 200;
}

function normalizeActionDisplay(action: string): string {
  if (!action) return "RPC";
  const a = action.toUpperCase();
  if (a.includes("CREATE") || a.includes("REGISTER") || a.includes("ADD")) return "POST";
  if (a.includes("UPDATE") || a.includes("EDIT") || a.includes("CHANGE")) return "PUT";
  if (a.includes("DELETE") || a.includes("REVOKE") || a.includes("REMOVE")) return "DEL";
  if (a.includes("GET") || a.includes("VIEW")) return "GET";
  return "RPC";
}

function getActionColor(actionMethod: string) {
  if (actionMethod === "POST" || actionMethod === "PUT") return "text-sky-400 font-semibold";
  if (actionMethod === "DEL") return "text-rose-400 font-semibold";
  if (actionMethod === "GET") return "text-muted-foreground font-medium";
  return "text-muted-foreground/70 font-semibold";
}

export function TenantLogsRowItem({
  event,
  isSelected,
  isRowSelected = false,
  onToggleSelectRow,
  visibleCols,
  onSelect,
}: TenantLogsRowItemProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = React.useState(false);

  const isImpersonated =
    !!event.metadata?.impersonatedBy ||
    !!event.metadata?.superAdmin ||
    event.actorRole === "super_admin";

  let formattedDate = event.occurredAt;
  try {
    formattedDate = format(new Date(event.occurredAt), "dd MMM HH:mm:ss");
  } catch {
    // fallback
  }

  const statusCode = getStatusCodeText(event);
  const statusColor = getStatusCodeColor(event.severity);
  const actionMethod = normalizeActionDisplay(event.action);
  const actionColor = getActionColor(actionMethod);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(event, null, 2));
    setCopied(true);
    toast.success(t("security.audit_copy_payload_success"));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={onSelect}
      className={`group flex items-center px-4 py-1.5 hover:bg-muted/30 transition-colors font-mono text-[11px] border-b border-border/20 cursor-pointer select-none ${
        isSelected ? "bg-muted/50 border-l-2 border-l-primary" : ""
      }`}
    >
      {/* Checkbox Column */}
      <div
        className="w-[20px] mr-2.5 shrink-0 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={isRowSelected}
          onCheckedChange={() => onToggleSelectRow?.(event.id)}
          className="size-3.5 rounded-[3px]"
          aria-label={`Select log ${event.id}`}
        />
      </div>

      {/* Timestamp */}
      {visibleCols.date !== false && (
        <div className="w-[140px] shrink-0 text-muted-foreground/80 flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getSeverityDot(event.severity)}`} />
          <span className="truncate">{formattedDate}</span>
        </div>
      )}

      {/* Status Code / Badge */}
      {visibleCols.status !== false && (
        <div className="w-[44px] shrink-0 flex items-center justify-start mr-2">
          <span className={`text-[10px] font-bold px-1 py-0.2 rounded border font-mono ${statusColor}`}>
            {statusCode}
          </span>
        </div>
      )}

      {/* Action / Method (e.g. RPC, POST, PUT, DEL) */}
      {visibleCols.method !== false && (
        <div className={`w-[48px] shrink-0 font-mono ${actionColor}`}>
          {actionMethod}
        </div>
      )}

      {/* Path / Resource Identifier */}
      {visibleCols.pathname !== false && (
        <div className="w-[200px] shrink-0 truncate flex items-center gap-1.5 text-foreground/80 pr-2">
          <span className="shrink-0">{getCategoryIcon(event.category, event.resourceType)}</span>
          <span className="truncate font-mono text-muted-foreground/90">
            {event.resourceType.toLowerCase()}/{event.resourceId}
          </span>
        </div>
      )}

      {/* Event Message & Impersonation Pill */}
      {visibleCols.message !== false && (
        <div className="flex-1 min-w-0 flex items-center gap-2 pr-3">
          <span className="truncate text-foreground font-sans font-medium text-xs">
            {event.action.replace(/_/g, " ")} on {event.resourceType} [{event.resourceId}]
          </span>

          {isImpersonated && (
            <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              {t("security.audit_impersonated_badge")}
            </span>
          )}
        </div>
      )}

      {/* Actor / Role / IP */}
      {visibleCols.actor !== false && (
        <div className="w-[200px] shrink-0 text-right truncate text-muted-foreground/70 text-[10px] flex items-center justify-end gap-1.5">
          <span className="truncate">
            by <strong className="text-foreground/80 font-mono font-medium">{event.actorEmail || event.actorId}</strong>
          </span>
          <span className="text-muted-foreground/50">({event.actorIp || "127.0.0.1"})</span>

          <button
            type="button"
            onClick={handleCopy}
            title="Copy Log JSON"
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-opacity cursor-pointer ml-1"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      )}
    </div>
  );
}

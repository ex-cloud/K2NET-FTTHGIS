import React from "react";
import {
  Copy,
  Check,
  Building2,
  FolderKanban,
  Layers,
  History,
  ShieldCheck,
  Plus,
  Minus,
} from "lucide-react";
import { cn } from "@k2net/ui";
import { type AuditStreamEntry } from "@/hooks/use-audit-log-stream";
import { getSourceIcon, getLevel } from "./logs-utils";
import { useTranslation } from "@k2net/i18n";
import { type AdvancedFilter } from "./logs-filter-context";

export function DrawerStatusBar({
  hash,
  isImpersonated,
  realActorId,
  actor,
  tenantSlug,
  onCopyValue,
  copiedKey,
}: {
  hash?: string;
  isImpersonated?: boolean;
  realActorId?: string;
  actor?: string;
  tenantSlug?: string;
  onCopyValue: (key: string, value: string) => void;
  copiedKey: string | null;
}) {
  if (!hash && !isImpersonated) return null;

  return (
    <div className="border-b border-border/50 bg-muted/15 p-2 px-3.5 space-y-1.5 shrink-0 select-none">
      {hash && (
        <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 min-w-0">
            <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="font-bold text-[10px] uppercase tracking-wider text-foreground">
              SHA-256 Verified
            </span>
            <span className="text-[10px] text-muted-foreground truncate hidden sm:inline" title={hash}>
              • {hash.slice(0, 16)}...{hash.slice(-8)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onCopyValue("SHA-256 Hash", hash)}
            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground font-sans px-1.5 py-0.5 rounded border border-border/50 bg-card hover:bg-muted transition-colors cursor-pointer shrink-0 shadow-2xs"
            title="Copy full SHA-256 hash"
          >
            {copiedKey === "SHA-256 Hash" ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
            <span>{copiedKey === "SHA-256 Hash" ? "Copied" : "Copy Hash"}</span>
          </button>
        </div>
      )}

      {isImpersonated && (
        <div className="flex items-center justify-between gap-2 text-[10px] font-mono pt-1 border-t border-border/30">
          <div className="flex items-center gap-1.5 text-purple-400">
            <span>🎭</span>
            <span className="font-bold">Impersonation:</span>
            <span className="text-foreground">{realActorId || actor}</span>
            <span className="text-muted-foreground">→</span>
            <span className="text-purple-300 font-semibold">{tenantSlug || "N/A"}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function OverviewTableRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group flex items-center justify-between p-2 px-3 hover:bg-muted/30 transition-colors">
      <span className="w-[32%] text-muted-foreground font-medium shrink-0">{label}</span>
      <div className="w-[68%] flex items-center justify-between gap-1 min-w-0 font-mono text-xs">
        {children}
      </div>
    </div>
  );
}

function OverviewBasicInfoSection({
  log,
  level,
  onCopyValue,
  copiedKey,
  onQuickFilter,
  t,
}: {
  log: AuditStreamEntry;
  level: string;
  onCopyValue: (k: string, v: string) => void;
  copiedKey: string | null;
  onQuickFilter: (f: AdvancedFilter["field"], v: string, op?: AdvancedFilter["operator"]) => void;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const isCritical = (log.severity || "").toUpperCase() === "CRITICAL";
  const isError = (log.severity || level).toUpperCase() === "ERROR" || isCritical;
  const isWarning =
    (log.severity || level).toUpperCase() === "WARNING" ||
    (log.severity || level).toUpperCase() === "WARN";

  return (
    <>
      <OverviewTableRow label={t("observability.event_id") || "Event ID"}>
        <span className="truncate text-foreground" title={log.id}>{log.id}</span>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onCopyValue("Event ID", log.id)}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            title="Copy Event ID"
          >
            {copiedKey === "Event ID" ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </OverviewTableRow>

      <OverviewTableRow label={t("observability.timestamp") || "Timestamp"}>
        <span className="truncate text-foreground">{log.timestamp}</span>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onCopyValue("Timestamp", log.timestamp)}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            title="Copy Timestamp"
          >
            {copiedKey === "Timestamp" ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </OverviewTableRow>

      <OverviewTableRow label="Severity & Level">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "w-2 h-2 rounded-full shrink-0",
              isCritical ? "bg-rose-500 animate-pulse" : isError ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-muted-foreground/60"
            )}
          />
          <span className="font-bold font-mono text-foreground text-xs">
            {log.severity || level.toUpperCase()}
          </span>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => onQuickFilter("severity", log.severity || level.toUpperCase(), "eq")}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            title="Filter for this severity"
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => onQuickFilter("severity", log.severity || level.toUpperCase(), "neq")}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            title="Exclude this severity"
          >
            <Minus className="w-3 h-3" />
          </button>
        </div>
      </OverviewTableRow>

      <OverviewTableRow label={t("observability.action_type") || "Action"}>
        <span className="font-semibold text-foreground truncate" title={log.action}>{log.action}</span>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => onQuickFilter("actor", log.action, "ilike")}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            title="Filter for this action"
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => onCopyValue("Action", log.action)}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            title="Copy Action"
          >
            {copiedKey === "Action" ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </OverviewTableRow>
    </>
  );
}

function OverviewContextSection({
  log,
  onQuickFilter,
  t,
}: {
  log: AuditStreamEntry;
  onQuickFilter: (f: AdvancedFilter["field"], v: string, op?: AdvancedFilter["operator"]) => void;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  return (
    <>
      {log.serviceSource && (
        <OverviewTableRow label={t("observability.service_source") || "Service Source"}>
          <span className="flex items-center gap-1.5 text-foreground truncate">
            {getSourceIcon(log.serviceSource)}
            <span>{log.serviceSource}</span>
          </span>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => onQuickFilter("serviceSource", log.serviceSource || "", "eq")}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              title="Filter for this source"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </OverviewTableRow>
      )}

      {log.tenantSlug && (
        <OverviewTableRow label={t("observability.tenant") || "Tenant"}>
          <span className="flex items-center gap-1.5 text-foreground truncate">
            <Building2 className="w-3 h-3 text-muted-foreground" />
            <span>{log.tenantSlug}</span>
          </span>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => onQuickFilter("tenantSlug", log.tenantSlug || "", "eq")}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              title="Filter for this tenant"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </OverviewTableRow>
      )}

      {log.scope && (
        <OverviewTableRow label="Scope">
          <span className="flex items-center gap-1.5 text-foreground truncate">
            <FolderKanban className="w-3 h-3 text-muted-foreground" />
            <span>{log.scope}</span>
            {log.projectName && <span className="text-muted-foreground">({log.projectName})</span>}
          </span>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => onQuickFilter("scope", log.scope || "", "eq")}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              title="Filter for this scope"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </OverviewTableRow>
      )}

      <OverviewTableRow label={t("observability.col_actor") || "Actor"}>
        <span className="text-foreground truncate" title={log.actor}>{log.actor}</span>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => onQuickFilter("actor", log.actor, "ilike")}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            title="Filter for this actor"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </OverviewTableRow>
    </>
  );
}

function OverviewNetworkSection({
  log,
  onCopyValue,
  copiedKey,
}: {
  log: AuditStreamEntry;
  onCopyValue: (k: string, v: string) => void;
  copiedKey: string | null;
}) {
  const hasHttp = Boolean(log.method || log.status || log.pathname);
  if (!hasHttp && !log.ip) return null;

  return (
    <>
      {hasHttp && (
        <>
          <OverviewTableRow label="HTTP Request">
            <div className="flex items-center gap-2 font-mono text-xs">
              {log.method && (
                <span className="px-1.5 py-0.2 rounded border border-border/60 bg-muted/40 font-bold text-[10px]">
                  {log.method}
                </span>
              )}
              {log.status && (
                <span
                  className={cn(
                    "font-bold text-xs",
                    Number(log.status) >= 500 ? "text-rose-400" : Number(log.status) >= 400 ? "text-amber-400" : "text-foreground"
                  )}
                >
                  {log.status}
                </span>
              )}
            </div>
          </OverviewTableRow>

          {log.pathname && (
            <div className="group flex items-start justify-between p-2 px-3 hover:bg-muted/30 transition-colors">
              <span className="w-[32%] text-muted-foreground font-medium shrink-0 mt-0.5">Pathname</span>
              <div className="w-[68%] flex items-start justify-between gap-1 min-w-0 font-mono text-xs">
                <span className="text-foreground break-all">{log.pathname}</span>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onCopyValue("Pathname", log.pathname || "")}
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Copy Pathname"
                  >
                    {copiedKey === "Pathname" ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {log.ip && (
        <OverviewTableRow label="Client IP">
          <span className="text-foreground">{log.ip}</span>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onCopyValue("Client IP", log.ip || "")}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              title="Copy Client IP"
            >
              {copiedKey === "Client IP" ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </OverviewTableRow>
      )}
    </>
  );
}

export function OverviewTab({
  log,
  onCopyValue,
  copiedKey,
  onQuickFilter,
}: {
  log: AuditStreamEntry;
  onCopyValue: (k: string, v: string) => void;
  copiedKey: string | null;
  onQuickFilter: (f: AdvancedFilter["field"], v: string, op?: AdvancedFilter["operator"]) => void;
}) {
  const { t } = useTranslation();
  const level = getLevel(log);

  return (
    <div className="space-y-4">
      <div className="border border-border/60 rounded-lg overflow-hidden bg-card divide-y divide-border/40">
        <OverviewBasicInfoSection
          log={log}
          level={level}
          onCopyValue={onCopyValue}
          copiedKey={copiedKey}
          onQuickFilter={onQuickFilter}
          t={t}
        />
        <OverviewContextSection
          log={log}
          onQuickFilter={onQuickFilter}
          t={t}
        />
        <OverviewNetworkSection
          log={log}
          onCopyValue={onCopyValue}
          copiedKey={copiedKey}
        />
      </div>

      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
          {t("observability.event_message") || "Event Message / Details"}
        </span>
        <div className="bg-muted/20 p-3 rounded-lg border border-border/60 font-mono text-xs text-foreground break-all whitespace-pre-wrap select-text leading-relaxed">
          {log.message}
        </div>
      </div>
    </div>
  );
}

export function MetadataDiffTab({ log }: { log: AuditStreamEntry }) {
  return (
    <div className="space-y-4">
      {(log.oldValue || log.newValue) && (
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Data Mutation Diff</span>
          </span>
          <div className="grid grid-cols-1 gap-2 font-mono text-xs">
            {log.oldValue && (
              <div className="bg-rose-500/5 border border-rose-500/20 rounded-md p-2.5 space-y-1">
                <div className="text-rose-400 font-bold text-[10px] uppercase tracking-wider">- Old Value (Before)</div>
                <pre className="text-rose-300/90 overflow-x-auto whitespace-pre-wrap text-[11px]">
                  {JSON.stringify(log.oldValue, null, 2)}
                </pre>
              </div>
            )}
            {log.newValue && (
              <div className="bg-muted/30 border border-border/60 rounded-md p-2.5 space-y-1">
                <div className="text-foreground font-bold text-[10px] uppercase tracking-wider">+ New Value (After)</div>
                <pre className="text-foreground/90 overflow-x-auto whitespace-pre-wrap text-[11px]">
                  {JSON.stringify(log.newValue, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {log.metadata && Object.keys(log.metadata).length > 0 ? (
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Extended Metadata Fields</span>
          </span>
          <div className="border border-border/60 rounded-lg overflow-hidden bg-card divide-y divide-border/40 font-mono text-xs">
            {Object.entries(log.metadata)
              .filter(
                ([k]) =>
                  ![
                    "oldValue",
                    "newValue",
                    "isImpersonated",
                    "realActorId",
                    "impersonationSessionId",
                    "impersonatedTenantId",
                    "scope",
                    "projectId",
                    "projectName",
                    "severity",
                    "logGroup",
                  ].includes(k)
              )
              .map(([key, val]) => (
                <div key={key} className="flex items-start justify-between p-2 px-3 gap-2 hover:bg-muted/30">
                  <span className="text-muted-foreground font-medium shrink-0">{key}:</span>
                  <span className="text-foreground text-right break-all">
                    {typeof val === "object" && val !== null ? JSON.stringify(val) : String(val)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div className="p-6 text-center text-muted-foreground border border-dashed border-border/60 rounded-lg font-sans text-xs">
          No extended metadata attached to this audit event.
        </div>
      )}
    </div>
  );
}

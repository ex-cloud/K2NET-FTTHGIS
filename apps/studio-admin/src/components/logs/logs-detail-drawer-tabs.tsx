import React from "react";
import {
  Building2,
  FolderKanban,
  Plus,
  Minus,
} from "lucide-react";
import {
  cn,
  LogsDetailDrawerStatusBar,
  LogsDetailOverviewTable,
  LogsDetailOverviewRow,
  LogsDetailMessageBox,
  LogsDetailDiffSection,
  LogsDetailMetadataFields,
} from "@k2net/ui";
import { type AuditStreamEntry } from "@/hooks/use-audit-log-stream";
import { getSourceIcon, getLevel } from "./logs-utils";
import { useTranslation } from "@k2net/i18n";
import { type AdvancedFilter } from "./logs-filter-context";

export { LogsDetailDrawerStatusBar as DrawerStatusBar };

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
      <LogsDetailOverviewRow
        label={t("observability.event_id") || "Event ID"}
        copyValue={log.id}
        onCopyValue={onCopyValue}
        copiedKey={copiedKey}
      >
        <span className="truncate text-foreground" title={log.id}>{log.id}</span>
      </LogsDetailOverviewRow>

      <LogsDetailOverviewRow
        label={t("observability.timestamp") || "Timestamp"}
        copyValue={log.timestamp}
        onCopyValue={onCopyValue}
        copiedKey={copiedKey}
      >
        <span className="truncate text-foreground">{log.timestamp}</span>
      </LogsDetailOverviewRow>

      <LogsDetailOverviewRow
        label="Severity & Level"
        quickActionSlot={
          <div className="flex items-center gap-0.5">
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
        }
      >
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
      </LogsDetailOverviewRow>

      <LogsDetailOverviewRow
        label={t("observability.action_type") || "Action"}
        copyValue={log.action}
        onCopyValue={onCopyValue}
        copiedKey={copiedKey}
        quickActionSlot={
          <button
            type="button"
            onClick={() => onQuickFilter("actor", log.action, "ilike")}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            title="Filter for this action"
          >
            <Plus className="w-3 h-3" />
          </button>
        }
      >
        <span className="font-semibold text-foreground truncate" title={log.action}>{log.action}</span>
      </LogsDetailOverviewRow>
    </>
  );
}

function OverviewContextSection({
  log,
  onCopyValue,
  copiedKey,
  onQuickFilter,
  t,
}: {
  log: AuditStreamEntry;
  onCopyValue: (k: string, v: string) => void;
  copiedKey: string | null;
  onQuickFilter: (f: AdvancedFilter["field"], v: string, op?: AdvancedFilter["operator"]) => void;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  return (
    <>
      {log.serviceSource && (
        <LogsDetailOverviewRow
          label={t("observability.service_source") || "Service Source"}
          copyValue={log.serviceSource}
          onCopyValue={onCopyValue}
          copiedKey={copiedKey}
          quickActionSlot={
            <button
              type="button"
              onClick={() => onQuickFilter("serviceSource", log.serviceSource || "", "eq")}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              title="Filter for this source"
            >
              <Plus className="w-3 h-3" />
            </button>
          }
        >
          <span className="flex items-center gap-1.5 text-foreground truncate">
            {getSourceIcon(log.serviceSource)}
            <span>{log.serviceSource}</span>
          </span>
        </LogsDetailOverviewRow>
      )}

      {(log.tenantSlug || log.tenantName) && (
        <LogsDetailOverviewRow
          label={t("observability.tenant") || "Tenant"}
          copyValue={log.tenantName || log.tenantSlug}
          onCopyValue={onCopyValue}
          copiedKey={copiedKey}
          quickActionSlot={
            <button
              type="button"
              onClick={() => onQuickFilter("tenantSlug", log.tenantSlug || "", "eq")}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              title="Filter for this tenant"
            >
              <Plus className="w-3 h-3" />
            </button>
          }
        >
          <div className="flex items-center gap-1.5 text-foreground truncate">
            <Building2 className="w-3 h-3 text-muted-foreground shrink-0" />
            <span className="font-medium truncate">{log.tenantName || log.tenantSlug}</span>
            {log.tenantSlug && log.tenantSlug !== "system" && log.tenantSlug !== log.tenantName && (
              <span className="text-[10px] text-muted-foreground font-mono">(@{log.tenantSlug})</span>
            )}
          </div>
        </LogsDetailOverviewRow>
      )}

      {log.scope && (
        <LogsDetailOverviewRow
          label="Scope"
          copyValue={log.scope}
          onCopyValue={onCopyValue}
          copiedKey={copiedKey}
          quickActionSlot={
            <button
              type="button"
              onClick={() => onQuickFilter("scope", log.scope || "", "eq")}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              title="Filter for this scope"
            >
              <Plus className="w-3 h-3" />
            </button>
          }
        >
          <div className="flex items-center gap-1.5 text-foreground truncate">
            <FolderKanban className="w-3 h-3 text-muted-foreground shrink-0" />
            <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded border border-border/60 bg-muted/40 text-foreground">
              {log.scope}
            </span>
          </div>
        </LogsDetailOverviewRow>
      )}

      {(log.projectName || log.projectId) && (
        <LogsDetailOverviewRow
          label="Project"
          copyValue={log.projectId || log.projectName}
          onCopyValue={onCopyValue}
          copiedKey={copiedKey}
          quickActionSlot={
            log.projectId ? (
              <button
                type="button"
                onClick={() => onQuickFilter("projectId", log.projectId || "", "eq")}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                title="Filter for this project"
              >
                <Plus className="w-3 h-3" />
              </button>
            ) : undefined
          }
        >
          <div className="flex items-center gap-1.5 text-foreground truncate">
            <span className="font-semibold text-foreground truncate">
              {log.projectName || log.projectId}
            </span>
            {log.projectId && log.projectName && (
              <span className="text-[10px] text-muted-foreground font-mono truncate" title={log.projectId}>
                (ID: {log.projectId.slice(0, 8)}...)
              </span>
            )}
          </div>
        </LogsDetailOverviewRow>
      )}

      <LogsDetailOverviewRow
        label={t("observability.col_actor") || "Actor"}
        copyValue={log.actor}
        onCopyValue={onCopyValue}
        copiedKey={copiedKey}
        quickActionSlot={
          <button
            type="button"
            onClick={() => onQuickFilter("actor", log.actor, "ilike")}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            title="Filter for this actor"
          >
            <Plus className="w-3 h-3" />
          </button>
        }
      >
        <span className="text-foreground truncate" title={log.actor}>{log.actor}</span>
      </LogsDetailOverviewRow>
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
          <LogsDetailOverviewRow label="HTTP Request">
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
          </LogsDetailOverviewRow>

          {log.pathname && (
            <LogsDetailOverviewRow
              label="Pathname"
              copyValue={log.pathname}
              onCopyValue={onCopyValue}
              copiedKey={copiedKey}
              breakAll
            >
              <span>{log.pathname}</span>
            </LogsDetailOverviewRow>
          )}
        </>
      )}

      {log.ip && (
        <LogsDetailOverviewRow
          label="Client IP"
          copyValue={log.ip}
          onCopyValue={onCopyValue}
          copiedKey={copiedKey}
        >
          <span>{log.ip}</span>
        </LogsDetailOverviewRow>
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
      <LogsDetailOverviewTable>
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
          onCopyValue={onCopyValue}
          copiedKey={copiedKey}
          onQuickFilter={onQuickFilter}
          t={t}
        />
        <OverviewNetworkSection
          log={log}
          onCopyValue={onCopyValue}
          copiedKey={copiedKey}
        />
      </LogsDetailOverviewTable>

      <LogsDetailMessageBox
        label={t("observability.event_message") || "Event Message / Details"}
        message={log.message}
      />
    </div>
  );
}

export function MetadataDiffTab({ log }: { log: AuditStreamEntry }) {
  return (
    <div className="space-y-4">
      <LogsDetailDiffSection oldValue={log.oldValue} newValue={log.newValue} />
      <LogsDetailMetadataFields metadata={log.metadata} />
    </div>
  );
}

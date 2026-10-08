import React from "react";
import { Copy, Sparkles, FileCode, Globe, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  UniversalContextMenu,
  type ContextMenuGroupConfig,
  Checkbox,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { type AuditStreamEntry } from "@/hooks/use-audit-log-stream";
import {
  getEventMessageDisplay,
  formatSupabaseLogPayload,
  getLevel,
} from "./logs-utils";
import {
  DateCell,
  SourceCell,
  StatusCell,
  MethodCell,
  PathnameCell,
  BenchmarkPill,
} from "./logs-row-cells";

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
                  prompt: `Analisis event log [${log.serviceSource || "system"}] ${log.method || ""} ${log.pathname || ""}: "${log.message || log.action || ""}". Status: ${log.status || "-"}, Tenant: ${log.tenantName || log.tenantSlug || "global"}. Identifikasi potensi masalah atau anomali.`,
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
            const payload = formatSupabaseLogPayload(log);
            navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
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
}: {
  log: AuditStreamEntry;
}) {
  const hasHashChain = Boolean(log.metadata?.hash || log.metadata?.prevHash);
  const isBenchmark = isBenchmarkEvent(log);
  const displayMsg = getEventMessageDisplay(log);

  return (
    <div className="flex-1 min-w-0 font-mono text-[11px] flex items-center gap-1.5 overflow-hidden">
      {hasHashChain && (
        <span
          title="Cryptographic Hash Chain Verified (SHA-256)"
          className="inline-flex items-center text-muted-foreground/40 shrink-0 select-none"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
        </span>
      )}
      {isBenchmark && <BenchmarkPill />}
      <span
        className="truncate text-muted-foreground/90 font-mono text-[11px] block"
        title={displayMsg}
      >
        {displayMsg}
      </span>
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
        <div className="w-[32px] shrink-0 flex items-center justify-center pr-2">
          <SourceCell source={log.serviceSource} logGroup={log.logGroup} />
        </div>
      )}

      {visibleCols.has("status") && (
        <StatusCell status={log.status} log={log} copiedId={copiedId} onCopyLog={onCopyLog} />
      )}

      {visibleCols.has("method") && (
        <div className="w-[54px] shrink-0 font-mono text-xs pr-2">
          <MethodCell method={log.method} />
        </div>
      )}

      {visibleCols.has("pathname") && (
        <PathnameCell
          pathname={log.pathname}
          targetResource={log.targetResource}
        />
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
        className={`flex items-center px-4 py-1.5 font-mono text-xs transition-colors cursor-pointer group ${rowBgClass}`}
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
          <MessageCell log={log} />
        )}
      </div>
    </UniversalContextMenu>
  );
}

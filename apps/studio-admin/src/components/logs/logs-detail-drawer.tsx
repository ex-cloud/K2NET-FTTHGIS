import React, { useState, useCallback, useMemo } from "react";
import {
  Copy,
  Info,
  Layers,
  Code2,
} from "lucide-react";
import {
  Button,
  LogsDetailDrawerShell,
  LogsDetailRawJsonTab,
  type LogsDetailDrawerTabItem,
} from "@k2net/ui";
import { type AuditStreamEntry } from "@/hooks/use-audit-log-stream";
import { useTranslation } from "@k2net/i18n";
import { useLogsFilter, type AdvancedFilter } from "./logs-filter-context";
import { toast } from "sonner";
import {
  DrawerStatusBar,
  OverviewTab,
  MetadataDiffTab,
} from "./logs-detail-drawer-tabs";
import { formatSupabaseLogPayload } from "./logs-utils";

export interface LogsDetailDrawerProps {
  selectedLog: AuditStreamEntry;
  onClose: () => void;
  onCopyLog: (log: AuditStreamEntry, e: React.MouseEvent) => void;
  onPrevLog?: () => void;
  onNextLog?: () => void;
  hasPrevLog?: boolean;
  hasNextLog?: boolean;
  currentIndex?: number;
  totalLogsCount?: number;
}

type TabKey = "overview" | "metadata" | "json";

export function LogsDetailDrawer({
  selectedLog,
  onClose,
  onCopyLog,
  onPrevLog,
  onNextLog,
  hasPrevLog = false,
  hasNextLog = false,
  currentIndex,
  totalLogsCount,
}: LogsDetailDrawerProps) {
  const { t } = useTranslation();
  const { addAdvancedFilter } = useLogsFilter();

  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const hash = (selectedLog.metadata?.hash || selectedLog.metadata?.prevHash) as string | undefined;
  const hasMetadataDiff = Boolean(selectedLog.oldValue || selectedLog.newValue);
  const hasExtendedMetadata = Boolean(
    selectedLog.metadata &&
      Object.keys(selectedLog.metadata).some(
        (k) =>
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
            "hash",
            "prevHash",
          ].includes(k)
      )
  );

  const handleCopyValue = useCallback((key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    toast.success(`Copied ${key} to clipboard`);
    setTimeout(() => setCopiedKey(null), 1800);
  }, []);

  const handleQuickFilter = useCallback(
    (field: AdvancedFilter["field"], value: string, operator: AdvancedFilter["operator"] = "eq") => {
      addAdvancedFilter({
        id: crypto.randomUUID(),
        field,
        operator,
        value,
      });
      const opLabel = operator === "eq" ? "=" : "!=";
      toast.success(`Filter added: ${field} ${opLabel} "${value}"`);
    },
    [addAdvancedFilter]
  );

  const drawerTabs = useMemo<LogsDetailDrawerTabItem[]>(() => [
    {
      key: "overview",
      label: "Overview",
      icon: <Info className="w-3.5 h-3.5" />,
    },
    {
      key: "metadata",
      label: "Metadata & Diff",
      icon: <Layers className="w-3.5 h-3.5" />,
      badge: hasMetadataDiff || hasExtendedMetadata,
    },
    {
      key: "json",
      label: "Raw JSON",
      icon: <Code2 className="w-3.5 h-3.5" />,
    },
  ], [hasMetadataDiff, hasExtendedMetadata]);

  return (
    <LogsDetailDrawerShell
      title={t("observability.log_details") || "Log Details"}
      currentIndex={currentIndex}
      totalLogsCount={totalLogsCount}
      onPrevLog={onPrevLog}
      onNextLog={onNextLog}
      hasPrevLog={hasPrevLog}
      hasNextLog={hasNextLog}
      onClose={onClose}
      tabs={drawerTabs}
      activeTab={activeTab}
      onTabChange={(key) => setActiveTab(key as TabKey)}
      statusBarSlot={
        <DrawerStatusBar
          hash={hash}
          isImpersonated={selectedLog.isImpersonated}
          realActorId={selectedLog.realActorId}
          actor={selectedLog.actor}
          tenantSlug={selectedLog.tenantSlug}
          onCopyValue={handleCopyValue}
          copiedKey={copiedKey}
        />
      }
      footerActionsSlot={
        <>
          <span className="text-[10px] text-muted-foreground font-mono hidden sm:inline">
            Use &apos;j&apos; / &apos;k&apos; to navigate • &apos;Esc&apos; to close
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => onCopyLog(selectedLog, e)}
            className="text-xs font-mono gap-1.5 h-7.5 px-3 border-border/70 bg-card hover:bg-muted cursor-pointer ml-auto shadow-xs font-medium"
          >
            <Copy className="w-3 h-3" />
            <span>{t("observability.copy_raw_event_json") || "Copy Raw JSON"}</span>
          </Button>
        </>
      }
    >
      {activeTab === "overview" && (
        <OverviewTab
          log={selectedLog}
          onCopyValue={handleCopyValue}
          copiedKey={copiedKey}
          onQuickFilter={handleQuickFilter}
        />
      )}

      {activeTab === "metadata" && <MetadataDiffTab log={selectedLog} />}

      {activeTab === "json" && (
        <LogsDetailRawJsonTab
          data={formatSupabaseLogPayload(selectedLog)}
          onCopyJson={() => {
            navigator.clipboard.writeText(JSON.stringify(formatSupabaseLogPayload(selectedLog), null, 2));
            toast.success("Copied Raw JSON to clipboard");
          }}
        />
      )}
    </LogsDetailDrawerShell>
  );
}

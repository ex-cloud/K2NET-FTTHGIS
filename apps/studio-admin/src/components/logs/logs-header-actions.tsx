import * as React from "react";
import { Button, ActionTooltip } from "@k2net/ui";
import {
  RefreshCw,
  BarChart2,
  Download,
  FileSpreadsheet,
  Play,
  Columns3,
  ShieldCheck,
  Archive,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@k2net/i18n";
import type { AuditStreamEntry } from "@/hooks/use-audit-log-stream";
import { exportLogsToCsv } from "./logs-utils";

export interface LogsHeaderActionsProps {
  filteredLogs: AuditStreamEntry[];
  clearLogs: () => void;
  showHistogram: boolean;
  setShowHistogram: React.Dispatch<React.SetStateAction<boolean>>;
  showColumnPicker: boolean;
  setShowColumnPicker: React.Dispatch<React.SetStateAction<boolean>>;
  columnBtnRef: React.RefObject<HTMLButtonElement | null>;
  isLivePaused: boolean;
  setIsLivePaused: React.Dispatch<React.SetStateAction<boolean>>;
  onOpenIntegrityModal: () => void;
  onOpenColdArchiveModal: () => void;
}

export function LogsHeaderActions({
  filteredLogs,
  clearLogs,
  showHistogram,
  setShowHistogram,
  showColumnPicker,
  setShowColumnPicker,
  columnBtnRef,
  isLivePaused,
  setIsLivePaused,
  onOpenIntegrityModal,
  onOpenColdArchiveModal,
}: LogsHeaderActionsProps) {
  const { t } = useTranslation();

  const handleExportJson = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const a = document.createElement("a");
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `k2net-logs-${Date.now()}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success(`Exported ${filteredLogs.length} log events to JSON.`);
  };

  const handleExportCsv = () => {
    exportLogsToCsv(filteredLogs);
    toast.success(`Exported ${filteredLogs.length} audit events to RFC-4180 CSV.`);
  };

  return (
    <div className="flex items-center gap-1.5 shrink-0 pl-2">
      <ActionTooltip label={t("observability.refresh_logs")} shortcut="R">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            clearLogs();
            toast.info("Refreshing real-time log feed...");
          }}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground border border-border/60 rounded-md"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </ActionTooltip>

      <ActionTooltip label={t("observability.toggle_histogram")} shortcut="H">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHistogram((prev) => !prev)}
          className={`h-7 w-7 p-0 border border-border/60 rounded-md ${showHistogram ? "bg-muted text-foreground" : "text-muted-foreground"}`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
        </Button>
      </ActionTooltip>

      <ActionTooltip label={t("observability.view_columns")} shortcut="C">
        <Button
          ref={columnBtnRef}
          variant="ghost"
          size="sm"
          onClick={() => setShowColumnPicker((prev) => !prev)}
          className={`h-7 w-7 p-0 border border-border/60 rounded-md ${showColumnPicker ? "bg-muted text-foreground" : "text-muted-foreground"}`}
        >
          <Columns3 className="w-3.5 h-3.5" />
        </Button>
      </ActionTooltip>

      <ActionTooltip label="Cold Storage S3 Archives (WORM)" shortcut="Alt+A">
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenColdArchiveModal}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground border border-border/60 rounded-md"
        >
          <Archive className="w-3.5 h-3.5 text-primary" />
        </Button>
      </ActionTooltip>

      <ActionTooltip label="Audit Forensic Integrity" shortcut="Alt+I">
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenIntegrityModal}
          className="h-7 w-7 p-0 text-primary hover:text-primary-foreground hover:bg-primary/20 border border-primary/30 rounded-md"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
        </Button>
      </ActionTooltip>

      <ActionTooltip label="Export RFC-4180 CSV" shortcut="Alt+S">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExportCsv}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground border border-border/60 rounded-md"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
        </Button>
      </ActionTooltip>

      <ActionTooltip label={t("observability.export_json")} shortcut="Alt+E">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExportJson}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground border border-border/60 rounded-md"
        >
          <Download className="w-3.5 h-3.5" />
        </Button>
      </ActionTooltip>

      <ActionTooltip
        label={isLivePaused ? t("observability.resume_stream") : t("observability.pause_stream")}
        shortcut="Space"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsLivePaused((prev) => !prev)}
          className={`h-7 text-xs font-mono gap-1.5 border-border/80 rounded-md px-2.5 ${
            isLivePaused
              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
              : "bg-primary/10 text-primary/80 border-primary/20"
          }`}
        >
          {isLivePaused ? (
            <Play className="w-3 h-3 fill-current" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          )}
          {isLivePaused ? t("observability.stream_paused") : t("observability.stream_live")}
        </Button>
      </ActionTooltip>
    </div>
  );
}

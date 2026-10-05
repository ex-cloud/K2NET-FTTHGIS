import * as React from "react";
import {
  Button,
  ActionTooltip,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
} from "@k2net/ui";
import {
  RefreshCw,
  BarChart2,
  Download,
  FileSpreadsheet,
  FileCode,
  Play,
  Pause,
  Columns3,
  ShieldCheck,
  Archive,
  BellRing,
  Bookmark,
  FileArchive,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@k2net/i18n";
import type { AuditStreamEntry } from "@/hooks/use-audit-log-stream";
import { exportLogsToCsv } from "./logs-utils";

export interface LogsHeaderActionsProps {
  filteredLogs: AuditStreamEntry[];
  /** Re-fetch the latest events from the audit gateway (does NOT wipe the buffer first). */
  onRefresh: () => Promise<void> | void;
  showHistogram: boolean;
  setShowHistogram: React.Dispatch<React.SetStateAction<boolean>>;
  showColumnPicker: boolean;
  setShowColumnPicker: React.Dispatch<React.SetStateAction<boolean>>;
  columnBtnRef: React.RefObject<HTMLButtonElement | null>;
  isLivePaused: boolean;
  setIsLivePaused: React.Dispatch<React.SetStateAction<boolean>>;
  onOpenIntegrityModal: () => void;
  onOpenColdArchiveModal: () => void;
  onOpenAlertConfigModal: () => void;
  onOpenSavePresetModal: () => void;
  onExportZipBundle: () => void;
  isExportingZip?: boolean;
}

export function LogsHeaderActions({
  filteredLogs,
  onRefresh,
  showHistogram,
  setShowHistogram,
  showColumnPicker,
  setShowColumnPicker,
  columnBtnRef,
  isLivePaused,
  setIsLivePaused,
  onOpenIntegrityModal,
  onOpenColdArchiveModal,
  onOpenAlertConfigModal,
  onOpenSavePresetModal,
  onExportZipBundle,
  isExportingZip = false,
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
    <div className="flex items-center gap-1.5 shrink-0 pl-1">
      {/* Group 1: Refresh & View Controls */}
      <ActionTooltip label={t("observability.refresh_logs")} shortcut="R">
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            try {
              await onRefresh();
              toast.success("Log feed refreshed.");
            } catch {
              toast.error("Failed to refresh log feed.");
            }
          }}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-border/60 rounded-md transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </ActionTooltip>

      <ActionTooltip label={t("observability.toggle_histogram")} shortcut="H">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHistogram((prev) => !prev)}
          className={`h-7 w-7 p-0 border rounded-md transition-colors ${
            showHistogram
              ? "bg-muted text-foreground border-border"
              : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
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
          className={`h-7 w-7 p-0 border rounded-md transition-colors ${
            showColumnPicker
              ? "bg-muted text-foreground border-border"
              : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <Columns3 className="w-3.5 h-3.5" />
        </Button>
      </ActionTooltip>

      {/* Group 2: Investigation & Forensic Suite (Icon Button) */}
      <DropdownMenu>
        <ActionTooltip label="Investigation & Forensic Tools" shortcut="Alt+I">
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Investigation & Forensic Tools"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-border/60 rounded-md transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
        </ActionTooltip>
        <DropdownMenuContent align="end" className="w-60 font-mono text-xs p-1 shadow-xl border border-border bg-popover">
          <DropdownMenuItem
            onClick={onOpenIntegrityModal}
            className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-[11px] text-foreground truncate">Audit Forensic Integrity</span>
            </div>
            <DropdownMenuShortcut className="text-[9px] opacity-70">Alt+I</DropdownMenuShortcut>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={onOpenAlertConfigModal}
            className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <BellRing className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-[11px] text-foreground truncate">Incident Alerts & Webhooks</span>
            </div>
            <DropdownMenuShortcut className="text-[9px] opacity-70">Alt+W</DropdownMenuShortcut>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={onOpenSavePresetModal}
            className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Bookmark className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-[11px] text-foreground truncate">Bookmark Search Preset</span>
            </div>
            <DropdownMenuShortcut className="text-[9px] opacity-70">Alt+B</DropdownMenuShortcut>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={onOpenColdArchiveModal}
            className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Archive className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-[11px] text-foreground truncate">Cold Storage S3 Archives</span>
            </div>
            <DropdownMenuShortcut className="text-[9px] opacity-70">Alt+A</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Group 3: Export Logs (Icon Button) */}
      <DropdownMenu>
        <ActionTooltip label="Export logs" shortcut="Alt+E">
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={isExportingZip}
              aria-label="Export logs"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-border/60 rounded-md transition-colors cursor-pointer"
            >
              {isExportingZip ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
            </Button>
          </DropdownMenuTrigger>
        </ActionTooltip>
        <DropdownMenuContent align="end" className="w-60 font-mono text-xs p-1 shadow-xl border border-border bg-popover">
          <DropdownMenuItem
            onClick={onExportZipBundle}
            className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <FileArchive className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-[11px] text-foreground truncate">Forensic Evidence (ZIP)</span>
              <span className="text-[8px] px-1 py-0.2 rounded bg-muted text-muted-foreground/80 border border-border/50 shrink-0">
                ISO 27037
              </span>
            </div>
            <DropdownMenuShortcut className="text-[9px] opacity-70">Alt+Z</DropdownMenuShortcut>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleExportCsv}
            className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <FileSpreadsheet className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-[11px] text-foreground truncate">CSV Dataset</span>
            </div>
            <DropdownMenuShortcut className="text-[9px] opacity-70">Alt+S</DropdownMenuShortcut>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleExportJson}
            className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <FileCode className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-[11px] text-foreground truncate">JSON Telemetry</span>
            </div>
            <DropdownMenuShortcut className="text-[9px] opacity-70">Alt+E</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Group 4: Live Stream Status Button (Supabase Exact Style) */}
      <ActionTooltip
        label={isLivePaused ? t("observability.resume_stream") : t("observability.pause_stream")}
        shortcut="Space"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsLivePaused((prev) => !prev)}
          className={`h-7 text-xs font-mono gap-1.5 rounded-md px-2.5 transition-all cursor-pointer ${
            isLivePaused
              ? "bg-transparent text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted/40"
              : "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 shadow-2xs"
          }`}
        >
          {isLivePaused ? (
            <Play className="w-3 h-3 text-muted-foreground" />
          ) : (
            <Pause className="w-3 h-3 text-primary" />
          )}
          <span className="font-medium text-xs">
            Live
          </span>
        </Button>
      </ActionTooltip>
    </div>
  );
}

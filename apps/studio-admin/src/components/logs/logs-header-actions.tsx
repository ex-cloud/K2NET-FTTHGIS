import * as React from "react";
import {
  Button,
  ActionTooltip,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from "@k2net/ui";
import {
  RefreshCw,
  BarChart2,
  Download,
  FileSpreadsheet,
  FileCode,
  Play,
  Columns3,
  ShieldCheck,
  Archive,
  BellRing,
  Bookmark,
  FileArchive,
  Loader2,
  ChevronDown,
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
  onOpenAlertConfigModal: () => void;
  onOpenSavePresetModal: () => void;
  onExportZipBundle: () => void;
  isExportingZip?: boolean;
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
    <div className="flex items-center gap-2 shrink-0 pl-1">
      {/* Group 1: View Controls */}
      <div className="flex items-center gap-1">
        <ActionTooltip label={t("observability.refresh_logs")} shortcut="R">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clearLogs();
              toast.info("Refreshing real-time log feed...");
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
            className={`h-7 w-7 p-0 border rounded-md transition-colors ${showHistogram
                ? "bg-primary/15 text-primary border-primary/40 shadow-xs"
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
            className={`h-7 w-7 p-0 border rounded-md transition-colors ${showColumnPicker
                ? "bg-muted text-foreground border-border"
                : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
          >
            <Columns3 className="w-3.5 h-3.5" />
          </Button>
        </ActionTooltip>
      </div>

      {/* Visual Separator */}
      <div className="h-4 w-px bg-border/60 shrink-0" />

      {/* Group 2: Security & Investigation Suite Dropdown Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs font-mono gap-1.5 border-border/80 rounded-md px-2.5 bg-background hover:bg-muted/70 text-foreground transition-all cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium text-xs">Investigate</span>
            <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 font-mono text-xs p-1 shadow-xl border border-border bg-popover">
          <DropdownMenuLabel className="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase px-2 py-0.5">
            Security & Governance Tools
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="my-1" />

          <DropdownMenuItem
            onClick={onOpenIntegrityModal}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors"
          >
            <div className="w-6 h-6 rounded bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3 h-3" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-[11px] text-foreground block leading-none mb-0.5">Audit Forensic Integrity</span>
              <p className="text-[9px] text-muted-foreground truncate leading-tight">
                Client-side SHA-256 Merkle root inspector
              </p>
            </div>
            <DropdownMenuShortcut className="text-[9px] opacity-70">Alt+I</DropdownMenuShortcut>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={onOpenAlertConfigModal}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors"
          >
            <div className="w-6 h-6 rounded bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center shrink-0">
              <BellRing className="w-3 h-3" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-[11px] text-foreground block leading-none mb-0.5">Incident Alerts & Webhooks</span>
              <p className="text-[9px] text-muted-foreground truncate leading-tight">
                Dispatcher & anti-storm rate limiter
              </p>
            </div>
            <DropdownMenuShortcut className="text-[9px] opacity-70">Alt+W</DropdownMenuShortcut>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={onOpenSavePresetModal}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors"
          >
            <div className="w-6 h-6 rounded bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <Bookmark className="w-3 h-3" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-[11px] text-foreground block leading-none mb-0.5">Bookmark Search Preset</span>
              <p className="text-[9px] text-muted-foreground truncate leading-tight">
                Save current filters as 1-click preset
              </p>
            </div>
            <DropdownMenuShortcut className="text-[9px] opacity-70">Alt+B</DropdownMenuShortcut>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={onOpenColdArchiveModal}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors"
          >
            <div className="w-6 h-6 rounded bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <Archive className="w-3 h-3" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-[11px] text-foreground block leading-none mb-0.5">Cold Storage S3 Archives</span>
              <p className="text-[9px] text-muted-foreground truncate leading-tight">
                Query WORM-locked MinIO partitions (&gt;90d)
              </p>
            </div>
            <DropdownMenuShortcut className="text-[9px] opacity-70">Alt+A</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Visual Separator */}
      <div className="h-4 w-px bg-border/60 shrink-0" />

      {/* Group 3: Consolidated Unified Export Dropdown Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isExportingZip}
            className="h-7 text-xs font-mono gap-1.5 border-border/80 rounded-md px-2.5 bg-background hover:bg-muted/70 text-foreground transition-all cursor-pointer"
          >
            {isExportingZip ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            ) : (
              <Download className="w-3.5 h-3.5 text-primary" />
            )}
            <span className="font-medium text-xs">Export</span>
            <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 font-mono text-xs p-1 shadow-xl border border-border bg-popover">
          <DropdownMenuLabel className="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase px-2 py-0.5">
            Exporters ({filteredLogs.length} events)
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuItem
            onClick={onExportZipBundle}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors"
          >
            <div className="w-6 h-6 rounded bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <FileArchive className="w-3 h-3" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-[11px] text-foreground flex items-center justify-between leading-none mb-0.5">
                <span>Forensic Evidence ZIP</span>
                <span className="text-[8px] px-1 py-0.1 rounded bg-primary/15 text-primary border border-primary/30">ISO 27037</span>
              </div>
              <p className="text-[9px] text-muted-foreground truncate leading-tight">
                JSON, CSV, Merkle Root & PEM Cert
              </p>
            </div>
            <DropdownMenuShortcut className="text-[9px] opacity-70">Alt+Z</DropdownMenuShortcut>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors"
          >
            <div className="w-6 h-6 rounded bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-3 h-3" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-[11px] text-foreground block leading-none mb-0.5">RFC-4180 CSV Dataset</span>
              <p className="text-[9px] text-muted-foreground truncate leading-tight">
                Universal spreadsheet table format
              </p>
            </div>
            <DropdownMenuShortcut className="text-[9px] opacity-70">Alt+S</DropdownMenuShortcut>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleExportJson}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors"
          >
            <div className="w-6 h-6 rounded bg-muted text-foreground border border-border/80 flex items-center justify-center shrink-0">
              <FileCode className="w-3 h-3" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-[11px] text-foreground block leading-none mb-0.5">Raw JSON Telemetry</span>
              <p className="text-[9px] text-muted-foreground truncate leading-tight">
                Indented JSON payloads with diffs
              </p>
            </div>
            <DropdownMenuShortcut className="text-[9px] opacity-70">Alt+E</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Visual Separator */}
      <div className="h-4 w-px bg-border/60 shrink-0" />

      {/* Group 4: Live Stream Status */}
      <ActionTooltip
        label={isLivePaused ? t("observability.resume_stream") : t("observability.pause_stream")}
        shortcut="Space"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsLivePaused((prev) => !prev)}
          className={`h-7 text-xs font-mono gap-1.5 border-border/80 rounded-md px-2.5 transition-all cursor-pointer ${isLivePaused
              ? "bg-amber-500/10 text-amber-400 border-amber-500/25 hover:bg-amber-500/20"
              : "bg-primary/10 text-primary border-primary/25 hover:bg-primary/20"
            }`}
        >
          {isLivePaused ? (
            <Play className="w-3 h-3 fill-current" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          )}
          <span className="font-medium">
            {isLivePaused ? t("observability.stream_paused") : t("observability.stream_live")}
          </span>
        </Button>
      </ActionTooltip>
    </div>
  );
}

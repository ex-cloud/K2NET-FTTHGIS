import React from "react";
import { 
  Database, 
  BrainCircuit, 
  HardDrive, 
  CheckCircle2, 
  HelpCircle, 
  FolderSync,
  Loader2
} from "lucide-react";
import { Button, Badge } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { type ServerSyncStatus } from "@/lib/actions/gateways";
import { formatBytes } from "./types";

interface AiKnowledgeSummaryBarProps {
  totalCount: number;
  totalChunks: number;
  totalBytes: number;
  syncStatus?: ServerSyncStatus | null;
  isSyncing?: boolean;
  onSyncServerDocs: () => void;
  onOpenUnindexedModal: () => void;
}

export function AiKnowledgeSummaryBar({
  totalCount,
  totalChunks,
  totalBytes,
  syncStatus,
  isSyncing = false,
  onSyncServerDocs,
  onOpenUnindexedModal,
}: AiKnowledgeSummaryBarProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {/* ── Inline KPI Stats Summary Bar ────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/75 dark:text-muted-foreground font-medium px-1">
        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-primary" />
          <span className="font-bold text-foreground font-mono">{totalCount}</span>
          <span>{t("ai.doc_list")}</span>
          <span title={t("ai.doc_list_tooltip_detail")} className="cursor-help text-foreground/50 hover:text-foreground">
            <HelpCircle className="h-3 w-3" />
          </span>
        </div>
        <span className="text-border">/</span>
        <div className="flex items-center gap-1.5">
          <BrainCircuit className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
          <span className="font-bold text-foreground font-mono">{totalChunks}</span>
          <span>{t("ai.vector_chunks")}</span>
          <span title={t("ai.vector_chunks_tooltip_detail")} className="cursor-help text-foreground/50 hover:text-foreground">
            <HelpCircle className="h-3 w-3" />
          </span>
        </div>
        <span className="text-border">/</span>
        <div className="flex items-center gap-1.5">
          <HardDrive className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
          <span className="font-bold text-foreground font-mono">{formatBytes(totalBytes)}</span>
          <span>{t("ai.file_size")}</span>
          <span title={t("ai.file_size_tooltip_detail")} className="cursor-help text-foreground/50 hover:text-foreground">
            <HelpCircle className="h-3 w-3" />
          </span>
        </div>
        <span className="text-border">/</span>
        <div className="flex items-center gap-1.5 text-primary font-mono font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>HNSW 1536 dim Ready</span>
        </div>
      </div>

      {/* ── Server Files Detection Banner ──────────────────────────────────── */}
      {syncStatus && syncStatus.unindexed_count > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 dark:border-amber-500/20 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0">
              <FolderSync className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">
                  {t("ai.unindexed_server_banner_title", { count: syncStatus.unindexed_count })}
                </span>
                <Badge variant="outline" className="text-[10px] bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono py-0">
                  {t("ai.unindexed_badge", { count: syncStatus.unindexed_count })}
                </Badge>
              </div>
              <p className="text-[11px] text-foreground/75 dark:text-muted-foreground mt-0.5">
                {t("ai.unindexed_server_banner_desc")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenUnindexedModal}
              className="text-xs h-8 border-border text-foreground hover:bg-muted/50 cursor-pointer"
            >
              {t("ai.view_files_count_btn", { count: syncStatus.unindexed_count })}
            </Button>
            <Button
              size="sm"
              onClick={onSyncServerDocs}
              disabled={isSyncing}
              className="text-xs h-8 gap-1.5 bg-amber-600 hover:bg-amber-500 text-primary-foreground font-medium cursor-pointer shadow-xs"
            >
              {isSyncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FolderSync className="w-3.5 h-3.5" />
              )}
              {isSyncing ? t("ai.syncing_server") : t("ai.sync_server_dir")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

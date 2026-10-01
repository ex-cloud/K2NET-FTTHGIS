import React from "react";
import { Database, Plus, RefreshCw } from "lucide-react";
import { Button } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";

interface KnowledgeTableEmptyStateProps {
  searchQuery: string;
  isSyncing: boolean;
  onGoToUpload: () => void;
  onSyncServerDocs: () => void;
}

export function KnowledgeTableEmptyState({
  searchQuery,
  isSyncing,
  onGoToUpload,
  onSyncServerDocs,
}: KnowledgeTableEmptyStateProps) {
  const { t } = useTranslation();

  return (
    <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
      <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center text-foreground/75 dark:text-muted-foreground border border-border/60">
        <Database className="w-6 h-6 opacity-60" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{t("common.no_data")}</p>
        <p className="text-xs text-foreground/75 dark:text-muted-foreground max-w-sm">
          {searchQuery
            ? `${t("common.no_results_for")} "${searchQuery}".`
            : t("ai.no_results_yet")}
        </p>
      </div>
      <div className="flex items-center gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onGoToUpload}
          className="text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
        >
          <Plus className="w-3.5 h-3.5" />
          {t("ai.add_document")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onSyncServerDocs}
          disabled={isSyncing}
          className="text-xs gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? t("ai.syncing_server") : t("ai.sync_server_dir")}
        </Button>
      </div>
    </div>
  );
}

import React from "react";
import { Database, Plus, RefreshCw } from "lucide-react";
import { Button } from "@k2net/ui";

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
  return (
    <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
      <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center text-foreground/75 dark:text-muted-foreground border border-border/60">
        <Database className="w-6 h-6 opacity-60" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Tidak Ada Dokumen SOP Ditemukan</p>
        <p className="text-xs text-foreground/75 dark:text-muted-foreground max-w-sm">
          {searchQuery
            ? `Tidak ada hasil untuk pencarian "${searchQuery}". Coba kata kunci lain atau reset filter kategori/scope.`
            : "Belum ada dokumen panduan SOP atau manual hardware yang cocok dengan kriteria filter."}
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
          Tambah Dokumen Baru
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onSyncServerDocs}
          disabled={isSyncing}
          className="text-xs gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Menyinkronkan..." : "Sinkronkan Server Docs"}
        </Button>
      </div>
    </div>
  );
}

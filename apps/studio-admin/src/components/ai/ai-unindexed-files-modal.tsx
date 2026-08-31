

import React from "react";
import { 
  FolderSync, 
  FileText, 
  Eye, 
  XCircle, 
  Sparkles, 
  Loader2 
} from "lucide-react";
import { 
  Button, 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter, 
  Badge 
} from "@k2net/ui";
import { ServerSyncStatus } from "@/lib/actions/gateways";
import { formatBytes } from "./types";

interface AiUnindexedFilesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  syncStatus?: ServerSyncStatus | null;
  isSyncing?: boolean;
  onSyncServerDocs: () => void;
  onPreview: (filePath: string) => void;
  previewLoadingPath: string | null;
  actionLoadingPath: string | null;
  onReject: (file: { path: string; title: string; category?: string }) => void;
  onIndexSingle: (file: { path: string; title?: string; category?: string }) => void;
}

export function AiUnindexedFilesModal({
  open,
  onOpenChange,
  syncStatus,
  isSyncing = false,
  onSyncServerDocs,
  onPreview,
  previewLoadingPath,
  actionLoadingPath,
  onReject,
  onIndexSingle,
}: AiUnindexedFilesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-card border-border shadow-2xl p-0 overflow-hidden rounded-xl">
        <DialogHeader className="p-5 pb-3 border-b border-border/80 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <FolderSync className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Berkas Server Belum Terindeks ({syncStatus?.unindexed_count || 0})
              </DialogTitle>
              <DialogDescription className="text-xs text-foreground/75 dark:text-muted-foreground mt-0.5">
                Daftar berkas Markdown (.md) di direktori server (/opt/project5/docs) yang belum masuk ke database & pgvector.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2.5 divide-y divide-border/40 custom-scrollbar">
          {syncStatus?.unindexed_files && syncStatus.unindexed_files.length > 0 ? (
            syncStatus.unindexed_files.map((file, idx) => (
              <div key={idx} className="pt-2.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <FileText className="w-4 h-4 text-foreground/75 dark:text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate">{file.title}</p>
                    <p className="text-[11px] text-foreground/75 dark:text-muted-foreground font-mono truncate">{file.path}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] font-mono border-border bg-muted/30 text-foreground/80">
                      {file.category}
                    </Badge>
                    <span className="text-[11px] font-mono text-foreground/75 dark:text-muted-foreground mr-1">
                      {formatBytes(file.size_bytes)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Tombol Pratinjau */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPreview(file.path)}
                      disabled={previewLoadingPath === file.path || actionLoadingPath === file.path}
                      className="h-7 px-2 text-[11px] gap-1 border-border/80 hover:bg-muted/60 text-foreground cursor-pointer"
                    >
                      {previewLoadingPath === file.path ? (
                        <Loader2 className="w-3 h-3 animate-spin text-primary" />
                      ) : (
                        <Eye className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                      )}
                      <span>Pratinjau</span>
                    </Button>

                    {/* Tombol Tolak */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onReject(file)}
                      disabled={actionLoadingPath === file.path || previewLoadingPath === file.path}
                      className="h-7 px-2 text-[11px] gap-1 border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50 cursor-pointer"
                    >
                      {actionLoadingPath === file.path ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      <span>Tolak</span>
                    </Button>

                    {/* Tombol Indeks 1-Click */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onIndexSingle(file)}
                      disabled={actionLoadingPath === file.path || previewLoadingPath === file.path}
                      className="h-7 px-2 text-[11px] gap-1 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 font-medium cursor-pointer"
                    >
                      {actionLoadingPath === file.path ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      <span>Indeks</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-foreground/75 dark:text-muted-foreground">
              Semua berkas server telah terindeks sepenuhnya.
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-border/80 bg-muted/20 flex flex-row items-center justify-between gap-2">
          <span className="text-[11px] text-foreground/75 dark:text-muted-foreground font-mono">
            Total: {syncStatus?.total_server_files || 0} berkas ({syncStatus?.indexed_count || 0} terindeks)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8 cursor-pointer"
            >
              Tutup
            </Button>
            <Button
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onSyncServerDocs();
              }}
              disabled={isSyncing || (syncStatus?.unindexed_count || 0) === 0}
              className="text-xs h-8 gap-1.5 bg-primary text-primary-foreground font-semibold cursor-pointer"
            >
              <FolderSync className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Menyinkronkan..." : "Indeks Semua Berkas Sekaligus"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

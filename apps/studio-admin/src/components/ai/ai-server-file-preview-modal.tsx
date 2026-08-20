"use client";

import React from "react";
import { 
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
  DialogFooter, 
  Badge 
} from "@k2net/ui";
import { ServerFilePreview } from "@/lib/actions/gateways";
import { formatBytes } from "./types";

interface AiServerFilePreviewModalProps {
  previewData: ServerFilePreview | null;
  onClose: () => void;
  actionLoadingPath: string | null;
  onReject: (file: { path: string; title: string; category?: string }) => void;
  onIndexSingle: (file: { path: string; title?: string; category?: string }) => void;
}

export function AiServerFilePreviewModal({
  previewData,
  onClose,
  actionLoadingPath,
  onReject,
  onIndexSingle,
}: AiServerFilePreviewModalProps) {
  return (
    <Dialog open={!!previewData} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-card border-border shadow-2xl p-0 overflow-hidden rounded-xl flex flex-col">
        <DialogHeader className="p-5 pb-3 border-b border-border/80 bg-muted/20 pr-10">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
              <Eye className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-base font-bold text-foreground truncate">
                  {previewData?.title || "Pratinjau Dokumen"}
                </DialogTitle>
                {previewData?.category && (
                  <Badge variant="outline" className="text-[10px] font-mono border-border bg-muted/40 text-foreground/80">
                    {previewData.category}
                  </Badge>
                )}
                <Badge variant="outline" className="text-[10px] font-mono border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  {previewData?.scope || "GLOBAL"}
                </Badge>
              </div>
              <p className="text-xs text-foreground/75 dark:text-muted-foreground mt-0.5 font-mono truncate">
                {previewData?.path}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Metadata summary bar */}
        <div className="px-5 py-2 bg-muted/40 border-b border-border/60 flex items-center justify-between text-[11px] text-foreground/80 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span>Karakter: <strong className="font-mono text-foreground">{previewData?.char_count.toLocaleString() || 0}</strong></span>
            <span>•</span>
            <span>Kata: <strong className="font-mono text-foreground">{previewData?.word_count.toLocaleString() || 0}</strong></span>
            <span>•</span>
            <span>Baris: <strong className="font-mono text-foreground">{previewData?.line_count.toLocaleString() || 0}</strong></span>
          </div>
          <div className="text-foreground/75 dark:text-muted-foreground font-mono">
            Ukuran: {formatBytes(previewData?.size_bytes || 0)}
          </div>
        </div>

        {/* Content viewer */}
        <div className="p-5 flex-1 overflow-y-auto max-h-[55vh] custom-scrollbar bg-card">
          <div className="rounded-lg border border-border/70 bg-muted/20 p-4 font-mono text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed select-text selection:bg-primary/20">
            {previewData?.content}
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border/80 bg-muted/20 flex flex-row items-center justify-between gap-2">
          <span className="text-[11px] text-foreground/75 dark:text-muted-foreground hidden sm:inline">
            Status: <span className="text-amber-500 font-semibold">Belum Terindeks</span>
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-8 cursor-pointer"
            >
              Tutup
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (previewData) {
                  onReject({
                    path: previewData.path,
                    title: previewData.title,
                    category: previewData.category,
                  });
                }
              }}
              disabled={actionLoadingPath === previewData?.path}
              className="text-xs h-8 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              Tolak Berkas
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (previewData) {
                  onIndexSingle({
                    path: previewData.path,
                    title: previewData.title,
                    category: previewData.category,
                  });
                }
              }}
              disabled={actionLoadingPath === previewData?.path}
              className="text-xs h-8 gap-1.5 bg-primary text-primary-foreground font-semibold cursor-pointer"
            >
              {actionLoadingPath === previewData?.path ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              Indeks Berkas Ini
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

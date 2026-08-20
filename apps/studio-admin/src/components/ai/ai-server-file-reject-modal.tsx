"use client";

import React from "react";
import { 
  XCircle, 
  Loader2 
} from "lucide-react";
import { 
  Button, 
  Input, 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@k2net/ui";

interface AiServerFileRejectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileToReject: { path: string; title: string; category?: string } | null;
  rejectReason: string;
  setRejectReason: (reason: string) => void;
  isRejecting: boolean;
  onConfirmReject: () => void;
}

export function AiServerFileRejectModal({
  open,
  onOpenChange,
  fileToReject,
  rejectReason,
  setRejectReason,
  isRejecting,
  onConfirmReject,
}: AiServerFileRejectModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border shadow-2xl p-0 overflow-hidden rounded-xl">
        <DialogHeader className="p-5 pb-3 border-b border-border/80 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive shrink-0">
              <XCircle className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Tolak Berkas Server?
              </DialogTitle>
              <DialogDescription className="text-xs text-foreground/75 dark:text-muted-foreground mt-0.5">
                Berkas tidak akan diindeks ke pgvector dan akan dipindahkan ke status Ditolak.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4">
          <div className="p-3 rounded-lg border border-border bg-muted/30 text-xs">
            <p className="font-semibold text-foreground">{fileToReject?.title}</p>
            <p className="text-[11px] text-foreground/75 dark:text-muted-foreground font-mono mt-0.5">{fileToReject?.path}</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Alasan Penolakan (Opsional)</label>
            <Input
              placeholder="Contoh: Berkas draf internal / belum siap publik"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="text-xs h-9 bg-background"
            />
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border/80 bg-muted/20 flex flex-row items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isRejecting}
            className="text-xs h-8 cursor-pointer"
          >
            Batal
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={onConfirmReject}
            disabled={isRejecting}
            className="text-xs h-8 gap-1.5 font-semibold cursor-pointer"
          >
            {isRejecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
            {isRejecting ? "Menolak..." : "Ya, Tolak Berkas"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

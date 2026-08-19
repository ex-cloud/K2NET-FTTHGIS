"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@k2net/ui";
import { AlertCircle } from "lucide-react";

interface ResetConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ResetConfirmModal({
  open,
  onOpenChange,
  onConfirm,
}: ResetConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-[450px] p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-500" />
            Reset Statistics Report?
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-2 leading-relaxed">
            This action will reset all metrics gathered by the{" "}
            <code className="bg-muted/60 px-1 py-0.5 rounded text-[10px] font-mono">pg_stat_statements</code>{" "}
            extension in the database. Historical data will be cleared, and new performance
            baselines will be started.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center justify-center h-8 px-3 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
            }}
            className="inline-flex items-center justify-center h-8 px-3 text-xs font-semibold rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-colors"
          >
            Reset stats
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

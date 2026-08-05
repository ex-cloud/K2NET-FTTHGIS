"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button } from "@k2net/ui";
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
            This action will reset all metrics gathered by the <code>pg_stat_statements</code> extension in the database. Historical data will be cleared, and new performance baselines will be started.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-8">
            Cancel
          </Button>
          <Button className="bg-rose-600 hover:bg-rose-500 text-white h-8" size="sm" onClick={onConfirm}>
            Reset stats
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@k2net/ui";
import { Keyboard } from "lucide-react";

interface TaskShortcutsHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskShortcutsHelpDialog({
  open,
  onOpenChange,
}: TaskShortcutsHelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-popover/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-5">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
            <Keyboard className="w-4 h-4 text-primary" />
            <span>Linear Keyboard Shortcuts</span>
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 text-xs pt-3">
          <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/50">
            <span className="text-muted-foreground">New Issue</span>
            <kbd className="px-2 py-0.5 rounded-md bg-muted border border-border font-mono font-bold text-foreground">C</kbd>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/50">
            <span className="text-muted-foreground">New Project</span>
            <kbd className="px-2 py-0.5 rounded-md bg-muted border border-border font-mono font-bold text-foreground">⇧ P</kbd>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/50">
            <span className="text-muted-foreground">Next row</span>
            <kbd className="px-2 py-0.5 rounded-md bg-muted border border-border font-mono font-bold text-foreground">J / ↓</kbd>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/50">
            <span className="text-muted-foreground">Prev row</span>
            <kbd className="px-2 py-0.5 rounded-md bg-muted border border-border font-mono font-bold text-foreground">K / ↑</kbd>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/50">
            <span className="text-muted-foreground">Open detail</span>
            <kbd className="px-2 py-0.5 rounded-md bg-muted border border-border font-mono font-bold text-foreground">Space / ↵</kbd>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/50">
            <span className="text-muted-foreground">Select row</span>
            <kbd className="px-2 py-0.5 rounded-md bg-muted border border-border font-mono font-bold text-foreground">X</kbd>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/50">
            <span className="text-muted-foreground">Deselect all</span>
            <kbd className="px-2 py-0.5 rounded-md bg-muted border border-border font-mono font-bold text-foreground">Esc</kbd>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/50">
            <span className="text-muted-foreground">Shortcuts help</span>
            <kbd className="px-2 py-0.5 rounded-md bg-muted border border-border font-mono font-bold text-foreground">?</kbd>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

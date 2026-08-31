

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@k2net/ui";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";

interface TaskBatchDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirmDelete: () => Promise<void>;
  loading?: boolean;
}

export function TaskBatchDeleteDialog({
  open,
  onOpenChange,
  selectedCount,
  onConfirmDelete,
  loading = false,
}: TaskBatchDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-popover/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-6">
        <DialogHeader className="flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold text-foreground">
              Hapus {selectedCount} Tugas Terpilih?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Tindakan ini permanen. Seluruh data {selectedCount} tugas, komentar, riwayat aktivitas, dan referensi terkait akan dihapus dari sistem.
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="flex items-center justify-end gap-2 pt-4 border-t border-border/40 mt-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => onOpenChange(false)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirmDelete}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Ya, Hapus {selectedCount} Tugas</span>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

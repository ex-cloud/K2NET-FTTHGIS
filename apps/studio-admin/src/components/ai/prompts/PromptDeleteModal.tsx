import React from "react";
import { AlertCircle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@k2net/ui";

interface PromptDeleteModalProps {
  deletePromptId: string | null;
  onClose: () => void;
  isDeleting: boolean;
  onConfirmDelete: () => void;
}

export function PromptDeleteModal({
  deletePromptId,
  onClose,
  isDeleting,
  onConfirmDelete,
}: PromptDeleteModalProps) {
  if (!deletePromptId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Hapus Prompt Rekomendasi?</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Prompt ini akan dihapus permanen dari basis data dan tidak akan lagi muncul di Ask AI
              Drawer pengguna.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
            className="text-xs cursor-pointer"
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirmDelete}
            disabled={isDeleting}
            className="text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
          >
            {isDeleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span>Hapus Permanen</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@k2net/ui";
import type { Permission } from "./permissions-types";

interface DeleteConfirmDialogProps {
  permission: Permission;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export function DeleteConfirmDialog({
  permission,
  onClose,
  onConfirm,
  isSubmitting,
}: DeleteConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">Hapus Permission?</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Apakah Anda yakin ingin menghapus kode permission{" "}
          <code className="font-mono font-bold text-foreground bg-muted px-1.5 py-0.5 rounded">
            {permission.code}
          </code>
          ? Tindakan ini akan mencabut permission ini dari seluruh role.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 border-border text-muted-foreground hover:text-foreground"
          >
            Batal
          </Button>
          <Button
            id="btn-confirm-delete-perm"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 bg-rose-600 hover:bg-rose-500 text-foreground font-semibold shadow-lg shadow-rose-600/20"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Hapus"}
          </Button>
        </div>
      </div>
    </div>
  );
}

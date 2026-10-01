import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
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
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-lg p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">{t("security.delete_permission")}</h3>
        <p className="text-xs text-muted-foreground mb-4">
          {t("security.delete_perm_confirm", { code: permission.code })}
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 border-border text-muted-foreground hover:text-foreground"
          >
            {t("common.cancel")}
          </Button>
          <Button
            id="btn-confirm-delete-perm"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 bg-rose-600 hover:bg-rose-500 text-foreground font-medium shadow-lg shadow-rose-600/20"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t("common.delete")}
          </Button>
        </div>
      </div>
    </div>
  );
}

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { MessageTemplate } from "@/hooks/useMessageTemplates";

interface DeleteTemplateConfirmDialogProps {
  template: MessageTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function DeleteTemplateConfirmDialog({
  template,
  open,
  onOpenChange,
  onConfirm,
  isSubmitting = false,
}: DeleteTemplateConfirmDialogProps) {
  const { t } = useTranslation();

  if (!template) return null;

  const handleConfirm = async () => {
    await onConfirm(template.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border p-6 text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                {t("billing.templates_delete_title")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {template.name} ({template.code})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-2 text-xs text-muted-foreground leading-relaxed">
          {t("billing.templates_delete_desc", { code: template.code })}
        </div>

        <DialogFooter className="pt-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="gap-1.5"
          >
            {isSubmitting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <AlertTriangle className="size-3.5" />
            )}
            <span>{t("billing.templates_action_delete")}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

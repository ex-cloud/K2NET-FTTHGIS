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
import { Ban } from "lucide-react";
import type { BillingInvoiceItem } from "@/hooks/useBillingInvoices";

export interface InvoiceCancelConfirmDialogProps {
  invoice: BillingInvoiceItem | null;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function InvoiceCancelConfirmDialog({
  invoice,
  onClose,
  onConfirm,
  isPending,
}: InvoiceCancelConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={!!invoice} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] bg-card border-border text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-md bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
              <Ban className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                {t("billing.cancel_confirm_title")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {invoice &&
                  t("billing.cancel_confirm_desc", {
                    invoiceNumber: invoice.invoiceNumber,
                  })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isPending}
            className="h-7 px-2.5 text-xs font-medium"
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={isPending}
            className="h-7 px-2.5 text-xs font-medium gap-1.5"
          >
            <Ban className="size-3.5" />
            <span>{isPending ? t("common.processing") : t("billing.action_cancel")}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

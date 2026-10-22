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
import { RotateCw } from "lucide-react";
import type { RenewalDispatchLog } from "@/hooks/useBillingRenewals";

export interface RetryDispatchDialogProps {
  log: RenewalDispatchLog | null;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function RetryDispatchDialog({
  log,
  onClose,
  onConfirm,
  isPending,
}: RetryDispatchDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={!!log} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] bg-card border-border text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <RotateCw className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                {t("billing.retry_confirm_title")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {log &&
                  t("billing.retry_confirm_desc", {
                    recipient: log.recipient,
                    channel: log.channel,
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
            size="sm"
            onClick={onConfirm}
            disabled={isPending}
            className="h-7 px-2.5 text-xs font-medium gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <RotateCw className="size-3.5" />
            <span>{isPending ? t("common.processing") : t("billing.action_retry_dispatch")}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

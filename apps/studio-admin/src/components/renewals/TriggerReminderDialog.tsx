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
import { Bell } from "lucide-react";
import type { RenewalQueueItem } from "@/hooks/useBillingRenewals";

export interface TriggerReminderDialogProps {
  item: RenewalQueueItem | null;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function TriggerReminderDialog({
  item,
  onClose,
  onConfirm,
  isPending,
}: TriggerReminderDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] bg-card border-border text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Bell className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                {t("billing.reminder_confirm_title")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {item &&
                  t("billing.reminder_confirm_desc", {
                    orgName: item.organizationName,
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
            <Bell className="size-3.5" />
            <span>{isPending ? t("common.processing") : t("billing.action_trigger_reminder")}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

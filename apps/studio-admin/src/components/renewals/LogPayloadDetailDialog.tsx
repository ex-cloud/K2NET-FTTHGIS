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
import { FileText } from "lucide-react";
import type { RenewalDispatchLog } from "@/hooks/useBillingRenewals";

export interface LogPayloadDetailDialogProps {
  log: RenewalDispatchLog | null;
  onClose: () => void;
}

export function LogPayloadDetailDialog({
  log,
  onClose,
}: LogPayloadDetailDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={!!log} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[560px] max-h-[80vh] flex flex-col bg-card border-border text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <FileText className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                {log?.subject || t("billing.view_message_detail")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {log?.channel} · {log?.recipient} · {log?.sentAt ? new Date(log.sentAt).toLocaleString() : ""}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-2">
          {log?.messageContent ? (
            <div className="p-3 rounded-md bg-muted/40 border border-border font-mono text-xs whitespace-pre-wrap break-words text-foreground">
              {log.messageContent}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No message content available.</p>
          )}

          {log?.errorDetails && (
            <div className="mt-3 p-2.5 rounded-md border border-destructive/40 bg-destructive/10 text-destructive text-xs font-mono">
              <span className="font-bold">Error Details: </span>
              {log.errorDetails}
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-7 px-2.5 text-xs font-medium"
          >
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

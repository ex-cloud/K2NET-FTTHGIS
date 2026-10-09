import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Badge,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import {
  type LicenseItem,
  useLicenseNotificationLogs,
  useSendManualLicenseReminder,
} from "../../hooks/useOrganizationLicenses";
import { Bell, Mail, MessageSquare, Send, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface LicenseNotificationLogsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  license: LicenseItem | null;
}

export function LicenseNotificationLogsModal({
  open,
  onOpenChange,
  license,
}: LicenseNotificationLogsModalProps) {
  const { t } = useTranslation();

  const { data: logs, isLoading, refetch } = useLicenseNotificationLogs(
    license?.organizationId,
    license?.id
  );

  const { mutateAsync: sendReminder, isPending: isSending } = useSendManualLicenseReminder();

  const handleSendReminder = async () => {
    if (!license) return;
    try {
      await sendReminder({
        orgId: license.organizationId,
        licenseId: license.id,
      });
      toast.success(t("license.notifications.reminder_sent_success"));
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("license.notifications.reminder_sent_failed"));
    }
  };

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case "EXPIRING_7D":
        return <Badge variant="outline" className="text-[10px] border-border/80 bg-foreground/5 text-foreground font-mono">H-7</Badge>;
      case "EXPIRING_3D":
        return <Badge variant="outline" className="text-[10px] border-border bg-foreground/10 text-foreground font-mono">H-3</Badge>;
      case "GRACE_PERIOD":
        return <Badge variant="destructive" className="text-[10px]">GRACE PERIOD</Badge>;
      case "READ_ONLY_LOCKED":
        return <Badge variant="destructive" className="text-[10px]">READ-ONLY</Badge>;
      case "SUSPENDED":
        return <Badge variant="destructive" className="text-[10px]">SUSPENDED</Badge>;
      case "MANUAL_REMINDER":
        return <Badge variant="outline" className="text-[10px]">MANUAL</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{stage}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SENT":
        return <CheckCircle2 className="size-3.5 text-foreground" />;
      case "FAILED":
        return <XCircle className="size-3.5 text-destructive" />;
      default:
        return <AlertCircle className="size-3.5 text-muted-foreground" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border/80 text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-muted/60 border border-border/80 flex items-center justify-center text-foreground">
              <Bell className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold tracking-tight">
                {t("license.notifications.log_title")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {license?.organizationName} — <span className="font-mono">{license?.maskedLicenseKey}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-2 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <span className="text-xs text-muted-foreground">
              {t("license.notifications.log_desc")}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSendReminder}
              disabled={isSending}
              className="h-7 px-2.5 text-xs font-medium gap-1.5"
            >
              {isSending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              {t("license.notifications.send_reminder_btn")}
            </Button>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : !logs || logs.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground">
                {t("license.notifications.no_logs")}
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border border-border/70 bg-muted/10 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="size-7 rounded-md bg-muted/40 border border-border/80 flex items-center justify-center shrink-0 mt-0.5">
                      {log.channel === "WHATSAPP" ? (
                        <MessageSquare className="size-3.5 text-foreground" />
                      ) : (
                        <Mail className="size-3.5 text-foreground/80" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{log.recipient}</span>
                        {getStageBadge(log.stage)}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {log.subject || log.channel} • {new Date(log.sentAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      {getStatusIcon(log.status)}
                      <span className="uppercase">{log.status}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter className="border-t border-border/60 pt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-7 px-3 text-xs"
          >
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

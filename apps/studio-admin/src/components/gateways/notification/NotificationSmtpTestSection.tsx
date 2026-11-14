import React from "react";
import { Loader2, Send, CheckCircle2, AlertCircle, Play } from "lucide-react";
import { Button, Input, Label } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";

export interface NotificationSmtpTestSectionProps {
  isTestingConnection: boolean;
  connectionStatus: { verified: boolean; message: string } | null;
  testRecipient: string;
  isSendingTest: boolean;
  onTestConnection: () => void;
  onRecipientChange: (val: string) => void;
  onSendTest: () => void;
}

export function NotificationSmtpTestSection({
  isTestingConnection,
  connectionStatus,
  testRecipient,
  isSendingTest,
  onTestConnection,
  onRecipientChange,
  onSendTest,
}: NotificationSmtpTestSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="pt-3 border-t border-border/60 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">
          {t("gateways.notification.smtp_verify_first_hint")}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isTestingConnection}
          onClick={onTestConnection}
          className="h-7 px-2.5 text-xs font-medium gap-1.5 shrink-0 border-border/80 cursor-pointer"
        >
          {isTestingConnection ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Play className="size-3.5" />
          )}
          {isTestingConnection
            ? t("gateways.notification.testing_smtp_connection")
            : t("gateways.notification.test_smtp_connection")}
        </Button>
      </div>

      {connectionStatus && (
        <div
          className={`flex items-start gap-2 rounded-md border p-2.5 text-xs ${
            connectionStatus.verified
              ? "border-primary/40 bg-primary/10 text-foreground"
              : "border-destructive/40 bg-destructive/10 text-destructive"
          }`}
        >
          {connectionStatus.verified ? (
            <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-primary" />
          ) : (
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
          )}
          <span className="leading-relaxed">{connectionStatus.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="TEST_EMAIL_RECIPIENT" className="text-[11px] text-muted-foreground font-medium">
            {t("gateways.notification.test_email_recipient_label")}
          </Label>
          <Input
            id="TEST_EMAIL_RECIPIENT"
            type="email"
            value={testRecipient}
            onChange={(e) => onRecipientChange(e.target.value)}
            disabled={!connectionStatus?.verified || isSendingTest}
            placeholder={t("gateways.notification.test_email_recipient_placeholder")}
            className="bg-input border-border text-foreground text-xs h-7"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!connectionStatus?.verified || isSendingTest}
          onClick={onSendTest}
          className="h-7 px-2.5 text-xs font-medium gap-1.5 shrink-0 border-border/80 cursor-pointer"
        >
          {isSendingTest ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Send className="size-3.5" />
          )}
          {isSendingTest
            ? t("gateways.notification.sending_test_email")
            : t("gateways.notification.send_test_email")}
        </Button>
      </div>
    </div>
  );
}

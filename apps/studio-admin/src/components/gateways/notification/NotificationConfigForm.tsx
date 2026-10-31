import React, { useState } from "react";
import { Lock, Server, MessageCircle, Mail, Save, Loader2, Eye, EyeOff, Send } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Switch,
  ActionTooltip,
} from "@k2net/ui";
import { PermissionGuard } from "@/hooks/use-permissions";
import { useTranslation } from "@k2net/i18n";
import { toast } from "sonner";
import { sendNotificationTestEmail } from "@/lib/actions/gateways";

interface NotificationConfigFormProps {
  config: Record<string, string>;
  saving: boolean;
  onInputChange: (key: string, value: string) => void;
  onSave: (e: React.FormEvent) => void;
  onReset: () => void;
}

export function NotificationConfigForm({
  config,
  saving,
  onInputChange,
  onSave,
  onReset,
}: NotificationConfigFormProps) {
  const { t } = useTranslation();
  const [showAuthToken, setShowAuthToken] = useState(false);
  const [showTwilioToken, setShowTwilioToken] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);

  const [testRecipient, setTestRecipient] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);

  const handleSendTest = async () => {
    setIsSendingTest(true);
    try {
      const res = await sendNotificationTestEmail({
        to: testRecipient.trim() || undefined,
      });
      toast.success(res.message || t("gateways.notification.test_email_success"));
    } catch (err) {
      console.error(err);
      toast.error(`${t("gateways.notification.test_email_failed")}: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  const isSecureActive = config.SMTP_SECURE === "true" || (!config.SMTP_SECURE && config.SMTP_PORT === "465");

  return (
    <form onSubmit={onSave} className="lg:col-span-2 space-y-6">
      {/* 1. Internal Auth Details */}
      <Card glowingEffect className="bg-card/60 border-border shadow-xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" /> {t("gateways.notification.security_title")}
          </CardTitle>
          <CardDescription className="text-[10px] text-muted-foreground">
            {t("gateways.notification.security_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="GATEWAY_TOKEN" className="text-xs text-muted-foreground">
                {t("gateways.notification.token_label")}
              </Label>
              <button
                type="button"
                onClick={() => setShowAuthToken(!showAuthToken)}
                className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                {showAuthToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showAuthToken ? t("common.hide") : t("common.show")}
              </button>
            </div>
            <Input
              id="GATEWAY_TOKEN"
              type={showAuthToken ? "text" : "password"}
              value={config.GATEWAY_TOKEN || ""}
              onChange={(e) => onInputChange("GATEWAY_TOKEN", e.target.value)}
              placeholder={t("gateways.notification.token_placeholder")}
              className="bg-input border-border text-foreground text-xs focus:border-primary/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. Redis Connection Details */}
      <Card glowingEffect className="bg-card/60 border-border shadow-xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Server className="w-4 h-4 text-primary" /> {t("gateways.notification.queue_title")}
          </CardTitle>
          <CardDescription className="text-[10px] text-muted-foreground">
            {t("gateways.notification.queue_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="REDIS_ADDR" className="text-xs text-muted-foreground">
              {t("gateways.notification.redis_host_label")}
            </Label>
            <Input
              id="REDIS_ADDR"
              type="text"
              value={config.REDIS_ADDR || ""}
              onChange={(e) => onInputChange("REDIS_ADDR", e.target.value)}
              placeholder="127.0.0.1:6379"
              className="bg-input border-border text-foreground text-xs focus:border-primary/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. Transactional Email & SMTP Gateway */}
      <Card glowingEffect className="bg-card/60 border-border shadow-xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" /> {t("gateways.notification.smtp_title")}
          </CardTitle>
          <CardDescription className="text-[10px] text-muted-foreground">
            {t("gateways.notification.smtp_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-2.5 rounded-lg border border-primary/25 bg-primary/10 text-xs text-foreground flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-semibold shrink-0">
              UNIFIED
            </span>
            <span className="text-[11px] text-muted-foreground leading-tight">
              {t("gateways.notification.smtp_unified_sync_hint")}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="SMTP_HOST" className="text-xs text-muted-foreground">
                {t("gateways.notification.smtp_host_label")}
              </Label>
              <Input
                id="SMTP_HOST"
                type="text"
                value={config.SMTP_HOST || ""}
                onChange={(e) => onInputChange("SMTP_HOST", e.target.value)}
                placeholder={t("gateways.notification.smtp_host_placeholder")}
                className="bg-input border-border text-foreground text-xs focus:border-primary/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="SMTP_PORT" className="text-xs text-muted-foreground">
                {t("gateways.notification.smtp_port_label")}
              </Label>
              <Input
                id="SMTP_PORT"
                type="text"
                value={config.SMTP_PORT || ""}
                onChange={(e) => onInputChange("SMTP_PORT", e.target.value)}
                placeholder={t("gateways.notification.smtp_port_placeholder")}
                className="bg-input border-border text-foreground text-xs focus:border-primary/50"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/60">
            <div className="space-y-0.5">
              <Label className="text-xs font-medium text-foreground">
                {t("gateways.notification.smtp_secure_label")}
              </Label>
              <p className="text-[10px] text-muted-foreground">
                {t("gateways.notification.smtp_secure_desc")}
              </p>
            </div>
            <Switch
              checked={isSecureActive}
              onCheckedChange={(checked) => onInputChange("SMTP_SECURE", checked ? "true" : "false")}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="SMTP_USER" className="text-xs text-muted-foreground">
                {t("gateways.notification.smtp_user_label")}
              </Label>
              <Input
                id="SMTP_USER"
                type="text"
                value={config.SMTP_USER || ""}
                onChange={(e) => onInputChange("SMTP_USER", e.target.value)}
                placeholder={t("gateways.notification.smtp_user_placeholder")}
                className="bg-input border-border text-foreground text-xs focus:border-primary/50"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="SMTP_PASSWORD" className="text-xs text-muted-foreground">
                  {t("gateways.notification.smtp_password_label")}
                </Label>
                <button
                  type="button"
                  onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                  className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  {showSmtpPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showSmtpPassword ? t("common.hide") : t("common.show")}
                </button>
              </div>
              <Input
                id="SMTP_PASSWORD"
                type={showSmtpPassword ? "text" : "password"}
                value={config.SMTP_PASSWORD || ""}
                onChange={(e) => onInputChange("SMTP_PASSWORD", e.target.value)}
                placeholder={t("gateways.notification.smtp_password_placeholder")}
                className="bg-input border-border text-foreground text-xs focus:border-primary/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="SMTP_FROM" className="text-xs text-muted-foreground">
              {t("gateways.notification.smtp_from_label")}
            </Label>
            <Input
              id="SMTP_FROM"
              type="text"
              value={config.SMTP_FROM || ""}
              onChange={(e) => onInputChange("SMTP_FROM", e.target.value)}
              placeholder={t("gateways.notification.smtp_from_placeholder")}
              className="bg-input border-border text-foreground text-xs focus:border-primary/50"
            />
          </div>

          {/* Test Email Dispatcher */}
          <div className="pt-2 border-t border-border/60">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="TEST_EMAIL_RECIPIENT" className="text-[11px] text-muted-foreground font-medium">
                  {t("gateways.notification.test_email_recipient_label")}
                </Label>
                <Input
                  id="TEST_EMAIL_RECIPIENT"
                  type="email"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder={t("gateways.notification.test_email_recipient_placeholder")}
                  className="bg-input border-border text-foreground text-xs h-7"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSendingTest}
                onClick={handleSendTest}
                className="h-7 px-2.5 text-xs font-medium gap-1.5 shrink-0 border-border/80"
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
        </CardContent>
      </Card>

      {/* 4. Twilio Credentials */}
      <Card glowingEffect className="bg-card/60 border-border shadow-xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" /> {t("gateways.notification.twilio_title")}
          </CardTitle>
          <CardDescription className="text-[10px] text-muted-foreground">
            {t("gateways.notification.twilio_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="TWILIO_ACCOUNT_SID" className="text-xs text-muted-foreground">
              {t("gateways.notification.twilio_sid_label")}
            </Label>
            <Input
              id="TWILIO_ACCOUNT_SID"
              type="text"
              value={config.TWILIO_ACCOUNT_SID || ""}
              onChange={(e) => onInputChange("TWILIO_ACCOUNT_SID", e.target.value)}
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="bg-input border-border text-foreground text-xs focus:border-primary/50"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="TWILIO_AUTH_TOKEN" className="text-xs text-muted-foreground">
                {t("gateways.notification.twilio_token_label")}
              </Label>
              <button
                type="button"
                onClick={() => setShowTwilioToken(!showTwilioToken)}
                className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                {showTwilioToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showTwilioToken ? t("common.hide") : t("common.show")}
              </button>
            </div>
            <Input
              id="TWILIO_AUTH_TOKEN"
              type={showTwilioToken ? "text" : "password"}
              value={config.TWILIO_AUTH_TOKEN || ""}
              onChange={(e) => onInputChange("TWILIO_AUTH_TOKEN", e.target.value)}
              placeholder={t("gateways.notification.twilio_token_placeholder")}
              className="bg-input border-border text-foreground text-xs focus:border-primary/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="TWILIO_FROM_NUMBER" className="text-xs text-muted-foreground">
              {t("gateways.notification.twilio_from_label")}
            </Label>
            <Input
              id="TWILIO_FROM_NUMBER"
              type="text"
              value={config.TWILIO_FROM_NUMBER || ""}
              onChange={(e) => onInputChange("TWILIO_FROM_NUMBER", e.target.value)}
              placeholder="whatsapp:+14155238886"
              className="bg-input border-border text-foreground text-xs focus:border-primary/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2.5">
        <ActionTooltip label={t("common.reset_form")} shortcut="Alt+R">
          <Button
            type="button"
            onClick={onReset}
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs font-medium border-border/80 text-muted-foreground hover:text-foreground"
          >
            {t("common.reset_form")}
          </Button>
        </ActionTooltip>
        <PermissionGuard permission="system.gateway.manage">
          <ActionTooltip label={t("gateways.save_config")} shortcut="Ctrl+S">
            <Button
              type="submit"
              disabled={saving}
              size="sm"
              className="h-7 px-2.5 text-xs font-medium gap-1.5"
            >
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              {t("gateways.save_config")}
            </Button>
          </ActionTooltip>
        </PermissionGuard>
      </div>
    </form>
  );
}

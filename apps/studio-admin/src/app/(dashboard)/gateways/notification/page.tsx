import React, { useEffect, useState, useCallback } from "react";
import { getGatewayConfigByKey, updateGatewayConfigByKey, getNotificationLogs, type NotificationLog } from "@/lib/actions/gateways";
import { MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GatewayPageWrapper } from "@/components/page-guards/gateway-page-wrapper";
import { NotificationConfigForm } from "@/components/gateways/notification/NotificationConfigForm";
import { NotificationRecentLogsCard } from "@/components/gateways/notification/NotificationRecentLogsCard";
import { NotificationStatsCard } from "@/components/gateways/notification/NotificationStatsCard";
import { useTranslation } from "@k2net/i18n";
import { z } from "zod";

export default function NotificationGatewayPage() {
  const { t } = useTranslation();
  const [config, setConfig] = useState<Record<string, string>>({});
  const [censored, setCensored] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifLogs, setNotifLogs] = useState<NotificationLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  const notificationSchema = React.useMemo(() => z.object({
    GATEWAY_TOKEN: z.string().min(16, t("gateways.notification.token_min_length")).optional().or(z.literal("")),
    REDIS_ADDR: z.string().regex(/^[^:]+:\d+$/, t("gateways.notification.redis_format_error")).optional().or(z.literal("")),
    TWILIO_ACCOUNT_SID: z.string().startsWith("AC", t("gateways.notification.twilio_sid_format_error")).length(34, t("gateways.notification.twilio_sid_format_error")).optional().or(z.literal("")),
    TWILIO_AUTH_TOKEN: z.string().min(16, t("gateways.notification.twilio_token_min_length")).optional().or(z.literal("")),
    TWILIO_FROM_NUMBER: z.string().min(3, t("gateways.notification.twilio_from_min_length")).optional().or(z.literal("")),
    SMTP_HOST: z.string().optional().or(z.literal("")),
    SMTP_PORT: z.string().regex(/^\d+$/, t("gateways.notification.smtp_port_format_error")).optional().or(z.literal("")),
    SMTP_USER: z.string().optional().or(z.literal("")),
    SMTP_PASSWORD: z.string().optional().or(z.literal("")),
    SMTP_FROM: z.string().optional().or(z.literal("")),
    SMTP_SECURE: z.string().optional().or(z.literal("")),
  }), [t]);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getGatewayConfigByKey("notification");
      if (data.status === "ok") {
        const flatConfig: Record<string, string> = {};
        const flatCensored: Record<string, string> = {};
        
        Object.values(data.sections).forEach((entries) => {
          entries.forEach((e) => {
            flatConfig[e.key] = e.censored;
            flatCensored[e.key] = e.censored;
          });
        });
        
        setConfig(flatConfig);
        setCensored(flatCensored);
      }
    } catch (err) {
      console.error(err);
      toast.error(`${t("gateways.config_load_failed")}: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const fetchNotifLogs = useCallback(async () => {
    try {
      setLogsLoading(true);
      const data = await getNotificationLogs();
      setNotifLogs(data);
    } catch (err) {
      console.error("Failed to load notification logs:", err);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
    fetchNotifLogs();
  }, [fetchConfig, fetchNotifLogs]);

  const handleInputChange = (key: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const updates: Record<string, string> = {};
    const validationData: Record<string, unknown> = {};
    
    const keysToUpdate = [
      "GATEWAY_TOKEN",
      "REDIS_ADDR",
      "TWILIO_ACCOUNT_SID",
      "TWILIO_AUTH_TOKEN",
      "TWILIO_FROM_NUMBER",
      "SMTP_HOST",
      "SMTP_PORT",
      "SMTP_USER",
      "SMTP_PASSWORD",
      "SMTP_FROM",
      "SMTP_SECURE",
    ];

    keysToUpdate.forEach((k) => {
      const currentValue = config[k] || "";
      const censoredValue = censored[k] || "";
      
      if (currentValue !== censoredValue && !currentValue.includes("••")) {
        updates[k] = currentValue;
        validationData[k] = currentValue;
      }
    });

    if (Object.keys(updates).length === 0) {
      toast.info(t("gateways.no_changes_detected"));
      return;
    }

    try {
      const partialSchema = notificationSchema.partial();
      partialSchema.parse(validationData);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(`${t("gateways.validation_failed")}: ${err.issues[0].message}`);
      } else {
        toast.error(t("gateways.validation_error"));
      }
      return;
    }

    setSaving(true);
    try {
      const res = await updateGatewayConfigByKey("notification", updates);
      toast.success(res.message || t("gateways.notification.save_success"));
      setTimeout(fetchConfig, 3000);
    } catch (err) {
      console.error(err);
      toast.error(`${t("gateways.config_save_failed")}: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <GatewayPageWrapper>
      <div className="flex-1 flex flex-col pt-16 px-4 md:px-8 bg-background h-full overflow-y-auto">
        <div className="w-full max-w-5xl mx-auto space-y-8 pb-20">
          <div className="flex items-center gap-4 border-b border-border pb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                {t("gateways.notification.title")}
              </h1>
              <p className="text-xs text-muted-foreground">
                {t("gateways.notification.subtitle")}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground">{t("gateways.notification.loading")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <NotificationConfigForm
                config={config}
                saving={saving}
                onInputChange={handleInputChange}
                onSave={handleSave}
                onReset={fetchConfig}
              />
              <div className="space-y-6">
                <NotificationRecentLogsCard logs={notifLogs} loading={logsLoading} />
                <NotificationStatsCard logs={notifLogs} loading={logsLoading} />
              </div>
            </div>
          )}
        </div>
      </div>
    </GatewayPageWrapper>
  );
}

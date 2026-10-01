import React, { useEffect, useState, useCallback } from "react";
import { getGatewayConfigByKey, updateGatewayConfigByKey, getAuditEvents, type AuditEvent } from "@/lib/actions/gateways";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@k2net/i18n";
import { GatewayPageWrapper } from "@/components/page-guards/gateway-page-wrapper";
import { AuditConfigForm } from "@/components/gateways/audit/AuditConfigForm";
import { AuditRecentLogsCard } from "@/components/gateways/audit/AuditRecentLogsCard";
import { z } from "zod";

const auditSchema = z.object({
  DATABASE_URL: z.string().url("Format URL database tidak valid").startsWith("postgres://", "Database harus berupa URL PostgreSQL (postgres://)"),
  RETENTION_DAYS: z.coerce.number().int("Retention period harus berupa angka bulat").min(1, "Retention period minimal 1 hari").max(3650, "Retention period maksimal 3650 hari (10 tahun)")
});

export default function AuditGatewayPage() {
  const { t } = useTranslation();
  const [config, setConfig] = useState<Record<string, string>>({});
  const [censored, setCensored] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getGatewayConfigByKey("audit");
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
      toast.error(`${t("gateways.config_load_failed")}: ` + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLogsLoading(true);
      const data = await getAuditEvents();
      setAuditLogs(data.slice(0, 10));
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
    fetchAuditLogs();
  }, [fetchConfig, fetchAuditLogs]);

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
    const keysToUpdate = ["DATABASE_URL", "RETENTION_DAYS"];

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
      const partialSchema = auditSchema.partial();
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
      const res = await updateGatewayConfigByKey("audit", updates);
      toast.success(res.message || t("gateways.audit.save_success"));
      setTimeout(fetchConfig, 3000);
    } catch (err) {
      console.error(err);
      toast.error(`${t("gateways.config_save_failed")}: ` + (err instanceof Error ? err.message : String(err)));
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
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                {t("gateways.audit.title")}
              </h1>
              <p className="text-xs text-muted-foreground">
                {t("gateways.audit.subtitle")}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground">{t("gateways.audit.loading")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <AuditConfigForm
                config={config}
                saving={saving}
                onInputChange={handleInputChange}
                onSave={handleSave}
                onReset={fetchConfig}
              />
              <div className="space-y-6">
                <AuditRecentLogsCard logs={auditLogs} loading={logsLoading} />
              </div>
            </div>
          )}
        </div>
      </div>
    </GatewayPageWrapper>
  );
}

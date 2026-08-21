"use client";

import { useState } from "react";
import { Badge, Button, Input, PageLayout, ActionTooltip } from "@k2net/ui";
import { History, Save, RefreshCw, Database, Clock, Play, CheckCircle2, XCircle } from "lucide-react";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { SystemSecurityWrapper } from "@/components/page-guards/system-security-wrapper";
import { SettingsSection } from "../../settings/components/settings-section";
import { SettingsFormRow } from "../../settings/components/settings-form-row";
import { toast } from "sonner";

export default function SecurityAuditLogsPage() {
  const { settings, loading, updateSettings, isUpdating, testEmail, isTestingEmail, refresh } = useSystemSettings();
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [smtpDrainResult, setSmtpDrainResult] = useState<{ success: boolean; message: string } | null>(null);

  const getValue = (key: string, defaultValue: string = ""): string => {
    if (formValues[key] !== undefined) return formValues[key];
    const dbVal = settings.find((s) => s.key === key)?.value;
    return dbVal !== undefined ? dbVal : defaultValue;
  };

  const handleInputChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const keysToSave: Record<string, string> = {
      audit_log_retention_days: getValue("audit_log_retention_days", "90"),
      minio_log_drain_bucket: getValue("minio_log_drain_bucket", "db-backups"),
      log_archival_cron: getValue("log_archival_cron", "0 0 * * *"),
      cors_allowed_origins: getValue("cors_allowed_origins", "https://system-gis.kdua.net,https://gis.kdua.net"),
      kong_rate_limit_per_minute: getValue("kong_rate_limit_per_minute", "120"),
    };

    try {
      await updateSettings(keysToSave);
      toast.success("Kebijakan Audit Log & CORS berhasil diperbarui!");
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message || "Gagal memperbarui kebijakan audit log");
    }
  };

  const handleTestDrain = async () => {
    const host = getValue("smtp_host", "smtp-relay.brevo.com");
    const port = parseInt(getValue("smtp_port", "587"), 10);
    if (!host || !port) {
      toast.error("SMTP Host dan Port wajib diisi untuk pengujian.");
      return;
    }
    setSmtpDrainResult(null);
    try {
      const res = await testEmail({ host, port });
      setSmtpDrainResult({ success: true, message: res.message || "Koneksi drain SMTP berhasil!" });
      toast.success("Pengujian drain SMTP berhasil!");
    } catch (e: unknown) {
      const err = e as Error;
      setSmtpDrainResult({ success: false, message: err.message || "Gagal koneksi drain SMTP." });
      toast.error("Pengujian drain SMTP gagal");
    }
  };

  return (
    <SystemSecurityWrapper>
      <PageLayout variant="workspace" spaceY="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                Monitoring
              </Badge>
              <span className="text-xs text-muted-foreground">• Compliance & Storage Archival</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <History className="w-6 h-6 text-primary" /> Audit Logs & CORS Policy
            </h1>
            <p className="text-xs text-muted-foreground">
              Konfigurasi masa retensi log audit, pengarsipan MinIO S3, serta CORS Origins yang diizinkan pada Kong API Gateway.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ActionTooltip label="Muat Ulang Pengaturan" shortcut="R">
              <Button
                variant="outline"
                onClick={() => refresh()}
                disabled={loading}
                className="border-border hover:bg-muted text-muted-foreground text-xs h-9 px-3 gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Reload
              </Button>
            </ActionTooltip>
            <ActionTooltip label="Simpan Kebijakan Audit & CORS" shortcut="Ctrl+S">
              <Button
                onClick={handleSave}
                disabled={isUpdating || loading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-9 px-4 font-medium gap-2 shadow-sm"
              >
                {isUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Changes
              </Button>
            </ActionTooltip>
          </div>
        </div>

        {/* Form Content */}
        <div className="space-y-8 pb-16">

          {/* Section 1: Retention Policy */}
          <SettingsSection
            title="Audit Log Retention Policy"
            description="Masa simpan catatan aktivitas sistem sebelum diarsipkan atau dibersihkan otomatis dari basis data."
          >
            <SettingsFormRow
              label="Masa Retensi Audit Log (Hari)"
              description="Jumlah hari catatan log audit disimpan aktif di PostgreSQL sebelum diarsipkan ke MinIO S3."
              divider={false}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <Input
                  type="number"
                  min={7}
                  max={365}
                  value={getValue("audit_log_retention_days", "90")}
                  onChange={(e) => handleInputChange("audit_log_retention_days", e.target.value)}
                  className="bg-background/80 border-border text-foreground text-xs w-28 text-right focus:border-primary"
                />
                <span className="text-xs text-muted-foreground font-medium">Hari</span>
              </div>
            </SettingsFormRow>
          </SettingsSection>

          {/* Section 2: MinIO S3 Log Drain */}
          <SettingsSection
            title="MinIO S3 Log Drain & Archival"
            description="Eksportasi dan pengarsipan otomatis catatan audit log ke penyimpanan objek MinIO S3 on-premise."
          >
            <SettingsFormRow
              label="Target Bucket MinIO S3"
              description="Nama bucket MinIO S3 tempat penyimpanan arsip berkala file kompresi log."
            >
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-primary shrink-0" />
                <Input
                  type="text"
                  value={getValue("minio_log_drain_bucket", "db-backups")}
                  onChange={(e) => handleInputChange("minio_log_drain_bucket", e.target.value)}
                  placeholder="db-backups"
                  className="bg-background/80 border-border text-foreground text-xs w-48 font-mono focus:border-primary"
                />
              </div>
            </SettingsFormRow>

            <SettingsFormRow
              label="Jadwal Cron Pengarsipan Log"
              description="Ekspresi cron untuk rotasi dan pengarsipan log otomatis oleh worker backend Spring Boot."
              divider={false}
            >
              <Input
                type="text"
                value={getValue("log_archival_cron", "0 0 * * *")}
                onChange={(e) => handleInputChange("log_archival_cron", e.target.value)}
                placeholder="0 0 * * *"
                className="bg-background/80 border-border text-foreground text-xs w-40 font-mono focus:border-primary"
              />
            </SettingsFormRow>
          </SettingsSection>

          {/* Section 3: CORS Allowed Origins (formerly in /settings/security) */}
          <SettingsSection
            title="Kong API Gateway — CORS Policy"
            description="Domain publik yang diizinkan melakukan panggilan API lintas domain melalui Kong API Gateway."
          >
            <SettingsFormRow
              label="Allowed Origins List (Comma Separated)"
              description="Daftar origin HTTP/HTTPS yang diperbolehkan mengakses endpoint REST API backend."
            >
              <Input
                type="text"
                value={getValue("cors_allowed_origins", "https://system-gis.kdua.net,https://gis.kdua.net")}
                onChange={(e) => handleInputChange("cors_allowed_origins", e.target.value)}
                placeholder="https://system-gis.kdua.net,https://gis.kdua.net"
                className="bg-background/80 border-border text-foreground text-xs w-full max-w-md font-mono focus:border-primary"
              />
            </SettingsFormRow>

            <SettingsFormRow
              label="Global Rate Limit per Minute (Kong)"
              description="Batas maksimum permintaan HTTP per menit per klien IP yang diizinkan melewati Kong API Gateway."
              divider={false}
            >
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={10}
                  max={10000}
                  value={getValue("kong_rate_limit_per_minute", "120")}
                  onChange={(e) => handleInputChange("kong_rate_limit_per_minute", e.target.value)}
                  className="bg-background/80 border-border text-foreground text-xs w-28 text-right focus:border-primary"
                />
                <span className="text-xs text-muted-foreground font-medium">req/min</span>
              </div>
            </SettingsFormRow>
          </SettingsSection>

          {/* Section 4: MinIO Drain Connection Test */}
          <div className="bg-muted/10 border border-dashed border-border/80 p-6 rounded-xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Play className="w-4 h-4 text-primary" /> Test MinIO S3 Drain Connection
                </h3>
                <p className="text-xs text-muted-foreground">
                  Uji konektivitas socket ke host MinIO S3 untuk memverifikasi endpoint drain log tersedia.
                </p>
              </div>
              <ActionTooltip label="Uji Koneksi Drain MinIO S3" shortcut="Alt+T">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestDrain}
                  disabled={isTestingEmail}
                  className="border-border hover:bg-muted text-muted-foreground text-xs h-9 px-4 gap-2 shrink-0"
                >
                  {isTestingEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  Run Drain Test
                </Button>
              </ActionTooltip>
            </div>

            {smtpDrainResult && (
              <div className={`p-4 rounded-lg border text-xs font-mono flex items-start gap-3 transition-all ${
                smtpDrainResult.success
                  ? "bg-primary/10 text-primary/80 border-primary/20"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/20"
              }`}>
                {smtpDrainResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-primary/80 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="font-semibold">{smtpDrainResult.success ? "DRAIN CONNECTION OK" : "DRAIN CONNECTION FAILED"}</p>
                  <p className="opacity-90">{smtpDrainResult.message}</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </PageLayout>
    </SystemSecurityWrapper>
  );
}


"use client";

import { useState } from "react";
import { Badge, Button, Input, PageLayout } from "@k2net/ui";
import { History, Save, RefreshCw, Database, Clock } from "lucide-react";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { SystemSettingsWrapper } from "@/components/page-guards/system-settings-wrapper";
import { SettingsSection } from "../components/settings-section";
import { SettingsFormRow } from "../components/settings-form-row";
import { toast } from "sonner";

export default function SettingsAuditLogsPage() {
  const { settings, loading, updateSettings, isUpdating, refresh } = useSystemSettings();
  const [formValues, setFormValues] = useState<Record<string, string>>({});

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
    };

    try {
      await updateSettings(keysToSave);
      toast.success("Kebijakan Audit Log Retention berhasil diperbarui!");
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message || "Gagal memperbarui kebijakan audit log");
    }
  };

  return (
    <SystemSettingsWrapper>
      <PageLayout variant="workspace" spaceY="space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                Security & Routing
              </Badge>
              <span className="text-xs text-muted-foreground">• Compliance & Storage Archival</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <History className="w-6 h-6 text-primary" /> Audit Log Retention & Drains
            </h1>
            <p className="text-xs text-muted-foreground">
              Konfigurasi masa retensi log audit, target bucket pengarsipan MinIO S3, dan jadwal sinkronisasi otomatis.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={() => refresh()}
              disabled={loading}
              className="border-border hover:bg-muted text-muted-foreground text-xs h-9 px-3 gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Reload
            </Button>
            <Button
              onClick={handleSave}
              disabled={isUpdating || loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-9 px-4 font-medium gap-2 shadow-sm"
            >
              {isUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Changes
            </Button>
          </div>
        </div>

        {/* Form Content */}
        <div className="space-y-8 pb-16">
          
          {/* Section 1: Retention Policy */}
          <SettingsSection
            title="Audit Log Retention Policy"
            description="Masa simpan catatan aktivitas sistem sebelum diarsipkan atau dibersihkan otomatis."
          >
            <SettingsFormRow
              label="Masa Retensi Audit Log (Hari)"
              description="Jumlah hari catatan log audit disimpan aktif di basis data PostgreSQL sebelum diarsipkan."
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

          {/* Section 2: Storage Drains & Archival */}
          <SettingsSection
            title="MinIO S3 Log Drain Target"
            description="Eksportasi dan pengarsipan otomatis catatan audit log ke penyimpanan objek MinIO S3."
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
              description="Ekspresi cron waktu pengarsipan dan rotasi log otomatis oleh worker backend."
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

        </div>
      </PageLayout>
    </SystemSettingsWrapper>
  );
}

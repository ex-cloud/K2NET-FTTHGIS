import { useState } from "react";
import { Badge, Button, PageLayout, ActionTooltip } from "@k2net/ui";
import { Mail, Save, RefreshCw } from "lucide-react";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { SystemSettingsWrapper } from "@/components/page-guards/system-settings-wrapper";
import { toast } from "sonner";
import { SmtpCredentialsSection } from "../components/smtp-credentials-section";
import { SmtpTestCard } from "../components/smtp-test-card";

export default function SettingsSmtpMailPage() {
  const { settings, loading, updateSettings, isUpdating, testEmail, isTestingEmail, refresh } = useSystemSettings();
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);

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
      smtp_host: getValue("smtp_host", "smtp-relay.brevo.com"),
      smtp_port: getValue("smtp_port", "587"),
      smtp_username: getValue("smtp_username", "ac9057001@smtp-brevo.com"),
      smtp_password: getValue("smtp_password", ""),
      smtp_from: getValue("smtp_from", "noreply@kdua.net"),
    };

    try {
      await updateSettings(keysToSave);
      toast.success("Konfigurasi SMTP Mail Server berhasil disimpan!");
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message || "Gagal menyimpan konfigurasi SMTP");
    }
  };

  const handleTestSmtp = async () => {
    const host = getValue("smtp_host", "smtp-relay.brevo.com");
    const port = parseInt(getValue("smtp_port", "587"), 10);
    const username = getValue("smtp_username");
    const password = getValue("smtp_password");

    if (!host || !port) {
      toast.error("SMTP Host dan Port wajib diisi untuk pengujian.");
      return;
    }

    setSmtpTestResult(null);
    try {
      const res = await testEmail({ host, port, username, password });
      setSmtpTestResult({ success: true, message: res.message || "Koneksi SMTP berhasil terhubung!" });
      toast.success("Pengujian koneksi SMTP berhasil!");
    } catch (e: unknown) {
      const error = e as Error;
      setSmtpTestResult({ success: false, message: error.message || "Gagal me-connect socket SMTP host." });
      toast.error("Pengujian koneksi SMTP gagal");
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
                System Communications
              </Badge>
              <span className="text-xs text-muted-foreground">• Central Mail Server Relay</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <Mail className="w-6 h-6 text-primary" /> SMTP Mail Server
            </h1>
            <p className="text-xs text-muted-foreground">
              Konfigurasi server email keluar utama untuk pengiriman link verifikasi akun, reset password, dan notifikasi sistem.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ActionTooltip label="Muat Ulang Pengaturan SMTP" shortcut="R">
              <Button
                variant="outline"
                onClick={() => refresh()}
                disabled={loading}
                className="border-border hover:bg-muted text-muted-foreground text-xs h-9 px-3 gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Reload
              </Button>
            </ActionTooltip>
            <ActionTooltip label="Simpan Pengaturan SMTP" shortcut="Ctrl+S">
              <Button
                onClick={handleSave}
                disabled={isUpdating || loading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-9 px-4 font-medium gap-2 shadow-sm"
              >
                {isUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save SMTP Settings
              </Button>
            </ActionTooltip>
          </div>
        </div>

        {/* Form Content */}
        <div className="space-y-8 pb-16">
          <SmtpCredentialsSection
            smtpHost={getValue("smtp_host", "smtp-relay.brevo.com")}
            onSmtpHostChange={(val) => handleInputChange("smtp_host", val)}
            smtpPort={getValue("smtp_port", "587")}
            onSmtpPortChange={(val) => handleInputChange("smtp_port", val)}
            smtpUsername={getValue("smtp_username", "")}
            onSmtpUsernameChange={(val) => handleInputChange("smtp_username", val)}
            smtpPassword={getValue("smtp_password", "")}
            onSmtpPasswordChange={(val) => handleInputChange("smtp_password", val)}
            smtpFrom={getValue("smtp_from", "noreply@kdua.net")}
            onSmtpFromChange={(val) => handleInputChange("smtp_from", val)}
          />

          <SmtpTestCard
            onTest={handleTestSmtp}
            isTestingEmail={isTestingEmail}
            smtpTestResult={smtpTestResult}
          />
        </div>
      </PageLayout>
    </SystemSettingsWrapper>
  );
}

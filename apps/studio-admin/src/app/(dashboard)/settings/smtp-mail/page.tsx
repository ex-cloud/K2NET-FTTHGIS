

import { useState } from "react";
import { Badge, Button, Input, PageLayout, ActionTooltip } from "@k2net/ui";
import { Mail, Save, RefreshCw, Eye, EyeOff, Play, CheckCircle2, XCircle } from "lucide-react";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { SystemSettingsWrapper } from "@/components/page-guards/system-settings-wrapper";
import { SettingsSection } from "../components/settings-section";
import { SettingsFormRow } from "../components/settings-form-row";
import { toast } from "sonner";

export default function SettingsSmtpMailPage() {
  const { settings, loading, updateSettings, isUpdating, testEmail, isTestingEmail, refresh } = useSystemSettings();
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
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
          
          {/* Top Main Form Container Card */}
          <SettingsSection
            title="SMTP Relay Credentials & Host"
            description="Kredensial otentikasi server mail relay (Brevo / SendGrid / Custom SMTP Server)."
          >
            <SettingsFormRow
              label="SMTP Hostname"
              description="Alamat host server SMTP (misal: smtp-relay.brevo.com atau smtp.gmail.com)."
            >
              <Input
                type="text"
                value={getValue("smtp_host", "smtp-relay.brevo.com")}
                onChange={(e) => handleInputChange("smtp_host", e.target.value)}
                placeholder="smtp-relay.brevo.com"
                className="bg-background/80 border-border text-foreground text-xs w-full max-w-sm font-mono focus:border-primary"
              />
            </SettingsFormRow>

            <SettingsFormRow
              label="SMTP Server Port"
              description="Port TLS/STARTTLS (587 atau 2525) atau SSL (465)."
            >
              <Input
                type="number"
                value={getValue("smtp_port", "587")}
                onChange={(e) => handleInputChange("smtp_port", e.target.value)}
                placeholder="587"
                className="bg-background/80 border-border text-foreground text-xs w-28 text-right font-mono focus:border-primary"
              />
            </SettingsFormRow>

            <SettingsFormRow
              label="SMTP Username"
              description="Username atau ID akun otentikasi relay email."
            >
              <Input
                type="text"
                value={getValue("smtp_username", "")}
                onChange={(e) => handleInputChange("smtp_username", e.target.value)}
                placeholder="username@smtp-provider.com"
                className="bg-background/80 border-border text-foreground text-xs w-full max-w-sm font-mono focus:border-primary"
              />
            </SettingsFormRow>

            <SettingsFormRow
              label="SMTP Password / API Key"
              description="Kata sandi otentikasi atau kunci API relay email."
            >
              <div className="relative w-full max-w-sm">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={getValue("smtp_password", "")}
                  onChange={(e) => handleInputChange("smtp_password", e.target.value)}
                  placeholder="••••••••••••••••"
                  className="bg-background/80 border-border text-foreground text-xs pr-10 font-mono focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </SettingsFormRow>

            <SettingsFormRow
              label="Default Sender Email ('From' Address)"
              description="Alamat email pengirim default yang tercantum pada penerima email."
              divider={false}
            >
              <Input
                type="email"
                value={getValue("smtp_from", "noreply@kdua.net")}
                onChange={(e) => handleInputChange("smtp_from", e.target.value)}
                placeholder="noreply@kdua.net"
                className="bg-background/80 border-border text-foreground text-xs w-full max-w-sm font-mono focus:border-primary"
              />
            </SettingsFormRow>
          </SettingsSection>

          {/* Bottom Separate Interactive Connection Test Card */}
          <div className="bg-muted/10 border border-dashed border-border/80 p-6 rounded-xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Play className="w-4 h-4 text-primary" /> Interactive Connection Test
                </h3>
                <p className="text-xs text-muted-foreground">
                  Uji konektivitas pengaturan SMTP secara langsung dengan menghubungkan socket ke host server SMTP.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleTestSmtp}
                disabled={isTestingEmail}
                className="border-border hover:bg-muted text-muted-foreground text-xs h-9 px-4 gap-2 shrink-0"
              >
                {isTestingEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                Run Connection Test
              </Button>
            </div>

            {/* Diagnostic Output Console */}
            {smtpTestResult && (
              <div className={`p-4 rounded-lg border text-xs font-mono flex items-start gap-3 transition-all ${
                smtpTestResult.success
                  ? "bg-primary/10 text-primary/80 border-primary/20"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/20"
              }`}>
                {smtpTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-primary/80 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="font-semibold">{smtpTestResult.success ? "CONNECTION SUCCESSFUL" : "CONNECTION FAILED"}</p>
                  <p className="opacity-90">{smtpTestResult.message}</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </PageLayout>
    </SystemSettingsWrapper>
  );
}

"use client";

import { useState } from "react";
import { Badge, Button, Input, PageLayout, Switch, TracingBeam } from "@k2net/ui";
import { ShieldCheck, Save, RefreshCw } from "lucide-react";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { SystemSettingsWrapper } from "@/components/page-guards/system-settings-wrapper";
import { SettingsSection } from "../components/settings-section";
import { SettingsFormRow } from "../components/settings-form-row";
import { toast } from "sonner";

export default function SettingsSecurityPage() {
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

  const handleSwitchChange = (key: string, checked: boolean) => {
    setFormValues((prev) => ({ ...prev, [key]: checked ? "true" : "false" }));
  };

  const handleSave = async () => {
    const keysToSave: Record<string, string> = {
      keycloak_issuer_url: getValue("keycloak_issuer_url", "https://auth-gis.k2net.id/realms/ftth-realm"),
      jwt_algorithm: getValue("jwt_algorithm", "RS256"),
      allow_self_registration: getValue("allow_self_registration", "false"),
      enforce_mfa: getValue("enforce_mfa", "false"),
      cors_allowed_origins: getValue("cors_allowed_origins", "https://system-gis.k2net.id,https://gis.k2net.id"),
    };

    try {
      await updateSettings(keysToSave);
      toast.success("Pengaturan Security & Routing berhasil diperbarui!");
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message || "Gagal memperbarui pengaturan keamanan");
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
              <span className="text-xs text-muted-foreground">• Keycloak IAM & Gateway CORS</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-primary" /> Security & CORS Routing
            </h1>
            <p className="text-xs text-muted-foreground">
              Konfigurasi Keycloak Realm Issuer, enkripsi token JWT, kebijakan pendaftaran pengguna, dan CORS gateway.
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

        {/* Content with TracingBeam */}
        <TracingBeam className="px-4">
          <div className="pl-4 md:pl-10 space-y-8 pb-16">
            
            {/* Section 1: Keycloak IAM & JWT */}
            <SettingsSection
              title="Keycloak IAM & JWT Token Validation"
              description="URL realm issuer dan algoritma tanda tangan digital untuk validasi token akses pengguna."
            >
              <SettingsFormRow
                label="Keycloak Realm Issuer URL"
                description="Endpoint publik realm Keycloak 26 yang digunakan Kong API Gateway dan NextAuth untuk memverifikasi JWT."
              >
                <Input
                  type="text"
                  value={getValue("keycloak_issuer_url", "https://auth-gis.k2net.id/realms/ftth-realm")}
                  onChange={(e) => handleInputChange("keycloak_issuer_url", e.target.value)}
                  placeholder="https://auth-gis.k2net.id/realms/ftth-realm"
                  className="bg-background/80 border-border text-foreground text-xs w-full max-w-md font-mono focus:border-primary"
                />
              </SettingsFormRow>

              <SettingsFormRow
                label="JWT Signing Algorithm"
                description="Algoritma kriptografi standar untuk menandatangani dan memverifikasi token JWT."
                divider={false}
              >
                <select
                  value={getValue("jwt_algorithm", "RS256")}
                  onChange={(e) => handleInputChange("jwt_algorithm", e.target.value)}
                  className="bg-background border border-border text-foreground text-xs rounded-md px-3 py-1.5 focus:border-primary w-40 font-mono"
                >
                  <option value="RS256">RS256 (Asymmetric PKI)</option>
                  <option value="HS256">HS256 (Symmetric HMAC)</option>
                </select>
              </SettingsFormRow>
            </SettingsSection>

            {/* Section 2: Policies */}
            <SettingsSection
              title="Access & Registration Policies"
              description="Kebijakan pendaftaran mandiri pengguna dan pemaksaan autentikasi dua faktor (MFA/2FA)."
            >
              <SettingsFormRow
                label="Allow Global Self-Registration"
                description="Saat diaktifkan, halaman pendaftaran akun terbuka untuk publik. Pengguna dapat mendaftarkan organisasi secara mandiri."
              >
                <Switch
                  checked={getValue("allow_self_registration", "false") === "true"}
                  onCheckedChange={(checked) => handleSwitchChange("allow_self_registration", checked)}
                  className="data-[state=checked]:bg-primary"
                />
              </SettingsFormRow>

              <SettingsFormRow
                label="Force Multi-Factor Authentication (MFA / 2FA)"
                description="Wajibkan penggunaan aplikasi otentikator TOTP untuk seluruh Super Admin dan Administrator tenant."
                divider={false}
              >
                <Switch
                  checked={getValue("enforce_mfa", "false") === "true"}
                  onCheckedChange={(checked) => handleSwitchChange("enforce_mfa", checked)}
                  className="data-[state=checked]:bg-primary"
                />
              </SettingsFormRow>
            </SettingsSection>

            {/* Section 3: CORS Allowed Origins */}
            <SettingsSection
              title="Cross-Origin Resource Sharing (CORS)"
              description="Domain publik yang diizinkan melakukan panggilan API lintas domain ke Kong API Gateway."
            >
              <SettingsFormRow
                label="Allowed Origins List (Comma Separated)"
                description="Daftar origin HTTP/HTTPS yang diperbolehkan mengakses API backend."
                divider={false}
              >
                <Input
                  type="text"
                  value={getValue("cors_allowed_origins", "https://system-gis.k2net.id,https://gis.k2net.id")}
                  onChange={(e) => handleInputChange("cors_allowed_origins", e.target.value)}
                  placeholder="e.g. https://system-gis.k2net.id,https://gis.k2net.id"
                  className="bg-background/80 border-border text-foreground text-xs w-full max-w-md font-mono focus:border-primary"
                />
              </SettingsFormRow>
            </SettingsSection>

          </div>
        </TracingBeam>
      </PageLayout>
    </SystemSettingsWrapper>
  );
}

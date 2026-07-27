"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge, Button, Input, PageLayout } from "@k2net/ui";
import { Palette, Save, RefreshCw, Upload, ShieldCheck } from "lucide-react";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { SystemSettingsWrapper } from "@/components/page-guards/system-settings-wrapper";
import { SettingsSection } from "../components/settings-section";
import { SettingsFormRow } from "../components/settings-form-row";
import { toast } from "sonner";

export default function SettingsBrandingPage() {
  const { settings, loading, updateSettings, isUpdating, refresh } = useSystemSettings();
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [dragActive, setDragActive] = useState(false);

  const getValue = (key: string, defaultValue: string = ""): string => {
    if (formValues[key] !== undefined) return formValues[key];
    const dbVal = settings.find((s) => s.key === key)?.value;
    return dbVal !== undefined ? dbVal : defaultValue;
  };

  const handleInputChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogoFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Format file harus berupa gambar (PNG, JPG, SVG, WEBP).");
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      toast.error("Ukuran logo maksimal 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        handleInputChange("logo_url", e.target.result as string);
        toast.success("Logo berhasil diimpor! Lihat pratinjau di sebelah kanan.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const keysToSave: Record<string, string> = {
      app_name: getValue("app_name", "K2NET FTTH GIS Platform"),
      logo_url: getValue("logo_url", ""),
      brand_accent_color: getValue("brand_accent_color", "#10b981"),
      footer_copyright: getValue("footer_copyright", "© 2026 K2NET Enterprise SaaS Platform. All rights reserved."),
    };

    try {
      await updateSettings(keysToSave);
      toast.success("Pengaturan Branding & Whitelabel berhasil diperbarui!");
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message || "Gagal memperbarui branding");
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
                Platform Config
              </Badge>
              <span className="text-xs text-muted-foreground">• Whitelabel Identity & Aesthetics</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <Palette className="w-6 h-6 text-primary" /> Branding & Whitelabel
            </h1>
            <p className="text-xs text-muted-foreground">
              Kustomisasi logo, favicon, warna aksen tema, dan teks hak cipta pada seluruh portal aplikasi secara global.
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
          
          {/* Section 1: Logo & Favicon */}
          <SettingsSection
            title="Logo & Brand Assets"
            description="Unggah logo resmi organisasi atau masukkan URL / string Base64 data logo."
          >
            <SettingsFormRow
              label="System Logo URL / Base64"
              description="URL gambar logo platform atau string Base64 yang akan ditampilkan di header dan login."
            >
              <Input
                type="text"
                value={getValue("logo_url", "")}
                onChange={(e) => handleInputChange("logo_url", e.target.value)}
                placeholder="e.g. /favicon.ico or data:image/png;base64,..."
                className="bg-background/80 border-border text-foreground text-xs max-w-sm focus:border-primary font-mono"
              />
            </SettingsFormRow>

            <SettingsFormRow
              label="Upload File Logo Image"
              description="Drag & drop atau pilih gambar logo dari komputer Anda (Format PNG, SVG, WEBP; Maks 1MB)."
              divider={false}
            >
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) handleLogoFile(e.dataTransfer.files[0]); }}
                onClick={() => document.getElementById("branding-logo-input")?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer w-full max-w-xs ${
                  dragActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background/40 text-muted-foreground hover:border-border/80"
                }`}
              >
                <input
                  id="branding-logo-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) handleLogoFile(e.target.files[0]); }}
                />
                <Upload className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs font-medium text-foreground">Klik atau drag file logo ke sini</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">PNG, SVG, WEBP (Max 1MB)</p>
              </div>
            </SettingsFormRow>
          </SettingsSection>

          {/* Section 2: Accent Theme & Live Preview */}
          <SettingsSection
            title="Theme Accent & Live Preview"
            description="Warna aksen tema utama dan pratinjau langsung tampilan header portal."
          >
            <SettingsFormRow
              label="Warna Aksen Branding (Hex Code)"
              description="Warna primer yang digunakan untuk button, badge, dan highlight pada portal pengguna."
            >
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={getValue("brand_accent_color", "#10b981")}
                  onChange={(e) => handleInputChange("brand_accent_color", e.target.value)}
                  className="w-8 h-8 rounded border border-border cursor-pointer bg-transparent"
                />
                <Input
                  type="text"
                  value={getValue("brand_accent_color", "#10b981")}
                  onChange={(e) => handleInputChange("brand_accent_color", e.target.value)}
                  className="bg-background/80 border-border text-foreground text-xs w-28 font-mono focus:border-primary"
                />
              </div>
            </SettingsFormRow>

            <SettingsFormRow
              label="Live Branding Preview"
              description="Simulasi pratinjau tampilan header portal pengguna secara real-time."
              divider={false}
            >
              <div className="p-4 rounded-xl border border-border bg-card/80 flex items-center justify-between w-full max-w-sm shadow-md">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-primary/10 border border-primary/30 flex items-center justify-center overflow-hidden">
                    {getValue("logo_url") ? (
                      <Image src={getValue("logo_url")} width={20} height={20} alt="Logo Preview" className="object-contain" unoptimized />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                    )}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary truncate max-w-[140px]">
                    {getValue("app_name", "K2NET FTTH GIS")}
                  </span>
                </div>
                <Badge variant="outline" className="border-primary/30 text-primary text-[9px]">
                  LIVE PREVIEW
                </Badge>
              </div>
            </SettingsFormRow>
          </SettingsSection>

        </div>
      </PageLayout>
    </SystemSettingsWrapper>
  );
}

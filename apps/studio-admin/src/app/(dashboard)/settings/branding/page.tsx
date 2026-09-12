import { useState } from "react";
import { Badge, Button, PageLayout, ActionTooltip } from "@k2net/ui";
import { Palette, Save, RefreshCw } from "lucide-react";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { SystemSettingsWrapper } from "@/components/page-guards/system-settings-wrapper";
import { toast } from "sonner";
import { BrandingLogoSection } from "../components/branding-logo-section";
import { BrandingThemeSection } from "../components/branding-theme-section";
import { BrandingInterfaceSection } from "../components/branding-interface-section";

export default function SettingsBrandingPage() {
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
            <ActionTooltip label="Muat Ulang Pengaturan Branding" shortcut="R">
              <Button
                variant="outline"
                onClick={() => refresh()}
                disabled={loading}
                className="border-border hover:bg-muted text-muted-foreground text-xs h-9 px-3 gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Reload
              </Button>
            </ActionTooltip>
            <ActionTooltip label="Simpan Perubahan Branding" shortcut="Ctrl+S">
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
          <BrandingLogoSection
            logoUrl={getValue("logo_url", "")}
            onLogoUrlChange={(val) => handleInputChange("logo_url", val)}
          />

          <BrandingThemeSection
            brandAccentColor={getValue("brand_accent_color", "#10b981")}
            onAccentColorChange={(val) => handleInputChange("brand_accent_color", val)}
            logoUrl={getValue("logo_url", "")}
            appName={getValue("app_name", "K2NET FTTH GIS")}
          />

          <BrandingInterfaceSection
            fontSize={getValue("interface_font_size", "default")}
            onFontSizeChange={(val) => handleInputChange("interface_font_size", val)}
            usePointerCursors={getValue("use_pointer_cursors", "true") === "true"}
            onPointerCursorsChange={(val) => handleInputChange("use_pointer_cursors", val ? "true" : "false")}
            underlineLinks={getValue("underline_links", "false") === "true"}
            onUnderlineLinksChange={(val) => handleInputChange("underline_links", val ? "true" : "false")}
            themePreset={getValue("interface_theme_preset", "dark")}
            onThemePresetChange={(val) => {
              handleInputChange("interface_theme_preset", val);
              if (val === "magic_blue") handleInputChange("brand_accent_color", "#3b82f6");
              else if (val === "dark") handleInputChange("brand_accent_color", "#10b981");
              else if (val === "classic_dark") handleInputChange("brand_accent_color", "#6366f1");
              toast.success(`Skema tema diubah ke ${val}`);
            }}
          />
        </div>
      </PageLayout>
    </SystemSettingsWrapper>
  );
}

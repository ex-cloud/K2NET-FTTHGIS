import { Button } from "@k2net/ui";
import { toast } from "sonner";
import { SettingsSection } from "./settings-section";
import { SettingsFormRow } from "./settings-form-row";
import { useTranslation } from "@k2net/i18n";

export interface BrandingInterfaceSectionProps {
  fontSize: string;
  onFontSizeChange: (val: string) => void;
  usePointerCursors: boolean;
  onPointerCursorsChange: (val: boolean) => void;
  underlineLinks: boolean;
  onUnderlineLinksChange: (val: boolean) => void;
  themePreset: string;
  onThemePresetChange: (val: string) => void;
}

export function BrandingInterfaceSection({
  fontSize,
  onFontSizeChange,
  usePointerCursors,
  onPointerCursorsChange,
  underlineLinks,
  onUnderlineLinksChange,
  themePreset,
  onThemePresetChange,
}: BrandingInterfaceSectionProps) {
  const { t } = useTranslation();

  return (
    <SettingsSection
      title={t("settings.branding.interface_title")}
      description={t("settings.branding.interface_desc")}
      divider={false}
    >
      {/* App Sidebar Customization */}
      <SettingsFormRow
        label={t("settings.branding.sidebar_label")}
        description={t("settings.branding.sidebar_desc")}
      >
        <Button
          variant="outline"
          size="sm"
          className="border-border hover:bg-muted text-foreground text-xs h-8 px-3"
          onClick={() => toast.info(t("settings.branding.sidebar_customized_toast"))}
        >
          {t("settings.branding.customize_btn")}
        </Button>
      </SettingsFormRow>

      {/* Font Size Selector */}
      <SettingsFormRow
        label={t("settings.branding.font_size_label")}
        description={t("settings.branding.font_size_desc")}
      >
        <select
          value={fontSize}
          onChange={(e) => onFontSizeChange(e.target.value)}
          className="bg-background border border-border text-foreground text-xs rounded-lg px-3 py-1.5 focus:border-primary outline-none"
        >
          <option value="default">Default (14px)</option>
          <option value="compact">Compact (13px)</option>
          <option value="large">Large (15px)</option>
        </select>
      </SettingsFormRow>

      {/* Use Pointer Cursors Toggle */}
      <SettingsFormRow
        label={t("settings.branding.pointer_cursors_label")}
        description={t("settings.branding.pointer_cursors_desc")}
      >
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="pointer-cursors-toggle"
            checked={usePointerCursors}
            onChange={(e) => onPointerCursorsChange(e.target.checked)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
          />
          <label htmlFor="pointer-cursors-toggle" className="text-xs text-muted-foreground cursor-pointer">
            {usePointerCursors ? t("common.enabled") : t("common.disabled")}
          </label>
        </div>
      </SettingsFormRow>

      {/* Underline Links Toggle */}
      <SettingsFormRow
        label={t("settings.branding.underline_links_label")}
        description={t("settings.branding.underline_links_desc")}
      >
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="underline-links-toggle"
            checked={underlineLinks}
            onChange={(e) => onUnderlineLinksChange(e.target.checked)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
          />
          <label htmlFor="underline-links-toggle" className="text-xs text-muted-foreground cursor-pointer">
            {underlineLinks ? "Always Underline" : "Default"}
          </label>
        </div>
      </SettingsFormRow>

      {/* Interface Theme Presets Selector */}
      <SettingsFormRow
        label={t("settings.branding.interface_theme_label")}
        description={t("settings.branding.interface_theme_desc")}
        divider={false}
      >
        <select
          value={themePreset}
          onChange={(e) => onThemePresetChange(e.target.value)}
          className="bg-card border border-border text-foreground text-xs rounded-lg px-3 py-2 font-medium focus:border-primary outline-none max-w-xs cursor-pointer shadow-sm"
        >
          <option value="system">Aa System preference</option>
          <option value="light">Aa Light</option>
          <option value="pure_light">Aa Pure Light</option>
          <option value="dark">Aa Dark (Default K2NET)</option>
          <option value="magic_blue">Aa Magic Blue</option>
          <option value="classic_dark">Aa Classic Dark</option>
          <option value="custom">Aa Custom</option>
        </select>
      </SettingsFormRow>
    </SettingsSection>
  );
}

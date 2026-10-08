import { Image } from "@/lib/navigation-compat";
import { Badge, Input } from "@k2net/ui";
import { ShieldCheck } from "lucide-react";
import { SettingsSection } from "./settings-section";
import { SettingsFormRow } from "./settings-form-row";
import { useTranslation } from "@k2net/i18n";

export interface BrandingThemeSectionProps {
  brandAccentColor: string;
  onAccentColorChange: (val: string) => void;
  logoUrl: string;
  appName: string;
}

export function BrandingThemeSection({
  brandAccentColor,
  onAccentColorChange,
  logoUrl,
  appName,
}: BrandingThemeSectionProps) {
  const { t } = useTranslation();

  return (
    <SettingsSection
      title={t("settings.branding.theme_accent_title")}
      description={t("settings.branding.theme_accent_desc")}
    >
      <SettingsFormRow
        label={t("settings.branding.accent_color_label")}
        description={t("settings.branding.accent_color_desc")}
      >
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={brandAccentColor}
            onChange={(e) => onAccentColorChange(e.target.value)}
            className="w-8 h-8 rounded border border-border cursor-pointer bg-transparent"
          />
          <Input
            type="text"
            value={brandAccentColor}
            onChange={(e) => onAccentColorChange(e.target.value)}
            className="bg-background/80 border-border text-foreground text-xs w-28 font-mono focus:border-primary"
          />
        </div>
      </SettingsFormRow>

      <SettingsFormRow
        label={t("settings.branding.live_preview_label")}
        description={t("settings.branding.live_preview_desc")}
        divider={false}
      >
        <div className="p-4 rounded-xl border border-border bg-card/80 flex items-center justify-between w-full max-w-sm shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/10 border border-primary/30 flex items-center justify-center overflow-hidden">
              {logoUrl ? (
                <Image src={logoUrl} width={20} height={20} alt="Logo Preview" className="object-contain" unoptimized />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              )}
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary truncate max-w-[140px]">
              {appName || "K2NET FTTH GIS"}
            </span>
          </div>
          <Badge variant="outline" className="border-primary/30 text-primary text-[9px]">
            LIVE PREVIEW
          </Badge>
        </div>
      </SettingsFormRow>
    </SettingsSection>
  );
}

import React from "react";
import { useTranslation } from "@k2net/i18n";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Label,
} from "@k2net/ui";
import {
  Palette,
  Upload,
  Globe,
  Building2,
} from "lucide-react";
import { getLogoUrl } from "../../lib/domain";
import type { UpdateTenantBrandingPayload } from "../../hooks/useTenantBranding";

export interface VisualIdentityCardProps {
  formData: UpdateTenantBrandingPayload;
  setFormData: React.Dispatch<React.SetStateAction<UpdateTenantBrandingPayload>>;
  isWhitelabelAllowed: boolean;
  onFileUpload: (file: File, type: "logo" | "favicon") => void;
  isUploadingLogo: boolean;
  isUploadingFavicon: boolean;
}

export function VisualIdentityCard({
  formData,
  setFormData,
  isWhitelabelAllowed,
  onFileUpload,
  isUploadingLogo,
  isUploadingFavicon,
}: VisualIdentityCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="border-border/60 bg-card shadow-xs">
      <CardHeader className="pb-3 border-b border-border/40">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Palette className="size-4 text-primary" />
          {t("settings.branding_title")}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {t("settings.branding_subtitle")}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">{t("settings.whitelabel.logo_url_label")}</Label>
            <div className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-border/80 bg-muted/10">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0 overflow-hidden">
                {formData.logoUrl ? (
                  <img src={getLogoUrl(formData.logoUrl)} alt="Logo" className="h-full w-full object-contain p-1" />
                ) : (
                  <Building2 className="size-8 text-primary/60" />
                )}
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <Label htmlFor="logoFileInput" className="cursor-pointer">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!isWhitelabelAllowed || isUploadingLogo}
                    className="h-7 px-2.5 text-xs font-medium gap-1.5 pointer-events-none"
                  >
                    <Upload className="size-3.5" />
                    {isUploadingLogo ? t("settings.whitelabel.saving") : t("settings.logo_upload_btn")}
                  </Button>
                </Label>
                <input
                  id="logoFileInput"
                  type="file"
                  accept="image/png,image/svg+xml,image/webp"
                  className="hidden"
                  disabled={!isWhitelabelAllowed || isUploadingLogo}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onFileUpload(file, "logo");
                  }}
                />
                <p className="text-[10px] text-muted-foreground">{t("settings.logo_size_hint")}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">{t("settings.whitelabel.favicon_url_label")}</Label>
            <div className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-border/80 bg-muted/10">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0 overflow-hidden">
                {formData.faviconUrl ? (
                  <img src={getLogoUrl(formData.faviconUrl)} alt="Favicon" className="h-8 w-8 object-contain" />
                ) : (
                  <Globe className="size-8 text-primary/60" />
                )}
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <Label htmlFor="faviconFileInput" className="cursor-pointer">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!isWhitelabelAllowed || isUploadingFavicon}
                    className="h-7 px-2.5 text-xs font-medium gap-1.5 pointer-events-none"
                  >
                    <Upload className="size-3.5" />
                    {isUploadingFavicon ? t("settings.whitelabel.saving") : t("settings.favicon_upload_btn")}
                  </Button>
                </Label>
                <input
                  id="faviconFileInput"
                  type="file"
                  accept="image/x-icon,image/png,image/svg+xml"
                  className="hidden"
                  disabled={!isWhitelabelAllowed || isUploadingFavicon}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onFileUpload(file, "favicon");
                  }}
                />
                <p className="text-[10px] text-muted-foreground">Format: .ico, .png 64x64 px.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="brandColorPrimary" className="text-xs font-semibold">
              {t("settings.whitelabel.primary_color_label")}
            </Label>
            <div className="flex items-center gap-2">
              <input
                id="brandColorPrimaryPicker"
                type="color"
                disabled={!isWhitelabelAllowed}
                value={formData.brandColorPrimary || "#2563EB"}
                onChange={(e) => setFormData((prev) => ({ ...prev, brandColorPrimary: e.target.value }))}
                className="h-8 w-10 p-0 border border-border rounded cursor-pointer bg-transparent"
              />
              <Input
                id="brandColorPrimary"
                disabled={!isWhitelabelAllowed}
                value={formData.brandColorPrimary || "#2563EB"}
                onChange={(e) => setFormData((prev) => ({ ...prev, brandColorPrimary: e.target.value }))}
                className="h-8 text-xs font-mono uppercase"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="brandColorAccent" className="text-xs font-semibold">
              {t("settings.whitelabel.accent_color_label")}
            </Label>
            <div className="flex items-center gap-2">
              <input
                id="brandColorAccentPicker"
                type="color"
                disabled={!isWhitelabelAllowed}
                value={formData.brandColorAccent || "#1D4ED8"}
                onChange={(e) => setFormData((prev) => ({ ...prev, brandColorAccent: e.target.value }))}
                className="h-8 w-10 p-0 border border-border rounded cursor-pointer bg-transparent"
              />
              <Input
                id="brandColorAccent"
                disabled={!isWhitelabelAllowed}
                value={formData.brandColorAccent || "#1D4ED8"}
                onChange={(e) => setFormData((prev) => ({ ...prev, brandColorAccent: e.target.value }))}
                className="h-8 text-xs font-mono uppercase"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

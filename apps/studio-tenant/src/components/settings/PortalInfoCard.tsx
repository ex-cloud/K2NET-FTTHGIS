import React from "react";
import { useTranslation } from "@k2net/i18n";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Label,
} from "@k2net/ui";
import { Building2 } from "lucide-react";
import type { UpdateTenantBrandingPayload } from "../../hooks/useTenantBranding";

export interface PortalInfoCardProps {
  formData: UpdateTenantBrandingPayload;
  setFormData: React.Dispatch<React.SetStateAction<UpdateTenantBrandingPayload>>;
  isWhitelabelAllowed: boolean;
}

export function PortalInfoCard({ formData, setFormData, isWhitelabelAllowed }: PortalInfoCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="border-border/60 bg-card shadow-xs">
      <CardHeader className="pb-3 border-b border-border/40">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Building2 className="size-4 text-primary" />
          {t("settings.system_info.core_spec_title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="appTitleInput" className="text-xs font-semibold">
              {t("settings.whitelabel.app_title_label")}
            </Label>
            <Input
              id="appTitleInput"
              disabled={!isWhitelabelAllowed}
              placeholder={t("settings.whitelabel.app_title_placeholder")}
              value={formData.appTitle || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, appTitle: e.target.value }))}
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="companyNameInput" className="text-xs font-semibold">
              {t("settings.whitelabel.company_name_label")}
            </Label>
            <Input
              id="companyNameInput"
              disabled={!isWhitelabelAllowed}
              placeholder={t("settings.whitelabel.company_name_placeholder")}
              value={formData.companyName || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, companyName: e.target.value }))}
              className="h-8 text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="space-y-1.5 sm:col-span-1">
            <Label htmlFor="footerTextInput" className="text-xs font-semibold">
              {t("settings.whitelabel.footer_text_label")}
            </Label>
            <Input
              id="footerTextInput"
              disabled={!isWhitelabelAllowed}
              placeholder={t("settings.whitelabel.footer_text_placeholder")}
              value={formData.footerText || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, footerText: e.target.value }))}
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="supportEmailInput" className="text-xs font-semibold">
              {t("settings.whitelabel.support_email_label")}
            </Label>
            <Input
              id="supportEmailInput"
              disabled={!isWhitelabelAllowed}
              type="email"
              placeholder="noc@mycompany.net"
              value={formData.supportEmail || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, supportEmail: e.target.value }))}
              className="h-8 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="supportPhoneInput" className="text-xs font-semibold">
              {t("settings.whitelabel.support_phone_label")}
            </Label>
            <Input
              id="supportPhoneInput"
              disabled={!isWhitelabelAllowed}
              placeholder="+62 812-3456-7890"
              value={formData.supportPhone || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, supportPhone: e.target.value }))}
              className="h-8 text-xs font-mono"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

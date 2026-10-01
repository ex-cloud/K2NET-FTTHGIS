import React, { useState } from "react";
import { Lock, Save, Loader2, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, ActionTooltip } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { PermissionGuard } from "@/hooks/use-permissions";

interface WhatsappConfigFormProps {
  config: Record<string, string>;
  saving: boolean;
  onInputChange: (key: string, value: string) => void;
  onSave: (e: React.FormEvent) => void;
  onReset: () => void;
}

export function WhatsappConfigForm({
  config,
  saving,
  onInputChange,
  onSave,
  onReset,
}: WhatsappConfigFormProps) {
  const { t } = useTranslation();
  const [showVerifyToken, setShowVerifyToken] = useState(false);
  const [showAccessToken, setShowAccessToken] = useState(false);

  return (
    <form onSubmit={onSave} className="lg:col-span-2 space-y-6">
      <Card glowingEffect className="bg-card/60 border-border shadow-xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" /> {t("gateways.whatsapp.cloud_api_title")}
          </CardTitle>
          <CardDescription className="text-[10px] text-muted-foreground">
            {t("gateways.whatsapp.cloud_api_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="WA_API_URL" className="text-xs text-muted-foreground">{t("gateways.whatsapp.api_url_label")}</Label>
            <Input
              id="WA_API_URL"
              type="text"
              value={config.WA_API_URL || ""}
              onChange={(e) => onInputChange("WA_API_URL", e.target.value)}
              placeholder="https://graph.facebook.com/v21.0"
              className="bg-input border-border text-foreground text-xs focus:border-primary/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="WA_PHONE_NUMBER_ID" className="text-xs text-muted-foreground">{t("gateways.whatsapp.phone_number_id_label")}</Label>
            <Input
              id="WA_PHONE_NUMBER_ID"
              type="text"
              value={config.WA_PHONE_NUMBER_ID || ""}
              onChange={(e) => onInputChange("WA_PHONE_NUMBER_ID", e.target.value)}
              placeholder="e.g. 109384738291039"
              className="bg-input border-border text-foreground text-xs focus:border-primary/50"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="WA_ACCESS_TOKEN" className="text-xs text-muted-foreground">{t("gateways.whatsapp.access_token_label")}</Label>
              <button
                type="button"
                onClick={() => setShowAccessToken(!showAccessToken)}
                className="text-[10px] text-muted-foreground hover:text-muted-foreground flex items-center gap-1 cursor-pointer"
              >
                {showAccessToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showAccessToken ? t("common.hide") : t("common.show")}
              </button>
            </div>
            <Input
              id="WA_ACCESS_TOKEN"
              type={showAccessToken ? "text" : "password"}
              value={config.WA_ACCESS_TOKEN || ""}
              onChange={(e) => onInputChange("WA_ACCESS_TOKEN", e.target.value)}
              placeholder="EAAGxxxxxxxxxxxxxxxxxxxxxxxxxxx..."
              className="bg-input border-border text-foreground text-xs focus:border-primary/50"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="WA_VERIFY_TOKEN" className="text-xs text-muted-foreground">{t("gateways.whatsapp.verify_token_label")}</Label>
              <button
                type="button"
                onClick={() => setShowVerifyToken(!showVerifyToken)}
                className="text-[10px] text-muted-foreground hover:text-muted-foreground flex items-center gap-1 cursor-pointer"
              >
                {showVerifyToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showVerifyToken ? t("common.hide") : t("common.show")}
              </button>
            </div>
            <Input
              id="WA_VERIFY_TOKEN"
              type={showVerifyToken ? "text" : "password"}
              value={config.WA_VERIFY_TOKEN || ""}
              onChange={(e) => onInputChange("WA_VERIFY_TOKEN", e.target.value)}
              placeholder={t("gateways.whatsapp.verify_token_placeholder")}
              className="bg-input border-border text-foreground text-xs focus:border-primary/50"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2.5">
        <ActionTooltip label={t("common.reset_form")} shortcut="Alt+R">
          <Button
            type="button"
            onClick={onReset}
            variant="outline"
            size="default"
            className="border-border/80 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {t("gateways.reset_form")}
          </Button>
        </ActionTooltip>
        <PermissionGuard permission="system.gateway.manage">
          <ActionTooltip label={t("gateways.save_config")} shortcut="Ctrl+S">
            <Button
              type="submit"
              disabled={saving}
              size="default"
              className="gap-1.5 cursor-pointer"
            >
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              {t("gateways.save_config")}
            </Button>
          </ActionTooltip>
        </PermissionGuard>
      </div>
    </form>
  );
}

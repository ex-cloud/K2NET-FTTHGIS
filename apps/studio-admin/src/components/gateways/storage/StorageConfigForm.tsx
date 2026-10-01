import React, { useState } from "react";
import { Cloud, Lock, Save, Loader2, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, ActionTooltip } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { PermissionGuard } from "@/hooks/use-permissions";

interface StorageConfigFormProps {
  config: Record<string, string>;
  saving: boolean;
  onInputChange: (key: string, value: string) => void;
  onSave: (e: React.FormEvent) => void;
  onReset: () => void;
}

export function StorageConfigForm({
  config,
  saving,
  onInputChange,
  onSave,
  onReset,
}: StorageConfigFormProps) {
  const { t } = useTranslation();
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);

  return (
    <form onSubmit={onSave} className="lg:col-span-2 space-y-6">
      {/* S3/R2 Bucket Connection Details */}
      <Card glowingEffect className="bg-card/60 border-border shadow-xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Cloud className="w-4 h-4 text-primary" /> {t("gateways.storage.bucket_connection_title")}
          </CardTitle>
          <CardDescription className="text-[10px] text-muted-foreground">
            {t("gateways.storage.bucket_connection_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="AWS_REGION" className="text-xs text-muted-foreground">{t("gateways.storage.region_label")}</Label>
              <Input
                id="AWS_REGION"
                type="text"
                value={config.AWS_REGION || ""}
                onChange={(e) => onInputChange("AWS_REGION", e.target.value)}
                placeholder="auto / ap-southeast-1"
                className="bg-input border-border text-foreground text-xs focus:border-primary/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="AWS_BUCKET_NAME" className="text-xs text-muted-foreground">{t("gateways.storage.bucket_name_label")}</Label>
              <Input
                id="AWS_BUCKET_NAME"
                type="text"
                value={config.AWS_BUCKET_NAME || ""}
                onChange={(e) => onInputChange("AWS_BUCKET_NAME", e.target.value)}
                placeholder="my-bucket-name"
                className="bg-input border-border text-foreground text-xs focus:border-primary/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="AWS_ENDPOINT" className="text-xs text-muted-foreground">{t("gateways.storage.custom_endpoint_label")}</Label>
            <Input
              id="AWS_ENDPOINT"
              type="text"
              value={config.AWS_ENDPOINT || ""}
              onChange={(e) => onInputChange("AWS_ENDPOINT", e.target.value)}
              placeholder="https://<account-id>.r2.cloudflarestorage.com"
              className="bg-input border-border text-foreground text-xs focus:border-primary/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* AWS / R2 Credentials */}
      <Card glowingEffect className="bg-card/60 border-border shadow-xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" /> {t("gateways.storage.credentials_title")}
          </CardTitle>
          <CardDescription className="text-[10px] text-muted-foreground">
            {t("gateways.storage.credentials_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="AWS_ACCESS_KEY_ID" className="text-xs text-muted-foreground">{t("gateways.storage.access_key_id_label")}</Label>
              <button
                type="button"
                onClick={() => setShowAccessKey(!showAccessKey)}
                className="text-[10px] text-muted-foreground hover:text-muted-foreground flex items-center gap-1 cursor-pointer"
              >
                {showAccessKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showAccessKey ? t("common.hide") : t("common.show")}
              </button>
            </div>
            <Input
              id="AWS_ACCESS_KEY_ID"
              type={showAccessKey ? "text" : "password"}
              value={config.AWS_ACCESS_KEY_ID || ""}
              onChange={(e) => onInputChange("AWS_ACCESS_KEY_ID", e.target.value)}
              placeholder={t("gateways.storage.access_key_id_placeholder")}
              className="bg-input border-border text-foreground text-xs focus:border-primary/50"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="AWS_SECRET_ACCESS_KEY" className="text-xs text-muted-foreground">{t("gateways.storage.secret_access_key_label")}</Label>
              <button
                type="button"
                onClick={() => setShowSecretKey(!showSecretKey)}
                className="text-[10px] text-muted-foreground hover:text-muted-foreground flex items-center gap-1 cursor-pointer"
              >
                {showSecretKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showSecretKey ? t("common.hide") : t("common.show")}
              </button>
            </div>
            <Input
              id="AWS_SECRET_ACCESS_KEY"
              type={showSecretKey ? "text" : "password"}
              value={config.AWS_SECRET_ACCESS_KEY || ""}
              onChange={(e) => onInputChange("AWS_SECRET_ACCESS_KEY", e.target.value)}
              placeholder={t("gateways.storage.secret_access_key_placeholder")}
              className="bg-input border-border text-foreground text-xs focus:border-primary/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
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

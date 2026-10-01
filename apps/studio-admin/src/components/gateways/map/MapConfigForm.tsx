import React, { useState } from "react";
import { Globe, Compass, Save, Loader2, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, ActionTooltip } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { PermissionGuard } from "@/hooks/use-permissions";

interface MapConfigFormProps {
  config: Record<string, string>;
  saving: boolean;
  onInputChange: (key: string, value: string) => void;
  onSave: (e: React.FormEvent) => void;
  onReset: () => void;
}

export function MapConfigForm({
  config,
  saving,
  onInputChange,
  onSave,
  onReset,
}: MapConfigFormProps) {
  const { t } = useTranslation();
  const [showGoogleKey, setShowGoogleKey] = useState(false);
  const [showHereKey, setShowHereKey] = useState(false);

  return (
    <form onSubmit={onSave} className="lg:col-span-2 space-y-6">
      {/* Google Maps API Keys */}
      <Card glowingEffect className="bg-card/60 border-border shadow-xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" /> {t("gateways.map.google_maps_title")}
          </CardTitle>
          <CardDescription className="text-[10px] text-muted-foreground">
            {t("gateways.map.google_maps_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="GOOGLE_MAPS_API_KEY" className="text-xs text-muted-foreground">{t("gateways.map.google_maps_key_label")}</Label>
              <button
                type="button"
                onClick={() => setShowGoogleKey(!showGoogleKey)}
                className="text-[10px] text-muted-foreground hover:text-muted-foreground flex items-center gap-1 cursor-pointer"
              >
                {showGoogleKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showGoogleKey ? t("common.hide") : t("common.show")}
              </button>
            </div>
            <Input
              id="GOOGLE_MAPS_API_KEY"
              type={showGoogleKey ? "text" : "password"}
              value={config.GOOGLE_MAPS_API_KEY || ""}
              onChange={(e) => onInputChange("GOOGLE_MAPS_API_KEY", e.target.value)}
              placeholder="AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="bg-input border-border text-foreground text-xs focus:border-primary/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* HERE Maps API Keys (Failover) */}
      <Card glowingEffect className="bg-card/60 border-border shadow-xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" /> {t("gateways.map.here_maps_title")}
          </CardTitle>
          <CardDescription className="text-[10px] text-muted-foreground">
            {t("gateways.map.here_maps_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="HERE_MAPS_API_KEY" className="text-xs text-muted-foreground">{t("gateways.map.here_maps_key_label")}</Label>
              <button
                type="button"
                onClick={() => setShowHereKey(!showHereKey)}
                className="text-[10px] text-muted-foreground hover:text-muted-foreground flex items-center gap-1 cursor-pointer"
              >
                {showHereKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showHereKey ? t("common.hide") : t("common.show")}
              </button>
            </div>
            <Input
              id="HERE_MAPS_API_KEY"
              type={showHereKey ? "text" : "password"}
              value={config.HERE_MAPS_API_KEY || ""}
              onChange={(e) => onInputChange("HERE_MAPS_API_KEY", e.target.value)}
              placeholder="HERE API Key..."
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

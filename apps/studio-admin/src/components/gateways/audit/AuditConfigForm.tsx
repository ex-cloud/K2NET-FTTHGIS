import React from "react";
import { Server, Lock, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, ActionTooltip } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { PermissionGuard } from "@/hooks/use-permissions";

interface AuditConfigFormProps {
  config: Record<string, string>;
  saving: boolean;
  onInputChange: (key: string, value: string) => void;
  onSave: (e: React.FormEvent) => void;
  onReset: () => void;
}

export function AuditConfigForm({
  config,
  saving,
  onInputChange,
  onSave,
  onReset,
}: AuditConfigFormProps) {
  const { t } = useTranslation();

  return (
    <form onSubmit={onSave} className="lg:col-span-2 space-y-6">
      <Card glowingEffect className="bg-card/60 border-border shadow-xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Server className="w-4 h-4 text-primary" /> {t("gateways.audit.db_title")}
          </CardTitle>
          <CardDescription className="text-[10px] text-muted-foreground">
            {t("gateways.audit.db_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="DATABASE_URL" className="text-xs text-muted-foreground">Database Connection URL</Label>
            <Input
              id="DATABASE_URL"
              type="text"
              value={config.DATABASE_URL || ""}
              onChange={(e) => onInputChange("DATABASE_URL", e.target.value)}
              placeholder="postgres://..."
              className="bg-input border-border text-foreground text-xs focus:border-primary/50"
            />
          </div>
        </CardContent>
      </Card>

      <Card glowingEffect className="bg-card/60 border-border shadow-xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" /> {t("gateways.audit.retention_title")}
          </CardTitle>
          <CardDescription className="text-[10px] text-muted-foreground">
            {t("gateways.audit.retention_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="RETENTION_DAYS" className="text-xs text-muted-foreground">Retention Period (Days)</Label>
            <Input
              id="RETENTION_DAYS"
              type="number"
              value={config.RETENTION_DAYS || ""}
              onChange={(e) => onInputChange("RETENTION_DAYS", e.target.value)}
              placeholder="365"
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

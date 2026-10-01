import { useState } from "react";
import { Badge, Button, Input, PageLayout, Switch, ActionTooltip } from "@k2net/ui";
import { Sliders, Save, RefreshCw, HardDrive } from "lucide-react";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { SystemSettingsWrapper } from "@/components/page-guards/system-settings-wrapper";
import { SettingsSection } from "../components/settings-section";
import { SettingsFormRow } from "../components/settings-form-row";
import { useTranslation } from "@k2net/i18n";
import { toast } from "sonner";

export default function SettingsGeneralPage() {
  const { t } = useTranslation();
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

  const handleSwitchChange = (key: string, checked: boolean) => {
    setFormValues((prev) => ({ ...prev, [key]: checked ? "true" : "false" }));
  };

  const handleSave = async () => {
    const keysToSave: Record<string, string> = {
      app_name: getValue("app_name", "K2NET FTTH GIS Platform"),
      default_storage_quota: getValue("default_storage_quota", "10"),
      system_maintenance_mode: getValue("system_maintenance_mode", "false"),
      maintenance_message: getValue("maintenance_message", "Sistem sedang dalam pemeliharaan rutin."),
    };

    try {
      await updateSettings(keysToSave);
      toast.success(t("settings.general.updated_success"));
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message || t("settings.general.update_failed"));
    }
  };

  return (
    <SystemSettingsWrapper>
      <PageLayout variant="workspace" spaceY="space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                {t("settings.general.platform_config_badge")}
              </Badge>
              <span className="text-xs text-muted-foreground">• {t("settings.general.platform_badge_subtitle")}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <Sliders className="w-6 h-6 text-primary" /> {t("settings.general.title")}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t("settings.general_subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ActionTooltip label={t("common.reload")} shortcut="R">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refresh()}
                disabled={loading}
                className="border-border hover:bg-muted text-muted-foreground text-xs h-7 px-2.5 gap-1.5 rounded-md shadow-xs cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> {t("common.reload")}
              </Button>
            </ActionTooltip>
            <ActionTooltip label={t("common.save_changes")} shortcut="Ctrl+S">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isUpdating || loading}
                className="text-xs h-7 px-2.5 font-medium gap-1.5 shadow-xs rounded-md cursor-pointer"
              >
                {isUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {t("common.save_changes")}
              </Button>
            </ActionTooltip>
          </div>
        </div>

        {/* Form Content */}
        <div className="space-y-8 pb-16">
          
          {/* Section 1: Platform Identity */}
          <SettingsSection
            title={t("settings.general.platform_identity_title")}
            description={t("settings.general.platform_identity_desc")}
          >
            <SettingsFormRow
              label={t("settings.general.app_name_label")}
              description={t("settings.general.app_name_desc")}
            >
              <Input
                type="text"
                value={getValue("app_name", "K2NET FTTH GIS Platform")}
                onChange={(e) => handleInputChange("app_name", e.target.value)}
                placeholder="e.g. K2NET FTTH GIS Platform"
                className="bg-background/80 border-border text-foreground text-xs max-w-xs focus:border-primary"
              />
            </SettingsFormRow>

            <SettingsFormRow
              label={t("settings.general.instance_id_label")}
              description={t("settings.general.instance_id_desc")}
              divider={false}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground bg-muted/60 border border-border px-3 py-1.5 rounded-md">
                  k2net-prod-cluster-01
                </span>
                <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 text-[10px]">
                  ACTIVE
                </Badge>
              </div>
            </SettingsFormRow>
          </SettingsSection>

          {/* Section 2: Default Storage Quota */}
          <SettingsSection
            title={t("settings.general.storage_allocation_title")}
            description={t("settings.general.storage_allocation_desc")}
          >
            <SettingsFormRow
              label={t("settings.general.default_quota_label")}
              description={t("settings.general.default_quota_desc")}
              divider={false}
            >
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-primary shrink-0" />
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={getValue("default_storage_quota", "10")}
                  onChange={(e) => handleInputChange("default_storage_quota", e.target.value)}
                  className="bg-background/80 border-border text-foreground text-xs w-28 text-right focus:border-primary"
                />
                <span className="text-xs text-muted-foreground font-medium">GB</span>
              </div>
            </SettingsFormRow>
          </SettingsSection>

          {/* Section 3: System Maintenance Mode */}
          <SettingsSection
            title={t("settings.general.maintenance_lock_title")}
            description={t("settings.general.maintenance_lock_desc")}
          >
            <SettingsFormRow
              label={t("settings.general.maintenance_mode_label")}
              description={t("settings.general.maintenance_mode_desc")}
            >
              <Switch
                checked={getValue("system_maintenance_mode", "false") === "true"}
                onCheckedChange={(checked) => handleSwitchChange("system_maintenance_mode", checked)}
                className="data-[state=checked]:bg-rose-500"
              />
            </SettingsFormRow>

            <SettingsFormRow
              label={t("settings.general.maintenance_message_label")}
              description={t("settings.general.maintenance_message_desc")}
              divider={false}
            >
              <Input
                type="text"
                value={getValue("maintenance_message", "Sistem sedang dalam pemeliharaan rutin.")}
                onChange={(e) => handleInputChange("maintenance_message", e.target.value)}
                placeholder="e.g. Sistem sedang dalam peningkatan performa."
                className="bg-background/80 border-border text-foreground text-xs w-full max-w-sm focus:border-primary"
              />
            </SettingsFormRow>
          </SettingsSection>

        </div>
      </PageLayout>
    </SystemSettingsWrapper>
  );
}

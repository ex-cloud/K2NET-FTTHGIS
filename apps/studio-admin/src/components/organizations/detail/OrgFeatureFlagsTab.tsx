import { useState, useEffect } from "react";
import { Badge, Button, Switch, ActionTooltip } from "@k2net/ui";
import {
  Sliders,
  Map,
  Radio,
  MessageSquare,
  Sparkles,
  FlaskConical,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@k2net/i18n";
import type { EnrichedOrganization, OrganizationFeatureFlags } from "../types";
import { useOrganizations } from "@/hooks/useOrganizations";

interface OrgFeatureFlagsTabProps {
  organization: EnrichedOrganization;
  onSaveFlags?: (flags: OrganizationFeatureFlags) => void;
}

export function OrgFeatureFlagsTab({
  organization: org,
  onSaveFlags,
}: OrgFeatureFlagsTabProps) {
  const { t } = useTranslation();
  const { updateFeatureFlags, refresh } = useOrganizations();
  const [flags, setFlags] = useState<OrganizationFeatureFlags>(org.featureFlags);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFlags(org.featureFlags);
  }, [org.featureFlags]);

  const handleToggle = (key: keyof OrganizationFeatureFlags) => {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateFeatureFlags({ slug: org.slug, flags: flags as Record<string, boolean> });
      onSaveFlags?.(flags);
      toast.success(t("organizations.flags_update_success", { name: org.name }), {
        description: t("organizations.flags_update_success_desc"),
      });
      refresh();
    } catch (err) {
      toast.error(t("organizations.flags_update_failed", { error: err instanceof Error ? err.message : "Server error" }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header with Save Action */}
      <div className="p-3.5 rounded-xl border border-border bg-card/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-foreground">
                {t("organizations.feature_flags_section_title")}
              </h3>
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[9px] font-mono px-1.5 py-0.2">
                {t("organizations.active_of_total", {
                  active: Object.values(flags).filter(Boolean).length,
                  total: 5,
                })}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {t("organizations.feature_flags_section_subtitle")}
            </p>
          </div>
        </div>

        <ActionTooltip label={t("organizations.save_flags_tooltip")} shortcut="Ctrl+S">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="h-7 px-2.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shrink-0 shadow-xs"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? t("organizations.saving_flags_btn") : t("organizations.save_flags_btn")}</span>
          </Button>
        </ActionTooltip>
      </div>

      {/* 2. Compact Feature Toggles List */}
      <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md divide-y divide-border/60 overflow-hidden shadow-2xs">
        {/* Flag 1: GIS Spatial Core */}
        <div className="flex items-center justify-between p-3.5 hover:bg-muted/20 transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Map className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">
                  {t("organizations.flag_gis_title")}
                </span>
                <Badge variant="outline" className="border-border text-[9px] font-mono px-1.5 py-0">CORE</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t("organizations.flag_gis_desc")}
              </p>
            </div>
          </div>
          <Switch
            checked={flags.gisCore}
            onCheckedChange={() => handleToggle("gisCore")}
          />
        </div>

        {/* Flag 2: OLT Poller Gateway */}
        <div className="flex items-center justify-between p-3.5 hover:bg-muted/20 transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Radio className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">
                  {t("organizations.flag_olt_title")}
                </span>
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[9px] font-mono px-1.5 py-0">PRO / ENT</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t("organizations.flag_olt_desc")}
              </p>
            </div>
          </div>
          <Switch
            checked={flags.oltPoller}
            onCheckedChange={() => handleToggle("oltPoller")}
          />
        </div>

        {/* Flag 3: WhatsApp Engine */}
        <div className="flex items-center justify-between p-3.5 hover:bg-muted/20 transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
              <MessageSquare className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">
                  {t("organizations.flag_whatsapp_title")}
                </span>
                <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-500 text-[9px] font-mono px-1.5 py-0">ADD-ON</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t("organizations.flag_whatsapp_desc")}
              </p>
            </div>
          </div>
          <Switch
            checked={flags.whatsappEngine}
            onCheckedChange={() => handleToggle("whatsappEngine")}
          />
        </div>

        {/* Flag 4: AI Copilot */}
        <div className="flex items-center justify-between p-3.5 hover:bg-muted/20 transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 shrink-0">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">
                  {t("organizations.flag_ai_title")}
                </span>
                <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-500 text-[9px] font-mono px-1.5 py-0">PREMIUM</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t("organizations.flag_ai_desc")}
              </p>
            </div>
          </div>
          <Switch
            checked={flags.aiCopilot}
            onCheckedChange={() => handleToggle("aiCopilot")}
          />
        </div>

        {/* Flag 5: Sandbox Mode */}
        <div className="flex items-center justify-between p-3.5 hover:bg-muted/20 transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <FlaskConical className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">
                  {t("organizations.flag_sandbox_title")}
                </span>
                <Badge variant="outline" className="border-border text-[9px] font-mono px-1.5 py-0">TESTING</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t("organizations.flag_sandbox_desc")}
              </p>
            </div>
          </div>
          <Switch
            checked={flags.sandboxMode}
            onCheckedChange={() => handleToggle("sandboxMode")}
          />
        </div>
      </div>
    </div>
  );
}

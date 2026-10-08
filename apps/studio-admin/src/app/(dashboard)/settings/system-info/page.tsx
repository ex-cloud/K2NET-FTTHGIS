import * as React from "react";
import {
  Badge,
  Button,
  PageLayout,
  ActionTooltip,
  TooltipProvider,
} from "@k2net/ui";
import {
  Cpu,
  RefreshCw,
  FileText,
  ExternalLink,
} from "lucide-react";
import { usePlatformSystemInfo } from "@/hooks/usePlatformSystemInfo";
import { SystemSettingsWrapper } from "@/components/page-guards/system-settings-wrapper";
import {
  SettingsSection,
  SystemStatusStrip,
  BackendStackCards,
  LiveTelemetryCards,
  SystemPatchesChangelogCard,
  generateSystemMarkdown,
} from "@/components/settings";
import { useTranslation } from "@k2net/i18n";
import { toast } from "sonner";

export default function SettingsSystemInfoPage() {
  const { t } = useTranslation();
  const { info, loading, refreshing, refresh } = usePlatformSystemInfo();
  const [copiedMd, setCopiedMd] = React.useState(false);

  const handleExportJSON = () => {
    if (!info) return;
    const exportData = {
      platform: "K2NET FTTH GIS Enterprise SaaS",
      generatedAt: new Date().toISOString(),
      ...info,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `k2net-system-spec-${info.appVersion}-${info.gitCommitHash}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("settings.system_info.toast_exported_json"));
  };

  const handleCopyMarkdown = () => {
    const md = generateSystemMarkdown(info);
    navigator.clipboard.writeText(md);
    setCopiedMd(true);
    toast.success(t("settings.system_info.toast_copied_md"));
    setTimeout(() => setCopiedMd(false), 2000);
  };

  return (
    <SystemSettingsWrapper>
      <PageLayout variant="workspace" spaceY="space-y-6">
        <TooltipProvider delayDuration={0}>
          {/* Header Section */}
          <div className="flex flex-col gap-4 border-b border-border pb-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                    {t("settings.system_info.badge")}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    • {t("settings.system_info.badge_subtitle")}
                  </span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                  <Cpu className="size-6 text-primary" />{" "}
                  {t("settings.system_info.title")}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {t("settings.system_info_subtitle")}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <ActionTooltip
                  label={t("settings.system_info.copy_markdown_tooltip")}
                  shortcut="M"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyMarkdown}
                    className="border-border hover:bg-muted text-foreground text-xs h-7 px-2.5 gap-1.5 rounded-md shadow-xs cursor-pointer"
                  >
                    <FileText className="size-3.5 text-muted-foreground" />
                    <span>
                      {copiedMd
                        ? t("settings.system_info.copied_badge")
                        : t("settings.system_info.copy_markdown_btn")}
                    </span>
                  </Button>
                </ActionTooltip>

                <ActionTooltip
                  label={t("settings.system_info.export_json_tooltip")}
                  shortcut="E"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportJSON}
                    disabled={loading}
                    className="border-border hover:bg-muted text-foreground text-xs h-7 px-2.5 gap-1.5 rounded-md shadow-xs cursor-pointer"
                  >
                    <ExternalLink className="size-3.5 text-muted-foreground" />
                    <span>{t("settings.system_info.export_json_btn")}</span>
                  </Button>
                </ActionTooltip>

                <ActionTooltip label={t("common.reload")} shortcut="R">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refresh()}
                    disabled={loading || refreshing}
                    className="border-border hover:bg-muted text-muted-foreground text-xs h-7 px-2.5 gap-1.5 rounded-md shadow-xs cursor-pointer"
                  >
                    <RefreshCw
                      className={`size-3.5 ${
                        loading || refreshing ? "animate-spin" : ""
                      }`}
                    />
                    <span>{t("settings.system_info.reload_btn")}</span>
                  </Button>
                </ActionTooltip>
              </div>
            </div>

            {/* Single-Row System Status Strip directly in Header */}
            <SystemStatusStrip info={info} loading={loading} />
          </div>

          {/* 2-Column Split Layout Sections (Keterangan di kiri, Data di kanan) */}
          <div className="space-y-8 pb-16">
            {/* Section 1: Backend & Database Infrastructure */}
            <SettingsSection
              title={t("settings.system_info.backend_stack_title")}
              description={t("settings.system_info.backend_stack_desc")}
              noCardWrapper
            >
              <BackendStackCards />
            </SettingsSection>

            {/* Section 2: Live Runtime Telemetry & Health */}
            <SettingsSection
              title={t("settings.system_info.live_telemetry_title")}
              description={t("settings.system_info.live_telemetry_desc")}
              noCardWrapper
            >
              <LiveTelemetryCards info={info} loading={loading} />
            </SettingsSection>

            {/* Section 3: System Patches & Release Changelog */}
            <SettingsSection
              title={t("settings.system_info.patches_changelog_title")}
              description={t("settings.system_info.patches_changelog_desc")}
              noCardWrapper
              divider={false}
            >
              <SystemPatchesChangelogCard info={info} loading={loading} />
            </SettingsSection>
          </div>
        </TooltipProvider>
      </PageLayout>
    </SystemSettingsWrapper>
  );
}


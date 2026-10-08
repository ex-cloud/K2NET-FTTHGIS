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
  CoreIdentityCards,
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
    toast.success("System specification exported as JSON!");
  };

  const handleCopyMarkdown = () => {
    const md = generateSystemMarkdown(info);
    navigator.clipboard.writeText(md);
    setCopiedMd(true);
    toast.success("System specification copied as Markdown!");
    setTimeout(() => setCopiedMd(false), 2000);
  };

  return (
    <SystemSettingsWrapper>
      <PageLayout variant="workspace" spaceY="space-y-6">
        <TooltipProvider delayDuration={0}>
          {/* Header Section */}
          <div className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
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
                <Cpu className="w-6 h-6 text-primary" />{" "}
                {t("settings.system_info.title")}
              </h1>
              <p className="text-xs text-muted-foreground">
                {t("settings.system_info_subtitle")}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <ActionTooltip label="Copy System Spec as Markdown" shortcut="M">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyMarkdown}
                  className="border-border hover:bg-muted text-foreground text-xs h-7 px-2.5 gap-1.5 rounded-md shadow-xs cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{copiedMd ? "Copied!" : "Copy Markdown"}</span>
                </Button>
              </ActionTooltip>

              <ActionTooltip label="Export Diagnostic Specification" shortcut="E">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportJSON}
                  disabled={loading}
                  className="border-border hover:bg-muted text-foreground text-xs h-7 px-2.5 gap-1.5 rounded-md shadow-xs cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>JSON Spec</span>
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
                    className={`w-3.5 h-3.5 ${loading || refreshing ? "animate-spin" : ""}`}
                  />
                  <span>{t("common.reload")}</span>
                </Button>
              </ActionTooltip>
            </div>
          </div>

          {/* 2-Column Split Layout Sections (Keterangan di kiri, Data di kanan) */}
          <div className="space-y-8 pb-16">
            {/* Section 1: Core System Identity & Versions */}
            <SettingsSection
              title={t("settings.system_info.core_spec_title")}
              description={t("settings.system_info.core_spec_desc")}
              noCardWrapper
            >
              <CoreIdentityCards info={info} loading={loading} />
            </SettingsSection>

            {/* Section 2: Backend & Database Infrastructure */}
            <SettingsSection
              title={t("settings.system_info.backend_stack_title")}
              description={t("settings.system_info.backend_stack_desc")}
              noCardWrapper
            >
              <BackendStackCards />
            </SettingsSection>

            {/* Section 3: Live Runtime Telemetry & Health */}
            <SettingsSection
              title={t("settings.system_info.live_telemetry_title")}
              description={t("settings.system_info.live_telemetry_desc")}
              noCardWrapper
            >
              <LiveTelemetryCards info={info} loading={loading} />
            </SettingsSection>

            {/* Section 4: System Patches & Release Changelog */}
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

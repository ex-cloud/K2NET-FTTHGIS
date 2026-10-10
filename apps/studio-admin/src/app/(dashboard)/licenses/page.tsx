import * as React from "react";
import { PageHero, Button } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { Plus, RefreshCcw, KeyRound } from "lucide-react";
import {
  useLicenseOverview,
  useAllLicenses,
} from "@/hooks/useOrganizationLicenses";
import { LicenseKpiCards } from "@/components/licenses/LicenseKpiCards";
import { LicenseDataTable } from "@/components/licenses/LicenseDataTable";
import { ManualIssueLicenseModal } from "@/components/licenses/ManualIssueLicenseModal";

export default function LicensesPage() {
  const { t } = useTranslation();
  const [issueModalOpen, setIssueModalOpen] = React.useState<boolean>(false);

  const {
    data: overview,
    isLoading: isOverviewLoading,
    refetch: refetchOverview,
  } = useLicenseOverview();

  const {
    data: licenses = [],
    isLoading: isLicensesLoading,
    refetch: refetchLicenses,
  } = useAllLicenses();

  const handleRefresh = () => {
    refetchOverview();
    refetchLicenses();
  };

  const totalCount = overview?.totalLicenses ?? licenses.length;
  const activeCount = overview?.activeLicenses ?? licenses.filter((l) => l.status === "ACTIVE").length;
  const graceCount = overview?.gracePeriodLicenses ?? licenses.filter((l) => l.status === "GRACE_PERIOD").length;
  const restrictedCount =
    (overview?.readOnlyLicenses ?? 0) + (overview?.suspendedLicenses ?? 0);

  return (
    <div className="relative flex flex-col w-full h-full bg-background pt-6 pb-0 gap-5 overflow-hidden">
      {/* Command Center Hero Header */}
      <div className="px-4 md:px-6 shrink-0">
        <PageHero
          bordered={false}
          className="pb-0"
          eyebrow={t("license.hero_eyebrow")}
          title={t("license.cmd_center_title")}
          icon={KeyRound}
          subtitle={t("license.cmd_center_desc")}
          meta={
            <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground/90 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-foreground font-mono">{activeCount}</span>
                <span>{t("license.kpi.active_licenses")}</span>
              </div>
              <span className="text-muted-foreground/30 px-1">/</span>
              <div className="flex items-center gap-1.5">
                <span className={`font-bold font-mono ${graceCount > 0 ? "text-amber-500" : "text-foreground"}`}>
                  {graceCount}
                </span>
                <span>{t("license.kpi.grace_period")}</span>
              </div>
              <span className="text-muted-foreground/30 px-1">/</span>
              <div className="flex items-center gap-1.5">
                <span className={`font-bold font-mono ${restrictedCount > 0 ? "text-destructive" : "text-foreground"}`}>
                  {restrictedCount}
                </span>
                <span>{t("license.kpi.read_only")}</span>
              </div>
              <span className="text-muted-foreground/30 px-1">/</span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-foreground font-mono">{totalCount}</span>
                <span>{t("license.kpi.total_licenses")}</span>
              </div>
            </div>
          }
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isOverviewLoading || isLicensesLoading}
                className="gap-1.5 h-7 px-2.5 text-xs font-medium border-border/80 bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                title={t("common.refresh")}
              >
                <RefreshCcw
                  className={`size-3.5 ${
                    isOverviewLoading || isLicensesLoading ? "animate-spin text-primary" : ""
                  }`}
                />
                <span>{t("common.refresh")}</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setIssueModalOpen(true)}
                className="gap-1.5 h-7 px-2.5 text-xs font-medium shadow-xs"
              >
                <Plus className="size-3.5" />
                <span>{t("license.actions.issue_manual")}</span>
              </Button>
            </div>
          }
        />
      </div>

      {/* 4-Grid Responsive KPI Strip */}
      <div className="px-4 md:px-6 shrink-0 animate-in fade-in-50 duration-150">
        <LicenseKpiCards
          overview={overview}
          licenses={licenses}
          loading={isOverviewLoading || isLicensesLoading}
        />
      </div>

      {/* Elevated Table Container */}
      <div className="flex-1 min-h-0 flex gap-4 px-4 md:px-6 pb-6 overflow-hidden">
        <div className="flex-1 min-h-0 border border-border bg-card/10 rounded-xl overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <LicenseDataTable
              licenses={licenses}
              loading={isLicensesLoading}
            />
          </div>
        </div>
      </div>

      {/* Manual Issue Modal */}
      <ManualIssueLicenseModal
        open={issueModalOpen}
        onOpenChange={setIssueModalOpen}
      />
    </div>
  );
}

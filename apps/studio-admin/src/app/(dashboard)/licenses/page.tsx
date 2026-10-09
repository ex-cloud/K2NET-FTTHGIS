import * as React from "react";
import {
  PageHeader,
  PageContentShell,
  Button,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { Plus, RefreshCcw } from "lucide-react";
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

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background">
      <PageHeader
        title={t("license.title")}
        breadcrumbs={[
          { label: t("nav.overview"), href: "/overview" },
          { label: t("license.title") },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="gap-1.5 h-7 px-2.5 text-xs font-medium"
              title={t("common.refresh")}
            >
              <RefreshCcw className="size-3.5" />
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

      <PageContentShell className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
        {/* KPI Cards Strip */}
        <LicenseKpiCards
          overview={overview}
          loading={isOverviewLoading}
        />

        {/* Data Table */}
        <LicenseDataTable
          licenses={licenses}
          loading={isLicensesLoading}
        />
      </PageContentShell>

      {/* Manual Issue Modal */}
      <ManualIssueLicenseModal
        open={issueModalOpen}
        onOpenChange={setIssueModalOpen}
      />
    </div>
  );
}

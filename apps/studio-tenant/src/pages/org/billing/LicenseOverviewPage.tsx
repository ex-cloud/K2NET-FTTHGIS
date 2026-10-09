import * as React from "react";
import { PageHeader, PageContentShell } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { useTenantLicense } from "../../../hooks/useTenantLicense";
import { ActiveLicenseCard } from "../../../components/licenses/ActiveLicenseCard";
import { ActivateLicenseKeyModal } from "../../../components/licenses/ActivateLicenseKeyModal";

export function LicenseOverviewPage() {
  const { t } = useTranslation();
  const {
    license,
    isLoading,
    activateLicense,
    isActivating,
  } = useTenantLicense();

  const [activateModalOpen, setActivateModalOpen] = React.useState(false);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title={t("license.tenant.active_title")}
        breadcrumbs={[
          { label: t("organizations.tab_overview"), href: "/projects" },
          { label: t("nav.tenant_billing"), href: "/billing/license" },
          { label: t("nav.billing_active_license") },
        ]}
      />

      <PageContentShell className="space-y-6 custom-scrollbar p-6">
        <ActiveLicenseCard
          license={license}
          isLoading={isLoading}
          onOpenActivateModal={() => setActivateModalOpen(true)}
        />

        <ActivateLicenseKeyModal
          open={activateModalOpen}
          onOpenChange={setActivateModalOpen}
          onActivate={activateLicense}
          isActivating={isActivating}
        />
      </PageContentShell>
    </div>
  );
}

import * as React from "react";
import { PageHeader, PageContentShell } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { useTenantLicense } from "../../../hooks/useTenantLicense";
import { QuotaUtilizationMeters } from "../../../components/licenses/QuotaUtilizationMeters";

export function QuotaUsagePage() {
  const { t } = useTranslation();
  const { license } = useTenantLicense();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title={t("license.tenant.quota_utilization_title")}
        breadcrumbs={[
          { label: t("organizations.tab_overview"), href: "/projects" },
          { label: t("nav.tenant_billing"), href: "/billing/license" },
          { label: t("nav.billing_quota_utilization") },
        ]}
      />

      <PageContentShell className="space-y-6 custom-scrollbar p-6">
        <QuotaUtilizationMeters license={license} />
      </PageContentShell>
    </div>
  );
}

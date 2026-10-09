import * as React from "react";
import { PageHeader, PageContentShell } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { useTenantLicense } from "../../../hooks/useTenantLicense";
import { BillingInvoicesTable } from "../../../components/licenses/BillingInvoicesTable";

export function InvoicesHistoryPage() {
  const { t } = useTranslation();
  const { invoices, isInvoicesLoading } = useTenantLicense();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title={t("license.tenant.invoices_title")}
        breadcrumbs={[
          { label: t("organizations.tab_overview"), href: "/projects" },
          { label: t("nav.tenant_billing"), href: "/billing/license" },
          { label: t("nav.billing_invoices_history") },
        ]}
      />

      <PageContentShell className="space-y-6 custom-scrollbar p-6">
        <BillingInvoicesTable
          invoices={invoices}
          isLoading={isInvoicesLoading}
        />
      </PageContentShell>
    </div>
  );
}

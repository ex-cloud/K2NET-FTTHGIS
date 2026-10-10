import * as React from "react";
import { PageHeader, PageContentShell, PageHero } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { Receipt } from "lucide-react";
import { useTenantLicense } from "../../../hooks/useTenantLicense";
import { BillingInvoicesTable } from "../../../components/licenses/BillingInvoicesTable";

export function InvoicesHistoryPage() {
  const { t } = useTranslation();
  const { invoices, isInvoicesLoading } = useTenantLicense();

  const totalInvoices = invoices.length;
  const paidCount = invoices.filter((i) => i.status === "PAID").length;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <PageHeader
        title={t("license.tenant.invoices_title")}
        breadcrumbs={[
          { label: t("organizations.tab_overview"), href: "/projects" },
          { label: t("nav.tenant_billing"), href: "/billing/license" },
          { label: t("nav.billing_invoices_history") },
        ]}
      />

      <div className="px-6 pt-2 shrink-0">
        <PageHero
          bordered={false}
          className="pb-2"
          eyebrow={t("billing.past_invoices")}
          title={t("license.tenant.invoices_title")}
          icon={Receipt}
          subtitle={t("license.tenant.invoices_desc")}
          meta={
            <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground font-medium">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-foreground font-mono">{paidCount}</span>
                <span>{t("billing.status_paid")}</span>
              </div>
              <span className="text-muted-foreground/30 px-1">/</span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-foreground font-mono">{totalInvoices}</span>
                <span>{t("billing.past_invoices")}</span>
              </div>
            </div>
          }
        />
      </div>

      <PageContentShell className="space-y-6 custom-scrollbar p-6 pt-2">
        <BillingInvoicesTable
          invoices={invoices}
          isLoading={isInvoicesLoading}
        />
      </PageContentShell>
    </div>
  );
}

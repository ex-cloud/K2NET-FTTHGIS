import * as React from "react";
import { PageHeader, PageContentShell, PageHero } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { Gauge } from "lucide-react";
import { useTenantLicense } from "../../../hooks/useTenantLicense";
import { QuotaUtilizationMeters } from "../../../components/licenses/QuotaUtilizationMeters";

export function QuotaUsagePage() {
  const { t } = useTranslation();
  const { license } = useTenantLicense();

  const planName = license?.planName || "Trial";

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <PageHeader
        title={t("license.tenant.quota_utilization_title")}
        breadcrumbs={[
          { label: t("organizations.tab_overview"), href: "/projects" },
          { label: t("nav.tenant_billing"), href: "/billing/license" },
          { label: t("nav.billing_quota_utilization") },
        ]}
      />

      <div className="px-6 pt-2 shrink-0">
        <PageHero
          bordered={false}
          className="pb-2"
          eyebrow={t("billing.cost_control_quotas")}
          title={t("license.tenant.quota_utilization_title")}
          icon={Gauge}
          subtitle={t("billing.cost_control_desc")}
          meta={
            <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground font-medium">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-foreground font-mono">{planName}</span>
                <span>{t("billing.current_plan")}</span>
              </div>
              <span className="text-muted-foreground/30 px-1">/</span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-foreground font-mono">
                  {license?.daysRemaining ?? "-"}
                </span>
                <span>{t("common.days").toLowerCase()} {t("license.table.days_remaining").toLowerCase()}</span>
              </div>
            </div>
          }
        />
      </div>

      <PageContentShell className="space-y-6 custom-scrollbar p-6 pt-2">
        <QuotaUtilizationMeters license={license} />
      </PageContentShell>
    </div>
  );
}

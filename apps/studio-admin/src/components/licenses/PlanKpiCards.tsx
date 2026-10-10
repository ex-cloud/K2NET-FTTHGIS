import * as React from "react";
import { Card } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { Layers, CreditCard, Network, ShieldCheck } from "lucide-react";
import type { SubscriptionPlanMaster } from "@/hooks/useSubscriptionPlans";

interface PlanKpiCardsProps {
  plans: SubscriptionPlanMaster[];
  loading?: boolean;
}

function formatPriceShort(val: number): string {
  if (val >= 1_000_000) {
    return `Rp ${(val / 1_000_000).toLocaleString("id-ID")}M`;
  }
  if (val >= 1_000) {
    return `Rp ${(val / 1_000).toLocaleString("id-ID")}K`;
  }
  return `Rp ${val.toLocaleString("id-ID")}`;
}

export function PlanKpiCards({ plans, loading }: PlanKpiCardsProps) {
  const { t } = useTranslation();

  const metrics = React.useMemo(() => {
    const totalPlans = plans.length;
    const prices = plans.map((p) => p.price).filter((p) => typeof p === "number");
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    const enterprisePlan = plans.find((p) => p.name.toUpperCase() === "ENTERPRISE");
    const entOlts = enterprisePlan?.maxProjects ?? 50;
    const entOdps = enterprisePlan?.maxOdps ?? 10000;

    const ssoCount = plans.filter((p) => p.hasSso).length;
    const apiCount = plans.filter((p) => p.hasApiAccess).length;

    return {
      totalPlans,
      priceRange: `${formatPriceShort(minPrice)} – ${formatPriceShort(maxPrice)}`,
      entOlts,
      entOdps,
      ssoCount,
      apiCount,
    };
  }, [plans]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Plan Templates */}
      <Card glowingEffect className="p-4 flex flex-col justify-between gap-3 bg-card border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
            {t("license.plans.kpi_total_plans")}
          </span>
          <div className="h-6 w-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Layers className="h-3.5 w-3.5" />
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
            {loading ? "—" : metrics.totalPlans}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {t("license.plans.kpi_total_plans_desc", { count: metrics.totalPlans })}
          </p>
        </div>
      </Card>

      {/* 2. Base Pricing Range */}
      <Card glowingEffect className="p-4 flex flex-col justify-between gap-3 bg-card border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
            {t("license.plans.kpi_price_range")}
          </span>
          <div className="h-6 w-6 rounded-lg bg-foreground/5 border border-border flex items-center justify-center text-foreground">
            <CreditCard className="h-3.5 w-3.5" />
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
            {loading ? "—" : metrics.priceRange}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {t("license.plans.kpi_price_range_desc")}
          </p>
        </div>
      </Card>

      {/* 3. Top Enterprise Quotas */}
      <Card glowingEffect className="p-4 flex flex-col justify-between gap-3 bg-card border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
            {t("license.plans.kpi_max_ent_quota")}
          </span>
          <div className="h-6 w-6 rounded-lg bg-foreground/5 border border-border flex items-center justify-center text-foreground">
            <Network className="h-3.5 w-3.5" />
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
            {loading ? "—" : `${metrics.entOlts} OLT`}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {t("license.plans.kpi_max_ent_quota_desc", {
              olts: metrics.entOlts,
              odps: metrics.entOdps,
            })}
          </p>
        </div>
      </Card>

      {/* 4. Feature Coverage */}
      <Card glowingEffect className="p-4 flex flex-col justify-between gap-3 bg-card border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
            {t("license.plans.kpi_feature_matrix")}
          </span>
          <div className="h-6 w-6 rounded-lg bg-foreground/5 border border-border flex items-center justify-center text-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
            {loading ? "—" : `${metrics.ssoCount} SSO · ${metrics.apiCount} API`}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {t("license.plans.kpi_feature_matrix_desc")}
          </p>
        </div>
      </Card>
    </div>
  );
}

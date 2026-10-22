import * as React from "react";
import { PageHero, Card, Button, PageLayout } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import {
  DollarSign,
  TrendingUp,
  Users,
  AlertTriangle,
  RefreshCcw,
  ArrowRight,
  Layers,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import {
  useAllTenantSubscriptions,
  type TenantSubscriptionItem,
} from "@/hooks/useBillingSubscriptions";
import { formatIdr } from "@/lib/formatters";
import { LifecycleStatusBadge } from "@/components/common/LifecycleStatusBadge";

export default function BillingOverviewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    data: subscriptions = [],
    isLoading: isSubsLoading,
    refetch: refetchSubs,
    isFetching,
  } = useAllTenantSubscriptions();

  // Filter only genuine commercial paying subscriptions
  const isPayingSub = (s: TenantSubscriptionItem) =>
    (s.status === "ACTIVE" || s.status === "GRACE_PERIOD") &&
    !s.test &&
    s.organizationSlug !== "default" &&
    Number(s.priceMonthly || 0) > 0;

  const payingSubs = React.useMemo(() => subscriptions.filter(isPayingSub), [subscriptions]);
  const activePayingCount = payingSubs.length;

  const productionMrr = React.useMemo(() => {
    return payingSubs.reduce((sum, s) => sum + Number(s.priceMonthly || 0), 0);
  }, [payingSubs]);

  const arpa = activePayingCount > 0 ? Math.round(productionMrr / activePayingCount) : 0;

  const atRiskCount = React.useMemo(() => {
    return subscriptions.filter((s) => {
      if (s.status === "GRACE_PERIOD") return true;
      if (!s.currentPeriodEnd) return false;
      const diffDays = Math.ceil(
        (new Date(s.currentPeriodEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return diffDays <= 7 && diffDays >= 0 && !s.test;
    }).length;
  }, [subscriptions]);

  // Tier breakdown calculation
  const tierCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      FREE: 0,
      STARTER: 0,
      PRO: 0,
      ENTERPRISE: 0,
    };
    for (const s of subscriptions) {
      if (s.test) continue;
      const tier = (s.planName || "").toUpperCase();
      if (counts[tier] !== undefined) {
        counts[tier]++;
      }
    }
    return counts;
  }, [subscriptions]);

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      {/* Page Hero Header */}
      <PageHero
        bordered={false}
        className="pb-0"
        eyebrow="BILLING"
        title={t("billing.overview_title")}
        icon={DollarSign}
        subtitle={t("billing.overview_desc")}
        meta={
          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground/90 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground font-mono">{formatIdr(productionMrr)}</span>
              <span>{t("billing.mrr_production")}</span>
            </div>
            <span className="text-muted-foreground/30 px-1">/</span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground font-mono">{activePayingCount}</span>
              <span>{t("billing.paying_tenants")}</span>
            </div>
            <span className="text-muted-foreground/30 px-1">/</span>
            <div className="flex items-center gap-1.5">
              <span className={`font-bold font-mono ${atRiskCount > 0 ? "text-amber-500" : "text-foreground"}`}>
                {atRiskCount}
              </span>
              <span>{t("billing.at_risk_tenants")}</span>
            </div>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchSubs()}
              disabled={isFetching}
              className="gap-1.5 h-7 px-2.5 text-xs font-medium border-border/80 bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
              title={t("common.refresh")}
            >
              <RefreshCcw className={`size-3.5 ${isFetching ? "animate-spin text-primary" : ""}`} />
              <span>{t("common.refresh")}</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate({ to: "/billing/subscriptions" })}
              className="gap-1.5 h-7 px-2.5 text-xs font-medium shadow-xs"
            >
              <span>{t("billing.manage_subscriptions")}</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        }
      />

      {/* 4-Grid Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Monthly Recurring Revenue */}
        <Card glowingEffect className="p-4 flex flex-col justify-between gap-3 bg-card border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
              {t("billing.mrr_production")}
            </span>
            <div className="size-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <TrendingUp className="size-3.5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {isSubsLoading ? "—" : formatIdr(productionMrr)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {t("billing.kpi_mrr_desc")}
            </p>
          </div>
          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{t("billing.paying_accounts")}</span>
            <span className="font-mono text-foreground font-bold">{activePayingCount}</span>
          </div>
        </Card>

        {/* Metric 2: Average Revenue Per Account (ARPA) */}
        <Card glowingEffect className="p-4 flex flex-col justify-between gap-3 bg-card border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
              {t("billing.kpi_arpa")}
            </span>
            <div className="size-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <DollarSign className="size-3.5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {isSubsLoading ? "—" : formatIdr(arpa)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {t("billing.kpi_arpa_desc")}
            </p>
          </div>
          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{t("billing.billing_base")}</span>
            <span className="font-mono text-foreground">{t("billing.monthly")}</span>
          </div>
        </Card>

        {/* Metric 3: Active Paying Tenants */}
        <Card glowingEffect className="p-4 flex flex-col justify-between gap-3 bg-card border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
              {t("billing.kpi_paying_clients")}
            </span>
            <div className="size-6 rounded-lg bg-foreground/5 border border-border flex items-center justify-center text-foreground">
              <Users className="size-3.5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {isSubsLoading ? "—" : activePayingCount}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {t("billing.kpi_paying_clients_desc")}
            </p>
          </div>
          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{t("billing.total_accounts")}</span>
            <span className="font-mono text-foreground">{subscriptions.length}</span>
          </div>
        </Card>

        {/* Metric 4: At-Risk & Dunning */}
        <Card glowingEffect className="p-4 flex flex-col justify-between gap-3 bg-card border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
              {t("billing.kpi_dunning_risk")}
            </span>
            <div className="size-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <AlertTriangle className="size-3.5" />
            </div>
          </div>
          <div>
            <p className={`text-2xl font-bold tracking-tight font-mono ${atRiskCount > 0 ? "text-amber-500" : "text-foreground"}`}>
              {isSubsLoading ? "—" : atRiskCount}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {t("billing.kpi_dunning_desc")}
            </p>
          </div>
          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{t("billing.collection_status")}</span>
            <span className={`font-mono font-medium ${atRiskCount > 0 ? "text-amber-500" : "text-primary"}`}>
              {atRiskCount > 0 ? t("billing.needs_followup") : t("billing.all_on_schedule")}
            </span>
          </div>
        </Card>
      </div>

      {/* Tier Distribution & Quick Nav Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tier Distribution Breakdown */}
        <Card className="p-5 bg-card border-border lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground font-mono">
              {t("billing.tier_distribution_title")}
            </h3>
            <Layers className="size-4 text-muted-foreground" />
          </div>

          <div className="space-y-3">
            {[
              { name: "ENTERPRISE", count: tierCounts.ENTERPRISE, color: "bg-primary" },
              { name: "PRO", count: tierCounts.PRO, color: "bg-blue-500" },
              { name: "STARTER", count: tierCounts.STARTER, color: "bg-primary/70" },
              { name: "FREE", count: tierCounts.FREE, color: "bg-muted-foreground/60" },
            ].map((tier) => (
              <div key={tier.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-medium text-foreground">{tier.name}</span>
                  <span className="font-mono text-muted-foreground">{tier.count}</span>
                </div>
                <div className="w-full bg-muted/40 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`${tier.color} h-full rounded-full transition-all`}
                    style={{
                      width: `${
                        subscriptions.length > 0 ? Math.round((tier.count / subscriptions.length) * 100) : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-border/60">
            <Button
              variant="outline"
              size="xs"
              onClick={() => navigate({ to: "/catalog/plans" })}
              className="w-full gap-1 h-6 text-[11px] font-medium"
            >
              <span>{t("billing.view_plan_templates")}</span>
              <ArrowRight className="size-3" />
            </Button>
          </div>
        </Card>

        {/* Operational Quick Actions & Recent Subscriptions */}
        <Card className="p-5 bg-card border-border lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground font-mono">
                {t("billing.recent_subs_title")}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {t("billing.recent_subs_desc")}
              </p>
            </div>
            <Button
              variant="outline"
              size="xs"
              onClick={() => navigate({ to: "/billing/subscriptions" })}
              className="gap-1 h-6 px-2 text-[11px] font-medium"
            >
              <span>{t("common.view_all")}</span>
              <ArrowRight className="size-3" />
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/80 text-muted-foreground text-[11px] font-semibold">
                  <th className="py-2 px-2.5">{t("billing.th_tenant")}</th>
                  <th className="py-2 px-2.5">{t("billing.th_plan")}</th>
                  <th className="py-2 px-2.5">{t("billing.th_status")}</th>
                  <th className="py-2 px-2.5 text-right">{t("billing.monthly_rate")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isSubsLoading ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-muted-foreground">
                      <RefreshCcw className="size-3.5 animate-spin mx-auto text-primary" />
                    </td>
                  </tr>
                ) : (
                  subscriptions.slice(0, 5).map((sub) => (
                    <tr key={sub.id} className="hover:bg-muted/15 transition-colors">
                      <td className="py-2 px-2.5">
                        <div className="font-semibold text-foreground">
                          {sub.organizationName || sub.organizationSlug}
                        </div>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {sub.organizationSlug}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 font-mono text-foreground font-medium">
                        {sub.planName}
                      </td>
                      <td className="py-2 px-2.5">
                        <LifecycleStatusBadge status={sub.status} />
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-medium text-foreground">
                        {formatIdr(sub.priceMonthly)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}

import * as React from "react";
import { CreditCard, Check, Zap, Loader2, Sparkles, Shield, ExternalLink } from "lucide-react";
import { PageHeader, PageContentShell, PageHero, Card, Button, Badge } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api-client";
import { useTenantSubscription } from "../../../hooks/useTenantSubscription";
import { toast } from "sonner";
import { ProratedUpgradeModal } from "../../../components/licenses/ProratedUpgradeModal";

interface SubscribeResponse {
  invoice_id?: string;
  invoice_url?: string;
  external_id?: string;
  amount?: number;
  status?: string;
}

interface PlanItem {
  key: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  current: boolean;
  badge?: string;
}

function resolvePlanDisplayTitle(tier: string, t: (k: string) => string): string {
  if (tier === "enterprise") return t("billing.plan_enterprise_title");
  if (tier === "pro") return t("billing.plan_pro_title");
  if (tier === "starter") return t("billing.plan_starter_title");
  return t("billing.plan_trial_title");
}

function PlanHeaderIcon({ tier }: { tier: string }) {
  if (tier === "enterprise") return <Sparkles className="h-5 w-5" />;
  if (tier === "free") return <Shield className="h-5 w-5" />;
  return <Zap className="h-5 w-5" />;
}

function CurrentPlanCard({
  tier,
  status,
  planCycle,
  isBoosterActive,
  boosterDaysRemaining,
  onManageQuota,
}: {
  tier: string;
  status: string;
  planCycle: string;
  isBoosterActive: boolean;
  boosterDaysRemaining: number;
  onManageQuota: () => void;
}) {
  const { t } = useTranslation();
  const title = resolvePlanDisplayTitle(tier, t as (k: string) => string);

  return (
    <Card className="p-5 border-border/80 bg-card shadow-2xs space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/40 text-foreground border border-border/80">
            <PlanHeaderIcon tier={tier} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">
                {title}
              </h3>
              <Badge variant="outline" className="text-[10px] font-mono border-border/80 bg-muted/30 text-foreground">
                {status || t("common.active")}
              </Badge>
              {isBoosterActive && (
                <Badge variant="outline" className="text-[10px] font-mono border-border/80 bg-muted/40 text-foreground">
                  {t("billing.booster_badge", { days: boosterDaysRemaining || 0 })}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("billing.billing_cycle")}: <strong>{planCycle}</strong>
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={onManageQuota}
          className="h-7 px-2.5 text-xs font-medium gap-1.5 rounded-md border-border/80 text-foreground"
        >
          <CreditCard className="h-3.5 w-3.5" />
          {tier === "free" ? t("billing.upgrade_plan") : t("billing.manage_quota")}
        </Button>
      </div>
    </Card>
  );
}

function PricingTierCard({
  plan,
  isPending,
  onSelect,
}: {
  plan: PlanItem;
  isPending: boolean;
  onSelect: (key: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <Card
      className={`p-5 flex flex-col justify-between border-border/80 bg-card transition-all ${
        plan.current
          ? "border-foreground ring-1 ring-foreground/20 shadow-xs"
          : "hover:border-foreground/40 shadow-2xs"
      }`}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground">{plan.name}</span>
          {plan.badge && (
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-muted/40 text-foreground border border-border/80">
              {plan.badge}
            </span>
          )}
        </div>

        <div>
          <span className="text-xl font-bold font-mono text-foreground">{plan.price}</span>
          <span className="text-xs text-muted-foreground ml-1">{plan.period}</span>
        </div>

        <p className="text-xs text-muted-foreground min-h-[32px] leading-relaxed">
          {plan.description}
        </p>

        <div className="pt-3 border-t border-border/50 space-y-2">
          {plan.features.map((f, fIdx) => (
            <div key={fIdx} className="flex items-center gap-2 text-xs text-foreground">
              <Check className="h-3.5 w-3.5 text-foreground shrink-0" />
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-border/50">
        <Button
          variant={plan.current ? "outline" : "default"}
          size="sm"
          disabled={plan.current || isPending}
          onClick={() => onSelect(plan.key)}
          className={`w-full h-7 px-2.5 text-xs font-medium gap-1.5 rounded-md ${
            plan.current
              ? "border-border/80 text-foreground"
              : "shadow-xs bg-foreground text-background hover:bg-foreground/90 cursor-pointer"
          }`}
        >
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t("common.processing")}
            </>
          ) : plan.current ? (
            t("billing.current_tier_btn")
          ) : (
            <>
              {t("billing.select_tier_btn")}
              <ExternalLink className="h-3 w-3" />
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

function buildPlanList(tier: string, formatCurrency: (v: number) => string, t: (k: string) => string): PlanItem[] {
  return [
    {
      key: "FREE",
      name: "STARTER TRIAL",
      price: formatCurrency(0),
      period: t("billing.per_month"),
      description: "Starter 14-day evaluation trial with basic hardware quotas and community support.",
      features: [
        "Maksimal 1 OLT & Proyek FTTH Aktif",
        "Maksimal 50 ODP & 10 ODC",
        "Hingga 100 Pelanggan Terdaftar",
        "2 GB Kapasitas MinIO S3 Storage",
        "Akses API Standar (500 RPM)",
      ],
      current: tier === "free",
      badge: tier === "free" ? t("billing.free_trial") : undefined,
    },
    {
      key: "STARTER",
      name: "STARTER ISP",
      price: formatCurrency(990000),
      period: t("billing.per_month"),
      description: "Starter ISP tier for local ISPs and RT-RW Net with 2 OLTs and up to 500 customers.",
      features: [
        "Maksimal 2 OLT & Proyek FTTH Aktif",
        "Maksimal 300 ODP & 50 ODC",
        "Hingga 500 Pelanggan Terdaftar",
        "15 GB Kapasitas MinIO S3 Storage",
        "Akses Webhook & API (2.000 RPM)",
      ],
      current: tier === "starter",
      badge: tier === "starter" ? t("billing.active_tier_badge") : undefined,
    },
    {
      key: "PRO",
      name: "PROFESSIONAL",
      price: formatCurrency(3900000),
      period: t("billing.per_month"),
      description: "Professional ISP tier with SNMP poller, optical heatmap, LDAP SSO, and Gold 99.5% SLA.",
      features: [
        "Maksimal 6 OLT & Proyek FTTH Aktif",
        "Maksimal 2.500 ODP & 500 ODC",
        "Hingga 5.000 Pelanggan Terdaftar",
        "100 GB Kapasitas MinIO S3 Storage",
        "Live SNMP OLT Poller Telemetry",
      ],
      current: tier === "pro",
      badge: tier === "pro" ? t("billing.active_tier_badge") : t("billing.most_popular"),
    },
    {
      key: "ENTERPRISE",
      name: "ENTERPRISE",
      price: formatCurrency(12500000),
      period: t("billing.per_month"),
      description: "Enterprise Core tier with AI Fiber Copilot, custom POP gateway, and Platinum 99.9% SLA.",
      features: [
        "Maksimal 25 OLT & Proyek FTTH Aktif",
        "Maksimal 12.000 ODP & 2.000 ODC",
        "Hingga 25.000 Pelanggan Terdaftar",
        "500 GB Kapasitas MinIO S3 Storage",
        "AI Fiber Diagnostics Copilot",
      ],
      current: tier === "enterprise",
      badge: tier === "enterprise" ? t("billing.active_tier_badge") : undefined,
    },
  ];
}

export function SubscriptionPlansPage() {
  const { t, formatCurrency } = useTranslation();
  const { summary, tier, planCycle, refetch } = useTenantSubscription();
  const [selectedUpgradePlan, setSelectedUpgradePlan] = React.useState<string | null>(null);

  const subscribeMutation = useMutation({
    mutationFn: async (targetPlan: string) => {
      return apiClient<SubscribeResponse>("/api/v1/payments/subscribe", {
        method: "POST",
        body: JSON.stringify({ plan: targetPlan }),
      });
    },
    onSuccess: (data) => {
      toast.success(t("billing.invoice_issued_success"));
      if (data?.invoice_url) {
        window.open(data.invoice_url, "_blank");
      }
      setSelectedUpgradePlan(null);
      refetch();
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : t("billing.subscribe_failed");
      toast.error(msg);
    },
  });

  const plans = React.useMemo(
    () => buildPlanList(tier, formatCurrency, t as (k: string) => string),
    [tier, formatCurrency, t]
  );

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <PageHeader
        title={t("billing.tenant_billing_title")}
        breadcrumbs={[
          { label: t("organizations.tab_overview"), href: "/projects" },
          { label: t("nav.tenant_billing"), href: "/billing/license" },
          { label: t("nav.billing_subscription_plans") },
        ]}
      />

      <div className="px-6 pt-2 shrink-0">
        <PageHero
          bordered={false}
          className="pb-2"
          eyebrow={t("billing.title")}
          title={t("billing.tenant_billing_title")}
          icon={CreditCard}
          subtitle={t("billing.tenant_billing_subtitle")}
          meta={
            <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground font-medium">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-foreground font-mono">{tier.toUpperCase()}</span>
                <span>{t("billing.current_plan")}</span>
              </div>
              <span className="text-muted-foreground/30 px-1">/</span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-foreground font-mono">{planCycle}</span>
                <span>{t("billing.billing_cycle")}</span>
              </div>
              {Boolean(summary?.isBoosterActive) && (
                <>
                  <span className="text-muted-foreground/30 px-1">/</span>
                  <div className="flex items-center gap-1 text-primary font-mono text-xs">
                    <Zap className="size-3" />
                    <span>{t("billing.booster_badge", { days: summary?.boosterDaysRemaining || 0 })}</span>
                  </div>
                </>
              )}
            </div>
          }
          actions={
            <Button
              size="sm"
              variant="default"
              onClick={() => setSelectedUpgradePlan("STARTER")}
              className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs"
            >
              <CreditCard className="size-3.5" />
              <span>{tier === "free" ? t("billing.upgrade_plan") : t("billing.manage_quota")}</span>
            </Button>
          }
        />
      </div>

      <PageContentShell className="space-y-6 custom-scrollbar p-6 pt-2">
        <CurrentPlanCard
          tier={tier}
          status={summary?.status || ""}
          planCycle={planCycle}
          isBoosterActive={Boolean(summary?.isBoosterActive)}
          boosterDaysRemaining={summary?.boosterDaysRemaining || 0}
          onManageQuota={() => setSelectedUpgradePlan("STARTER")}
        />

        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("billing.title")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {plans.map((p) => (
              <PricingTierCard
                key={p.key}
                plan={p}
                isPending={subscribeMutation.isPending && selectedUpgradePlan === p.key}
                onSelect={(k) => setSelectedUpgradePlan(k)}
              />
            ))}
          </div>
        </div>
      </PageContentShell>

      {/* Prorated Upgrade Interactive Calculator Modal */}
      <ProratedUpgradeModal
        open={Boolean(selectedUpgradePlan)}
        onOpenChange={(open) => {
          if (!open) setSelectedUpgradePlan(null);
        }}
        targetPlan={selectedUpgradePlan}
        onConfirmCheckout={async (plan) => {
          await subscribeMutation.mutateAsync(plan);
        }}
        isCheckingOut={subscribeMutation.isPending}
      />
    </div>
  );
}

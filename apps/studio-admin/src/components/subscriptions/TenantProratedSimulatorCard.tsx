import * as React from "react";
import { Card, Button, Badge, toast } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import {
  Building2,
  Calendar,
  Clock,
  ArrowRight,
  ArrowUpRight,
  SlidersHorizontal,
  Check,
  Copy,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import type { TenantSubscriptionItem } from "@/hooks/useBillingSubscriptions";
import type { SubscriptionPlanMaster } from "@/hooks/useSubscriptionPlans";
import { useAdminProrateEstimate } from "@/hooks/useOrganizationLicenses";

export interface TenantProratedSimulatorCardProps {
  subscriptions: TenantSubscriptionItem[];
  dbPlans: SubscriptionPlanMaster[];
  onOpenWizard: (sub: TenantSubscriptionItem) => void;
  formatIdr: (val?: number) => string;
}

export function TenantProratedSimulatorCard({
  subscriptions,
  dbPlans,
  onOpenWizard,
  formatIdr,
}: TenantProratedSimulatorCardProps) {
  const { t } = useTranslation();
  const [simOrgId, setSimOrgId] = React.useState<string>("");
  const [simTargetPlan, setSimTargetPlan] = React.useState<string>("ENTERPRISE");
  const [simCopied, setSimCopied] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (subscriptions.length > 0 && !simOrgId) {
      setSimOrgId(subscriptions[0].organizationId);
    }
  }, [subscriptions, simOrgId]);

  const selectedSimSub = React.useMemo(() => {
    return (
      subscriptions.find((s) => s.organizationId === simOrgId && s.status === "ACTIVE") ||
      subscriptions.find((s) => s.organizationId === simOrgId)
    );
  }, [subscriptions, simOrgId]);

  const {
    data: simEstimate,
    isLoading: isSimEstimating,
    error: simError,
  } = useAdminProrateEstimate(simOrgId || undefined, simTargetPlan || undefined);

  const handleCopyEstimate = () => {
    if (!simEstimate || !selectedSimSub) return;
    const summary = [
      `=== K2NET UPGRADE PRORATION ESTIMATE ===`,
      `Tenant: ${selectedSimSub.organizationName} (${selectedSimSub.organizationSlug})`,
      `Transition: ${simEstimate.currentPlan} -> ${simEstimate.targetPlan}`,
      `Days Remaining: ${simEstimate.daysRemaining} / ${simEstimate.totalCycleDays} days`,
      `Current Plan Daily Rate: ${formatIdr(simEstimate.dailyRateOld)}`,
      `Unused Prorated Credit: -${formatIdr(simEstimate.proratedCredit)}`,
      `Target Plan Price: ${formatIdr(simEstimate.targetPlanPrice)}`,
      `Net Payable Amount: ${formatIdr(simEstimate.netDueAmount)} IDR`,
      `Calculation: ${simEstimate.calculationSummary}`,
    ].join("\n");

    navigator.clipboard.writeText(summary).then(() => {
      setSimCopied(true);
      toast.success(t("license.prorate.copy_estimate_success"));
      setTimeout(() => setSimCopied(false), 2000);
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-6xl">
      {/* Simulator Inputs Card */}
      <Card glowingEffect className="p-5 flex flex-col justify-between gap-5 bg-card border-border">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Building2 className="size-3.5 text-muted-foreground" />
              <span>{t("license.prorate.select_org")}</span>
            </label>
            <select
              value={simOrgId}
              onChange={(e) => setSimOrgId(e.target.value)}
              className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-1 focus:ring-border"
            >
              {subscriptions.map((s) => (
                <option key={s.organizationId} value={s.organizationId}>
                  {s.organizationName || s.organizationSlug} ({s.organizationSlug}) — {s.planName}
                </option>
              ))}
            </select>
          </div>

          {selectedSimSub && (
            <div className="p-3 rounded-md border border-border/70 bg-muted/20 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                  {t("license.prorate.tenant_info")}
                </span>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {selectedSimSub.planName}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-border/40">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="size-3 shrink-0" />
                  <span>{selectedSimSub.currentPeriodEnd ? selectedSimSub.currentPeriodEnd.substring(0, 10) : "—"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="size-3 shrink-0" />
                  <span className="font-mono text-foreground font-medium">
                    {selectedSimSub.billingCycle}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Target Plan Selector from DB Plans */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <SlidersHorizontal className="size-3.5 text-muted-foreground" />
              <span>{t("license.prorate.target_tier_selection")}</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {dbPlans.filter((p: SubscriptionPlanMaster) => p.name !== "CUSTOM").map((plan: SubscriptionPlanMaster) => {
                const isSelected = simTargetPlan.toUpperCase() === plan.name.toUpperCase();
                const isCurrent = selectedSimSub?.planName?.toUpperCase() === plan.name.toUpperCase();

                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSimTargetPlan(plan.name)}
                    className={`h-11 px-2.5 rounded-md border text-xs font-medium transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                      isSelected
                        ? "bg-foreground text-background border-foreground shadow-xs font-semibold"
                        : "bg-muted/15 border-border text-foreground hover:bg-muted/30"
                    }`}
                  >
                    <span className="font-mono text-xs">{plan.name}</span>
                    {isCurrent && (
                      <span className="text-[9px] opacity-75 font-mono">
                        ({t("license.prorate.current_plan")})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-border/60 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyEstimate}
            disabled={!simEstimate}
            className="w-1/2 gap-1.5 text-xs font-medium"
          >
            {simCopied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
            <span>{t("license.prorate.copy_estimate")}</span>
          </Button>

          {selectedSimSub && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onOpenWizard(selectedSimSub)}
              className="w-1/2 gap-1.5 text-xs font-medium shadow-xs"
            >
              <ArrowUpRight className="size-3.5" />
              <span>{t("billing.open_wizard_btn")}</span>
            </Button>
          )}
        </div>
      </Card>

      {/* Simulator Breakdown Card */}
      <Card glowingEffect className="p-5 flex flex-col justify-between gap-5 bg-card border-border">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <span className="text-xs font-semibold text-foreground">
              {t("license.prorate.breakdown_title")}
            </span>
            {simEstimate && (
              <Badge
                variant="outline"
                className={`text-[10px] font-mono gap-1 ${
                  simEstimate.isUpgradeEligible
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground"
                }`}
              >
                {simEstimate.isUpgradeEligible ? <CheckCircle2 className="size-3" /> : <AlertCircle className="size-3" />}
                {simEstimate.isUpgradeEligible
                  ? t("license.prorate.eligible_badge")
                  : t("license.prorate.not_eligible_badge")}
              </Badge>
            )}
          </div>

          {isSimEstimating ? (
            <div className="space-y-3 py-6 animate-pulse">
              <div className="h-6 bg-muted/40 rounded w-1/3" />
              <div className="h-14 bg-muted/20 rounded" />
              <div className="h-4 bg-muted/40 rounded w-1/2" />
            </div>
          ) : simError ? (
            <div className="flex items-start gap-2.5 text-muted-foreground text-xs p-4 rounded-md border border-border/70 bg-muted/10">
              <AlertCircle className="size-4 shrink-0 text-amber-500 mt-0.5" />
              <p>{t("license.prorate.no_active_license_warning")}</p>
            </div>
          ) : simEstimate ? (
            <div className="space-y-4">
              {/* Transition display */}
              <div className="flex items-center justify-between p-3 rounded-md border border-border/70 bg-muted/20 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground">
                    {t("license.prorate.current_plan")}
                  </span>
                  <p className="font-mono font-bold text-foreground text-sm">{simEstimate.currentPlan}</p>
                  <p className="text-[11px] font-mono text-muted-foreground">{formatIdr(simEstimate.currentPlanPrice)}</p>
                </div>
                <div className="flex items-center justify-center size-7 rounded-full bg-muted/40 text-muted-foreground">
                  <ArrowRight className="size-3.5" />
                </div>
                <div className="space-y-0.5 text-right">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground">
                    {t("license.prorate.target_plan_label")}
                  </span>
                  <p className="font-mono font-bold text-foreground text-sm">{simEstimate.targetPlan}</p>
                  <p className="text-[11px] font-mono text-muted-foreground">{formatIdr(simEstimate.targetPlanPrice)}</p>
                </div>
              </div>

              {/* Accounting Grid */}
              <div className="space-y-2 text-xs border border-border/60 rounded-md p-3.5 bg-muted/10">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("license.prorate.days_remaining")}</span>
                  <span className="font-mono font-medium text-foreground">
                    {simEstimate.daysRemaining} / {simEstimate.totalCycleDays}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("license.prorate.daily_rate_old")}</span>
                  <span className="font-mono font-medium text-foreground">
                    {formatIdr(simEstimate.dailyRateOld)} / {t("common.day")}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("license.prorate.prorated_credit")}</span>
                  <span className="font-mono font-semibold text-primary">
                    - {formatIdr(simEstimate.proratedCredit)}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("license.prorate.target_plan_label")}</span>
                  <span className="font-mono font-medium text-foreground">
                    {formatIdr(simEstimate.targetPlanPrice)}
                  </span>
                </div>

                <div className="pt-2.5 mt-2 border-t border-border flex items-baseline justify-between">
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      {t("license.prorate.net_amount_due")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Tax exclusive · Pro-rata applied</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
                      {formatIdr(simEstimate.netDueAmount)}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-1">IDR</span>
                  </div>
                </div>
              </div>

              {simEstimate.calculationSummary && (
                <div className="flex items-start gap-2 p-2.5 rounded-md border border-border/40 bg-muted/15 text-[11px] text-muted-foreground">
                  <FileText className="size-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                  <p className="italic leading-relaxed">{simEstimate.calculationSummary}</p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="pt-2 border-t border-border/60 text-[10px] text-muted-foreground">
          {t("license.prorate.accounting_footnote")}
        </div>
      </Card>
    </div>
  );
}

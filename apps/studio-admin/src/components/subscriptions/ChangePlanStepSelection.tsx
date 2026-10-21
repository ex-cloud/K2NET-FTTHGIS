import * as React from "react";
import { Badge } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { Server, Database, Cpu, Sparkles } from "lucide-react";
import type { SubscriptionPlanMaster } from "@/hooks/useSubscriptionPlans";
import type { TenantSubscriptionItem } from "@/hooks/useBillingSubscriptions";

export interface ChangePlanStepSelectionProps {
  subscription?: TenantSubscriptionItem | null;
  targetPlan: string;
  setTargetPlan: (plan: string) => void;
  targetCycle: "MONTHLY" | "YEARLY";
  setTargetCycle: (cycle: "MONTHLY" | "YEARLY") => void;
  selectablePlans: SubscriptionPlanMaster[];
  isPlansLoading: boolean;
  annualDiscountRate: number;
  formatIdr: (val?: number) => string;
}

export function ChangePlanStepSelection({
  subscription,
  targetPlan,
  setTargetPlan,
  targetCycle,
  setTargetCycle,
  selectablePlans,
  isPlansLoading,
  annualDiscountRate,
  formatIdr,
}: ChangePlanStepSelectionProps) {
  const { t } = useTranslation();

  const selectedPlanSpec = selectablePlans.find(
    (p) => p.name.toUpperCase() === targetPlan.toUpperCase()
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {t("billing.wizard_step_1_desc")}
        </p>

        {/* Billing Cycle Selector */}
        <div className="inline-flex p-0.5 rounded-md border border-border bg-muted/20">
          <button
            type="button"
            onClick={() => setTargetCycle("MONTHLY")}
            className={`h-6 px-2.5 rounded text-[11px] font-medium transition-all ${
              targetCycle === "MONTHLY"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("billing.monthly")}
          </button>
          <button
            type="button"
            onClick={() => setTargetCycle("YEARLY")}
            className={`h-6 px-2.5 rounded text-[11px] font-medium transition-all ${
              targetCycle === "YEARLY"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("billing.annual")} (-{Math.round(annualDiscountRate * 100)}%)
          </button>
        </div>
      </div>

      {/* Dynamic Tier Cards Grid */}
      {isPlansLoading ? (
        <div className="grid grid-cols-3 gap-3 animate-pulse">
          <div className="h-28 bg-muted/20 rounded-lg" />
          <div className="h-28 bg-muted/20 rounded-lg" />
          <div className="h-28 bg-muted/20 rounded-lg" />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {selectablePlans.map((plan: SubscriptionPlanMaster) => {
            const isSelected = targetPlan.toUpperCase() === plan.name.toUpperCase();
            const isCurrent = subscription?.planName?.toUpperCase() === plan.name.toUpperCase();
            const monthlyPrice = plan.price || 0;
            const computedYearlyPrice = Math.round(monthlyPrice * 12 * (1 - annualDiscountRate));
            const price = targetCycle === "YEARLY" ? computedYearlyPrice : monthlyPrice;

            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setTargetPlan(plan.name)}
                className={`p-3.5 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? "border-foreground bg-foreground/5 shadow-xs ring-1 ring-foreground/20"
                    : "border-border/80 bg-card hover:bg-muted/30"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-foreground">
                      {plan.name}
                    </span>
                    {isCurrent && (
                      <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0">
                        {t("billing.current_plan")}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight">
                    {plan.description || plan.name}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-border/50">
                  <span className="text-sm font-bold font-mono text-foreground block">
                    {formatIdr(price)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {targetCycle === "YEARLY" ? t("billing.per_year") : t("billing.per_month")}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Dynamic Live Quota Comparison Card */}
      {selectedPlanSpec && (
        <div className="p-3.5 rounded-lg border border-border/70 bg-muted/15 space-y-2.5">
          <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground font-semibold">
            {t("billing.target_plan_details")} · {selectedPlanSpec.name} ({targetCycle})
          </span>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-2 p-2 rounded-md bg-background/60 border border-border/40">
              <Server className="size-3.5 text-muted-foreground shrink-0" />
              <div>
                <span className="text-[10px] text-muted-foreground block">{t("billing.quota_olts")}</span>
                <span className="font-mono font-bold text-foreground">
                  {selectedPlanSpec.maxOlts ?? selectedPlanSpec.maxProjects} {t("billing.units_label")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-md bg-background/60 border border-border/40">
              <Database className="size-3.5 text-muted-foreground shrink-0" />
              <div>
                <span className="text-[10px] text-muted-foreground block">{t("billing.quota_odps")}</span>
                <span className="font-mono font-bold text-foreground">
                  {selectedPlanSpec.maxOdps?.toLocaleString() ?? 0} {t("billing.points_label")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-md bg-background/60 border border-border/40">
              <Cpu className="size-3.5 text-muted-foreground shrink-0" />
              <div>
                <span className="text-[10px] text-muted-foreground block">{t("billing.quota_storage")}</span>
                <span className="font-mono font-bold text-foreground">
                  {selectedPlanSpec.maxStorageGb ?? 0} GB
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-md bg-background/60 border border-border/40">
              <Sparkles className="size-3.5 text-muted-foreground shrink-0" />
              <div>
                <span className="text-[10px] text-muted-foreground block">{t("billing.quota_api")}</span>
                <span className="font-mono font-bold text-foreground">
                  {selectedPlanSpec.hasSso ? t("billing.feature_sso") : t("billing.feature_api")}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

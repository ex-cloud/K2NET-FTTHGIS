import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { Calculator, ArrowRight, CheckCircle2, AlertCircle, Building2 } from "lucide-react";
import {
  useAdminProrateEstimate,
  type LicenseItem,
} from "@/hooks/useOrganizationLicenses";

export interface AdminProrateCalculatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  licenses?: LicenseItem[];
  initialLicense?: LicenseItem | null;
}

function formatIdr(val?: number): string {
  if (typeof val !== "number" || isNaN(val) || val <= 0) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
}

const AVAILABLE_PLANS = ["STARTER", "PRO", "ENTERPRISE"] as const;

export function AdminProrateCalculatorModal({
  open,
  onOpenChange,
  licenses = [],
  initialLicense,
}: AdminProrateCalculatorModalProps) {
  const { t } = useTranslation();

  // Distinct organizations from active licenses
  const orgOptions = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; slug: string; currentPlan: string }>();
    for (const lic of licenses) {
      if (!map.has(lic.organizationId)) {
        map.set(lic.organizationId, {
          id: lic.organizationId,
          name: lic.organizationName || lic.organizationSlug,
          slug: lic.organizationSlug,
          currentPlan: lic.planName,
        });
      }
    }
    return Array.from(map.values());
  }, [licenses]);

  const [selectedOrgId, setSelectedOrgId] = React.useState<string>("");
  const [targetPlan, setTargetPlan] = React.useState<string>("ENTERPRISE");

  // Sync initial selection when modal opens
  React.useEffect(() => {
    if (open) {
      if (initialLicense?.organizationId) {
        setSelectedOrgId(initialLicense.organizationId);
      } else if (orgOptions.length > 0 && !selectedOrgId) {
        setSelectedOrgId(orgOptions[0].id);
      }
    }
  }, [open, initialLicense, orgOptions, selectedOrgId]);

  const selectedOrg = React.useMemo(() => {
    return orgOptions.find((o) => o.id === selectedOrgId);
  }, [orgOptions, selectedOrgId]);

  // Hook estimate calculation
  const {
    data: estimate,
    isLoading: isEstimating,
    error,
  } = useAdminProrateEstimate(
    open && selectedOrgId ? selectedOrgId : undefined,
    open && targetPlan ? targetPlan : undefined
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Calculator className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                {t("license.prorate.calculator_title")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {t("license.prorate.calculator_desc")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Organization Selector */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">
              {t("license.prorate.select_org")}
            </label>
            <div className="relative">
              <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-xs rounded-md bg-muted/20 border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="" disabled>
                  {t("license.prorate.select_org_placeholder")}
                </option>
                {orgOptions.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.slug}) — {org.currentPlan}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Target Tier Selector */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">
              {t("license.prorate.target_plan")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {AVAILABLE_PLANS.map((plan) => {
                const isSelected = targetPlan === plan;
                const isCurrent = selectedOrg?.currentPlan?.toUpperCase() === plan;
                return (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => setTargetPlan(plan)}
                    className={`h-9 px-2 rounded-md border text-xs font-medium transition-all flex flex-col items-center justify-center gap-0.5 ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-muted/10 border-border/80 text-foreground hover:bg-muted/30"
                    }`}
                  >
                    <span>{plan}</span>
                    {isCurrent && (
                      <span className="text-[9px] opacity-80 font-mono">
                        ({t("license.prorate.current_plan")})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Simulation Output Card */}
          <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
            {isEstimating ? (
              <div className="space-y-2.5 py-4 animate-pulse">
                <div className="h-4 bg-muted/40 rounded w-1/3" />
                <div className="h-10 bg-muted/30 rounded" />
                <div className="h-4 bg-muted/40 rounded w-1/2" />
              </div>
            ) : error ? (
              <div className="flex items-start gap-2 text-destructive text-xs py-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{t("license.prorate.no_active_license_warning")}</span>
              </div>
            ) : estimate ? (
              <>
                {/* Plan Transition & Eligibility Header */}
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                    <span className="font-mono">{estimate.currentPlan}</span>
                    <ArrowRight className="size-3 text-muted-foreground" />
                    <span className="font-mono font-bold text-primary">{estimate.targetPlan}</span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      estimate.isUpgradeEligible
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {estimate.isUpgradeEligible ? (
                      <CheckCircle2 className="size-2.5" />
                    ) : (
                      <AlertCircle className="size-2.5" />
                    )}
                    {estimate.isUpgradeEligible
                      ? t("license.prorate.eligible_badge")
                      : t("license.prorate.not_eligible_badge")}
                  </span>
                </div>

                {/* Calculation Details Grid */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t("license.prorate.days_remaining")}</span>
                    <span className="font-mono text-foreground">
                      {t("license.prorate.days_of_cycle", {
                        days: estimate.daysRemaining,
                        total: estimate.totalCycleDays,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t("license.prorate.daily_rate_old")}</span>
                    <span className="font-mono text-foreground">
                      {formatIdr(estimate.dailyRateOld)} / day
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t("license.prorate.prorated_credit")}</span>
                    <span className="font-mono font-semibold text-primary">
                      - {formatIdr(estimate.proratedCredit)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t("license.prorate.target_plan_label")}</span>
                    <span className="font-mono text-foreground">
                      {formatIdr(estimate.targetPlanPrice)}
                    </span>
                  </div>
                </div>

                {/* Net Due Highlight */}
                <div className="pt-2 border-t border-border/80 flex items-baseline justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    {t("license.prorate.net_amount_due")}
                  </span>
                  <div className="text-right">
                    <span className="text-xl font-bold font-mono text-primary">
                      {formatIdr(estimate.netDueAmount)}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-1">IDR</span>
                  </div>
                </div>

                {/* Summary note */}
                {estimate.calculationSummary && (
                  <p className="text-[11px] text-muted-foreground italic pt-1 border-t border-border/40">
                    {estimate.calculationSummary}
                  </p>
                )}
              </>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-7 px-2.5 text-xs font-medium"
          >
            {t("license.prorate.close_btn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

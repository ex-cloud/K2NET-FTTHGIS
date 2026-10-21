import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  toast,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import {
  Layers,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useSubscriptionPlans, type SubscriptionPlanMaster } from "@/hooks/useSubscriptionPlans";
import {
  useAdminProrateEstimate,
} from "@/hooks/useOrganizationLicenses";
import {
  useChangeTenantPlan,
  useBillingPolicies,
  type TenantSubscriptionItem,
} from "@/hooks/useBillingSubscriptions";
import { ChangePlanStepSelection } from "./ChangePlanStepSelection";
import { ChangePlanStepProration } from "./ChangePlanStepProration";
import { ChangePlanStepConfirmation } from "./ChangePlanStepConfirmation";

export interface ChangePlanWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription?: TenantSubscriptionItem | null;
  onSuccess?: () => void;
}

function formatIdr(val?: number): string {
  if (typeof val !== "number" || isNaN(val) || val <= 0) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
}

export function ChangePlanWizardModal({
  open,
  onOpenChange,
  subscription,
  onSuccess,
}: ChangePlanWizardModalProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = React.useState<1 | 2 | 3>(1);

  const [targetPlan, setTargetPlan] = React.useState<string>("");
  const [targetCycle, setTargetCycle] = React.useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [isDirectOverride, setIsDirectOverride] = React.useState<boolean>(true);
  const [notes, setNotes] = React.useState<string>("");
  const [isAgreed, setIsAgreed] = React.useState<boolean>(false);

  // Dynamic Plans from Backend
  const { data: dbPlans = [], isLoading: isPlansLoading } = useSubscriptionPlans();
  const { data: policies = [] } = useBillingPolicies();

  const annualDiscountRate = React.useMemo(() => {
    const policy = policies.find((p) => p.policyKey === "ANNUAL_DISCOUNT_PERCENT");
    if (policy?.policyValue) {
      const parsed = parseFloat(policy.policyValue);
      if (!isNaN(parsed) && parsed > 0) return parsed / 100;
    }
    return 0.10;
  }, [policies]);

  const selectablePlans = React.useMemo(() => {
    return dbPlans.filter((p: SubscriptionPlanMaster) => p.name !== "CUSTOM");
  }, [dbPlans]);

  // Initialize state when modal opens
  React.useEffect(() => {
    if (open && subscription) {
      setCurrentStep(1);
      setIsAgreed(false);
      setNotes("");
      setIsDirectOverride(true);

      const currentTier = subscription.planName?.toUpperCase() || "";
      const otherPlans = selectablePlans.filter((p: SubscriptionPlanMaster) => p.name.toUpperCase() !== currentTier);

      if (otherPlans.length > 0) {
        setTargetPlan(otherPlans[0].name);
      } else if (selectablePlans.length > 0) {
        setTargetPlan(selectablePlans[0].name);
      }

      setTargetCycle(subscription.billingCycle === "YEARLY" ? "YEARLY" : "MONTHLY");
    }
  }, [open, subscription, selectablePlans]);

  // Hook Proration Estimate
  const {
    data: estimate,
    isLoading: isEstimating,
    error: estimateError,
  } = useAdminProrateEstimate(
    open && subscription?.organizationId ? subscription.organizationId : undefined,
    open && targetPlan ? targetPlan : undefined
  );

  // Mutation
  const changePlanMutation = useChangeTenantPlan();

  const handleApplyChange = async () => {
    if (!subscription?.organizationSlug) return;

    try {
      await changePlanMutation.mutateAsync({
        slug: subscription.organizationSlug,
        newPlanName: targetPlan,
        planCycle: targetCycle,
        isDirectOverride,
        notes: notes.trim() || undefined,
      });

      toast.success(t("billing.change_plan_success"));
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("billing.change_plan_failed");
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border p-6 overflow-hidden">
        {/* Header */}
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Layers className="size-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-foreground">
                  {t("billing.change_plan")}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {subscription?.organizationName || subscription?.organizationSlug} · {subscription?.planName}
                </DialogDescription>
              </div>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center gap-1.5 bg-muted/30 p-1 rounded-md border border-border/60">
              <span
                className={`text-[11px] px-2 py-0.5 rounded font-mono font-medium ${
                  currentStep === 1
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground cursor-pointer"
                }`}
                onClick={() => setCurrentStep(1)}
              >
                1. {t("billing.wizard_step_1")}
              </span>
              <span className="text-muted-foreground/40 text-xs">/</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded font-mono font-medium ${
                  currentStep === 2
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground cursor-pointer"
                }`}
                onClick={() => setCurrentStep(2)}
              >
                2. {t("billing.wizard_step_2")}
              </span>
              <span className="text-muted-foreground/40 text-xs">/</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded font-mono font-medium ${
                  currentStep === 3
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground cursor-pointer"
                }`}
                onClick={() => setCurrentStep(3)}
              >
                3. {t("billing.wizard_step_3")}
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Wizard Body Steps */}
        <div className="py-4 space-y-4 min-h-[340px]">
          {currentStep === 1 && (
            <ChangePlanStepSelection
              subscription={subscription}
              targetPlan={targetPlan}
              setTargetPlan={setTargetPlan}
              targetCycle={targetCycle}
              setTargetCycle={setTargetCycle}
              selectablePlans={selectablePlans}
              isPlansLoading={isPlansLoading}
              annualDiscountRate={annualDiscountRate}
              formatIdr={formatIdr}
            />
          )}

          {currentStep === 2 && (
            <ChangePlanStepProration
              estimate={estimate}
              isEstimating={isEstimating}
              estimateError={estimateError}
              isDirectOverride={isDirectOverride}
              setIsDirectOverride={setIsDirectOverride}
              notes={notes}
              setNotes={setNotes}
              formatIdr={formatIdr}
            />
          )}

          {currentStep === 3 && (
            <ChangePlanStepConfirmation
              subscription={subscription}
              targetPlan={targetPlan}
              targetCycle={targetCycle}
              estimate={estimate}
              notes={notes}
              isAgreed={isAgreed}
              setIsAgreed={setIsAgreed}
              formatIdr={formatIdr}
            />
          )}
        </div>

        {/* Modal Footer */}
        <DialogFooter className="border-t border-border/60 pt-3 flex items-center justify-between sm:justify-between w-full">
          <div>
            {currentStep > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2) : 1))}
                className="gap-1.5 h-7 px-2.5 text-xs font-medium"
              >
                <ChevronLeft className="size-3.5" />
                <span>{t("billing.step_prev")}</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-7 px-2.5 text-xs font-medium"
            >
              {t("common.cancel")}
            </Button>

            {currentStep < 3 ? (
              <Button
                variant="default"
                size="sm"
                onClick={() => setCurrentStep((prev) => (prev < 3 ? ((prev + 1) as 2 | 3) : 3))}
                disabled={!targetPlan}
                className="gap-1.5 h-7 px-2.5 text-xs font-medium shadow-xs"
              >
                <span>{t("billing.step_next")}</span>
                <ChevronRight className="size-3.5" />
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleApplyChange}
                disabled={!isAgreed || changePlanMutation.isPending}
                className="gap-1.5 h-7 px-2.5 text-xs font-medium shadow-xs"
              >
                <ShieldCheck className="size-3.5" />
                <span>
                  {changePlanMutation.isPending
                    ? t("billing.btn_applying")
                    : t("billing.btn_apply_change")}
                </span>
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

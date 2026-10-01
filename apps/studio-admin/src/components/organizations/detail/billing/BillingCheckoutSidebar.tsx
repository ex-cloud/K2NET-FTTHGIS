import { Button, Input, Label } from "@k2net/ui";
import { Loader2 } from "lucide-react";
import type { SubscriptionPlanInfo, ProrationEstimate } from "./billing-types";
import { useTranslation } from "@k2net/i18n";

interface BillingCheckoutSidebarProps {
  selectedPlanTarget: SubscriptionPlanInfo;
  isDowngradeMode: boolean;
  prorateData: ProrationEstimate | null;
  upgradeNotes: string;
  setUpgradeNotes: (v: string) => void;
  ackOverQuota: boolean;
  downgradeReason: string;
  isExecuting: boolean;
  onExecuteUpgrade: () => void;
  onExecuteDowngrade: () => void;
  onClose: () => void;
}

export function BillingCheckoutSidebar({
  selectedPlanTarget,
  isDowngradeMode,
  prorateData,
  upgradeNotes,
  setUpgradeNotes,
  ackOverQuota,
  downgradeReason,
  isExecuting,
  onExecuteUpgrade,
  onExecuteDowngrade,
  onClose,
}: BillingCheckoutSidebarProps) {
  const { t } = useTranslation();
  const isSubmitDisabled =
    isExecuting || (isDowngradeMode && (!ackOverQuota || !downgradeReason.trim()));

  return (
    <div className="md:col-span-5 p-6 md:p-7 flex flex-col justify-between space-y-6 bg-muted/10">
      <div className="space-y-4">
        <h5 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
          Billing Summary
        </h5>

        {/* Proration / Cost Breakdown Box */}
        <div className="rounded-xl border border-border bg-card p-3.5 space-y-2.5 text-xs">
          <div className="flex items-center justify-between font-bold text-foreground pb-1.5 border-b border-border">
            <span>{selectedPlanTarget.name} Plan</span>
            <span className="font-mono">{selectedPlanTarget.price} / bln</span>
          </div>

          {!isDowngradeMode && (
            <>
              <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                <span>{t("organizations.billing_cycle_params")}</span>
                <span>
                  {t("organizations.billing_remaining_days", {
                    remaining: prorateData?.remainingDays ?? 30,
                    total: prorateData?.totalCycleDays ?? 30,
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground">{t("organizations.billing_old_plan_credit")}</span>
                <span className="font-mono text-primary font-semibold">
                  - Rp {(prorateData?.unusedOldPlanCredit ?? 0).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground">{t("organizations.billing_new_plan_prorated")}</span>
                <span className="font-mono text-foreground font-semibold">
                  + Rp {(prorateData?.newPlanProratedCost ?? selectedPlanTarget.numericPrice ?? 0).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border font-bold text-xs">
                <span className="text-foreground">{t("organizations.billing_net_payable")}</span>
                <span className="font-mono text-primary text-sm">
                  Rp {(prorateData?.netPayableDelta ?? selectedPlanTarget.numericPrice ?? 0).toLocaleString("id-ID")}
                </span>
              </div>
            </>
          )}
        </div>

        {!isDowngradeMode && (
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-foreground">{t("organizations.billing_po_ref_label")}</Label>
            <Input
              placeholder={t("organizations.billing_po_ref_placeholder")}
              value={upgradeNotes}
              onChange={(e) => setUpgradeNotes(e.target.value)}
              className="h-8 text-xs bg-card border-border text-foreground"
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-4 border-t border-border/60">
        <Button
          size="sm"
          disabled={isSubmitDisabled}
          onClick={isDowngradeMode ? onExecuteDowngrade : onExecuteUpgrade}
          className="w-full text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-8 gap-1.5 shadow-xs cursor-pointer"
        >
          {isExecuting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isDowngradeMode ? (
            t("organizations.billing_execute_downgrade")
          ) : (
            t("organizations.billing_activate_upgrade_now")
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="w-full text-xs text-muted-foreground hover:text-foreground h-7 cursor-pointer"
        >
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  );
}

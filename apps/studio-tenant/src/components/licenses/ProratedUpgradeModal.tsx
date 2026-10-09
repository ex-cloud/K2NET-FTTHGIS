import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Badge,
  Card,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import {
  Zap,
  ArrowRight,
  Sparkles,
  CreditCard,
  Loader2,
  Clock,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { useProrateEstimate } from "../../hooks/useTenantLicense";

interface ProratedUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetPlan: string | null;
  onConfirmCheckout: (targetPlan: string) => Promise<void>;
  isCheckingOut: boolean;
}

export function ProratedUpgradeModal({
  open,
  onOpenChange,
  targetPlan,
  onConfirmCheckout,
  isCheckingOut,
}: ProratedUpgradeModalProps) {
  const { t, formatCurrency } = useTranslation();
  const { data: estimate, isLoading } = useProrateEstimate(open ? targetPlan : null);

  const handleCheckout = async () => {
    if (!targetPlan) return;
    await onConfirmCheckout(targetPlan);
  };

  const currentPrice = estimate?.currentPlanPrice ?? 0;
  const targetPrice = estimate?.targetPlanPrice ?? 0;
  const credit = estimate?.proratedCredit ?? 0;
  const netDue = estimate?.netDueAmount ?? targetPrice;
  const daysLeft = estimate?.daysRemaining ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border/80 p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/80 bg-muted/30 text-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground tracking-tight">
                  {t("billing.prorate_modal_title")}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {t("billing.prorate_modal_desc")}
                </DialogDescription>
              </div>
            </div>
            <Badge variant="outline" className="border-border bg-muted/30 text-[10px] text-foreground font-mono">
              {targetPlan}
            </Badge>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-xs">{t("billing.calculating_prorate")}</span>
            </div>
          ) : (
            <>
              {/* Plan Comparison Strip */}
              <div className="grid grid-cols-2 gap-3 items-center">
                <Card className="p-3 bg-muted/15 border-border/70 flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    {t("billing.current_plan")}
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">
                      {estimate?.currentPlan || "STARTER"}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {formatCurrency(currentPrice)}
                    </span>
                  </div>
                  {daysLeft > 0 ? (
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1 font-mono">
                      <Clock className="h-3 w-3" />
                      <span>{t("billing.days_remaining_label", { count: daysLeft })}</span>
                    </div>
                  ) : null}
                </Card>

                <Card className="p-3 bg-muted/25 border-foreground/30 ring-1 ring-foreground/10 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-foreground tracking-wider flex items-center gap-1">
                      <Zap className="h-3 w-3 text-primary" />
                      {t("billing.target_plan")}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">
                      {targetPlan}
                    </span>
                    <span className="text-xs font-mono font-semibold text-foreground">
                      {formatCurrency(targetPrice)}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1">
                    {t("billing.full_month_entitlement")}
                  </span>
                </Card>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="rounded-lg border border-border/80 bg-background p-4 space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  {t("billing.price_breakdown_title")}
                </span>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t("billing.base_target_price", { plan: targetPlan || "" })}</span>
                  <span className="font-mono text-foreground">{formatCurrency(targetPrice)}</span>
                </div>

                {credit > 0 ? (
                  <div className="flex items-center justify-between text-xs text-foreground bg-muted/20 -mx-2 px-2 py-1 rounded">
                    <div className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-primary" />
                      <span>{t("billing.prorated_credit_label", { count: daysLeft })}</span>
                    </div>
                    <span className="font-mono font-semibold text-primary">
                      - {formatCurrency(credit)}
                    </span>
                  </div>
                ) : null}

                <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      {t("billing.net_due_today")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {t("billing.tax_inclusive_notice")}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold font-mono text-foreground block">
                      {formatCurrency(netDue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reassurance Notice */}
              <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-muted/15 p-3 rounded-lg border border-border/60">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {t("billing.checkout_reassurance_desc")}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="flex items-center justify-end gap-2 p-4 border-t border-border/60 bg-muted/10">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isCheckingOut}
            className="h-7 px-2.5 text-xs font-medium rounded-md border-border/80 cursor-pointer"
          >
            {t("common.cancel")}
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleCheckout}
            disabled={isCheckingOut || isLoading}
            className="h-7 px-2.5 text-xs font-medium gap-1.5 rounded-md shadow-xs bg-foreground text-background hover:bg-foreground/90 cursor-pointer"
          >
            {isCheckingOut ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{t("billing.generating_invoice")}</span>
              </>
            ) : (
              <>
                <CreditCard className="h-3.5 w-3.5" />
                <span>{t("billing.confirm_and_pay_xendit")}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

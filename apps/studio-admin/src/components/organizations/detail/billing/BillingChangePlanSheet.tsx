import * as React from "react";
import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@k2net/ui";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { SubscriptionPlanInfo } from "./billing-types";
import { BillingPlanLoadingSkeleton } from "./BillingPlanLoadingSkeleton";
import { BillingPlanErrorState } from "./BillingPlanErrorState";
import { BillingTopPlanCard } from "./BillingTopPlanCard";
import { BillingEnterprisePlanCard } from "./BillingEnterprisePlanCard";

interface BillingChangePlanSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orgName: string;
  currentTier: string;
  currentPlanCode?: string;
  availablePlans: SubscriptionPlanInfo[];
  plansLoading: boolean;
  plansError?: string | null;
  onRetryPlans?: () => void;
  onSelectPlan: (plan: SubscriptionPlanInfo) => void;
}

export function BillingChangePlanSheet({
  isOpen,
  onOpenChange,
  orgName,
  currentTier,
  currentPlanCode,
  availablePlans,
  plansLoading,
  plansError,
  onRetryPlans,
  onSelectPlan,
}: BillingChangePlanSheetProps) {
  const isPlanCurrent = (plan: SubscriptionPlanInfo) => {
    const normPlanCode = plan.code.toLowerCase().trim();
    const normPlanName = plan.name.toLowerCase().trim();
    const normCurrentTier = currentTier.toLowerCase().trim();
    const normCurrentCode = (currentPlanCode || "").toLowerCase().trim();

    if (normCurrentCode && (normPlanCode === normCurrentCode || normPlanName === normCurrentCode)) {
      return true;
    }
    if (normPlanCode === normCurrentTier || normPlanName === normCurrentTier) {
      return true;
    }
    if (
      (normPlanCode === "free" || normPlanName === "free") &&
      (normCurrentTier.includes("free") || normCurrentTier.includes("trial"))
    ) {
      return true;
    }
    if (
      (normPlanCode === "starter" || normPlanName === "starter") &&
      normCurrentTier.includes("starter")
    ) {
      return true;
    }
    if (
      (normPlanCode === "pro" || normPlanName === "pro" || normPlanName === "professional") &&
      (normCurrentTier.includes("pro") || normCurrentTier.includes("professional"))
    ) {
      return true;
    }
    if (
      (normPlanCode === "enterprise" || normPlanName === "enterprise") &&
      normCurrentTier.includes("enterprise")
    ) {
      return true;
    }
    return false;
  };

  const currentPlanObj = availablePlans.find((p) => isPlanCurrent(p));
  const currentPrice = currentPlanObj ? currentPlanObj.numericPrice : 0;

  // Split into Top 3 Cards (Free, Starter, Pro) and Bottom 1 Card (Enterprise)
  const topPlans = availablePlans.filter(
    (p) => p.code.toUpperCase() !== "ENTERPRISE" && p.name.toUpperCase() !== "ENTERPRISE"
  );
  const enterprisePlan = availablePlans.find(
    (p) => p.code.toUpperCase() === "ENTERPRISE" || p.name.toUpperCase() === "ENTERPRISE"
  );

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-[96vw] sm:max-w-[900px] xl:max-w-[900px] flex flex-col p-0 bg-card/95 backdrop-blur-2xl border-l border-border h-full overflow-hidden"
      >
        {/* Top Header - Fixed Sleek Supabase Style with Groove Seam */}
        <div className="flex items-center justify-between px-6 py-3.5 border-groove-b shrink-0 bg-card/80 backdrop-blur-md">
          <SheetHeader className="p-0 space-y-0 text-left">
            <SheetTitle className="text-sm font-semibold text-foreground tracking-tight">
              Change subscription plan for {orgName}
            </SheetTitle>
          </SheetHeader>

          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.info("Membuka halaman dokumentasi dan perbandingan harga paket K2NET.")}
            className="h-7.5 px-3 text-xs border-border/80 bg-card/60 hover:bg-muted text-foreground font-medium gap-1.5 cursor-pointer rounded-md shadow-2xs transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Pricing</span>
          </Button>
        </div>

        {/* Middle Body - Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5">
          {plansLoading ? (
            <BillingPlanLoadingSkeleton />
          ) : plansError || availablePlans.length === 0 ? (
            <BillingPlanErrorState onRetry={onRetryPlans} />
          ) : (
            <div className="space-y-4">
              {/* Top 3 Cards Grid (Free, Starter, Pro) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {topPlans.map((plan) => {
                  const isCurrent = isPlanCurrent(plan);
                  const isDowngrade = !isCurrent && plan.numericPrice < currentPrice;

                  return (
                    <BillingTopPlanCard
                      key={plan.name}
                      plan={plan}
                      isCurrent={isCurrent}
                      isDowngrade={isDowngrade}
                      onSelectPlan={onSelectPlan}
                    />
                  );
                })}
              </div>

              {/* Bottom Card 4: Enterprise Plan (Landscape / Collapsible) */}
              {enterprisePlan && (
                <BillingEnterprisePlanCard
                  plan={enterprisePlan}
                  isCurrent={isPlanCurrent(enterprisePlan)}
                  isDowngrade={
                    !isPlanCurrent(enterprisePlan) && enterprisePlan.numericPrice < currentPrice
                  }
                  onSelectPlan={onSelectPlan}
                />
              )}
            </div>
          )}
        </div>

        {/* Bottom Footer - Fixed Sleek Trust & FAQ Bar with Groove Seam */}
        <div className="px-6 py-3 border-groove-t bg-card/95 backdrop-blur-xl shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>Pembayaran aman via Virtual Account Bank, QRIS, & Kartu Kredit Korporat.</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => toast.info("Faktur diterbitkan otomatis setiap awal siklus penagihan.")}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              FAQ Penagihan
            </button>
            <span className="text-muted-foreground/40">•</span>
            <button
              type="button"
              onClick={() => toast.info("Jaminan SLA 99.5% - 99.9% dan kuota perangkat FTTH terisolasi.")}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Kebijakan SLA & Kuota
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

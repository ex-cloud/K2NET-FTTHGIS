

import React from "react";
import {
  Badge,
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@k2net/ui";
import { Check, Loader2, AlertTriangle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import type { SubscriptionPlanInfo } from "./billing-types";

interface BillingChangePlanSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orgName: string;
  currentTier: string;
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
  availablePlans,
  plansLoading,
  plansError,
  onRetryPlans,
  onSelectPlan,
}: BillingChangePlanSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[95vw] sm:max-w-[950px] xl:max-w-[1100px] overflow-y-auto bg-card/95 backdrop-blur-2xl border-l border-border p-6 md:p-8 space-y-6"
      >
        <SheetHeader className="space-y-1 text-left">
          <SheetTitle className="text-lg font-bold text-foreground">
            Change subscription plan for {orgName}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Pilih tier paket langganan yang sesuai dengan skala jaringan ISP dan kebutuhan kuota operasional Anda.
          </SheetDescription>
        </SheetHeader>

        {plansLoading ? (
          /* Sleek Skeleton Cards while loading */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="rounded-xl border border-border bg-card/40 p-5 space-y-4 animate-pulse h-[340px] flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-3 w-full bg-muted/60 rounded" />
                  <div className="h-7 w-32 bg-muted rounded my-2" />
                  <div className="h-8 w-full bg-muted/80 rounded" />
                  <div className="space-y-2 pt-3">
                    <div className="h-3 w-full bg-muted/50 rounded" />
                    <div className="h-3 w-4/5 bg-muted/50 rounded" />
                    <div className="h-3 w-3/4 bg-muted/50 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : plansError || availablePlans.length === 0 ? (
          /* Friendly Error / Retry state */
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 text-center space-y-3">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-amber-500/20 text-amber-500">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
            <div className="space-y-1">
              <h5 className="text-sm font-bold text-foreground">Gagal memuat paket dari server</h5>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Terjadi kendala saat menghubungkan ke database paket langganan. Silakan coba muat ulang data paket.
              </p>
            </div>
            {onRetryPlans && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetryPlans}
                className="text-xs border-amber-500/40 bg-card hover:bg-amber-500/20 text-foreground font-semibold gap-1.5 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Coba Lagi</span>
              </Button>
            )}
          </div>
        ) : (
          /* Dynamic Plans Grid */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {availablePlans.map((plan) => {
              const currentPlanObj = availablePlans.find(
                (p) =>
                  p.name.toLowerCase() === currentTier.toLowerCase() ||
                  p.code.toLowerCase() === currentTier.toLowerCase()
              );
              const currentPrice = currentPlanObj ? currentPlanObj.numericPrice : 0;

              const isCurrent =
                plan.name.toLowerCase() === currentTier.toLowerCase() ||
                plan.code.toLowerCase() === currentTier.toLowerCase();
              const isDowngrade = !isCurrent && plan.numericPrice < currentPrice;

              return (
                <div
                  key={plan.name}
                  className={`relative rounded-xl border p-4.5 flex flex-col justify-between transition-all ${
                    isCurrent
                      ? "border-primary bg-primary/5 ring-1 ring-primary/40 shadow-sm"
                      : "border-border bg-card/60 hover:border-border hover:bg-card/90"
                  }`}
                >
                  {plan.popular && !isCurrent && (
                    <div className="absolute -top-2.5 right-3 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full font-mono shadow-xs">
                      MOST POPULAR
                    </div>
                  )}

                  {isCurrent && (
                    <div className="absolute -top-2.5 right-3 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full font-mono shadow-xs">
                      CURRENT PLAN
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <h5 className="text-sm font-bold text-foreground">{plan.name.toUpperCase()}</h5>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{plan.description}</p>
                    </div>

                    <div className="flex items-baseline gap-1 py-1">
                      <span className="text-xl font-extrabold font-mono text-foreground">{plan.price}</span>
                      <span className="text-xs text-muted-foreground font-mono">{plan.period}</span>
                    </div>

                    {/* Plan Action Button */}
                    <Button
                      size="sm"
                      disabled={isCurrent}
                      onClick={() => onSelectPlan(plan)}
                      className={`w-full text-xs font-semibold h-8 cursor-pointer ${
                        isCurrent
                          ? "bg-muted text-muted-foreground border border-border"
                          : isDowngrade
                          ? "bg-muted hover:bg-muted/80 text-foreground border border-border"
                          : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                      }`}
                    >
                      {isCurrent ? (
                        "Current plan"
                      ) : isDowngrade ? (
                        `Downgrade to ${plan.name}`
                      ) : (
                        `Upgrade to ${plan.name}`
                      )}
                    </Button>

                    {/* Feature bullet points */}
                    <div className="space-y-2 pt-3 border-t border-border/60">
                      {plan.features.map((feat) => (
                        <div key={feat.title} className="flex items-start gap-2 text-xs text-foreground/90">
                          <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold block text-[11px] text-foreground">{feat.title}</span>
                            <span className="text-[10px] text-muted-foreground block">{feat.detail}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Enterprise Custom Banner (Supabase-Style) */}
        <div className="rounded-xl border border-border bg-card/60 p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-indigo-500/40 bg-indigo-500/10 text-indigo-400 font-mono text-[10px] font-bold">
                ENTERPRISE CUSTOM
              </Badge>
              <h5 className="text-xs font-bold text-foreground">Untuk Infrastruktur ISP Skala Besar (&gt;50 OLT)</h5>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Dukungan dedicated database PostgreSQL cluster, kustomisasi poller SNMP multi-datacenter, dan on-premise deployment.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.info("Silakan hubungi K2NET Enterprise Solution Team.")}
            className="h-7 text-xs border-border bg-card hover:bg-muted text-foreground shrink-0 font-medium cursor-pointer"
          >
            Contact Us
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

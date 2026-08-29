"use client";

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
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { SubscriptionPlanInfo } from "./billing-types";

interface BillingChangePlanSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orgName: string;
  currentTier: string;
  availablePlans: SubscriptionPlanInfo[];
  plansLoading: boolean;
  onSelectPlan: (plan: SubscriptionPlanInfo) => void;
}

export function BillingChangePlanSheet({
  isOpen,
  onOpenChange,
  orgName,
  currentTier,
  availablePlans,
  plansLoading,
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
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-xs font-mono">Memuat daftar paket dari database...</span>
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

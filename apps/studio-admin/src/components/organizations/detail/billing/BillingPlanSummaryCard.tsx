"use client";

import React from "react";
import { Badge, Button } from "@k2net/ui";
import { CreditCard } from "lucide-react";
import type { SubscriptionSummary } from "./billing-types";

interface BillingPlanSummaryCardProps {
  currentTier: string;
  summary: SubscriptionSummary | null;
  orgStatus: string;
  effectiveMaxOlts: number;
  effectiveMaxOdps: number;
  maxStorageGb: number;
  onOpenChangePlan: () => void;
}

export function BillingPlanSummaryCard({
  currentTier,
  summary,
  orgStatus,
  effectiveMaxOlts,
  effectiveMaxOdps,
  maxStorageGb,
  onOpenChangePlan,
}: BillingPlanSummaryCardProps) {
  const priceNum = summary?.planPrice !== undefined ? Number(summary.planPrice) : 0;
  const formattedPrice = priceNum > 0 ? `Rp ${priceNum.toLocaleString("id-ID")}` : "Free Trial";

  // Dynamic next invoice date: 1st of next month
  const nextInvoiceDate = new Date();
  nextInvoiceDate.setMonth(nextInvoiceDate.getMonth() + 1);
  nextInvoiceDate.setDate(1);
  const nextInvoiceStr = nextInvoiceDate.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
      <div className="lg:col-span-4 space-y-1">
        <h4 className="text-sm font-bold text-foreground">Subscription Plan</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Setiap organisasi memiliki paket langganan, siklus penagihan, metode pembayaran, dan kuota aset tersendiri.
        </p>
      </div>

      <div className="lg:col-span-8">
        <div className="rounded-xl border border-border bg-card/80 p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/70">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h5 className="text-base font-extrabold text-foreground">{currentTier} Plan</h5>
                <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-[10px] font-mono">
                  {summary?.status || orgStatus}
                </Badge>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold font-mono text-foreground">{formattedPrice}</span>
                {priceNum > 0 && <span className="text-xs text-muted-foreground font-mono">/ bulan</span>}
              </div>
            </div>

            {/* Primary Action: Change Subscription Plan */}
            <Button
              size="sm"
              onClick={onOpenChangePlan}
              className="h-8 px-3.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-xs cursor-pointer"
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Change subscription plan</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground font-mono pt-1">
            <div>
              <span className="text-[10px] uppercase font-bold text-foreground/75 dark:text-muted-foreground block">
                Maksimal Hardware
              </span>
              <span className="font-semibold text-foreground">
                {effectiveMaxOlts} OLT · {effectiveMaxOdps.toLocaleString("id-ID")} ODP
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-foreground/75 dark:text-muted-foreground block">
                Penyimpanan MinIO
              </span>
              <span className="font-semibold text-foreground">{maxStorageGb} GB Dedicated S3</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-foreground/75 dark:text-muted-foreground block">
                Siklus Tagihan
              </span>
              <span className="font-semibold text-foreground">Bulanan ({nextInvoiceStr})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

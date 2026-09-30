import * as React from "react";
import { Badge, Button, ActionTooltip } from "@k2net/ui";
import { CreditCard } from "lucide-react";
import { useTranslation } from "@k2net/i18n";
import { usePermissions } from "@/hooks/use-permissions";
import type { SubscriptionSummary } from "./billing-types";

interface BillingPlanSummaryCardProps {
  currentTier: string;
  summary: SubscriptionSummary | null;
  orgStatus: string;
  effectiveMaxOlts: number;
  effectiveMaxOdps: number;
  maxStorageGb: number;
  isLoading?: boolean;
  onOpenChangePlan: () => void;
}

export function BillingPlanSummaryCard({
  currentTier,
  summary,
  orgStatus,
  effectiveMaxOlts,
  effectiveMaxOdps,
  maxStorageGb,
  isLoading = false,
  onOpenChangePlan,
}: BillingPlanSummaryCardProps) {
  const { t, formatCurrency, formatNumber, formatDate } = useTranslation();
  const { canAccess } = usePermissions();
  const canManageBilling = canAccess(["system.organizations.manage", "system.billing.manage"]);
  const priceNum = Number(summary?.planPrice || 0);
  const formattedPrice =
    isLoading
      ? "—"
      : priceNum > 0
      ? formatCurrency(priceNum)
      : summary?.planPrice !== undefined
      ? t("billing.free_trial")
      : "—";

  // Dynamic next invoice date: 1st of next month
  const nextInvoiceDate = new Date();
  nextInvoiceDate.setMonth(nextInvoiceDate.getMonth() + 1);
  nextInvoiceDate.setDate(1);
  const nextInvoiceStr = formatDate(nextInvoiceDate);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
      <div className="lg:col-span-4 space-y-1">
        <h4 className="text-sm font-bold text-foreground">{t("billing.title")}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t("billing.subtitle")}
        </p>
      </div>

      <div className="lg:col-span-8">
        <div className="rounded-xl border border-border bg-card/80 p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/70">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <div className="h-5 w-36 bg-muted animate-pulse rounded" />
                ) : (
                  <>
                    <h5 className="text-base font-extrabold text-foreground">{currentTier} Plan</h5>
                    <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-[10px] font-mono">
                      {summary?.status || orgStatus}
                    </Badge>
                  </>
                )}
              </div>
              <div className="flex items-baseline gap-1">
                {isLoading ? (
                  <div className="h-6 w-24 bg-muted animate-pulse rounded my-0.5" />
                ) : (
                  <>
                    <span className="text-lg font-bold font-mono text-foreground">{formattedPrice}</span>
                    {priceNum > 0 && <span className="text-xs text-muted-foreground font-mono">{t("billing.per_month")}</span>}
                  </>
                )}
              </div>
            </div>

            {/* Primary Action: Change Subscription Plan */}
            <ActionTooltip
              label={
                canManageBilling
                  ? t("billing.change_plan")
                  : "Akses Read-Only: Memerlukan izin system.organizations.manage"
              }
            >
              <Button
                size="sm"
                onClick={onOpenChangePlan}
                disabled={isLoading || !canManageBilling}
                className="h-8 px-3.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>{t("billing.change_plan")}</span>
              </Button>
            </ActionTooltip>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground font-mono pt-1">
            <div>
              <span className="text-[10px] uppercase font-bold text-foreground/75 dark:text-muted-foreground block">
                {t("billing.max_hardware")}
              </span>
              <span className="font-semibold text-foreground">
                {isLoading ? "—" : `${effectiveMaxOlts} OLT · ${formatNumber(effectiveMaxOdps)} ODP`}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-foreground/75 dark:text-muted-foreground block">
                {t("billing.minio_storage")}
              </span>
              <span className="font-semibold text-foreground">
                {isLoading ? "—" : `${maxStorageGb} GB Dedicated S3`}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-foreground/75 dark:text-muted-foreground block">
                {t("billing.billing_cycle")}
              </span>
              <span className="font-semibold text-foreground">
                {isLoading ? "—" : `${t("billing.monthly")} (${nextInvoiceStr})`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

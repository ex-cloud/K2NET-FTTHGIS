import * as React from "react";
import { useTranslation } from "@k2net/i18n";
import { AlertCircle, Lock } from "lucide-react";
import type { ProrateEstimateResponse } from "@/hooks/useOrganizationLicenses";

export interface ChangePlanStepProrationProps {
  estimate?: ProrateEstimateResponse;
  isEstimating: boolean;
  estimateError?: unknown;
  isDirectOverride: boolean;
  setIsDirectOverride: (override: boolean) => void;
  notes: string;
  setNotes: (notes: string) => void;
  formatIdr: (val?: number) => string;
}

export function ChangePlanStepProration({
  estimate,
  isEstimating,
  estimateError,
  isDirectOverride,
  setIsDirectOverride,
  notes,
  setNotes,
  formatIdr,
}: ChangePlanStepProrationProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {t("billing.wizard_step_2_desc")}
      </p>

      {isEstimating ? (
        <div className="space-y-3 py-6 animate-pulse">
          <div className="h-6 bg-muted/40 rounded w-1/3" />
          <div className="h-20 bg-muted/20 rounded" />
        </div>
      ) : estimateError ? (
        <div className="flex items-start gap-2.5 text-muted-foreground text-xs p-4 rounded-md border border-border/70 bg-muted/10">
          <AlertCircle className="size-4 shrink-0 text-amber-500 mt-0.5" />
          <p>{t("license.prorate.no_active_license_warning")}</p>
        </div>
      ) : estimate ? (
        <div className="space-y-3">
          {/* Proration Accounting Box */}
          <div className="border border-border/70 rounded-lg p-3.5 bg-muted/15 space-y-2.5 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>{t("license.prorate.days_remaining")}</span>
              <span className="font-mono font-medium text-foreground">
                {estimate.daysRemaining} / {estimate.totalCycleDays} {t("common.days").toLowerCase()}
              </span>
            </div>

            <div className="flex justify-between text-muted-foreground">
              <span>{t("license.prorate.daily_rate_old")}</span>
              <span className="font-mono font-medium text-foreground">
                {formatIdr(estimate.dailyRateOld)} / {t("common.day").toLowerCase()}
              </span>
            </div>

            <div className="flex justify-between text-muted-foreground">
              <span>{t("license.prorate.prorated_credit")}</span>
              <span className="font-mono font-semibold text-primary">
                - {formatIdr(estimate.proratedCredit)}
              </span>
            </div>

            <div className="flex justify-between text-muted-foreground">
              <span>{t("billing.target_plan")} ({estimate.targetPlan})</span>
              <span className="font-mono font-medium text-foreground">
                {formatIdr(estimate.targetPlanPrice)}
              </span>
            </div>

            {/* Net Highlight */}
            <div className="pt-2.5 mt-2 border-t border-border flex items-baseline justify-between">
              <div>
                <span className="text-xs font-bold text-foreground block">
                  {t("license.prorate.net_amount_due")}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Tax exclusive · Pro-rata applied
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
                  {formatIdr(estimate.netDueAmount)}
                </span>
                <span className="text-[10px] text-muted-foreground ml-1">IDR</span>
              </div>
            </div>
          </div>

          {/* Administrative Controls */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border/70 bg-card">
              <input
                type="checkbox"
                id="direct-override-checkbox"
                checked={isDirectOverride}
                onChange={(e) => setIsDirectOverride(e.target.checked)}
                className="mt-0.5 rounded border-border text-primary focus:ring-primary size-4 cursor-pointer"
              />
              <label htmlFor="direct-override-checkbox" className="text-xs space-y-0.5 cursor-pointer">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Lock className="size-3 text-primary" />
                  {t("billing.direct_override_label")}
                </span>
                <p className="text-[11px] text-muted-foreground">
                  {t("billing.direct_override_desc")}
                </p>
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {t("billing.admin_notes_label")}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("billing.admin_notes_placeholder")}
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-1 focus:ring-border"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

import * as React from "react";
import { Badge } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { ProrateEstimateResponse } from "@/hooks/useOrganizationLicenses";
import type { TenantSubscriptionItem } from "@/hooks/useBillingSubscriptions";

export interface ChangePlanStepConfirmationProps {
  subscription?: TenantSubscriptionItem | null;
  targetPlan: string;
  targetCycle: "MONTHLY" | "YEARLY";
  estimate?: ProrateEstimateResponse;
  notes: string;
  isAgreed: boolean;
  setIsAgreed: (agreed: boolean) => void;
  formatIdr: (val?: number) => string;
}

export function ChangePlanStepConfirmation({
  subscription,
  targetPlan,
  targetCycle,
  estimate,
  notes,
  isAgreed,
  setIsAgreed,
  formatIdr,
}: ChangePlanStepConfirmationProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {t("billing.wizard_step_3_desc")}
      </p>

      {/* Summary Card */}
      <div className="p-4 rounded-lg border border-border/80 bg-muted/20 space-y-3 text-xs">
        <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
          <span className="text-muted-foreground">{t("billing.table_header_tenant")}:</span>
          <span className="font-semibold text-foreground font-mono">
            {subscription?.organizationName} ({subscription?.organizationSlug})
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t("billing.target_plan")}:</span>
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-foreground">
            <span>{subscription?.planName}</span>
            <ArrowRight className="size-3 text-muted-foreground" />
            <span className="text-primary">{targetPlan}</span>
            <Badge variant="outline" className="text-[9px] font-mono ml-1">
              {targetCycle}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t("license.prorate.net_amount_due")}:</span>
          <span className="font-mono font-bold text-foreground text-sm">
            {formatIdr(estimate?.netDueAmount)} IDR
          </span>
        </div>

        {notes && (
          <div className="flex items-center justify-between pt-1 text-[11px]">
            <span className="text-muted-foreground">{t("billing.admin_notes_label")}:</span>
            <span className="font-mono text-foreground">{notes}</span>
          </div>
        )}
      </div>

      {/* Transition Impact Checklist */}
      <div className="space-y-2 p-3.5 rounded-lg border border-border/60 bg-muted/10 text-xs">
        <span className="text-[10px] font-mono uppercase text-muted-foreground font-semibold">
          {t("billing.system_automation_title")}
        </span>
        <ul className="space-y-1.5 text-[11px] text-muted-foreground pt-1">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-primary shrink-0" />
            <span>{t("billing.impact_instant_quota")}</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-primary shrink-0" />
            <span>{t("billing.impact_keycloak_sync")}</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-primary shrink-0" />
            <span>{t("billing.impact_crypto_license")}</span>
          </li>
        </ul>
      </div>

      {/* Legal Confirmation Agreement */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg border border-primary/30 bg-primary/5">
        <input
          type="checkbox"
          id="agreement-checkbox"
          checked={isAgreed}
          onChange={(e) => setIsAgreed(e.target.checked)}
          className="mt-0.5 rounded border-border text-primary focus:ring-primary size-4 cursor-pointer"
        />
        <label htmlFor="agreement-checkbox" className="text-xs text-foreground font-medium cursor-pointer">
          {t("billing.agreement_confirm")}
        </label>
      </div>
    </div>
  );
}

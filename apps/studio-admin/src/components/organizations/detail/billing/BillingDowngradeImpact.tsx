import {
  DialogTitle,
  DialogDescription,
  Input,
  Label,
  Checkbox,
} from "@k2net/ui";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "@k2net/i18n";
import type { SubscriptionPlanInfo } from "./billing-types";

interface BillingDowngradeImpactProps {
  selectedPlanTarget: SubscriptionPlanInfo;
  usedOlts: number;
  usedOdps: number;
  downgradeReason: string;
  setDowngradeReason: (v: string) => void;
  ackOverQuota: boolean;
  setAckOverQuota: (v: boolean) => void;
}

export function BillingDowngradeImpact({
  selectedPlanTarget,
  usedOlts,
  usedOdps,
  downgradeReason,
  setDowngradeReason,
  ackOverQuota,
  setAckOverQuota,
}: BillingDowngradeImpactProps) {
  const { t } = useTranslation();
  const isOltsOver = usedOlts > selectedPlanTarget.maxOlts;
  const isOdpsOver = usedOdps > selectedPlanTarget.maxOdps;

  return (
    <>
      <div className="space-y-1.5">
        <DialogTitle className="text-base font-bold text-amber-500 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <span>{t("billing.downgrade_impact_title", { planName: selectedPlanTarget.name })}</span>
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          {t("billing.downgrade_impact_desc")}
        </DialogDescription>
      </div>

      {/* Impact comparison table */}
      <div className="rounded-xl border border-border bg-card p-3 space-y-2 text-xs">
        <div className="flex items-center justify-between font-mono pb-1 border-b border-border text-[11px]">
          <span className="text-muted-foreground">{t("billing.downgrade_col_resource")}</span>
          <span>{t("billing.downgrade_col_capacity")}</span>
        </div>
        <div className="flex items-center justify-between font-mono">
          <span className="text-foreground">{t("billing.downgrade_olt_device")}</span>
          <span className={isOltsOver ? "text-amber-500 font-bold" : "text-foreground"}>
            {usedOlts} / {selectedPlanTarget.maxOlts} OLT {isOltsOver ? t("billing.downgrade_over_quota") : "✓"}
          </span>
        </div>
        <div className="flex items-center justify-between font-mono">
          <span className="text-foreground">{t("billing.downgrade_odp_node")}</span>
          <span className={isOdpsOver ? "text-amber-500 font-bold" : "text-foreground"}>
            {usedOdps.toLocaleString()} / {selectedPlanTarget.maxOdps.toLocaleString()} ODP {isOdpsOver ? t("billing.downgrade_over_quota") : "✓"}
          </span>
        </div>
      </div>

      {/* Protection Notice */}
      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-muted-foreground leading-relaxed">
        <strong className="text-foreground block mb-0.5">🛡️ {t("billing.downgrade_policy_title")}</strong>
        {t("billing.downgrade_policy_desc", { olts: usedOlts, odps: usedOdps })}
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-semibold text-foreground">{t("billing.downgrade_reason_label")}</Label>
        <Input
          placeholder={t("billing.downgrade_reason_placeholder")}
          value={downgradeReason}
          onChange={(e) => setDowngradeReason(e.target.value)}
          className="h-8 text-xs bg-card border-border text-foreground"
        />
      </div>

      <div className="flex items-start gap-2 pt-1">
        <Checkbox
          id="ack-overquota-split-modal"
          checked={ackOverQuota}
          onCheckedChange={(c: boolean) => setAckOverQuota(!!c)}
        />
        <Label htmlFor="ack-overquota-split-modal" className="text-[11px] text-muted-foreground leading-tight cursor-pointer">
          {t("billing.downgrade_ack_label")}
        </Label>
      </div>
    </>
  );
}

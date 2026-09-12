import { DialogTitle } from "@k2net/ui";
import { Check } from "lucide-react";
import type { SubscriptionPlanInfo } from "./billing-types";

interface BillingUpgradeFeaturesProps {
  orgName: string;
  selectedPlanTarget: SubscriptionPlanInfo;
}

export function BillingUpgradeFeatures({
  orgName,
  selectedPlanTarget,
}: BillingUpgradeFeaturesProps) {
  return (
    <>
      <div className="space-y-1.5">
        <DialogTitle className="text-base font-bold text-foreground leading-snug">
          Upgrade {orgName} to the {selectedPlanTarget.name} plan to unlock more spatial compute resources, AI diagnostics, daily backups, and SLA support.
        </DialogTitle>
        <p className="text-xs text-muted-foreground">
          Upgrade features &amp; Included Quotas
        </p>
      </div>

      <div className="space-y-3 pt-1">
        {selectedPlanTarget.features.map((feat) => (
          <div key={feat.title} className="flex items-start gap-2.5 text-xs">
            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground block text-xs">{feat.title}</span>
              <span className="text-[11px] text-muted-foreground block">{feat.detail}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-[11px] text-muted-foreground leading-relaxed">
        ✨ Begitu diaktivasi, semua batas kuota dan fitur premium langsung terbuka saat itu juga (*Instant Unfreeze*).
      </div>
    </>
  );
}

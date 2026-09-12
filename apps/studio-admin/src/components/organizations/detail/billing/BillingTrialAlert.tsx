import { Button } from "@k2net/ui";
import { Clock } from "lucide-react";
import type { TenantSubscriptionSummary } from "@/hooks/useTenantSubscription";

interface BillingTrialAlertProps {
  status: string;
  summary: TenantSubscriptionSummary | null;
  onExtendTrial: (days: number) => void;
}

export function BillingTrialAlert({
  status,
  summary,
  onExtendTrial,
}: BillingTrialAlertProps) {
  if (status !== "TRIAL" && !summary?.trialExpiresAt) {
    return null;
  }

  return (
    <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2.5">
        <Clock className="h-4 w-4 text-amber-500 shrink-0" />
        <div>
          <span className="font-bold text-foreground">Status Masa Uji Coba (Starter Trial): </span>
          <span className="text-foreground/80">
            {summary?.isTrialExpired
              ? "Masa trial telah kedaluwarsa. Sistem berada pada masa tenggang akses terbatas."
              : `Sisa ${summary?.trialDaysRemaining ?? 7} hari masa evaluasi.`}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 self-end sm:self-center">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onExtendTrial(7)}
          className="h-7 text-xs border-amber-500/40 bg-card hover:bg-amber-500/20 text-foreground font-medium cursor-pointer"
        >
          +7 Hari Trial
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onExtendTrial(14)}
          className="h-7 text-xs border-amber-500/40 bg-card hover:bg-amber-500/20 text-foreground font-medium cursor-pointer"
        >
          +14 Hari Trial
        </Button>
      </div>
    </div>
  );
}

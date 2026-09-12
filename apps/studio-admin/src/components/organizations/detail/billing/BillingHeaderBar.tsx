import { Badge, Button } from "@k2net/ui";
import { CreditCard, Zap, AlertTriangle, ShieldAlert } from "lucide-react";
import type { TenantSubscriptionSummary } from "@/hooks/useTenantSubscription";

interface BillingHeaderBarProps {
  currentTier: string;
  summary: TenantSubscriptionSummary | null;
  onOpenDunningModal: () => void;
}

export function BillingHeaderBar({
  currentTier,
  summary,
  onOpenDunningModal,
}: BillingHeaderBarProps) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Tata Kelola Paket Langganan &amp; Billing</h3>
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-mono text-[10px] font-bold">
            {currentTier.toUpperCase()} PLAN
          </Badge>

          {summary?.isBoosterActive && (
            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-500 font-mono text-[10px] gap-1">
              <Zap className="h-3 w-3" />
              <span>BOOSTER +{summary.boosterOdps} ODP ({summary.boosterDaysRemaining} Hari Sisa)</span>
            </Badge>
          )}

          {summary?.isOverQuota && (
            <Badge variant="destructive" className="font-mono text-[10px] gap-1">
              <AlertTriangle className="h-3 w-3" />
              <span>OVER_QUOTA (Read-Only Mode)</span>
            </Badge>
          )}

          {summary?.dunningLevel !== undefined && summary.dunningLevel > 0 && (
            <Badge variant="destructive" className="font-mono text-[10px] gap-1">
              <ShieldAlert className="h-3 w-3" />
              <span>OVERDUE (Level {summary.dunningLevel})</span>
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Kelola tier paket langganan, kalkulasi prorata upgrade, dan kontrol status dunning organisasi.
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant="outline"
          onClick={onOpenDunningModal}
          className="h-8 px-3 text-xs font-medium border-border text-foreground hover:bg-muted/50 gap-1.5 cursor-pointer"
        >
          <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
          <span>Kontrol Dunning</span>
        </Button>
      </div>
    </div>
  );
}

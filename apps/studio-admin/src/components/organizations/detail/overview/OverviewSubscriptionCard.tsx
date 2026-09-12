import { Badge, Button, Card } from "@k2net/ui";
import { CreditCard } from "lucide-react";
import type { EnrichedOrganization } from "../../types";
import type { TenantSubscriptionSummary } from "@/hooks/useTenantSubscription";

interface OverviewSubscriptionCardProps {
  org: EnrichedOrganization;
  summary: TenantSubscriptionSummary | null;
  onOpenPlanUpgrade?: () => void;
}

export function OverviewSubscriptionCard({
  org,
  summary,
  onOpenPlanUpgrade,
}: OverviewSubscriptionCardProps) {
  return (
    <Card className="lg:col-span-1 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
          Subscription Tier
        </h4>
        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-xs font-semibold">
          {summary?.planTier ?? org.planTier}
        </Badge>
      </div>

      <div className="space-y-2 pt-1">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-foreground">
            {summary?.planPrice
              ? `Rp ${Number(summary.planPrice).toLocaleString("id-ID")}`
              : org.planTier === "Enterprise"
              ? "Rp 12.500.000"
              : org.planTier === "Professional"
              ? "Rp 4.500.000"
              : "Rp 1.500.000"}
          </span>
          <span className="text-xs text-muted-foreground">/ bulan</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Paket lisensi komputasi FTTH GIS SaaS aktif untuk operasional mitra ISP.
        </p>
      </div>

      <div className="border-t border-border/50 pt-3 space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Billing Cycle:</span>
          <span className="font-semibold text-foreground">
            {summary?.planCycle === "ANNUAL" ? "Tahunan (Diskon 15%)" : "Bulanan"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Account Status:</span>
          <span className="font-mono text-foreground">
            {summary?.trialDaysRemaining
              ? `Trial (${summary.trialDaysRemaining} hari sisa)`
              : "Aktif (Auto-renew)"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Payment Gateway:</span>
          <span className="text-foreground">Xendit Virtual Account &amp; Invoicing</span>
        </div>
      </div>

      <div className="pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenPlanUpgrade}
          className="w-full text-xs font-semibold border-border bg-card hover:bg-accent gap-2 cursor-pointer"
        >
          <CreditCard className="h-3.5 w-3.5 text-primary" />
          <span>Upgrade / Ubah Paket</span>
        </Button>
      </div>
    </Card>
  );
}

import { Badge, Button, ActionTooltip } from "@k2net/ui";
import { Sliders, Zap } from "lucide-react";
import type { TenantSubscriptionSummary } from "@/hooks/useTenantSubscription";

interface HardwareHeaderBarProps {
  usedOlts: number;
  effectiveMaxOlts: number;
  isBoosterActive: boolean;
  summary: TenantSubscriptionSummary | null;
  onOpenBoosterModal: () => void;
  onOpenQuotaModal: () => void;
}

export function HardwareHeaderBar({
  usedOlts,
  effectiveMaxOlts,
  isBoosterActive,
  summary,
  onOpenBoosterModal,
  onOpenQuotaModal,
}: HardwareHeaderBarProps) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card/70 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-xs font-bold text-foreground">Hardware Quotas &amp; OLT Poller Telemetry</h3>
          <Badge variant="outline" className="border-border text-[9px] font-mono px-1.5 py-0">
            {usedOlts} of {effectiveMaxOlts} OLTs Active
          </Badge>

          {isBoosterActive && (
            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-500 font-mono text-[9px] gap-1">
              <Zap className="h-3 w-3" />
              <span>BOOSTER +{summary?.boosterOdps} ODP ({summary?.boosterDaysRemaining} Hari Sisa)</span>
            </Badge>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Semua perangkat OLT yang terdaftar dimonitor secara berkala oleh <code className="text-primary font-mono text-[10px]">ftth-poller:5010</code>.
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <ActionTooltip label="Terapkan Kuota Darurat Tambahan (+1.000 ODP 30 Hari)">
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenBoosterModal}
            className="h-7 px-2.5 text-xs font-semibold border-amber-500/30 bg-card hover:bg-amber-500/10 text-amber-500 gap-1.5 shadow-2xs cursor-pointer"
          >
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span>+ Emergency Booster</span>
          </Button>
        </ActionTooltip>

        <ActionTooltip label="Sesuaikan Batas Kuota Hardware" shortcut="Q">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenQuotaModal}
            className="h-7 px-2.5 text-xs font-semibold border-border bg-card hover:bg-muted text-foreground gap-1.5 shadow-2xs cursor-pointer"
          >
            <Sliders className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Adjust Quotas</span>
          </Button>
        </ActionTooltip>
      </div>
    </div>
  );
}

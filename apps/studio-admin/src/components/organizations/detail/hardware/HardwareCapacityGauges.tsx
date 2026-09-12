import type { TenantSubscriptionSummary } from "@/hooks/useTenantSubscription";

interface HardwareCapacityGaugesProps {
  usedOlts: number;
  effectiveMaxOlts: number;
  maxOlts: number;
  usedOdps: number;
  effectiveMaxOdps: number;
  maxOdps: number;
  isBoosterActive: boolean;
  summary: TenantSubscriptionSummary | null;
}

export function HardwareCapacityGauges({
  usedOlts,
  effectiveMaxOlts,
  maxOlts,
  usedOdps,
  effectiveMaxOdps,
  maxOdps,
  isBoosterActive,
  summary,
}: HardwareCapacityGaugesProps) {
  const oltPct = Math.min(100, (usedOlts / Math.max(1, effectiveMaxOlts)) * 100);
  const odpPct = Math.min(100, (usedOdps / Math.max(1, effectiveMaxOdps)) * 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* OLT Gauge */}
      <div className="p-3.5 rounded-xl border border-border bg-card/60 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-foreground">Kapasitas Slot OLT Fisik</span>
          <span className="font-mono text-muted-foreground">
            {usedOlts} / {effectiveMaxOlts} OLT
            {isBoosterActive && summary?.boosterOlts ? ` (${maxOlts} Base + ${summary.boosterOlts} Booster)` : ""}
          </span>
        </div>
        <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden flex">
          <div
            className="bg-primary h-full transition-all duration-500"
            style={{ width: `${oltPct}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
          <span>Terpakai: {Math.round(oltPct)}%</span>
          <span>Tersisa: {Math.max(0, effectiveMaxOlts - usedOlts)} Slot</span>
        </div>
      </div>

      {/* ODP Gauge */}
      <div className="p-3.5 rounded-xl border border-border bg-card/60 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-foreground">Kapasitas Node ODP / FAT</span>
          <span className="font-mono text-muted-foreground">
            {usedOdps} / {effectiveMaxOdps} ODP
            {isBoosterActive && summary?.boosterOdps ? ` (${maxOdps} Base + ${summary.boosterOdps} Booster)` : ""}
          </span>
        </div>
        <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden flex">
          <div
            className="bg-primary h-full transition-all duration-500"
            style={{ width: `${odpPct}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
          <span>Terpakai: {Math.round(odpPct)}%</span>
          <span>Tersisa: {Math.max(0, effectiveMaxOdps - usedOdps)} Node</span>
        </div>
      </div>
    </div>
  );
}

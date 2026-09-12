import { Button, Input, Label } from "@k2net/ui";
import { Loader2 } from "lucide-react";
import type { SubscriptionPlanInfo, ProrationEstimate } from "./billing-types";

interface BillingCheckoutSidebarProps {
  selectedPlanTarget: SubscriptionPlanInfo;
  isDowngradeMode: boolean;
  prorateData: ProrationEstimate | null;
  upgradeNotes: string;
  setUpgradeNotes: (v: string) => void;
  ackOverQuota: boolean;
  downgradeReason: string;
  isExecuting: boolean;
  onExecuteUpgrade: () => void;
  onExecuteDowngrade: () => void;
  onClose: () => void;
}

export function BillingCheckoutSidebar({
  selectedPlanTarget,
  isDowngradeMode,
  prorateData,
  upgradeNotes,
  setUpgradeNotes,
  ackOverQuota,
  downgradeReason,
  isExecuting,
  onExecuteUpgrade,
  onExecuteDowngrade,
  onClose,
}: BillingCheckoutSidebarProps) {
  const isSubmitDisabled =
    isExecuting || (isDowngradeMode && (!ackOverQuota || !downgradeReason.trim()));

  return (
    <div className="md:col-span-5 p-6 md:p-7 flex flex-col justify-between space-y-6 bg-muted/10">
      <div className="space-y-4">
        <h5 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
          Billing Summary
        </h5>

        {/* Proration / Cost Breakdown Box */}
        <div className="rounded-xl border border-border bg-card p-3.5 space-y-2.5 text-xs">
          <div className="flex items-center justify-between font-bold text-foreground pb-1.5 border-b border-border">
            <span>{selectedPlanTarget.name} Plan</span>
            <span className="font-mono">{selectedPlanTarget.price} / bln</span>
          </div>

          {!isDowngradeMode && (
            <>
              <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                <span>Parameter Siklus</span>
                <span>Sisa {prorateData?.remainingDays ?? 30} dari {prorateData?.totalCycleDays ?? 30} Hari</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground">Kredit Paket Lama:</span>
                <span className="font-mono text-primary font-semibold">
                  - Rp {(prorateData?.unusedOldPlanCredit ?? 0).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground">Biaya Prorata Baru:</span>
                <span className="font-mono text-foreground font-semibold">
                  + Rp {(prorateData?.newPlanProratedCost ?? selectedPlanTarget.numericPrice ?? 0).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border font-bold text-xs">
                <span className="text-foreground">Tagihan Bersih:</span>
                <span className="font-mono text-primary text-sm">
                  Rp {(prorateData?.netPayableDelta ?? selectedPlanTarget.numericPrice ?? 0).toLocaleString("id-ID")}
                </span>
              </div>
            </>
          )}
        </div>

        {!isDowngradeMode && (
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-foreground">Referensi PO / Catatan (Opsional)</Label>
            <Input
              placeholder="Contoh: PO-KIR-2026-08 / BAST Billing"
              value={upgradeNotes}
              onChange={(e) => setUpgradeNotes(e.target.value)}
              className="h-8 text-xs bg-card border-border text-foreground"
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-4 border-t border-border/60">
        <Button
          size="sm"
          disabled={isSubmitDisabled}
          onClick={isDowngradeMode ? onExecuteDowngrade : onExecuteUpgrade}
          className="w-full text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 h-8 gap-1.5 shadow-xs cursor-pointer"
        >
          {isExecuting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isDowngradeMode ? (
            "Eksekusi Downgrade"
          ) : (
            "Aktivasi Upgrade Sekarang"
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="w-full text-xs text-muted-foreground hover:text-foreground h-7 cursor-pointer"
        >
          Batal
        </Button>
      </div>
    </div>
  );
}

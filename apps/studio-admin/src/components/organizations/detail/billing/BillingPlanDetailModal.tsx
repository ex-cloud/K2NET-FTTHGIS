import {
  Dialog,
  DialogContent,
} from "@k2net/ui";
import type { SubscriptionPlanInfo, ProrationEstimate } from "./billing-types";
import { BillingUpgradeFeatures } from "./BillingUpgradeFeatures";
import { BillingDowngradeImpact } from "./BillingDowngradeImpact";
import { BillingCheckoutSidebar } from "./BillingCheckoutSidebar";

interface BillingPlanDetailModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orgName: string;
  selectedPlanTarget: SubscriptionPlanInfo | null;
  isDowngradeMode: boolean;
  usedOlts: number;
  usedOdps: number;
  prorateData: ProrationEstimate | null;
  upgradeNotes: string;
  setUpgradeNotes: (v: string) => void;
  downgradeReason: string;
  setDowngradeReason: (v: string) => void;
  ackOverQuota: boolean;
  setAckOverQuota: (v: boolean) => void;
  isExecuting: boolean;
  onExecuteUpgrade: () => void;
  onExecuteDowngrade: () => void;
}

export function BillingPlanDetailModal({
  isOpen,
  onOpenChange,
  orgName,
  selectedPlanTarget,
  isDowngradeMode,
  usedOlts,
  usedOdps,
  prorateData,
  upgradeNotes,
  setUpgradeNotes,
  downgradeReason,
  setDowngradeReason,
  ackOverQuota,
  setAckOverQuota,
  isExecuting,
  onExecuteUpgrade,
  onExecuteDowngrade,
}: BillingPlanDetailModalProps) {
  if (!selectedPlanTarget) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-popover/95 backdrop-blur-2xl border-border sm:max-w-[900px] p-0 overflow-hidden shadow-2xl rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[480px]">
          {/* Left Column (Features or Downgrade Impact) */}
          <div className="md:col-span-7 p-6 md:p-7 space-y-5 border-b md:border-b-0 md:border-r border-border/70 bg-card/40">
            {!isDowngradeMode ? (
              <BillingUpgradeFeatures
                orgName={orgName}
                selectedPlanTarget={selectedPlanTarget}
              />
            ) : (
              <BillingDowngradeImpact
                selectedPlanTarget={selectedPlanTarget}
                usedOlts={usedOlts}
                usedOdps={usedOdps}
                downgradeReason={downgradeReason}
                setDowngradeReason={setDowngradeReason}
                ackOverQuota={ackOverQuota}
                setAckOverQuota={setAckOverQuota}
              />
            )}
          </div>

          {/* Right Column (Billing Summary & Actions) */}
          <BillingCheckoutSidebar
            selectedPlanTarget={selectedPlanTarget}
            isDowngradeMode={isDowngradeMode}
            prorateData={prorateData}
            upgradeNotes={upgradeNotes}
            setUpgradeNotes={setUpgradeNotes}
            ackOverQuota={ackOverQuota}
            downgradeReason={downgradeReason}
            isExecuting={isExecuting}
            onExecuteUpgrade={onExecuteUpgrade}
            onExecuteDowngrade={onExecuteDowngrade}
            onClose={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

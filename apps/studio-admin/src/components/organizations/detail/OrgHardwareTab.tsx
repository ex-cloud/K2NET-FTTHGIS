import type { EnrichedOrganization } from "../types";
import { useOrgHardwareState } from "./hardware/useOrgHardwareState";
import { HardwareHeaderBar } from "./hardware/HardwareHeaderBar";
import { HardwareCapacityGauges } from "./hardware/HardwareCapacityGauges";
import { HardwareDevicesTable } from "./hardware/HardwareDevicesTable";
import { HardwareBoosterModal } from "./hardware/HardwareBoosterModal";

interface OrgHardwareTabProps {
  organization: EnrichedOrganization;
  onOpenQuotaModal: () => void;
}

export function OrgHardwareTab({
  organization: org,
  onOpenQuotaModal,
}: OrgHardwareTabProps) {
  const state = useOrgHardwareState(org);

  return (
    <div className="space-y-6">
      {/* 1. Header Quota Allocation & Booster Action */}
      <HardwareHeaderBar
        usedOlts={state.usedOlts}
        effectiveMaxOlts={state.effectiveMaxOlts}
        isBoosterActive={state.isBoosterActive}
        summary={state.summary}
        onOpenBoosterModal={() => state.setIsBoosterModalOpen(true)}
        onOpenQuotaModal={onOpenQuotaModal}
      />

      {/* 2. Effective Hardware Capacity Gauges */}
      <HardwareCapacityGauges
        usedOlts={state.usedOlts}
        effectiveMaxOlts={state.effectiveMaxOlts}
        maxOlts={state.maxOlts}
        usedOdps={state.usedOdps}
        effectiveMaxOdps={state.effectiveMaxOdps}
        maxOdps={state.maxOdps}
        isBoosterActive={state.isBoosterActive}
        summary={state.summary}
      />

      {/* 3. OLT Hardware Devices Table */}
      <HardwareDevicesTable
        oltDevices={state.oltDevices}
        testingOltId={state.testingOltId}
        onTestPing={state.handleTestPing}
        onCopy={state.handleCopy}
      />

      {/* 4. Emergency Quota Booster Modal */}
      <HardwareBoosterModal
        open={state.isBoosterModalOpen}
        onOpenChange={state.setIsBoosterModalOpen}
        boosterOlts={state.boosterOlts}
        setBoosterOlts={state.setBoosterOlts}
        boosterOdps={state.boosterOdps}
        setBoosterOdps={state.setBoosterOdps}
        boosterDuration={state.boosterDuration}
        setBoosterDuration={state.setBoosterDuration}
        boosterReason={state.boosterReason}
        setBoosterReason={state.setBoosterReason}
        isSavingBooster={state.isSavingBooster}
        onApplyBooster={state.handleApplyBooster}
      />
    </div>
  );
}

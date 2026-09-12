import type { EnrichedOrganization } from "../types";
import {
  BillingPlanSummaryCard,
  BillingQuotasCard,
  BillingInvoicesTable,
  BillingChangePlanSheet,
  BillingPlanDetailModal,
  BillingDunningModal,
} from "./billing";
import { useOrgBillingState } from "./billing/useOrgBillingState";
import { BillingHeaderBar } from "./billing/BillingHeaderBar";
import { BillingTrialAlert } from "./billing/BillingTrialAlert";

interface OrgBillingTabProps {
  organization: EnrichedOrganization;
  onOpenPlanUpgrade?: () => void;
}

export function OrgBillingTab({
  organization: org,
}: OrgBillingTabProps) {
  const state = useOrgBillingState(org);

  return (
    <div className="space-y-8">
      {/* Top Header & Status Bar */}
      <BillingHeaderBar
        currentTier={state.currentTier}
        summary={state.summary}
        onOpenDunningModal={() => state.setIsDunningModalOpen(true)}
      />

      {/* Trial Alert Banner */}
      <BillingTrialAlert
        status={org.status}
        summary={state.summary}
        onExtendTrial={state.handleExtendTrial}
      />

      {/* Subscription Plan Summary Card */}
      <BillingPlanSummaryCard
        currentTier={state.currentTier}
        summary={state.summary}
        orgStatus={org.status}
        effectiveMaxOlts={state.effectiveMaxOlts}
        effectiveMaxOdps={state.effectiveMaxOdps}
        maxStorageGb={state.maxStorageGb}
        isLoading={state.subLoading}
        onOpenChangePlan={() => state.setIsChangePlanSheetOpen(true)}
      />

      {/* Cost Control & Hardware Quotas */}
      <BillingQuotasCard
        usedOlts={state.usedOlts}
        effectiveMaxOlts={state.effectiveMaxOlts}
        oltPct={state.oltPct}
        usedOdps={state.usedOdps}
        effectiveMaxOdps={state.effectiveMaxOdps}
        odpPct={state.odpPct}
        usedStorageGb={state.usedStorageGb}
        maxStorageGb={state.maxStorageGb}
        storagePct={state.storagePct}
      />

      {/* Past Invoices History */}
      <BillingInvoicesTable
        invoices={state.invoices}
        picEmail={org.picEmail}
      />

      {/* Slide-over sheet for Changing Plan */}
      <BillingChangePlanSheet
        isOpen={state.isChangePlanSheetOpen}
        onOpenChange={state.setIsChangePlanSheetOpen}
        orgName={org.name}
        currentTier={state.currentTier}
        availablePlans={state.availablePlans}
        plansLoading={state.plansLoading}
        plansError={state.plansError}
        onRetryPlans={state.refetchPlans}
        onSelectPlan={state.handleSelectPlanFromSheet}
      />

      {/* Two-column split modal for Checkout & Impact */}
      <BillingPlanDetailModal
        isOpen={state.isPlanDetailModalOpen}
        onOpenChange={state.setIsPlanDetailModalOpen}
        orgName={org.name}
        selectedPlanTarget={state.selectedPlanTarget}
        isDowngradeMode={state.isDowngradeMode}
        usedOlts={state.usedOlts}
        usedOdps={state.usedOdps}
        prorateData={state.prorateData}
        upgradeNotes={state.upgradeNotes}
        setUpgradeNotes={state.setUpgradeNotes}
        downgradeReason={state.downgradeReason}
        setDowngradeReason={state.setDowngradeReason}
        ackOverQuota={state.ackOverQuota}
        setAckOverQuota={state.setAckOverQuota}
        isExecuting={state.isExecuting}
        onExecuteUpgrade={state.handleExecuteUpgrade}
        onExecuteDowngrade={state.handleExecuteDowngrade}
      />

      {/* Modal for Dunning & Debt Escalation */}
      <BillingDunningModal
        isOpen={state.isDunningModalOpen}
        onOpenChange={state.setIsDunningModalOpen}
        selectedDunningLevel={state.selectedDunningLevel}
        setSelectedDunningLevel={state.setSelectedDunningLevel}
        dunningNotes={state.dunningNotes}
        setDunningNotes={state.setDunningNotes}
        isExecuting={state.isExecuting}
        onExecuteDunning={state.handleExecuteDunning}
      />
    </div>
  );
}

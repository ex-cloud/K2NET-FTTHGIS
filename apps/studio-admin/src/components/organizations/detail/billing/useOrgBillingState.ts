import { useState, useMemo } from "react";
import { toast } from "sonner";
import { toBackendPlanName, type EnrichedOrganization } from "../../types";
import { useTenantSubscription, type TenantSubscriptionSummary } from "@/hooks/useTenantSubscription";
import type { ProrationEstimate } from "@/lib/actions/gateways";
import type { SubscriptionPlanInfo, TenantInvoice } from "./billing-types";

function formatPlanAmount(planPrice?: number): string {
  const numericPrice = Number(planPrice || 0);
  if (numericPrice > 0) {
    return `Rp ${numericPrice.toLocaleString("id-ID")}`;
  }
  if (planPrice !== undefined) {
    return "Free Trial";
  }
  return "—";
}

function generateMockInvoices(currentTier: string, planPrice?: number): TenantInvoice[] {
  const nowYear = new Date().getFullYear();
  const currentPlanAmountStr = formatPlanAmount(planPrice);

  return [
    {
      id: "inv-1",
      invoiceNumber: `INV-${nowYear}-08-0042`,
      date: "01 Aug 2026",
      description: `K2NET FTTH GIS SaaS Subscription — ${currentTier} Tier`,
      amount: currentPlanAmountStr,
      status: "PAID",
      paymentMethod: "Xendit Virtual Account BCA",
    },
    {
      id: "inv-2",
      invoiceNumber: `INV-${nowYear}-07-0038`,
      date: "01 Jul 2026",
      description: `K2NET FTTH GIS SaaS Subscription — ${currentTier} Tier`,
      amount: currentPlanAmountStr,
      status: "PAID",
      paymentMethod: "Xendit Virtual Account BCA",
    },
    {
      id: "inv-3",
      invoiceNumber: `INV-${nowYear}-06-0029`,
      date: "01 Jun 2026",
      description: `K2NET FTTH GIS SaaS Subscription — ${currentTier} Tier`,
      amount: currentPlanAmountStr,
      status: "PAID",
      paymentMethod: "Xendit Virtual Account Mandiri",
    },
  ];
}

function resolvePlanTierInfo(summary: TenantSubscriptionSummary | null | undefined, org: EnrichedOrganization) {
  const rawPlanName = summary?.planName || toBackendPlanName(org.planTier) || "";
  const currentTier =
    summary?.planTier ||
    org.planTier ||
    (rawPlanName ? (rawPlanName.toUpperCase() === "FREE" ? "Free Trial" : rawPlanName) : "Starter");
  const isFreeOrTrial =
    currentTier.toLowerCase().includes("free") || currentTier.toLowerCase().includes("trial");
  const currentPlanCode = rawPlanName || (isFreeOrTrial ? "FREE" : currentTier);
  return { currentTier, currentPlanCode };
}

function findMatchingPlan(
  availablePlans: SubscriptionPlanInfo[],
  currentTier: string,
  currentPlanCode: string
): SubscriptionPlanInfo | undefined {
  const normCurrentTier = currentTier.toLowerCase().trim();
  const normCurrentCode = currentPlanCode.toLowerCase().trim();
  return availablePlans.find((p) => {
    const normCode = p.code.toLowerCase().trim();
    const normName = p.name.toLowerCase().trim();
    if (normCurrentCode && (normCode === normCurrentCode || normName === normCurrentCode)) return true;
    if (normCode === normCurrentTier || normName === normCurrentTier) return true;
    if (
      (normCode === "free" || normName === "free") &&
      (normCurrentTier.includes("free") || normCurrentTier.includes("trial"))
    ) {
      return true;
    }
    return false;
  });
}

function calculateUsageMetrics(summary: TenantSubscriptionSummary | null | undefined, org: EnrichedOrganization) {
  const usedOlts = summary?.usedOlts ?? org.usedOlts;
  const usedOdps = summary?.usedOdps ?? org.usedOdps;
  const effectiveMaxOlts = summary?.effectiveMaxOlts ?? org.maxOlts;
  const effectiveMaxOdps = summary?.effectiveMaxOdps ?? org.maxOdps;
  const maxStorageGb = summary?.maxStorageGb ?? org.maxStorageGb;
  const usedStorageGb = summary?.usedStorageGb ?? org.usedStorageGb;

  const oltPct = effectiveMaxOlts > 0 ? Math.round((usedOlts / effectiveMaxOlts) * 100) : 0;
  const odpPct = effectiveMaxOdps > 0 ? Math.round((usedOdps / effectiveMaxOdps) * 100) : 0;
  const storagePct = maxStorageGb > 0 ? Math.round((usedStorageGb / maxStorageGb) * 100) : 0;

  return {
    usedOlts,
    usedOdps,
    effectiveMaxOlts,
    effectiveMaxOdps,
    maxStorageGb,
    usedStorageGb,
    oltPct,
    odpPct,
    storagePct,
  };
}

export function useOrgBillingState(org: EnrichedOrganization) {
  const {
    summary,
    availablePlans,
    plansLoading,
    plansError,
    loading: subLoading,
    upgrade,
    downgrade,
    getProrateCalc,
    extendTrial,
    updateDunning,
    refetch,
    refetchPlans,
  } = useTenantSubscription(org.slug);

  const [isChangePlanSheetOpen, setIsChangePlanSheetOpen] = useState(false);
  const [isPlanDetailModalOpen, setIsPlanDetailModalOpen] = useState(false);
  const [isDunningModalOpen, setIsDunningModalOpen] = useState(false);

  const [selectedPlanTarget, setSelectedPlanTarget] = useState<SubscriptionPlanInfo | null>(null);
  const [isDowngradeMode, setIsDowngradeMode] = useState(false);
  const [prorateData, setProrateData] = useState<ProrationEstimate | null>(null);
  const [upgradeNotes, setUpgradeNotes] = useState("");
  const [downgradeReason, setDowngradeReason] = useState("");
  const [ackOverQuota, setAckOverQuota] = useState(false);
  const [selectedDunningLevel, setSelectedDunningLevel] = useState(summary?.dunningLevel || 0);
  const [dunningNotes, setDunningNotes] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);

  const { currentTier, currentPlanCode } = useMemo(
    () => resolvePlanTierInfo(summary, org),
    [summary, org]
  );

  const usage = useMemo(() => calculateUsageMetrics(summary, org), [summary, org]);

  const invoices = useMemo(() => {
    return generateMockInvoices(currentTier, summary?.planPrice);
  }, [currentTier, summary?.planPrice]);

  const handleSelectPlanFromSheet = async (plan: SubscriptionPlanInfo) => {
    setSelectedPlanTarget(plan);

    const currentPlanObj = findMatchingPlan(availablePlans, currentTier, currentPlanCode);
    const currentPrice = currentPlanObj ? currentPlanObj.numericPrice : summary?.planPrice || 0;
    const isDowngrade = plan.numericPrice < currentPrice;

    setIsDowngradeMode(isDowngrade);

    if (isDowngrade) {
      setDowngradeReason("");
      setAckOverQuota(false);
    } else {
      const pr = await getProrateCalc(plan.code, "MONTHLY");
      setProrateData(pr);
      setUpgradeNotes("");
    }

    setIsPlanDetailModalOpen(true);
  };

  const handleExecuteUpgrade = async () => {
    if (!selectedPlanTarget) return;
    setIsExecuting(true);
    try {
      await upgrade({
        newPlanName: selectedPlanTarget.code,
        planCycle: "MONTHLY",
        isDirectOverride: true,
        notes: upgradeNotes || "Super Admin Plan Upgrade",
      });
      setIsPlanDetailModalOpen(false);
      setIsChangePlanSheetOpen(false);
      refetch();
    } catch {
      // Handled in hook
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExecuteDowngrade = async () => {
    if (!selectedPlanTarget) return;
    if (!downgradeReason.trim()) {
      toast.error("Wajib mengisi alasan resmi / nomor surat downgrade.");
      return;
    }
    setIsExecuting(true);
    try {
      await downgrade({
        targetPlanName: selectedPlanTarget.code,
        reason: downgradeReason,
        acknowledgeOverQuota: ackOverQuota,
      });
      setIsPlanDetailModalOpen(false);
      setIsChangePlanSheetOpen(false);
      refetch();
    } catch {
      // Handled in hook
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExtendTrial = async (days: number, reason?: string) => {
    try {
      await extendTrial({
        additionalDays: days,
        reason: reason || `Super admin extension +${days} days`,
      });
      refetch();
    } catch {
      // Handled in hook
    }
  };

  const handleExecuteDunning = async () => {
    setIsExecuting(true);
    try {
      await updateDunning({
        dunningLevel: Number(selectedDunningLevel),
        notes: dunningNotes,
      });
      setIsDunningModalOpen(false);
      refetch();
    } catch {
      // Handled in hook
    } finally {
      setIsExecuting(false);
    }
  };

  return {
    summary,
    availablePlans,
    plansLoading,
    plansError,
    subLoading,
    currentTier,
    currentPlanCode,
    usedOlts: usage.usedOlts,
    usedOdps: usage.usedOdps,
    effectiveMaxOlts: usage.effectiveMaxOlts,
    effectiveMaxOdps: usage.effectiveMaxOdps,
    maxStorageGb: usage.maxStorageGb,
    usedStorageGb: usage.usedStorageGb,
    oltPct: usage.oltPct,
    odpPct: usage.odpPct,
    storagePct: usage.storagePct,
    invoices,
    isChangePlanSheetOpen,
    setIsChangePlanSheetOpen,
    isPlanDetailModalOpen,
    setIsPlanDetailModalOpen,
    isDunningModalOpen,
    setIsDunningModalOpen,
    selectedPlanTarget,
    isDowngradeMode,
    prorateData,
    upgradeNotes,
    setUpgradeNotes,
    downgradeReason,
    setDowngradeReason,
    ackOverQuota,
    setAckOverQuota,
    selectedDunningLevel,
    setSelectedDunningLevel,
    dunningNotes,
    setDunningNotes,
    isExecuting,
    refetchPlans,
    handleSelectPlanFromSheet,
    handleExecuteUpgrade,
    handleExecuteDowngrade,
    handleExtendTrial,
    handleExecuteDunning,
  };
}

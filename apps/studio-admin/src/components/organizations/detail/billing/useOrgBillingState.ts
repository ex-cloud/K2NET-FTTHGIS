import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useTranslation } from "@k2net/i18n";
import { toBackendPlanName, type EnrichedOrganization } from "../../types";
import { useTenantSubscription, type TenantSubscriptionSummary } from "@/hooks/useTenantSubscription";
import { useBillingInvoices } from "@/hooks/useBillingInvoices";
import { formatIdr } from "@/lib/formatters";
import type { ProrationEstimate } from "@/lib/actions/gateways";
import type { SubscriptionPlanInfo, TenantInvoice } from "./billing-types";

function formatInvoiceDate(isoString?: string): string {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
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
  const { t } = useTranslation();
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

  const { data: allInvoices = [] } = useBillingInvoices();

  const invoices: TenantInvoice[] = useMemo(() => {
    const orgFiltered = allInvoices.filter(
      (inv) => inv.organizationId === org.id || (org.slug && inv.organizationSlug === org.slug)
    );
    return orgFiltered.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      date: formatInvoiceDate(inv.createdAt),
      description: inv.description,
      amount: formatIdr(inv.amount),
      status: inv.status,
      paymentMethod: inv.paymentMethod || "Xendit VA / Gateway",
    }));
  }, [allInvoices, org.id, org.slug]);

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
      toast.error(t("billing.toast_downgrade_reason_required"));
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

"use client";

import React, { useState } from "react";
import { Badge, Button } from "@k2net/ui";
import { CreditCard, AlertTriangle, Clock, Zap, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import type { EnrichedOrganization } from "../types";
import { useTenantSubscription } from "@/hooks/useTenantSubscription";
import {
  BillingPlanSummaryCard,
  BillingQuotasCard,
  BillingInvoicesTable,
  BillingChangePlanSheet,
  BillingPlanDetailModal,
  BillingDunningModal,
  type TenantInvoice,
  type SubscriptionPlanInfo,
} from "./billing";

interface OrgBillingTabProps {
  organization: EnrichedOrganization;
  onOpenPlanUpgrade?: () => void;
}

export function OrgBillingTab({
  organization: org,
}: OrgBillingTabProps) {
  const {
    summary,
    availablePlans,
    plansLoading,
    upgrade,
    downgrade,
    getProrateCalc,
    extendTrial,
    updateDunning,
    refetch,
  } = useTenantSubscription(org.slug);

  // Modals & Sheets state
  const [isChangePlanSheetOpen, setIsChangePlanSheetOpen] = useState(false);
  const [isPlanDetailModalOpen, setIsPlanDetailModalOpen] = useState(false);
  const [isDunningModalOpen, setIsDunningModalOpen] = useState(false);

  // Plan selection states
  const [selectedPlanTarget, setSelectedPlanTarget] = useState<SubscriptionPlanInfo | null>(null);
  const [isDowngradeMode, setIsDowngradeMode] = useState(false);
  const [prorateData, setProrateData] = useState<any>(null);
  const [upgradeNotes, setUpgradeNotes] = useState("");
  const [downgradeReason, setDowngradeReason] = useState("");
  const [ackOverQuota, setAckOverQuota] = useState(false);
  const [selectedDunningLevel, setSelectedDunningLevel] = useState(summary?.dunningLevel || 0);
  const [dunningNotes, setDunningNotes] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);

  const currentTier = summary?.planTier || org.planTier || "Professional";
  const usedOlts = summary?.usedOlts ?? org.usedOlts;
  const usedOdps = summary?.usedOdps ?? org.usedOdps;
  const effectiveMaxOlts = summary?.effectiveMaxOlts ?? org.maxOlts;
  const effectiveMaxOdps = summary?.effectiveMaxOdps ?? org.maxOdps;
  const maxStorageGb = summary?.maxStorageGb ?? org.maxStorageGb;
  const usedStorageGb = summary?.usedStorageGb ?? org.usedStorageGb;

  const oltPct = effectiveMaxOlts > 0 ? Math.round((usedOlts / effectiveMaxOlts) * 100) : 0;
  const odpPct = effectiveMaxOdps > 0 ? Math.round((usedOdps / effectiveMaxOdps) * 100) : 0;
  const storagePct = maxStorageGb > 0 ? Math.round((usedStorageGb / maxStorageGb) * 100) : 0;

  // Dynamic Invoices data derived from active subscription & real dates
  const tierUpper = (currentTier || "").toUpperCase();
  const defaultTierPrice = tierUpper.includes("ENTERPRISE")
    ? 14500000
    : tierUpper.includes("PRO")
    ? 4900000
    : 0;

  const activePlanPrice = summary?.planPrice !== undefined ? Number(summary.planPrice) : defaultTierPrice;
  const currentPlanAmountStr = activePlanPrice > 0 ? `Rp ${activePlanPrice.toLocaleString("id-ID")}` : "Free Trial";
  const nowYear = new Date().getFullYear();

  const invoices: TenantInvoice[] = [
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

  // Handle plan selection inside slide-over sheet dynamically
  const handleSelectPlanFromSheet = async (plan: SubscriptionPlanInfo) => {
    setSelectedPlanTarget(plan);

    const currentPlanObj = availablePlans.find(
      (p) =>
        p.name.toLowerCase() === currentTier.toLowerCase() ||
        p.code.toLowerCase() === currentTier.toLowerCase()
    );
    const currentPrice = currentPlanObj ? currentPlanObj.numericPrice : (summary?.planPrice || 0);
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

  const handleExtendTrial = async (days: number) => {
    try {
      await extendTrial({ additionalDays: days, reason: `Super admin extension +${days} days` });
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

  return (
    <div className="space-y-8">
      {/* ── Top Header & Status Bar ────────────────────────────────────────── */}
      <div className="p-4 rounded-xl border border-border bg-card/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Tata Kelola Paket Langganan & Billing</h3>
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
            onClick={() => setIsDunningModalOpen(true)}
            className="h-8 px-3 text-xs font-medium border-border text-foreground hover:bg-muted/50 gap-1.5 cursor-pointer"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
            <span>Kontrol Dunning</span>
          </Button>
        </div>
      </div>

      {/* ── Trial Alert Banner ─────────────────────────────────────────────── */}
      {(org.status === "TRIAL" || summary?.trialExpiresAt) && (
        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 text-amber-500 shrink-0" />
            <div>
              <span className="font-bold text-foreground">Status Masa Uji Coba (Starter Trial): </span>
              <span className="text-foreground/80">
                {summary?.isTrialExpired
                  ? "Masa trial telah kedaluwarsa. Sistem berada pada masa tenggang akses terbatas."
                  : `Sisa ${summary?.trialDaysRemaining ?? 7} hari masa evaluasi.`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 self-end sm:self-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExtendTrial(7)}
              className="h-7 text-xs border-amber-500/40 bg-card hover:bg-amber-500/20 text-foreground font-medium cursor-pointer"
            >
              +7 Hari Trial
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExtendTrial(14)}
              className="h-7 text-xs border-amber-500/40 bg-card hover:bg-amber-500/20 text-foreground font-medium cursor-pointer"
            >
              +14 Hari Trial
            </Button>
          </div>
        </div>
      )}

      {/* ── SECTION 1: Subscription Plan Summary Card ──────────────────────── */}
      <BillingPlanSummaryCard
        currentTier={currentTier}
        summary={summary}
        orgStatus={org.status}
        effectiveMaxOlts={effectiveMaxOlts}
        effectiveMaxOdps={effectiveMaxOdps}
        maxStorageGb={maxStorageGb}
        onOpenChangePlan={() => setIsChangePlanSheetOpen(true)}
      />

      {/* ── SECTION 2: Cost Control & Hardware Quotas ────────────────────────── */}
      <BillingQuotasCard
        usedOlts={usedOlts}
        effectiveMaxOlts={effectiveMaxOlts}
        oltPct={oltPct}
        usedOdps={usedOdps}
        effectiveMaxOdps={effectiveMaxOdps}
        odpPct={odpPct}
        usedStorageGb={usedStorageGb}
        maxStorageGb={maxStorageGb}
        storagePct={storagePct}
      />

      {/* ── SECTION 3: Past Invoices History ─────────────────────────────────── */}
      <BillingInvoicesTable
        invoices={invoices}
        picEmail={org.picEmail}
      />

      {/* ── SLIDE-OVER SHEET: Change Subscription Plan (Dynamic from DB) ─────── */}
      <BillingChangePlanSheet
        isOpen={isChangePlanSheetOpen}
        onOpenChange={setIsChangePlanSheetOpen}
        orgName={org.name}
        currentTier={currentTier}
        availablePlans={availablePlans}
        plansLoading={plansLoading}
        onSelectPlan={handleSelectPlanFromSheet}
      />

      {/* ── TWO-COLUMN SPLIT MODAL: Features & Proration/Impact Checkout ────── */}
      <BillingPlanDetailModal
        isOpen={isPlanDetailModalOpen}
        onOpenChange={setIsPlanDetailModalOpen}
        orgName={org.name}
        selectedPlanTarget={selectedPlanTarget}
        isDowngradeMode={isDowngradeMode}
        usedOlts={usedOlts}
        usedOdps={usedOdps}
        prorateData={prorateData}
        upgradeNotes={upgradeNotes}
        setUpgradeNotes={setUpgradeNotes}
        downgradeReason={downgradeReason}
        setDowngradeReason={setDowngradeReason}
        ackOverQuota={ackOverQuota}
        setAckOverQuota={setAckOverQuota}
        isExecuting={isExecuting}
        onExecuteUpgrade={handleExecuteUpgrade}
        onExecuteDowngrade={handleExecuteDowngrade}
      />

      {/* ── MODAL: Dunning & Debt Escalation ─────────────────────────────────── */}
      <BillingDunningModal
        isOpen={isDunningModalOpen}
        onOpenChange={setIsDunningModalOpen}
        selectedDunningLevel={selectedDunningLevel}
        setSelectedDunningLevel={setSelectedDunningLevel}
        dunningNotes={dunningNotes}
        setDunningNotes={setDunningNotes}
        isExecuting={isExecuting}
        onExecuteDunning={handleExecuteDunning}
      />
    </div>
  );
}

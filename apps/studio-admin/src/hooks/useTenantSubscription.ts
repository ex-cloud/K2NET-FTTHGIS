"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  getSubscriptionSummary,
  upgradeSubscriptionPlan,
  downgradeSubscriptionPlan,
  getProrationEstimate,
  applyEmergencyBooster,
  extendTrialPeriod,
  updateDunningStatus,
  type SubscriptionSummary,
  type ProrationEstimate,
} from "@/lib/actions/gateways/subscription";

export function useTenantSubscription(slug?: string) {
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetchSummary = useCallback(async (silent = false) => {
    if (!slug) return;
    try {
      if (!silent) setLoading(true);
      const data = await getSubscriptionSummary(slug);
      if (mounted.current) {
        setSummary(data);
        setError(null);
      }
    } catch (err: any) {
      if (mounted.current) {
        setError(err.message || "Gagal memuat ringkasan langganan");
      }
    } finally {
      if (mounted.current && !silent) {
        setLoading(false);
      }
    }
  }, [slug]);

  useEffect(() => {
    mounted.current = true;
    fetchSummary();
    return () => {
      mounted.current = false;
    };
  }, [fetchSummary]);

  const upgrade = useCallback(
    async (params: {
      newPlanName: string;
      planCycle?: string;
      isDirectOverride?: boolean;
      notes?: string;
    }) => {
      if (!slug) return;
      try {
        const res = await upgradeSubscriptionPlan(slug, params);
        toast.success(`Paket berhasil ditingkatkan ke ${params.newPlanName}!`);
        setSummary(res);
        return res;
      } catch (err: any) {
        toast.error(err.message || "Gagal meningkatkan paket");
        throw err;
      }
    },
    [slug]
  );

  const downgrade = useCallback(
    async (params: {
      targetPlanName: string;
      reason: string;
      acknowledgeOverQuota?: boolean;
    }) => {
      if (!slug) return;
      try {
        const res = await downgradeSubscriptionPlan(slug, params);
        if (res.overQuotaMode) {
          toast.warning(`Downgrade berhasil ke ${params.targetPlanName}. Akun memasuki mode OVER_QUOTA (Read-Only).`);
        } else {
          toast.success(`Downgrade berhasil ke ${params.targetPlanName}!`);
        }
        setSummary(res.summary);
        return res;
      } catch (err: any) {
        toast.error(err.message || "Gagal melakukan downgrade paket");
        throw err;
      }
    },
    [slug]
  );

  const getProrateCalc = useCallback(
    async (targetPlan: string, targetCycle = "MONTHLY"): Promise<ProrationEstimate | null> => {
      if (!slug) return null;
      try {
        return await getProrationEstimate(slug, targetPlan, targetCycle);
      } catch {
        return null;
      }
    },
    [slug]
  );

  const addBooster = useCallback(
    async (params: {
      boosterOlts: number;
      boosterOdps: number;
      durationDays?: number;
      reason?: string;
    }) => {
      if (!slug) return;
      try {
        const res = await applyEmergencyBooster(slug, params);
        toast.success(`Emergency booster +${params.boosterOlts} OLTs & +${params.boosterOdps} ODPs aktif!`);
        setSummary(res);
        return res;
      } catch (err: any) {
        toast.error(err.message || "Gagal menerapkan emergency booster");
        throw err;
      }
    },
    [slug]
  );

  const extendTrial = useCallback(
    async (params: { additionalDays?: number; reason?: string }) => {
      if (!slug) return;
      try {
        const res = await extendTrialPeriod(slug, params);
        toast.success(`Masa trial berhasil diperpanjang +${params.additionalDays || 7} hari!`);
        setSummary(res);
        return res;
      } catch (err: any) {
        toast.error(err.message || "Gagal memperpanjang masa trial");
        throw err;
      }
    },
    [slug]
  );

  const updateDunning = useCallback(
    async (params: { dunningLevel: number; notes?: string }) => {
      if (!slug) return;
      try {
        const res = await updateDunningStatus(slug, params);
        toast.success(`Status dunning berhasil diperbarui ke Level ${params.dunningLevel}`);
        setSummary(res);
        return res;
      } catch (err: any) {
        toast.error(err.message || "Gagal memperbarui status dunning");
        throw err;
      }
    },
    [slug]
  );

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary,
    upgrade,
    downgrade,
    getProrateCalc,
    addBooster,
    extendTrial,
    updateDunning,
  };
}

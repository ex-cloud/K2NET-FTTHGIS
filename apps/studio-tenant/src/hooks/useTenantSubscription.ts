import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api-client";
import { getCurrentOrgSlug } from "../lib/domain";
import { useTenantInfo } from "./useTenantInfo";

export interface SubscriptionSummary {
  orgId: string;
  orgName: string;
  orgSlug: string;
  status: "ACTIVE" | "TRIAL" | "PENDING_APPROVAL" | "OVERDUE" | "OVER_QUOTA" | "SUSPENDED" | "TRIAL_EXPIRED" | "DELETED" | string;
  planTier: string;
  planName: string;
  planPrice: number;
  planCycle: "MONTHLY" | "YEARLY" | string;

  // Hardware Quotas & Live Usage
  maxOlts: number;
  usedOlts: number;
  maxOdps: number;
  usedOdps: number;
  maxStorageGb: number;
  usedStorageGb: number;
  apiRateLimitMax: number;
  apiRateLimitUsed: number;

  // Emergency Quota Booster
  isBoosterActive: boolean;
  boosterOlts: number;
  boosterOdps: number;
  boosterExpiresAt?: string | null;
  boosterDaysRemaining: number;
  effectiveMaxOlts: number;
  effectiveMaxOdps: number;

  // Lifecycle & Dunning
  trialExpiresAt?: string | null;
  isTrialExpired: boolean;
  trialDaysRemaining: number;
  gracePeriodUntil?: string | null;
  dunningLevel: number;
  isOverQuota: boolean;
  isSoftLocked: boolean;

  // Feature Entitlements
  hasApiAccess?: boolean;
  hasSso?: boolean;
}

export type NormalizedTier = "free" | "starter" | "pro" | "enterprise";

function parseTier(rawInput?: string): NormalizedTier {
  if (!rawInput) return "free";
  const raw = rawInput.toLowerCase();
  if (raw.includes("enterprise") || raw.includes("telco")) return "enterprise";
  if (raw.includes("pro") || raw.includes("professional")) return "pro";
  if (raw.includes("starter") || raw.includes("lite")) return "starter";
  if (raw.includes("free") || raw.includes("trial") || raw.includes("basic")) return "free";
  return "free";
}

function getProjectLimits(summary: SubscriptionSummary | null | undefined, tier: NormalizedTier, isTrialExpired: boolean, status: string) {
  const defaultMax = tier === "free" ? 1 : tier === "starter" ? 2 : tier === "enterprise" ? 25 : 6;
  const maxProjects = summary?.effectiveMaxOlts ?? defaultMax;
  const usedProjects = summary?.usedOlts ?? 0;
  const projectPercentage = maxProjects > 0 ? Math.min(100, Math.round((usedProjects / maxProjects) * 100)) : 0;
  const isBlocked = isTrialExpired || status === "TRIAL_EXPIRED" || status === "SUSPENDED" || Boolean(summary?.isSoftLocked);
  const canCreateProject = usedProjects < maxProjects && !isBlocked;

  return { maxProjects, usedProjects, projectPercentage, canCreateProject };
}

function getOdpLimits(summary: SubscriptionSummary | null | undefined, tier: NormalizedTier) {
  const defaultMax = tier === "free" ? 50 : tier === "starter" ? 300 : tier === "enterprise" ? 12000 : 2500;
  const maxOdps = summary?.effectiveMaxOdps ?? defaultMax;
  const usedOdps = summary?.usedOdps ?? 0;
  const odpPercentage = maxOdps > 0 ? Math.min(100, Math.round((usedOdps / maxOdps) * 100)) : 0;

  return { maxOdps, usedOdps, odpPercentage };
}

function getStorageLimits(summary: SubscriptionSummary | null | undefined, tier: NormalizedTier) {
  const defaultMax = tier === "free" ? 2 : tier === "starter" ? 15 : tier === "enterprise" ? 500 : 100;
  const maxStorageGb = summary?.maxStorageGb ?? defaultMax;
  const usedStorageGb = summary?.usedStorageGb ?? 0;
  const storagePercentage = maxStorageGb > 0 ? Math.min(100, Math.round((usedStorageGb / maxStorageGb) * 100)) : 0;

  return { maxStorageGb, usedStorageGb, storagePercentage };
}

function getPlanDisplayName(summary: SubscriptionSummary | null | undefined, tier: NormalizedTier): string {
  if (summary?.planName) return summary.planName;
  if (tier === "enterprise") return "ENTERPRISE";
  if (tier === "starter") return "STARTER";
  if (tier === "free") return "FREE";
  return "PRO";
}

export function useTenantSubscription() {
  const { planTier: infoTier, resolvedTenant } = useTenantInfo();
  const orgSlug = resolvedTenant?.slug || getCurrentOrgSlug() || "system";

  const {
    data: summary,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<SubscriptionSummary | null>({
    queryKey: ["tenant-subscription-summary", orgSlug],
    queryFn: async () => {
      if (!orgSlug || orgSlug === "system" || orgSlug === "ftth-realm") {
        return null;
      }
      try {
        return await apiClient<SubscriptionSummary>(`/api/v1/organizations/${orgSlug}/subscription`);
      } catch (err) {
        console.warn("Failed to fetch tenant subscription summary:", err);
        return null;
      }
    },
    staleTime: 60 * 1000,
  });

  const rawPlanString =
    summary?.planName ||
    summary?.planTier ||
    resolvedTenant?.planTier ||
    infoTier ||
    "free";

  const tier = React.useMemo(() => parseTier(rawPlanString), [rawPlanString]);
  const status = summary?.status || resolvedTenant?.status || (tier === "free" ? "TRIAL" : "ACTIVE");
  const isTrialExpired = Boolean(summary?.isTrialExpired || status === "TRIAL_EXPIRED");

  const gracePeriodUntil = summary?.gracePeriodUntil || null;
  const graceDaysRemaining = React.useMemo(() => {
    if (!gracePeriodUntil) return 0;
    try {
      const diffMs = new Date(gracePeriodUntil).getTime() - Date.now();
      return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    } catch {
      return 0;
    }
  }, [gracePeriodUntil]);

  const isGracePeriodActive = isTrialExpired && graceDaysRemaining > 0;

  const { maxProjects, usedProjects, projectPercentage, canCreateProject } = React.useMemo(
    () => getProjectLimits(summary, tier, isTrialExpired, status),
    [summary, tier, isTrialExpired, status]
  );

  const { maxOdps, usedOdps, odpPercentage } = React.useMemo(
    () => getOdpLimits(summary, tier),
    [summary, tier]
  );

  const { maxStorageGb, usedStorageGb, storagePercentage } = React.useMemo(
    () => getStorageLimits(summary, tier),
    [summary, tier]
  );

  const isProOrEnterprise = tier === "pro" || tier === "enterprise";
  const isEnterprise = tier === "enterprise";
  const planName = React.useMemo(() => {
    if (summary?.planName) return summary.planName;
    if (resolvedTenant?.planTier) return resolvedTenant.planTier.toUpperCase();
    return getPlanDisplayName(summary, tier);
  }, [summary, resolvedTenant?.planTier, tier]);

  return {
    summary,
    tier,
    planName,
    planCycle: summary?.planCycle || "MONTHLY",
    status,
    isOverQuota: Boolean(summary?.isOverQuota),
    isSoftLocked: Boolean(summary?.isSoftLocked),
    isTrialExpired,
    isGracePeriodActive,
    gracePeriodUntil,
    graceDaysRemaining,
    trialDaysRemaining: summary?.trialDaysRemaining ?? (status === "TRIAL" ? 14 : 0),
    isBoosterActive: Boolean(summary?.isBoosterActive),
    boosterDaysRemaining: summary?.boosterDaysRemaining ?? 0,

    // Project limits
    usedProjects,
    maxProjects,
    projectPercentage,
    canCreateProject,

    // ODP limits
    usedOdps,
    maxOdps,
    odpPercentage,

    // Storage limits
    usedStorageGb,
    maxStorageGb,
    storagePercentage,

    // Feature gates
    canAccessHeatmap: isProOrEnterprise,
    canAccessCadBuilder: isProOrEnterprise,
    canAccessOltPoller: isProOrEnterprise,
    canAccessAiAssistant: isEnterprise,
    canAccessCustomDomain: isEnterprise,
    canAccessSso: summary?.hasSso ?? isProOrEnterprise,
    canAccessApi: summary?.hasApiAccess ?? (tier !== "free"),

    isLoading,
    isError,
    error,
    refetch,
  };
}

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

  // FTTH Projects & Archived Quotas
  maxProjects?: number;
  usedProjects?: number;
  effectiveMaxProjects?: number;
  archivedProjects?: number;
  maxArchivedProjects?: number;

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

const TIER_PROJECT_LIMITS: Record<NormalizedTier, number> = {
  free: 1,
  starter: 2,
  pro: 6,
  enterprise: 25,
};

function parseTier(rawInput?: string): NormalizedTier {
  if (!rawInput) return "free";
  const raw = rawInput.toLowerCase();
  if (raw.includes("enterprise") || raw.includes("telco")) return "enterprise";
  if (raw.includes("pro") || raw.includes("professional")) return "pro";
  if (raw.includes("starter") || raw.includes("lite")) return "starter";
  return "free";
}

export function getRecommendedUpgradeTier(
  currentTier: NormalizedTier,
  requiredTier?: NormalizedTier
): NormalizedTier {
  const TIER_ORDER: NormalizedTier[] = ["free", "starter", "pro", "enterprise"];
  const currentIndex = TIER_ORDER.indexOf(currentTier);

  // By default, recommend the next tier level up
  let targetIndex = Math.min(currentIndex + 1, TIER_ORDER.length - 1);
  if (targetIndex === 0) targetIndex = 1; // if free, recommend starter

  // If a specific requiredTier is provided and is higher, recommend that one
  if (requiredTier) {
    const reqIndex = TIER_ORDER.indexOf(requiredTier);
    if (reqIndex > targetIndex) {
      targetIndex = reqIndex;
    }
  }

  return TIER_ORDER[targetIndex];
}

function getProjectLimits(summary: SubscriptionSummary | null | undefined, tier: NormalizedTier, isTrialExpired: boolean, status: string) {
  const defaultMax = TIER_PROJECT_LIMITS[tier] ?? 1;
  const maxProjects = summary?.effectiveMaxProjects ?? summary?.maxProjects ?? summary?.effectiveMaxOlts ?? defaultMax;
  const usedProjects = summary?.usedProjects ?? summary?.usedOlts ?? 0;
  const projectPercentage = maxProjects > 0 ? Math.min(100, Math.round((usedProjects / maxProjects) * 100)) : 0;

  const maxArchivedProjects = summary?.maxArchivedProjects ?? defaultMax;
  const archivedProjects = summary?.archivedProjects ?? 0;
  const archivedPercentage = maxArchivedProjects > 0 ? Math.min(100, Math.round((archivedProjects / maxArchivedProjects) * 100)) : 0;

  const isBlocked = isTrialExpired || status === "TRIAL_EXPIRED" || status === "SUSPENDED" || Boolean(summary?.isSoftLocked);
  const canCreateProject = usedProjects < maxProjects && !isBlocked;
  const canArchiveProject = archivedProjects < maxArchivedProjects;

  return {
    maxProjects,
    usedProjects,
    projectPercentage,
    canCreateProject,
    maxArchivedProjects,
    archivedProjects,
    archivedPercentage,
    canArchiveProject,
  };
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

function computeGraceDays(gracePeriodUntil?: string | null): number {
  if (!gracePeriodUntil) return 0;
  try {
    const diffMs = new Date(gracePeriodUntil).getTime() - Date.now();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  } catch {
    return 0;
  }
}

function resolveRawPlanString(summary?: SubscriptionSummary | null, resolvedTier?: string, infoTier?: string): string {
  return summary?.planName || summary?.planTier || resolvedTier || infoTier || "free";
}

function resolvePlanName(summary?: SubscriptionSummary | null, resolvedTier?: string, tier?: NormalizedTier): string {
  if (summary?.planName) return summary.planName;
  if (resolvedTier) return resolvedTier.toUpperCase();
  return getPlanDisplayName(summary, tier || "free");
}

function resolveFeatureGates(summary: SubscriptionSummary | null | undefined, tier: NormalizedTier) {
  const isProOrEnterprise = tier === "pro" || tier === "enterprise";
  const isEnterprise = tier === "enterprise";
  return {
    isProOrEnterprise,
    isEnterprise,
    canAccessHeatmap: isProOrEnterprise,
    canAccessCadBuilder: isProOrEnterprise,
    canAccessOltPoller: isProOrEnterprise,
    canAccessAiAssistant: isEnterprise,
    canAccessCustomDomain: isEnterprise,
    canAccessSso: summary?.hasSso ?? isProOrEnterprise,
    canAccessApi: summary?.hasApiAccess ?? (tier !== "free"),
  };
}

function resolveLifecycleStats(summary: SubscriptionSummary | null | undefined, status: string, isTrialExpired: boolean) {
  const gracePeriodUntil = summary?.gracePeriodUntil || null;
  const graceDaysRemaining = computeGraceDays(gracePeriodUntil);
  const isGracePeriodActive = isTrialExpired && graceDaysRemaining > 0;
  const trialDaysRemaining = summary?.trialDaysRemaining ?? (status === "TRIAL" ? 14 : 0);
  const isBoosterActive = Boolean(summary?.isBoosterActive);
  const boosterDaysRemaining = summary?.boosterDaysRemaining ?? 0;

  return {
    gracePeriodUntil,
    graceDaysRemaining,
    isGracePeriodActive,
    trialDaysRemaining,
    isBoosterActive,
    boosterDaysRemaining,
  };
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

  const rawPlanString = resolveRawPlanString(summary, resolvedTenant?.planTier, infoTier);
  const tier = React.useMemo(() => parseTier(rawPlanString), [rawPlanString]);
  const status = summary?.status || resolvedTenant?.status || (tier === "free" ? "TRIAL" : "ACTIVE");
  const isTrialExpired = Boolean(summary?.isTrialExpired || status === "TRIAL_EXPIRED");

  const lifecycle = React.useMemo(
    () => resolveLifecycleStats(summary, status, isTrialExpired),
    [summary, status, isTrialExpired]
  );

  const {
    maxProjects,
    usedProjects,
    projectPercentage,
    canCreateProject,
    maxArchivedProjects,
    archivedProjects,
    archivedPercentage,
    canArchiveProject,
  } = React.useMemo(
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

  const features = React.useMemo(() => resolveFeatureGates(summary, tier), [summary, tier]);
  const planName = React.useMemo(
    () => resolvePlanName(summary, resolvedTenant?.planTier, tier),
    [summary, resolvedTenant?.planTier, tier]
  );

  return {
    summary,
    tier,
    planName,
    planCycle: summary?.planCycle || "MONTHLY",
    status,
    isOverQuota: Boolean(summary?.isOverQuota),
    isSoftLocked: Boolean(summary?.isSoftLocked),
    isTrialExpired,
    isGracePeriodActive: lifecycle.isGracePeriodActive,
    gracePeriodUntil: lifecycle.gracePeriodUntil,
    graceDaysRemaining: lifecycle.graceDaysRemaining,
    trialDaysRemaining: lifecycle.trialDaysRemaining,
    isBoosterActive: lifecycle.isBoosterActive,
    boosterDaysRemaining: lifecycle.boosterDaysRemaining,

    // Recommended upgrade tier based on current tier & limits
    recommendedUpgradeTier: getRecommendedUpgradeTier(tier),

    // Project limits (Active & Archived)
    usedProjects,
    maxProjects,
    projectPercentage,
    canCreateProject,
    archivedProjects,
    maxArchivedProjects,
    archivedPercentage,
    canArchiveProject,

    // ODP limits
    usedOdps,
    maxOdps,
    odpPercentage,

    // Storage limits
    usedStorageGb,
    maxStorageGb,
    storagePercentage,

    // Feature gates
    canAccessHeatmap: features.canAccessHeatmap,
    canAccessCadBuilder: features.canAccessCadBuilder,
    canAccessOltPoller: features.canAccessOltPoller,
    canAccessAiAssistant: features.canAccessAiAssistant,
    canAccessCustomDomain: features.canAccessCustomDomain,
    canAccessSso: features.canAccessSso,
    canAccessApi: features.canAccessApi,

    isLoading,
    isError,
    error,
    refetch,
  };
}

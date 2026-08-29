"use server";

import {
  getGatewayToken,
  verifySuperAdmin,
  GATEWAY_BASE_URL,
} from "./common";

export interface SubscriptionSummary {
  orgId: string;
  orgName: string;
  orgSlug: string;
  status: string;
  planTier: string;
  planName: string;
  planPrice: number;
  planCycle: string;

  maxOlts: number;
  usedOlts: number;
  maxOdps: number;
  usedOdps: number;
  maxStorageGb: number;
  usedStorageGb: number;
  apiRateLimitMax: number;
  apiRateLimitUsed: number;

  isBoosterActive: boolean;
  boosterOlts: number;
  boosterOdps: number;
  boosterExpiresAt?: string;
  boosterDaysRemaining: number;
  effectiveMaxOlts: number;
  effectiveMaxOdps: number;

  trialExpiresAt?: string;
  isTrialExpired: boolean;
  trialDaysRemaining: number;
  gracePeriodUntil?: string;
  dunningLevel: number;
  isOverQuota: boolean;
  isSoftLocked: boolean;
}

export interface ProrationEstimate {
  currentPlan: string;
  targetPlan: string;
  currentPlanPrice: number;
  targetPlanPrice: number;
  totalCycleDays: number;
  remainingDays: number;
  unusedOldPlanCredit: number;
  newPlanProratedCost: number;
  netPayableDelta: number;
}

export async function getSubscriptionSummary(slug: string): Promise<SubscriptionSummary> {
  await verifySuperAdmin();
  const token = getGatewayToken();
  const res = await fetch(`${GATEWAY_BASE_URL}/api/v1/organizations/${slug}/subscription`, {
    headers: {
      "X-Gateway-Token": token,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch subscription summary: ${res.statusText}`);
  }
  return res.json();
}

export async function upgradeSubscriptionPlan(
  slug: string,
  request: {
    newPlanName: string;
    planCycle?: string;
    isDirectOverride?: boolean;
    notes?: string;
  }
): Promise<SubscriptionSummary> {
  await verifySuperAdmin();
  const token = getGatewayToken();
  const res = await fetch(`${GATEWAY_BASE_URL}/api/v1/organizations/${slug}/subscription/upgrade`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Gateway-Token": token,
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown error");
    throw new Error(err || "Failed to upgrade subscription plan");
  }
  return res.json();
}

export async function downgradeSubscriptionPlan(
  slug: string,
  request: {
    targetPlanName: string;
    reason: string;
    acknowledgeOverQuota?: boolean;
  }
): Promise<{
  status: string;
  overQuotaMode: boolean;
  usedOlts: number;
  targetMaxOlts: number;
  usedOdps: number;
  targetMaxOdps: number;
  gracePeriodUntil?: string;
  summary: SubscriptionSummary;
}> {
  await verifySuperAdmin();
  const token = getGatewayToken();
  const res = await fetch(`${GATEWAY_BASE_URL}/api/v1/organizations/${slug}/subscription/downgrade`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Gateway-Token": token,
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown error");
    throw new Error(err || "Failed to downgrade subscription plan");
  }
  return res.json();
}

export async function getProrationEstimate(
  slug: string,
  targetPlan: string,
  targetCycle = "MONTHLY"
): Promise<ProrationEstimate> {
  await verifySuperAdmin();
  const token = getGatewayToken();
  const res = await fetch(
    `${GATEWAY_BASE_URL}/api/v1/organizations/${slug}/subscription/prorate-estimate?targetPlan=${encodeURIComponent(
      targetPlan
    )}&targetCycle=${encodeURIComponent(targetCycle)}`,
    {
      headers: {
        "X-Gateway-Token": token,
      },
      next: { revalidate: 0 },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to calculate proration estimate");
  }
  return res.json();
}

export async function applyEmergencyBooster(
  slug: string,
  request: {
    boosterOlts: number;
    boosterOdps: number;
    durationDays?: number;
    reason?: string;
  }
): Promise<SubscriptionSummary> {
  await verifySuperAdmin();
  const token = getGatewayToken();
  const res = await fetch(`${GATEWAY_BASE_URL}/api/v1/organizations/${slug}/subscription/booster`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Gateway-Token": token,
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown error");
    throw new Error(err || "Failed to apply emergency booster");
  }
  return res.json();
}

export async function extendTrialPeriod(
  slug: string,
  request: {
    additionalDays?: number;
    reason?: string;
  }
): Promise<SubscriptionSummary> {
  await verifySuperAdmin();
  const token = getGatewayToken();
  const res = await fetch(`${GATEWAY_BASE_URL}/api/v1/organizations/${slug}/subscription/trial-extend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Gateway-Token": token,
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown error");
    throw new Error(err || "Failed to extend trial period");
  }
  return res.json();
}

export async function updateDunningStatus(
  slug: string,
  request: {
    dunningLevel: number;
    notes?: string;
  }
): Promise<SubscriptionSummary> {
  await verifySuperAdmin();
  const token = getGatewayToken();
  const res = await fetch(`${GATEWAY_BASE_URL}/api/v1/organizations/${slug}/subscription/dunning`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Gateway-Token": token,
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown error");
    throw new Error(err || "Failed to update dunning status");
  }
  return res.json();
}

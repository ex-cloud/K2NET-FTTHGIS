export type OrganizationStatus =
  | "ACTIVE"
  | "TRIAL"
  | "PROVISIONING"
  | "OVERDUE"
  | "SUSPENDED"
  | "TRIAL_EXPIRED"
  | "PENDING_APPROVAL"
  | "DELETED";

export type SlaTier = "Platinum (99.9%)" | "Gold (99.5%)" | "Standard (99.0%)";

export type PlanTier = "Starter" | "Professional" | "Enterprise" | "Custom";

export function normalizePlanTier(name?: string | null): PlanTier {
  if (!name) return "Starter";
  const upper = name.toUpperCase();
  if (upper === "FREE" || upper === "STARTER" || upper.includes("FREE") || upper.includes("STARTER") || upper.includes("TRIAL")) return "Starter";
  if (upper === "PRO" || upper === "PROFESSIONAL" || upper.includes("PRO")) return "Professional";
  if (upper === "ENTERPRISE") return "Enterprise";
  if (upper === "CUSTOM") return "Custom";
  return "Starter";
}

export function toBackendPlanName(tier: PlanTier | string): string {
  switch (tier) {
    case "Starter":
      return "FREE";
    case "Professional":
      return "PRO";
    case "Enterprise":
      return "ENTERPRISE";
    case "Custom":
      return "ENTERPRISE";
    default:
      return typeof tier === "string" ? tier.toUpperCase() : "PRO";
  }
}

export function calculateTrialDaysLeft(trialExpiresAt?: string, status?: string): number | undefined {
  if (trialExpiresAt) {
    try {
      const exp = new Date(trialExpiresAt).getTime();
      const now = Date.now();
      return Math.max(0, Math.ceil((exp - now) / 86400000));
    } catch {
      return 7;
    }
  }
  return status === "TRIAL" ? 7 : undefined;
}

export interface OrganizationFeatureFlags {
  gisCore: boolean;
  oltPoller: boolean;
  whatsappEngine: boolean;
  aiCopilot: boolean;
  sandboxMode: boolean;
}

export interface EnrichedOrganization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  website?: string;
  logoUrl?: string;
  status: OrganizationStatus;
  planTier: PlanTier;
  createdAt: string;

  // Contact / PIC
  picName?: string;
  picPhone?: string;
  picEmail?: string;
  slaTier: SlaTier;

  // FTTH Spatial Hardware Quota
  maxOlts: number;
  usedOlts: number;
  maxOdps: number;
  usedOdps: number;
  maxStorageGb: number;
  usedStorageGb: number;

  // Custom Domain & SSL
  customDomain?: string;
  domainVerified: boolean;
  domainSslActive: boolean;

  // Feature Flags
  featureFlags: OrganizationFeatureFlags;

  // Telemetry & Rate Limiting
  apiRateLimitUsed: number;
  apiRateLimitMax: number;
  apiLatencyMs: number;

  // Lifecycle Details
  provisioningStep?: number; // 1: DB Schema, 2: IAM Realm, 3: Kong Route, 4: MinIO S3
  trialDaysLeft?: number;
  trialExpiresAt?: string;
  isTrialExpired?: boolean;
  gracePeriodUntil?: string;
  dunningLevel?: number;
  planCycle?: "MONTHLY" | "YEARLY";
  overQuotaMode?: boolean;
  isOverQuota?: boolean;
  isSoftLocked?: boolean;

  // Emergency Quota Booster
  isBoosterActive?: boolean;
  boosterOdps?: number;
  boosterOlts?: number;
  boosterExpiresAt?: string;
  boosterDaysRemaining?: number;
  effectiveMaxOlts?: number;
  effectiveMaxOdps?: number;
}

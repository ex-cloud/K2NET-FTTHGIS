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
  [key: string]: boolean;
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

export function enrichOrganization(
  rawOrg: any,
  stats: any = {}
): EnrichedOrganization {
  const planTier = normalizePlanTier(rawOrg.subscriptionPlan?.name);
  const status = (rawOrg.status || "ACTIVE") as OrganizationStatus;

  const persistedFlags = stats?.featureFlags as OrganizationFeatureFlags | undefined;
  const resolvedFlags: OrganizationFeatureFlags = {
    gisCore: persistedFlags?.gisCore ?? true,
    oltPoller: persistedFlags?.oltPoller ?? (planTier !== "Starter"),
    whatsappEngine: persistedFlags?.whatsappEngine ?? true,
    aiCopilot: persistedFlags?.aiCopilot ?? (planTier === "Enterprise"),
    sandboxMode: persistedFlags?.sandboxMode ?? false,
  };

  const resolvedPicName = rawOrg.adminUsername && rawOrg.adminUsername.trim() !== "" ? rawOrg.adminUsername : "—";
  const resolvedPicEmail = rawOrg.adminEmail && rawOrg.adminEmail.trim() !== "" ? rawOrg.adminEmail : `${rawOrg.slug}@kdua.net`;

  const hasCustomDomain = Boolean(rawOrg.website?.includes(".") && !rawOrg.website.includes("kdua.net"));
  const customDomain = hasCustomDomain ? rawOrg.website!.replace(/^https?:\/\//, "").replace(/\/.*$/, "") : undefined;

  return {
    id: rawOrg.id || `org-${rawOrg.slug}`,
    name: rawOrg.name || rawOrg.slug,
    slug: rawOrg.slug,
    description: rawOrg.description,
    address: rawOrg.address,
    website: rawOrg.website,
    logoUrl: rawOrg.logoUrl,
    status: status,
    planTier: planTier,
    createdAt: rawOrg.createdAt || "2026-08-20",

    picName: resolvedPicName,
    picEmail: resolvedPicEmail,
    picPhone: undefined,
    slaTier: planTier === "Enterprise" ? "Platinum (99.9%)" : planTier === "Professional" ? "Gold (99.5%)" : "Standard (99.0%)",

    maxOlts: rawOrg.subscriptionPlan?.maxProjects || (planTier === "Enterprise" ? 20 : planTier === "Starter" ? 2 : 5),
    usedOlts: stats?.usedOlts ?? stats?.projectCount ?? 0,
    maxOdps: rawOrg.subscriptionPlan?.maxOdps || (planTier === "Enterprise" ? 10000 : planTier === "Starter" ? 500 : 2500),
    usedOdps: stats?.usedOdps ?? 0,
    maxStorageGb: planTier === "Enterprise" ? 100 : planTier === "Starter" ? 10 : 25,
    usedStorageGb: stats?.usedStorageGb ?? 0,

    customDomain: customDomain,
    domainVerified: hasCustomDomain,
    domainSslActive: hasCustomDomain,

    featureFlags: resolvedFlags,

    apiRateLimitUsed: stats?.apiRateLimitUsed ?? 0,
    apiRateLimitMax: planTier === "Enterprise" ? 20000 : planTier === "Starter" ? 2000 : 5000,
    apiLatencyMs: stats?.apiLatencyMs ?? 0,
    trialDaysLeft: calculateTrialDaysLeft(rawOrg.trialExpiresAt, status),
  };
}

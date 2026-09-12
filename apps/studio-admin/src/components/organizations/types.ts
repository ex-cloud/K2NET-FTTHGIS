import type { Organization, OrganizationStats } from "@/hooks/useOrganizations";

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
  effectiveMaxOlts?: number;
  effectiveMaxOdps?: number;
}

export interface RawOrganizationInput {
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  address?: string;
  website?: string;
  logoUrl?: string;
  status?: string;
  createdAt?: string;
  adminUsername?: string;
  adminEmail?: string;
  trialExpiresAt?: string;
  subscriptionPlan?: {
    name?: string;
    maxProjects?: number;
    maxOdps?: number;
    maxCustomers?: number;
    maxOdcs?: number;
  };
}

export interface OrganizationStatsInput {
  usedOlts?: number;
  projectCount?: number;
  usedOdps?: number;
  usedStorageGb?: number;
  apiRateLimitUsed?: number;
  apiLatencyMs?: number;
  featureFlags?: OrganizationFeatureFlags | Record<string, boolean>;
}

function resolveSlaTier(tier: PlanTier): SlaTier {
  if (tier === "Enterprise") return "Platinum (99.9%)";
  if (tier === "Professional") return "Gold (99.5%)";
  return "Standard (99.0%)";
}

function resolveFeatureFlags(
  persisted?: Partial<OrganizationFeatureFlags>,
  tier?: PlanTier
): OrganizationFeatureFlags {
  return {
    gisCore: persisted?.gisCore ?? true,
    oltPoller: persisted?.oltPoller ?? (tier !== "Starter"),
    whatsappEngine: persisted?.whatsappEngine ?? true,
    aiCopilot: persisted?.aiCopilot ?? (tier === "Enterprise"),
    sandboxMode: persisted?.sandboxMode ?? false,
  };
}

function resolveMaxQuotas(
  tier: PlanTier,
  plan?: RawOrganizationInput["subscriptionPlan"]
) {
  const isEnterprise = tier === "Enterprise";
  const isStarter = tier === "Starter";

  const defaultOlts = isEnterprise ? 20 : isStarter ? 2 : 5;
  const defaultOdps = isEnterprise ? 10000 : isStarter ? 500 : 2500;
  const maxStorageGb = isEnterprise ? 100 : isStarter ? 10 : 25;
  const apiRateLimitMax = isEnterprise ? 20000 : isStarter ? 2000 : 5000;

  return {
    maxOlts: plan?.maxProjects || defaultOlts,
    maxOdps: plan?.maxOdps || defaultOdps,
    maxStorageGb,
    apiRateLimitMax,
  };
}

function resolveCustomDomain(website?: string): { customDomain?: string; hasCustomDomain: boolean } {
  if (!website || !website.includes(".") || website.includes("kdua.net")) {
    return { hasCustomDomain: false };
  }
  const cleanDomain = website.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return { customDomain: cleanDomain, hasCustomDomain: true };
}

function resolvePicInfo(rawOrg: Organization | RawOrganizationInput): { picName: string; picEmail: string } {
  const picName = rawOrg.adminUsername && rawOrg.adminUsername.trim() !== "" ? rawOrg.adminUsername : "—";
  const picEmail = rawOrg.adminEmail && rawOrg.adminEmail.trim() !== "" ? rawOrg.adminEmail : `${rawOrg.slug || "tenant"}@kdua.net`;
  return { picName, picEmail };
}

function resolveUsedQuotas(stats: Partial<OrganizationStats> | OrganizationStatsInput) {
  return {
    usedOlts: stats?.usedOlts ?? stats?.projectCount ?? 0,
    usedOdps: stats?.usedOdps ?? 0,
    usedStorageGb: stats?.usedStorageGb ?? 0,
    apiRateLimitUsed: stats?.apiRateLimitUsed ?? 0,
    apiLatencyMs: stats?.apiLatencyMs ?? 0,
  };
}

export function enrichOrganization(
  rawOrg: Organization | RawOrganizationInput,
  stats: Partial<OrganizationStats> | OrganizationStatsInput = {}
): EnrichedOrganization {
  const planTier = normalizePlanTier(rawOrg.subscriptionPlan?.name);
  const status = (rawOrg.status || "ACTIVE") as OrganizationStatus;
  const featureFlags = resolveFeatureFlags(stats?.featureFlags as Partial<OrganizationFeatureFlags> | undefined, planTier);
  const quotas = resolveMaxQuotas(planTier, rawOrg.subscriptionPlan);
  const { customDomain, hasCustomDomain } = resolveCustomDomain(rawOrg.website);
  const { picName, picEmail } = resolvePicInfo(rawOrg);
  const used = resolveUsedQuotas(stats);

  return {
    id: rawOrg.id || `org-${rawOrg.slug || "tenant"}`,
    name: rawOrg.name || rawOrg.slug || "Organization",
    slug: rawOrg.slug || "tenant",
    description: rawOrg.description,
    address: rawOrg.address,
    website: rawOrg.website,
    logoUrl: rawOrg.logoUrl,
    status,
    planTier,
    createdAt: rawOrg.createdAt || "2026-08-20",

    picName,
    picEmail,
    picPhone: undefined,
    slaTier: resolveSlaTier(planTier),

    maxOlts: quotas.maxOlts,
    usedOlts: used.usedOlts,
    maxOdps: quotas.maxOdps,
    usedOdps: used.usedOdps,
    maxStorageGb: quotas.maxStorageGb,
    usedStorageGb: used.usedStorageGb,

    customDomain,
    domainVerified: hasCustomDomain,
    domainSslActive: hasCustomDomain,

    featureFlags,

    apiRateLimitUsed: used.apiRateLimitUsed,
    apiRateLimitMax: quotas.apiRateLimitMax,
    apiLatencyMs: used.apiLatencyMs,
    trialDaysLeft: calculateTrialDaysLeft(rawOrg.trialExpiresAt, status),
  };
}

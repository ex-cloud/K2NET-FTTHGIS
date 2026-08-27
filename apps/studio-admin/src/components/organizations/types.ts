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
}

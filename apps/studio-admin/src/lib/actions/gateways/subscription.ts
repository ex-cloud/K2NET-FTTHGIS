"use server";

import { auth } from "@/auth";
import {
  getGatewayToken,
  verifySuperAdmin,
} from "./common";

const BACKEND_BASE_URL =
  process.env.BACKEND_API_URL ||
  process.env.BACKEND_INTERNAL_URL ||
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, "") ||
  "http://backend:9090";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const session = await auth();
  const token = session?.accessToken as string | undefined;
  const gatewayToken = getGatewayToken();
  const headers: Record<string, string> = {
    "X-Gateway-Token": gatewayToken,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

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
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_BASE_URL}/api/v1/organizations/${slug}/subscription`, {
    headers,
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
  const headers = await getAuthHeaders();
  headers["Content-Type"] = "application/json";

  const res = await fetch(`${BACKEND_BASE_URL}/api/v1/organizations/${slug}/subscription/upgrade`, {
    method: "POST",
    headers,
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
  const headers = await getAuthHeaders();
  headers["Content-Type"] = "application/json";

  const res = await fetch(`${BACKEND_BASE_URL}/api/v1/organizations/${slug}/subscription/downgrade`, {
    method: "POST",
    headers,
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
  targetCycle: string = "MONTHLY"
): Promise<ProrationEstimate> {
  await verifySuperAdmin();
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/v1/organizations/${slug}/subscription/prorate-estimate?targetPlan=${encodeURIComponent(
      targetPlan
    )}&targetCycle=${encodeURIComponent(targetCycle)}`,
    {
      headers,
      next: { revalidate: 0 },
    }
  );

  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown error");
    throw new Error(err || "Failed to calculate proration estimate");
  }
  return res.json();
}

export async function applyEmergencyBooster(
  slug: string,
  request: {
    boosterOdps: number;
    boosterOlts?: number;
    additionalOdps?: number;
    additionalOlts?: number;
    durationDays?: number;
    reason?: string;
  }
): Promise<SubscriptionSummary> {
  await verifySuperAdmin();
  const headers = await getAuthHeaders();
  headers["Content-Type"] = "application/json";

  const payload = {
    boosterOdps: request.boosterOdps ?? request.additionalOdps ?? 0,
    boosterOlts: request.boosterOlts ?? request.additionalOlts ?? 0,
    durationDays: request.durationDays ?? 30,
    reason: request.reason || "Super Admin Emergency Quota Booster",
  };

  const res = await fetch(`${BACKEND_BASE_URL}/api/v1/organizations/${slug}/subscription/booster`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
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
  const headers = await getAuthHeaders();
  headers["Content-Type"] = "application/json";

  const res = await fetch(`${BACKEND_BASE_URL}/api/v1/organizations/${slug}/subscription/trial-extend`, {
    method: "POST",
    headers,
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
  const headers = await getAuthHeaders();
  headers["Content-Type"] = "application/json";

  const res = await fetch(`${BACKEND_BASE_URL}/api/v1/organizations/${slug}/subscription/dunning`, {
    method: "POST",
    headers,
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown error");
    throw new Error(err || "Failed to update dunning status");
  }
  return res.json();
}

export interface SubscriptionPlanFeature {
  title: string;
  detail: string;
}

export interface SubscriptionPlanInfo {
  id?: string;
  name: string;
  code: string;
  price: string;
  numericPrice: number;
  period: string;
  description: string;
  popular?: boolean;
  maxOlts: number;
  maxOdps: number;
  maxOdcs: number;
  maxStorageGb: number;
  apiRpm: number;
  hasSso: boolean;
  hasApiAccess: boolean;
  features: SubscriptionPlanFeature[];
}

export async function getAvailableSubscriptionPlans(): Promise<SubscriptionPlanInfo[]> {
  await verifySuperAdmin();
  const headers = await getAuthHeaders();
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/v1/organizations/plans`, {
      headers,
      next: { revalidate: 60 },
    });

    if (res.ok) {
      const rawPlans: any[] = await res.json();
      if (Array.isArray(rawPlans) && rawPlans.length > 0) {
        const mapped: SubscriptionPlanInfo[] = rawPlans.map((p) => {
          const numPrice = Number(p.price || 0);
          const formattedPrice =
            numPrice === 0
              ? "Free Trial"
              : `Rp ${numPrice.toLocaleString("id-ID")}`;

          const maxOlts = Number(p.maxProjects || 0);
          const maxOdps = Number(p.maxOdps || 0);
          const maxOdcs = Number(p.maxOdcs || 0);
          const maxCustomers = Number(p.maxCustomers || 0);
          const maxStorageGb = maxOlts >= 20 ? 100 : maxOlts >= 5 ? 50 : 10;
          const apiRpm = p.hasApiAccess ? (maxOlts >= 20 ? 20000 : 5000) : 2000;
          const hasSso = Boolean(p.hasSso);
          const hasApiAccess = Boolean(p.hasApiAccess);

          const features: SubscriptionPlanFeature[] = [
            {
              title: `Maks. ${maxOlts} OLT & ${maxOdps.toLocaleString("id-ID")} ODP`,
              detail: "Alokasi kapasitas pemetaan topologi kabel fiber optik",
            },
            {
              title: `Maks. ${maxOdcs.toLocaleString("id-ID")} ODC & ${maxCustomers.toLocaleString("id-ID")} Pelanggan`,
              detail: "Kapasitas distribusi FAT / closure dan data pelanggan",
            },
            {
              title: `${maxStorageGb} GB MinIO S3 Storage`,
              detail: "Penyimpanan berkas foto redaman, surat jalan, dan dokumen",
            },
            {
              title: hasApiAccess ? `API Access (${apiRpm.toLocaleString("id-ID")} RPM)` : "Standard API Rate Limit",
              detail: hasApiAccess
                ? "Integrasi REST API, webhook, dan SNMP OLT Poller telemetry"
                : "Akses integrasi sistem billing dan CRM",
            },
            {
              title: hasSso ? "Keycloak SSO / LDAP Federation" : "Standard Email & Password Auth",
              detail: hasSso
                ? "Integrasi IAM keamanan terpusat & multi-faktor autentikasi"
                : "Manajemen kredensial tim operasional",
            },
            {
              title: maxOlts >= 20 ? "Platinum 99.9% 24/7 SLA Matrix" : maxOlts >= 5 ? "Gold 99.5% SLA Support" : "Standard Community Support",
              detail: maxOlts >= 20
                ? "Dedicated Technical Account Manager & prioritas eskalasi"
                : "Dukungan bantuan tiket teknis dan forum komunitas",
            },
          ];

          return {
            id: p.id,
            name: p.name,
            code: p.name,
            price: formattedPrice,
            numericPrice: numPrice,
            period: "/ month",
            description: p.description || `Paket layanan infrastruktur GIS FTTH terkelola tier ${p.name}.`,
            popular: false,
            maxOlts,
            maxOdps,
            maxOdcs,
            maxStorageGb,
            apiRpm,
            hasSso,
            hasApiAccess,
            features,
          };
        });

        // Sort ascending by price
        mapped.sort((a, b) => a.numericPrice - b.numericPrice);

        // Mark popular tier dynamically (the middle tier if 3 or more plans)
        if (mapped.length >= 3) {
          const midIdx = Math.floor(mapped.length / 2);
          mapped[midIdx].popular = true;
        }

        return mapped;
      }
    }
  } catch {
    // Network or server unreachable
  }

  // Canonical baseline seed fallback
  return [
    {
      name: "FREE",
      code: "FREE",
      price: "Free Trial",
      numericPrice: 0,
      period: "/ month",
      description: "Starter evaluation trial with basic hardware quotas and standard community support.",
      popular: false,
      maxOlts: 2,
      maxOdps: 500,
      maxOdcs: 100,
      maxStorageGb: 10,
      apiRpm: 2000,
      hasSso: false,
      hasApiAccess: false,
      features: [
        { title: "Maks. 2 OLT & 500 ODP", detail: "Alokasi kapasitas pemetaan topologi kabel fiber optik" },
        { title: "Maks. 100 ODC & 1.000 Pelanggan", detail: "Kapasitas distribusi FAT / closure dan data pelanggan" },
        { title: "10 GB MinIO S3 Storage", detail: "Penyimpanan berkas foto redaman, surat jalan, dan dokumen" },
        { title: "Standard API Rate Limit", detail: "Akses integrasi sistem billing dan CRM" },
        { title: "Standard Email & Password Auth", detail: "Manajemen kredensial tim operasional" },
        { title: "Standard Community Support", detail: "Dukungan bantuan tiket teknis dan forum komunitas" },
      ],
    },
    {
      name: "PRO",
      code: "PRO",
      price: "Rp 4.900.000",
      numericPrice: 4900000,
      period: "/ month",
      description: "Professional ISP tier with dedicated poller, LDAP SSO, and Gold 99.5% SLA.",
      popular: true,
      maxOlts: 5,
      maxOdps: 2500,
      maxOdcs: 500,
      maxStorageGb: 50,
      apiRpm: 5000,
      hasSso: true,
      hasApiAccess: true,
      features: [
        { title: "Maks. 5 OLT & 2.500 ODP", detail: "Alokasi kapasitas pemetaan topologi kabel fiber optik" },
        { title: "Maks. 500 ODC & 5.000 Pelanggan", detail: "Kapasitas distribusi FAT / closure dan data pelanggan" },
        { title: "50 GB MinIO S3 Storage", detail: "Penyimpanan berkas foto redaman, surat jalan, dan dokumen" },
        { title: "API Access (5.000 RPM)", detail: "Integrasi REST API, webhook, dan SNMP OLT Poller telemetry" },
        { title: "Keycloak SSO / LDAP Federation", detail: "Integrasi IAM keamanan terpusat & multi-faktor autentikasi" },
        { title: "Gold 99.5% SLA Support", detail: "Dukungan bantuan tiket teknis dan forum komunitas" },
      ],
    },
    {
      name: "ENTERPRISE",
      code: "ENTERPRISE",
      price: "Rp 14.500.000",
      numericPrice: 14500000,
      period: "/ month",
      description: "Enterprise Core tier with AI Fiber Copilot, custom POP gateway, and Platinum 99.9% SLA.",
      popular: false,
      maxOlts: 20,
      maxOdps: 10000,
      maxOdcs: 2000,
      maxStorageGb: 100,
      apiRpm: 20000,
      hasSso: true,
      hasApiAccess: true,
      features: [
        { title: "Maks. 20 OLT & 10.000 ODP", detail: "Alokasi kapasitas pemetaan topologi kabel fiber optik" },
        { title: "Maks. 2.000 ODC & 20.000 Pelanggan", detail: "Kapasitas distribusi FAT / closure dan data pelanggan" },
        { title: "100 GB MinIO S3 Storage", detail: "Penyimpanan berkas foto redaman, surat jalan, dan dokumen" },
        { title: "API Access (20.000 RPM)", detail: "Integrasi REST API, webhook, dan SNMP OLT Poller telemetry" },
        { title: "Keycloak SSO / LDAP Federation", detail: "Integrasi IAM keamanan terpusat & multi-faktor autentikasi" },
        { title: "Platinum 99.9% 24/7 SLA Matrix", detail: "Dedicated Technical Account Manager & prioritas eskalasi" },
      ],
    },
  ];
}

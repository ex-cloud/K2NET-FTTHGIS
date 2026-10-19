import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useSession } from "@/lib/auth-compat";

export type PackageCategory =
  | "TELEMETRY"
  | "FIELD_OPS"
  | "INTEGRATION"
  | "CAPACITY_BOOSTER"
  | "SECURITY_GOV"
  | "SPATIAL_AI"
  | "WHITE_LABEL"
  | "DISASTER_RECOVERY"
  | "COMPLIANCE_ROW"
  | "CONTRACTOR_OPS"
  | "SALES_EXPANSION"
  | "IOT_SENSORS"
  | "CIVIL_INFRA"
  | "AI_COPILOT"
  | "GIS_ANALYTICS"
  | "BILLING_FINANCE"
  | "WORKFORCE_SAFETY"
  | "COLLABORATION";

export type PackageBillingType =
  | "RECURRING_MONTHLY"
  | "MONTHLY_RECURRING"
  | "ANNUAL_RECURRING"
  | "ONE_TIME"
  | "METERED_USAGE";

export interface PlatformPackageItem {
  id: string;
  packageCode: string;
  packageName: string;
  description?: string;
  category: PackageCategory;
  billingType: PackageBillingType;
  priceIdr: number;
  minimumTier?: string;
  quotaDeltaOlt?: number;
  quotaDeltaOdp?: number;
  published: boolean;
  lifecycleStatus?: "PUBLISHED" | "DRAFT" | "CORE_BUNDLED" | "DEPRECATED" | string;
  prerequisiteCodes?: string[];
  conflictCodes?: string[];
  subscriberCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PackageKpiOverview {
  totalPackages: number;
  publishedPackages: number;
  draftPackages: number;
  activeSubscriptions: number;
  estimatedMonthlyAddonRevenue: number;
  categoryDistribution: Record<string, number>;
  topAdoptedPackages: Array<{
    packageCode: string;
    packageName: string;
    category: string;
    activeCount: number;
  }>;
}

export interface TenantPackageSubscriptionItem {
  id: string;
  organizationId: string;
  organizationName?: string;
  organizationSlug?: string;
  packageCode: string;
  packageName?: string;
  status: "ACTIVE" | "GRACE_PERIOD" | "EXPIRED" | "REVOKED";
  billingType: PackageBillingType;
  activatedAt: string;
  expiresAt?: string;
  autoRenew: boolean;
  effectivePriceIdr?: number;
  grantNotes?: string;
}

export interface CreatePackagePayload {
  packageCode: string;
  packageName: string;
  description?: string;
  category: PackageCategory;
  billingType: PackageBillingType;
  priceIdr: number;
  minimumTier?: string;
  quotaDeltaOlt?: number;
  quotaDeltaOdp?: number;
  published?: boolean;
  prerequisiteCodes?: string[];
  conflictCodes?: string[];
}

export interface UpdatePackagePayload {
  packageName?: string;
  description?: string;
  category?: PackageCategory;
  billingType?: PackageBillingType;
  priceIdr?: number;
  minimumTier?: string;
  quotaDeltaOlt?: number;
  quotaDeltaOdp?: number;
  published?: boolean;
  prerequisiteCodes?: string[];
  conflictCodes?: string[];
}

export interface GrantPackagePayload {
  organizationId: string;
  packageCode: string;
  durationDays: number;
  notes?: string;
}

function parsePackageQuotaDelta(item: Record<string, unknown>): { olt: number; odp: number } {
  let olt = typeof item.quotaDeltaOlt === "number" ? item.quotaDeltaOlt : undefined;
  let odp = typeof item.quotaDeltaOdp === "number" ? item.quotaDeltaOdp : undefined;
  if (item.quotaDeltaJson) {
    try {
      const q =
        typeof item.quotaDeltaJson === "string"
          ? (JSON.parse(item.quotaDeltaJson) as Record<string, unknown>)
          : (item.quotaDeltaJson as Record<string, unknown>);
      if (olt === undefined) {
        const val = q.deltaOlts !== undefined ? q.deltaOlts : q.olt;
        if (val !== undefined) olt = Number(val);
      }
      if (odp === undefined) {
        const val = q.deltaOdps !== undefined ? q.deltaOdps : q.odp;
        if (val !== undefined) odp = Number(val);
      }
    } catch {
      // ignore parse error
    }
  }
  return { olt: olt ?? 0, odp: odp ?? 0 };
}

function parsePackageDescription(item: Record<string, unknown>): string {
  if (typeof item.description === "string" && item.description.trim()) {
    return item.description;
  }
  if (item.metadataJson) {
    try {
      const m =
        typeof item.metadataJson === "string"
          ? (JSON.parse(item.metadataJson) as Record<string, unknown>)
          : (item.metadataJson as Record<string, unknown>);
      if (m?.description) return String(m.description);
    } catch {
      // ignore parse error
    }
  }
  return "";
}

function mapToPlatformPackageItem(item: Record<string, unknown>): PlatformPackageItem {
  const { olt, odp } = parsePackageQuotaDelta(item);
  const description = parsePackageDescription(item);
  const rawBilling = item.billingType;
  const billingType =
    rawBilling === "MONTHLY_RECURRING"
      ? "RECURRING_MONTHLY"
      : (rawBilling as PackageBillingType) || "RECURRING_MONTHLY";

  return {
    id: String(item.id || ""),
    packageCode: String(item.packageCode || item.code || ""),
    packageName: String(item.packageName || item.name || ""),
    description,
    category: item.category as PackageCategory,
    billingType,
    priceIdr: Number(item.priceIdr ?? item.priceMonthly ?? 0),
    minimumTier: String(item.minimumTier || item.minPlanTier || "FREE"),
    quotaDeltaOlt: olt,
    quotaDeltaOdp: odp,
    published: Boolean(item.published ?? item.isPublished ?? true),
    lifecycleStatus: String(item.lifecycleStatus || (Boolean(item.published ?? item.isPublished) ? "PUBLISHED" : "DRAFT")),
    prerequisiteCodes: Array.isArray(item.prerequisiteCodes) ? (item.prerequisiteCodes as string[]) : [],
    conflictCodes: Array.isArray(item.conflictCodes) ? (item.conflictCodes as string[]) : [],
    subscriberCount: typeof item.subscriberCount === "number" ? item.subscriberCount : undefined,
    createdAt: typeof item.createdAt === "string" ? item.createdAt : undefined,
    updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : undefined,
  };
}

export function usePlatformPackages(filters?: { status?: string; category?: string; lifecycle?: string }) {
  const { data: session, status } = useSession();
  const activeToken =
    session?.accessToken ||
    (typeof window !== "undefined"
      ? (window as unknown as { __K2NET_AUTH__?: { token?: string } }).__K2NET_AUTH__?.token
      : undefined);

  return useQuery<PlatformPackageItem[]>({
    queryKey: ["platform-packages", filters?.status, filters?.category, filters?.lifecycle, activeToken],
    queryFn: async () => {
      const baseUrl = getBackendBaseUrl();
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.category) params.append("category", filters.category);
      if (filters?.lifecycle) params.append("lifecycle", filters.lifecycle);

      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await httpClient(`${baseUrl}/system/packages${qs}`, {
        token: activeToken,
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch packages: ${res.status}`);
      }
      const rawList = await res.json();
      const list = Array.isArray(rawList) ? (rawList as Record<string, unknown>[]) : [];
      return list.map(mapToPlatformPackageItem);
    },
    enabled: status !== "unauthenticated" && (!!activeToken || typeof window !== "undefined"),
    staleTime: 30 * 1000,
  });
}

export function usePackageKpiOverview(options?: { enabled?: boolean }) {
  const { data: session, status } = useSession();
  const activeToken =
    session?.accessToken ||
    (typeof window !== "undefined"
      ? (window as unknown as { __K2NET_AUTH__?: { token?: string } }).__K2NET_AUTH__?.token
      : undefined);

  return useQuery<PackageKpiOverview>({
    queryKey: ["platform-packages-overview", activeToken],
    queryFn: async () => {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/system/packages/overview`, {
        token: activeToken,
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch packages overview: ${res.status}`);
      }
      return res.json();
    },
    enabled:
      (options?.enabled ?? true) &&
      status !== "unauthenticated" &&
      (!!activeToken || typeof window !== "undefined"),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function usePackageSubscriptions(packageCode?: string) {
  const { data: session, status } = useSession();
  const activeToken =
    session?.accessToken ||
    (typeof window !== "undefined"
      ? (window as unknown as { __K2NET_AUTH__?: { token?: string } }).__K2NET_AUTH__?.token
      : undefined);

  return useQuery<TenantPackageSubscriptionItem[]>({
    queryKey: ["platform-package-subscriptions", packageCode, activeToken],
    queryFn: async () => {
      if (!packageCode) return [];
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/system/packages/${packageCode}/subscriptions`, {
        token: activeToken,
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch package subscriptions: ${res.status}`);
      }
      return res.json();
    },
    enabled: !!packageCode && status !== "unauthenticated" && (!!activeToken || typeof window !== "undefined"),
    staleTime: 30 * 1000,
  });
}

export function useAllPackageSubscriptions() {
  const { data: session, status } = useSession();
  const activeToken =
    session?.accessToken ||
    (typeof window !== "undefined"
      ? (window as unknown as { __K2NET_AUTH__?: { token?: string } }).__K2NET_AUTH__?.token
      : undefined);

  return useQuery<TenantPackageSubscriptionItem[]>({
    queryKey: ["platform-all-package-subscriptions", activeToken],
    queryFn: async () => {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/system/packages/subscriptions`, {
        token: activeToken,
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch all subscriptions: ${res.status}`);
      }
      return res.json();
    },
    enabled: status !== "unauthenticated" && (!!activeToken || typeof window !== "undefined"),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function useCreatePackage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const activeToken =
    session?.accessToken ||
    (typeof window !== "undefined"
      ? (window as unknown as { __K2NET_AUTH__?: { token?: string } }).__K2NET_AUTH__?.token
      : undefined);

  return useMutation({
    mutationFn: async (payload: CreatePackagePayload) => {
      const baseUrl = getBackendBaseUrl();
      const quotaDelta: Record<string, number> = {};
      if (payload.quotaDeltaOlt !== undefined) quotaDelta.olt = payload.quotaDeltaOlt;
      if (payload.quotaDeltaOdp !== undefined) quotaDelta.odp = payload.quotaDeltaOdp;

      const metadata: Record<string, unknown> = {};
      if (payload.description) metadata.description = payload.description;

      const backendPayload = {
        code: payload.packageCode,
        name: payload.packageName,
        category: payload.category,
        billingType:
          payload.billingType === "MONTHLY_RECURRING" ? "RECURRING_MONTHLY" : payload.billingType,
        priceMonthly: payload.priceIdr,
        minPlanTier: payload.minimumTier || "FREE",
        quotaDeltaJson: Object.keys(quotaDelta).length > 0 ? JSON.stringify(quotaDelta) : null,
        metadataJson: Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null,
        isPublished: payload.published ?? true,
        prerequisiteCodes: payload.prerequisiteCodes || [],
        conflictCodes: payload.conflictCodes || [],
      };

      const res = await httpClient(`${baseUrl}/system/packages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backendPayload),
        token: activeToken,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create package: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-packages"] });
      queryClient.invalidateQueries({ queryKey: ["platform-packages-overview"] });
    },
  });
}

export function useUpdatePackage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const activeToken =
    session?.accessToken ||
    (typeof window !== "undefined"
      ? (window as unknown as { __K2NET_AUTH__?: { token?: string } }).__K2NET_AUTH__?.token
      : undefined);

  return useMutation({
    mutationFn: async ({ code, payload }: { code: string; payload: UpdatePackagePayload }) => {
      const baseUrl = getBackendBaseUrl();
      const quotaDelta: Record<string, number> = {};
      if (payload.quotaDeltaOlt !== undefined) quotaDelta.olt = payload.quotaDeltaOlt;
      if (payload.quotaDeltaOdp !== undefined) quotaDelta.odp = payload.quotaDeltaOdp;

      const metadata: Record<string, unknown> = {};
      if (payload.description !== undefined) metadata.description = payload.description;

      const backendPayload: Record<string, unknown> = {};
      if (payload.packageName !== undefined) backendPayload.name = payload.packageName;
      if (payload.category !== undefined) backendPayload.category = payload.category;
      if (payload.billingType !== undefined) {
        backendPayload.billingType =
          payload.billingType === "MONTHLY_RECURRING" ? "RECURRING_MONTHLY" : payload.billingType;
      }
      if (payload.priceIdr !== undefined) backendPayload.priceMonthly = payload.priceIdr;
      if (payload.minimumTier !== undefined) backendPayload.minPlanTier = payload.minimumTier;
      if (Object.keys(quotaDelta).length > 0) backendPayload.quotaDeltaJson = JSON.stringify(quotaDelta);
      if (Object.keys(metadata).length > 0) backendPayload.metadataJson = JSON.stringify(metadata);
      if (payload.published !== undefined) backendPayload.isPublished = payload.published;
      if (payload.prerequisiteCodes !== undefined) backendPayload.prerequisiteCodes = payload.prerequisiteCodes;
      if (payload.conflictCodes !== undefined) backendPayload.conflictCodes = payload.conflictCodes;

      const res = await httpClient(`${baseUrl}/system/packages/${code}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backendPayload),
        token: activeToken,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update package: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-packages"] });
      queryClient.invalidateQueries({ queryKey: ["platform-packages-overview"] });
    },
  });
}

export function useTogglePublishPackage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const activeToken =
    session?.accessToken ||
    (typeof window !== "undefined"
      ? (window as unknown as { __K2NET_AUTH__?: { token?: string } }).__K2NET_AUTH__?.token
      : undefined);

  return useMutation({
    mutationFn: async ({ code, published }: { code: string; published: boolean }) => {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/system/packages/${code}/publish?published=${published}`, {
        method: "PATCH",
        token: activeToken,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to toggle publish: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-packages"] });
      queryClient.invalidateQueries({ queryKey: ["platform-packages-overview"] });
    },
  });
}

export function useGrantPackage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const activeToken =
    session?.accessToken ||
    (typeof window !== "undefined"
      ? (window as unknown as { __K2NET_AUTH__?: { token?: string } }).__K2NET_AUTH__?.token
      : undefined);

  return useMutation({
    mutationFn: async (payload: GrantPackagePayload) => {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/system/packages/grant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        token: activeToken,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to grant package: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-packages"] });
      queryClient.invalidateQueries({ queryKey: ["platform-packages-overview"] });
      queryClient.invalidateQueries({ queryKey: ["platform-package-subscriptions"] });
    },
  });
}

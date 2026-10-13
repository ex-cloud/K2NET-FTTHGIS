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

export function usePlatformPackages(filters?: { status?: string; category?: string }) {
  const { data: session, status } = useSession();
  const activeToken =
    session?.accessToken ||
    (typeof window !== "undefined"
      ? (window as unknown as { __K2NET_AUTH__?: { token?: string } }).__K2NET_AUTH__?.token
      : undefined);

  return useQuery<PlatformPackageItem[]>({
    queryKey: ["platform-packages", filters?.status, filters?.category, activeToken],
    queryFn: async () => {
      const baseUrl = getBackendBaseUrl();
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.category) params.append("category", filters.category);

      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await httpClient(`${baseUrl}/system/packages${qs}`, {
        token: activeToken,
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch packages: ${res.status}`);
      }
      const rawList = await res.json();
      return (Array.isArray(rawList) ? rawList : []).map((item: any): PlatformPackageItem => {
        let quotaDeltaOlt = item.quotaDeltaOlt;
        let quotaDeltaOdp = item.quotaDeltaOdp;
        if (item.quotaDeltaJson) {
          try {
            const q =
              typeof item.quotaDeltaJson === "string" ? JSON.parse(item.quotaDeltaJson) : item.quotaDeltaJson;
            if (quotaDeltaOlt === undefined) {
              const val = q.deltaOlts !== undefined ? q.deltaOlts : q.olt;
              if (val !== undefined) quotaDeltaOlt = Number(val);
            }
            if (quotaDeltaOdp === undefined) {
              const val = q.deltaOdps !== undefined ? q.deltaOdps : q.odp;
              if (val !== undefined) quotaDeltaOdp = Number(val);
            }
          } catch {
            // ignore parse error
          }
        }

        let description = item.description;
        if (!description && item.metadataJson) {
          try {
            const m =
              typeof item.metadataJson === "string" ? JSON.parse(item.metadataJson) : item.metadataJson;
            if (m.description) description = String(m.description);
          } catch {
            // ignore parse error
          }
        }

        const billingType =
          item.billingType === "MONTHLY_RECURRING" ? "RECURRING_MONTHLY" : item.billingType || "RECURRING_MONTHLY";

        return {
          id: item.id,
          packageCode: item.packageCode || item.code,
          packageName: item.packageName || item.name,
          description: description || "",
          category: item.category,
          billingType: billingType as PackageBillingType,
          priceIdr: Number(item.priceIdr ?? item.priceMonthly ?? 0),
          minimumTier: item.minimumTier || item.minPlanTier || "FREE",
          quotaDeltaOlt: quotaDeltaOlt ?? 0,
          quotaDeltaOdp: quotaDeltaOdp ?? 0,
          published: Boolean(item.published ?? item.isPublished ?? true),
          prerequisiteCodes: item.prerequisiteCodes || [],
          conflictCodes: item.conflictCodes || [],
          subscriberCount: item.subscriberCount,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };
      });
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

      const metadata: Record<string, any> = {};
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

      const metadata: Record<string, any> = {};
      if (payload.description !== undefined) metadata.description = payload.description;

      const backendPayload: Record<string, any> = {};
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

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useSession } from "@/lib/auth-compat";

export type PackageCategory =
  | "TELEMETRY"
  | "FIELD_OPS"
  | "CAPACITY_BOOSTER"
  | "SECURITY_GOV"
  | "CIVIL_INFRA"
  | "AI_COPILOT"
  | "GIS_ANALYTICS"
  | "DISASTER_RECOVERY"
  | "BILLING_FINANCE"
  | "INTEGRATION"
  | "WORKFORCE_SAFETY"
  | "COLLABORATION";

export type PackageBillingType =
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
      return res.json();
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
      const res = await httpClient(`${baseUrl}/system/packages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      const res = await httpClient(`${baseUrl}/system/packages/${code}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

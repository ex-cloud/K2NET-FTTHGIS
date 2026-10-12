import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/api-client";
import { getCurrentOrgSlug } from "../lib/domain";

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

export type PackageEligibilityState =
  | "READY"
  | "PREREQUISITE_REQUIRED"
  | "PLAN_UPGRADE_REQUIRED"
  | "LICENSE_UNHEALTHY"
  | "ALREADY_ACTIVE";

export interface PackageEligibility {
  isEligible: boolean;
  eligibilityState: PackageEligibilityState;
  missingPrerequisites?: string[];
  conflictActivePackages?: string[];
  minRequiredPlan?: string;
  currentPlan?: string;
  licenseStatus?: string;
}

export interface TenantMarketplacePackage {
  id: string;
  code: string;
  name: string;
  category: PackageCategory;
  billingType: PackageBillingType;
  priceMonthly: number;
  minPlanTier?: string;
  prerequisiteCodes?: string[];
  conflictCodes?: string[];
  featureKey?: string;
  quotaDeltaJson?: string;
  metadataJson?: string;
  isPublished: boolean;
  iconName?: string;
  badgeLabel?: string;
  sortOrder: number;
  eligibility?: PackageEligibility;
  isSubscribed?: boolean;
  currentExpiresAt?: string;
}

export interface TenantPackageSubscription {
  id: string;
  organizationId: string;
  packageId: string;
  packageCode: string;
  packageName: string;
  category: PackageCategory;
  status: "ACTIVE" | "PENDING_PAYMENT" | "EXPIRED" | "CANCELLED" | "TRIAL" | string;
  grantedBy?: string;
  grantNotes?: string;
  activatedAt?: string;
  expiresAt?: string;
  autoRenew: boolean;
  lastInvoiceId?: string;
  daysRemaining?: number;
}

export interface OrderPackageRequest {
  packageId: string;
  includePrerequisites?: boolean;
  paymentMethod?: string;
}

export interface OrderPackageResponse {
  success: boolean;
  message?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  baseAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
  currency?: string;
  paymentUrl?: string;
  dueDate?: string;
  activatedSubscriptions?: TenantPackageSubscription[];
  isImmediateActivation?: boolean;
}

export function useTenantPackagesMarketplace() {
  const queryClient = useQueryClient();
  const orgSlug = getCurrentOrgSlug();

  // Query: Catalog Marketplace dengan Dynamic 3-Layer Eligibility
  const catalogQuery = useQuery<TenantMarketplacePackage[]>({
    queryKey: ["tenant-packages-marketplace", orgSlug],
    queryFn: async () => {
      return apiClient<TenantMarketplacePackage[]>("/api/v1/tenant/packages/marketplace");
    },
    staleTime: 60 * 1000,
    retry: 1,
  });

  // Query: Active Subscriptions Milik Tenant
  const subscriptionsQuery = useQuery<TenantPackageSubscription[]>({
    queryKey: ["tenant-packages-subscriptions", orgSlug],
    queryFn: async () => {
      return apiClient<TenantPackageSubscription[]>("/api/v1/tenant/packages/subscriptions");
    },
    staleTime: 60 * 1000,
    retry: 1,
  });

  // Mutation: Pemesanan / Checkout Paket Add-on
  const orderMutation = useMutation<OrderPackageResponse, Error, OrderPackageRequest>({
    mutationFn: async (req) => {
      return apiClient<OrderPackageResponse>("/api/v1/tenant/packages/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
    },
    onSuccess: () => {
      // Refresh katalog, subscriptions, serta kuota tenant
      queryClient.invalidateQueries({ queryKey: ["tenant-packages-marketplace"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-packages-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-subscription-summary"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-license"] });
    },
  });

  // Mutation: Pembatalan Auto-Renewal
  const cancelRenewMutation = useMutation<TenantPackageSubscription, Error, string>({
    mutationFn: async (subscriptionId) => {
      return apiClient<TenantPackageSubscription>(
        `/api/v1/tenant/packages/subscriptions/${subscriptionId}/cancel-renew`,
        { method: "POST" }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-packages-marketplace"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-packages-subscriptions"] });
    },
  });

  return {
    catalog: catalogQuery.data ?? [],
    subscriptions: subscriptionsQuery.data ?? [],
    isLoading: catalogQuery.isLoading || subscriptionsQuery.isLoading,
    isCatalogLoading: catalogQuery.isLoading,
    isSubscriptionsLoading: subscriptionsQuery.isLoading,
    catalogError: catalogQuery.error,
    subscriptionsError: subscriptionsQuery.error,
    refetchCatalog: catalogQuery.refetch,
    refetchSubscriptions: subscriptionsQuery.refetch,
    refetchAll: () => {
      catalogQuery.refetch();
      subscriptionsQuery.refetch();
    },
    orderPackage: orderMutation.mutateAsync,
    isOrdering: orderMutation.isPending,
    cancelAutoRenew: cancelRenewMutation.mutateAsync,
    isCancelling: cancelRenewMutation.isPending,
  };
}

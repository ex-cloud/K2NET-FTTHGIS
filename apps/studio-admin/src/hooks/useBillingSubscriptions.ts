import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useSession } from "@/lib/auth-compat";
import {
  upgradeSubscriptionPlan,
  getProrationEstimate,
  type ProrationEstimate,
} from "@/lib/actions/gateways/subscription";

export interface TenantSubscriptionItem {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  planVersionId?: string;
  planName: string;
  version?: string;
  status: "ACTIVE" | "GRACE_PERIOD" | "RESTRICTED_READ_ONLY" | "SUSPENDED" | string;
  billingCycle: "MONTHLY" | "YEARLY" | string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  gracePeriodEnd?: string;
  test: boolean;
  custom?: boolean;
  priceMonthly?: number;
  priceYearly?: number;
  currency?: string;
  billingContactName?: string;
  billingContactEmail?: string;
  billingContactPhone?: string;

  // Custom Overrides
  overrideMaxProjects?: number;
  overrideMaxArchivedProjects?: number;
  overrideMaxOlts?: number;
  overrideMaxOdcs?: number;
  overrideMaxOdps?: number;
  overrideMaxCustomers?: number;
  overrideMaxStorageGb?: number;
  overrideApiRateLimitRpm?: number;

  // Feature Entitlements
  featureSsoEnabled?: boolean;
  featureApiEnabled?: boolean;
  featureAiCopilotEnabled?: boolean;
  featureCustomDomainEnabled?: boolean;

  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillingPolicyItem {
  id: string;
  policyKey: string;
  policyValue: string;
  description?: string;
}

export function useAllTenantSubscriptions() {
  const { data: session } = useSession();

  return useQuery<TenantSubscriptionItem[]>({
    queryKey: ["all-tenant-subscriptions", session?.accessToken],
    queryFn: async () => {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/system/subscriptions`, {
        token: session?.accessToken ?? undefined,
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch tenant subscriptions: ${res.statusText}`);
      }
      return res.json();
    },
    staleTime: 30 * 1000,
  });
}

export function useTenantSubscriptionById(id?: string) {
  const { data: session } = useSession();

  return useQuery<TenantSubscriptionItem>({
    queryKey: ["tenant-subscription", id, session?.accessToken],
    queryFn: async () => {
      if (!id) throw new Error("Subscription ID is required");
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/system/subscriptions/${id}`, {
        token: session?.accessToken ?? undefined,
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch subscription: ${res.statusText}`);
      }
      return res.json();
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useBillingPolicies() {
  const { data: session } = useSession();

  return useQuery<BillingPolicyItem[]>({
    queryKey: ["billing-policies", session?.accessToken],
    queryFn: async () => {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/system/billing/policies`, {
        token: session?.accessToken ?? undefined,
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch billing policies: ${res.statusText}`);
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useChangeTenantPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slug,
      newPlanName,
      planCycle,
      isDirectOverride,
      notes,
    }: {
      slug: string;
      newPlanName: string;
      planCycle?: string;
      isDirectOverride?: boolean;
      notes?: string;
    }) => {
      return upgradeSubscriptionPlan(slug, {
        newPlanName,
        planCycle,
        isDirectOverride,
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-tenant-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["all-licenses"] });
      queryClient.invalidateQueries({ queryKey: ["license-overview"] });
    },
  });
}

export { getProrationEstimate, type ProrationEstimate };

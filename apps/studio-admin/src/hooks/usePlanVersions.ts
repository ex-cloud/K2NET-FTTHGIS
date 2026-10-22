import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useSession } from "@/lib/auth-compat";

export interface PlanVersion {
  id: string;
  version: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  priceMonthly: number;
  priceYearly?: number;
  currency: string;
  maxProjects: number;
  maxArchivedProjects: number;
  maxOlts: number;
  maxOdcs?: number;
  maxOdps?: number;
  maxCustomers?: number;
  maxStorageGb: number;
  apiRateLimitRpm: number;
  hasSso: boolean;
  hasApiAccess: boolean;
  hasAiCopilot: boolean;
  hasCustomDomain: boolean;
  graceDays: number;
  readonlyDays: number;
  effectiveFrom: string;
  effectiveTo?: string;
  publishedBy?: string;
  changelog?: string;
  createdAt?: string;
}

export interface CreatePlanVersionInput {
  version: string;
  status?: "DRAFT" | "ACTIVE";
  priceMonthly: number;
  priceYearly?: number;
  currency?: string;
  maxProjects?: number;
  maxArchivedProjects?: number;
  maxOlts?: number;
  maxOdcs?: number;
  maxOdps?: number;
  maxCustomers?: number;
  maxStorageGb?: number;
  apiRateLimitRpm?: number;
  hasSso?: boolean;
  hasApiAccess?: boolean;
  hasAiCopilot?: boolean;
  hasCustomDomain?: boolean;
  graceDays?: number;
  readonlyDays?: number;
  changelog?: string;
}

export function usePlanVersions(planId?: string) {
  const { data: session } = useSession();

  return useQuery<PlanVersion[]>({
    queryKey: ["plan-versions", planId, session?.accessToken],
    queryFn: async () => {
      if (!planId) return [];
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/system/plans/${planId}/versions`, {
        token: session?.accessToken ?? undefined,
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch plan versions: ${res.status}`);
      }
      return res.json();
    },
    enabled: Boolean(planId),
    staleTime: 30 * 1000,
  });
}

export function useCreatePlanVersion(planId?: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreatePlanVersionInput) => {
      if (!planId) throw new Error("Plan ID is required");
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/system/plans/${planId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        token: session?.accessToken ?? undefined,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");
        throw new Error(`Failed to create plan version: ${res.status} - ${errorText}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plan-versions", planId] });
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
    },
  });
}

export function usePublishPlanVersion(planId?: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (versionId: string) => {
      if (!planId) throw new Error("Plan ID is required");
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/system/plans/${planId}/versions/${versionId}/publish`, {
        method: "POST",
        token: session?.accessToken ?? undefined,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");
        throw new Error(`Failed to publish plan version: ${res.status} - ${errorText}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plan-versions", planId] });
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      queryClient.invalidateQueries({ queryKey: ["license-overview"] });
    },
  });
}

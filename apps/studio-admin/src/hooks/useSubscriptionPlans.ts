import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useSession } from "@/lib/auth-compat";

export interface SubscriptionPlanMaster {
  id: string;
  name: string; // "FREE", "STARTER", "PRO", "ENTERPRISE"
  description?: string;
  price: number;
  maxProjects: number;
  maxArchivedProjects: number;
  maxOdcs: number;
  maxOdps: number;
  maxCustomers: number;
  hasSso: boolean;
  hasApiAccess: boolean;
}

export interface UpdateSubscriptionPlanPayload {
  id: string;
  description?: string;
  price: number;
  maxProjects?: number;
  maxArchivedProjects?: number;
  maxOdcs?: number;
  maxOdps?: number;
  maxCustomers?: number;
  hasSso?: boolean;
  hasApiAccess?: boolean;
}

export function useSubscriptionPlans() {
  const { data: session } = useSession();

  return useQuery<SubscriptionPlanMaster[]>({
    queryKey: ["subscription-plans", session?.accessToken],
    queryFn: async () => {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/system/plans`, {
        token: session?.accessToken ?? undefined,
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch subscription plans: ${res.status}`);
      }
      return res.json();
    },
    staleTime: 30 * 1000,
  });
}

export function useUpdateSubscriptionPlan() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateSubscriptionPlanPayload) => {
      const baseUrl = getBackendBaseUrl();
      const { id, ...bodyPayload } = payload;
      const res = await httpClient(`${baseUrl}/system/plans/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
        token: session?.accessToken ?? undefined,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");
        throw new Error(`Failed to update subscription plan: ${res.status} - ${errorText}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      queryClient.invalidateQueries({ queryKey: ["license-overview"] });
      queryClient.invalidateQueries({ queryKey: ["all-licenses"] });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["organization-quotas"] });
    },
  });
}

import { useQuery } from "@tanstack/react-query";
import { getApiAuthToken } from "../lib/api-client";

export interface PublicModuleItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  scope: string;
  category: string;
  minPlanTier: string;
  status: "ACTIVE" | "MAINTENANCE" | "DISABLED" | "IN_DEVELOPMENT" | "DEPRECATED";
  isEnabled: boolean;
}

export function usePublicModules() {
  const token = getApiAuthToken();

  return useQuery<PublicModuleItem[]>({
    queryKey: ["public-tenant-modules", token],
    queryFn: async () => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      try {
        const res = await fetch("/api/v1/modules?scope=TENANT", { headers });
        if (!res.ok) {
          return [];
        }
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
    staleTime: 15_000,
  });
}

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api-client";
import { getCurrentOrgSlug } from "../lib/domain";

export interface TenantEntitlementsData {
  activeFeatures: string[];
  activePackages: string[];
  quotaDeltas: Record<string, number>;
  quotaSummary?: {
    effectiveMaxProjects?: number;
    usedProjects?: number;
    packageBoosterOlts?: number;
    effectiveMaxOdps?: number;
    usedOdps?: number;
    packageBoosterOdps?: number;
    [key: string]: unknown;
  };
}

/**
 * Hook untuk mengevaluasi hak akses fitur aktif (Entitlements) dan kuota booster paket add-on tenant.
 */
export function useTenantEntitlements() {
  const orgSlug = getCurrentOrgSlug();

  const query = useQuery<TenantEntitlementsData>({
    queryKey: ["tenant-entitlements", orgSlug],
    queryFn: async () => {
      return apiClient<TenantEntitlementsData>("/api/v1/tenant/packages/entitlements");
    },
    enabled: !!orgSlug,
    staleTime: 60 * 1000,
  });

  const hasFeature = (featureKey: string): boolean => {
    if (!featureKey) return false;
    if (!query.data?.activeFeatures) return false;
    const lowerKey = featureKey.toLowerCase();
    return query.data.activeFeatures.some((f) => f.toLowerCase() === lowerKey);
  };

  const hasPackage = (packageCode: string): boolean => {
    if (!packageCode) return false;
    if (!query.data?.activePackages) return false;
    const upperCode = packageCode.toUpperCase();
    return query.data.activePackages.some((p) => p.toUpperCase() === upperCode);
  };

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    status: query.status,
    isSuccess: query.isSuccess,
    isFetching: query.isFetching,
    entitlements: query.data,
    activeFeatures: query.data?.activeFeatures ?? [],
    activePackages: query.data?.activePackages ?? [],
    quotaDeltas: query.data?.quotaDeltas ?? {},
    quotaSummary: query.data?.quotaSummary,
    hasFeature,
    hasPackage,
  };
}

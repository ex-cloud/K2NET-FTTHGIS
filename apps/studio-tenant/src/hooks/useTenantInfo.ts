import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { extractTenantSlug, type ResolvedTenant } from "../lib/keycloak-config";
import { useImpersonationSession } from "../lib/useImpersonationSession";
import { useAuth } from "@k2net/auth/client";

export function useTenantInfo() {
  const { user } = useAuth();
  const { isImpersonating, tenantName: impersonatedTenantName } = useImpersonationSession();
  const currentSlug = extractTenantSlug();

  // Try reading initial cached data from sessionStorage
  const initialData: ResolvedTenant | undefined = React.useMemo(() => {
    try {
      const raw = sessionStorage.getItem("k2net_resolved_tenant");
      return raw ? JSON.parse(raw) : undefined;
    } catch {
      return undefined;
    }
  }, []);

  const { data: resolvedTenant, isLoading, refetch } = useQuery<ResolvedTenant | null>({
    queryKey: ["tenant-info", currentSlug],
    queryFn: async () => {
      if (!currentSlug || currentSlug === "ftth-realm" || currentSlug === "system") {
        return null;
      }
      const res = await fetch(`/api/v1/public/organizations/resolve?slug=${encodeURIComponent(currentSlug)}`);
      if (!res.ok) return null;
      const json: ResolvedTenant = await res.json();
      try {
        sessionStorage.setItem("k2net_resolved_tenant", JSON.stringify(json));
      } catch {
        // ignore
      }
      return json;
    },
    initialData: initialData && initialData.slug === currentSlug ? initialData : undefined,
    staleTime: 5 * 60 * 1000,
  });

  const organizationName = React.useMemo(() => {
    if (isImpersonating && impersonatedTenantName) return impersonatedTenantName;
    if (resolvedTenant?.organizationName) return resolvedTenant.organizationName;
    if (initialData?.organizationName) return initialData.organizationName;
    const customTenantName = (user as { tenantName?: string } | null)?.tenantName;
    if (customTenantName) return customTenantName;
    // Human-readable fallback only: NEVER uppercase raw random slug strings
    return "Organization Workspace";
  }, [isImpersonating, impersonatedTenantName, resolvedTenant?.organizationName, initialData?.organizationName, user]);

  const planTier = React.useMemo(() => {
    const rawTier = (resolvedTenant?.planTier || initialData?.planTier || "PRO").toLowerCase();
    if (rawTier.includes("enterprise") || rawTier.includes("sla")) return "enterprise";
    if (rawTier.includes("pro") || rawTier.includes("business")) return "pro";
    if (rawTier.includes("free") || rawTier.includes("starter") || rawTier.includes("basic")) return "free";
    return "pro";
  }, [resolvedTenant?.planTier, initialData?.planTier]);

  const logoUrl = resolvedTenant?.logoUrl || initialData?.logoUrl || undefined;
  const isResolving = isLoading && !resolvedTenant && !initialData;

  return {
    organizationName,
    planTier,
    logoUrl,
    slug: currentSlug,
    resolvedTenant: resolvedTenant || initialData || null,
    isLoading: isResolving,
    refetch,
  };
}

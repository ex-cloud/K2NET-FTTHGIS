import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/api-client";
import { getCurrentOrgSlug } from "../lib/domain";

export interface TenantBrandingData {
  id: string;
  organizationId: string;
  organizationSlug: string;
  customDomain: string | null;
  domainStatus: "PENDING_DNS" | "ACTIVE" | "FAILED";
  cnameTarget: string;
  verificationToken: string;
  verifiedAt: string | null;
  sslStatus: "PENDING" | "ISSUED" | "FAILED";
  sslIssuedAt: string | null;
  appTitle: string | null;
  companyName: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  brandColorPrimary: string | null;
  brandColorAccent: string | null;
  footerText: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  isWhitelabelAllowed: boolean;
  dnsInstructions: string;
}

export interface UpdateTenantBrandingPayload {
  customDomain?: string | null;
  appTitle?: string | null;
  companyName?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  brandColorPrimary?: string | null;
  brandColorAccent?: string | null;
  footerText?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
}

export interface VerifyDnsResult {
  verified: boolean;
  domainStatus: "PENDING_DNS" | "ACTIVE" | "FAILED";
  customDomain: string | null;
  message: string;
  cnameTarget: string;
  currentResolvedTarget: string | null;
}

export function useTenantBranding() {
  const queryClient = useQueryClient();
  const orgSlug = getCurrentOrgSlug();
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const slugParam = searchParams?.get("slug") || searchParams?.get("tenant") || orgSlug || "";

  const brandingQuery = useQuery({
    queryKey: ["tenant-branding", orgSlug, slugParam],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (slugParam) params.slug = slugParam;
      return apiClient<TenantBrandingData>("/api/v1/tenant/branding", { params });
    },
    staleTime: 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: UpdateTenantBrandingPayload) => {
      const params: Record<string, string> = {};
      if (slugParam) params.slug = slugParam;
      return apiClient<TenantBrandingData>("/api/v1/tenant/branding", {
        method: "PUT",
        params,
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-branding"] });
    },
  });

  const verifyDnsMutation = useMutation({
    mutationFn: async () => {
      const params: Record<string, string> = {};
      if (slugParam) params.slug = slugParam;
      return apiClient<VerifyDnsResult>("/api/v1/tenant/branding/verify-dns", {
        method: "POST",
        params,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-branding"] });
    },
  });

  return {
    branding: brandingQuery.data,
    isLoading: brandingQuery.isLoading,
    isError: brandingQuery.isError,
    error: brandingQuery.error,
    refetch: brandingQuery.refetch,
    updateBranding: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    verifyDns: verifyDnsMutation.mutateAsync,
    isVerifyingDns: verifyDnsMutation.isPending,
  };
}

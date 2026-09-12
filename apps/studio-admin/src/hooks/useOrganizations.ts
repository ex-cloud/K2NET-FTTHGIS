import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '@/lib/httpClient';
import { getBackendBaseUrl } from '@/lib/api-config';
import { useSession } from '@/lib/auth-compat';
import { useEffect } from 'react';

export interface Organization {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  website?: string;
  subscriptionPlan?: {
    name: string;
    maxProjects?: number;
    maxOdcs?: number;
    maxOdps?: number;
    maxCustomers?: number;
  };
  logoUrl?: string;
  // LDAP Configuration
  ldapEnabled?: boolean;
  ldapUrl?: string;
  ldapBaseDn?: string;
  ldapBindDn?: string;
  ldapBindPassword?: string;
  // Admin Account Provisioning
  adminEmail?: string;
  adminUsername?: string;
  adminPassword?: string;
  plan?: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'PROVISIONING' | 'OVERDUE' | 'TRIAL_EXPIRED' | 'PENDING_APPROVAL' | 'DELETED';
  trialExpiresAt?: string;
  createdAt?: string;
}

export interface OrganizationStats {
  projectCount: number;
  usedOlts: number;
  odcCount: number;
  usedOdps: number;
  customerCount: number;
  usedStorageGb?: number;
  apiRateLimitUsed?: number;
  apiLatencyMs?: number;
  organizationSlug: string;
  organizationName?: string;
  featureFlags?: Record<string, boolean>;
}

export function useOrganizations() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();

  const { 
    data: organizations = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery<Organization[]>({
    queryKey: ['organizations', session?.accessToken],
    queryFn: async () => {
      if (!session?.accessToken) {
        return [];
      }
      
      const baseUrl = getBackendBaseUrl();
      
      const res = await httpClient(`${baseUrl}/organizations`, {
        token: session.accessToken,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => 'Unknown error');
        throw new Error(`Failed to fetch organizations: ${res.status} - ${errorText}`);
      }
      
      const data = await res.json();
      return Array.isArray(data) ? data : (Array.isArray(data?.content) ? data.content : []);
    },
    enabled: status === 'authenticated' && !!session?.accessToken,
    staleTime: 30 * 1000, // Reduced to 30 seconds for faster updates during testing
    retry: 1, // Only retry once
  });

  // Fetch real aggregated usage statistics for all organizations
  const { 
    data: allStats = {}, 
    refetch: refetchStats 
  } = useQuery<Record<string, OrganizationStats>>({
    queryKey: ['organizations-all-stats', session?.accessToken],
    queryFn: async () => {
      if (!session?.accessToken) return {};
      const baseUrl = getBackendBaseUrl();
      try {
        const res = await httpClient(`${baseUrl}/organizations/analytics/all-stats`, {
          token: session.accessToken,
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {
        console.warn('Failed to fetch org all-stats:', e);
      }
      return {};
    },
    enabled: status === 'authenticated' && !!session?.accessToken,
    staleTime: 30 * 1000,
    retry: 1,
  });

  // Auto-detect suspension from org data (catches cases where API returns 200 but org is suspended)
  useEffect(() => {
    // Keep this effect but remove the log
    if (organizations.length > 0) {
      const hasSuspended = organizations.some(
        (org) => org.status === 'SUSPENDED' || org.status === 'TRIAL_EXPIRED'
      );
      if (hasSuspended) {
        // We don't auto-trigger overlay here because the /org LIST page should still show orgs
        // The overlay is triggered when entering a specific suspended org
      }
    }
  }, [organizations]);

  const createMutation = useMutation({
    mutationFn: async (org: Organization) => {
      if (!session?.accessToken) throw new Error("Not authenticated");
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/organizations`, {
        method: 'POST',
        body: JSON.stringify(org),
        token: session.accessToken,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to create organization');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['organizations-all-stats'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (args: string | { idOrSlug?: string; slug?: string; mode?: string; reason?: string }) => {
      if (!session?.accessToken) throw new Error("Not authenticated");
      const targetSlug = typeof args === 'string' ? args : (args.idOrSlug || args.slug || '');
      const mode = typeof args === 'string' ? 'soft' : (args.mode || 'soft');
      const reason = typeof args === 'string' ? '' : (args.reason || '');

      const baseUrl = getBackendBaseUrl();
      const params = new URLSearchParams({ mode });
      if (reason) params.set("reason", reason);

      const res = await httpClient(`${baseUrl}/organizations/${targetSlug}?${params.toString()}`, {
        method: 'DELETE',
        token: session.accessToken,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(errorText || 'Failed to delete organization');
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['organizations-all-stats'] });
      queryClient.invalidateQueries({ queryKey: ['trash-items'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ slug, org }: { slug: string; org: Partial<Organization> }) => {
      if (!session?.accessToken) throw new Error("Not authenticated");
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/organizations/${slug}`, {
        method: 'PUT',
        body: JSON.stringify(org),
        token: session.accessToken,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(errorText || 'Failed to update organization');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['organizations-all-stats'] });
    },
  });

  const updateFeatureFlagsMutation = useMutation({
    mutationFn: async ({ slug, flags }: { slug: string; flags: Record<string, boolean> }) => {
      if (!session?.accessToken) throw new Error("Not authenticated");
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/organizations/${slug}/features`, {
        method: 'PUT',
        token: session.accessToken,
        body: JSON.stringify(flags),
      });
      if (!res.ok) {
        throw new Error(`Failed to update feature flags: ${res.statusText}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations-all-stats'] });
    },
  });

  const checkSlugAvailable = async (slug: string) => {
    if (!session?.accessToken) return false;
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/organizations/check-slug/${slug}`, {
        token: session.accessToken,
      });
      if (!res.ok) return false;
      const isAvailable: boolean = await res.json();
      return isAvailable;
    } catch {
      return false;
    }
  };

  const useOrganizationBySlug = (slug: string | undefined) => {
    return organizations.find(org => org.slug === slug);
  };

  const refreshAll = async () => {
    return await Promise.all([refetch(), refetchStats()]);
  };

  return {
    organizations,
    allStats,
    orgStats: allStats,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refresh: refreshAll,
    createOrganization: createMutation.mutateAsync,
    updateOrganization: updateMutation.mutateAsync,
    deleteOrganization: deleteMutation.mutateAsync,
    deleteOrg: deleteMutation.mutateAsync,
    updateFeatureFlags: updateFeatureFlagsMutation.mutateAsync,
    checkSlugAvailable,
    useOrganizationBySlug
  };
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '@/lib/httpClient';
import { getBackendBaseUrl } from '@/lib/api-config';
import { useSession } from 'next-auth/react';
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
  status?: 'ACTIVE' | 'SUSPENDED' | 'TRIAL_EXPIRED' | 'DELETED';
  trialExpiresAt?: string;
  createdAt?: string;
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
        // If we get a 403, httpClient already handles ORGANIZATION_SUSPENDED
        // For other errors, log and return empty instead of throwing
        const errorText = await res.text().catch(() => 'Unknown error');
        
        // Don't throw on 401/403 - just return empty array
        // This prevents React Query from retrying and flooding the console
        if (res.status === 401 || res.status === 403) {
          return [];
        }
        throw new Error(`Failed to fetch organizations: ${res.status} - ${errorText}`);
      }
      
      const data = await res.json();
      return data;
    },
    enabled: status === 'authenticated' && !!session?.accessToken,
    staleTime: 30 * 1000, // Reduced to 30 seconds for faster updates during testing
    retry: 1, // Only retry once
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

  return {
    organizations,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refresh: refetch,
    createOrganization: createMutation.mutateAsync,
    checkSlugAvailable,
    useOrganizationBySlug
  };
}

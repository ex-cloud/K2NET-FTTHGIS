import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '@/lib/httpClient';
import { getBackendBaseUrl } from '@/lib/api-config';
import { useSession } from 'next-auth/react';

export interface Organization {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  website?: string;
  plan?: string;
  logoUrl?: string;
  // LDAP Configuration
  ldapEnabled?: boolean;
  ldapUrl?: string;
  ldapBaseDn?: string;
  ldapBindDn?: string;
  ldapBindPassword?: string;
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
      if (!session?.accessToken) return [];
      
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/organizations`, {
        token: session.accessToken,
      });

      if (!res.ok) throw new Error('Failed to fetch organizations');
      return res.json();
    },
    enabled: status === 'authenticated' && !!session?.accessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

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

  return {
    organizations,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refresh: refetch,
    createOrganization: createMutation.mutateAsync,
    checkSlugAvailable
  };
}

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

export interface Project {
  id: string;
  name: string;
  status: string;
}

export function useProjects(orgId: string | undefined) {
  const { data: session, status } = useSession();

  const { 
    data: projects = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery<Project[]>({
    queryKey: ['projects', orgId, session?.accessToken],
    queryFn: async () => {
      if (!orgId || !session?.accessToken) return [];
      
      const res = await fetch(`/api/v1/organizations/${orgId}/projects`, {
        headers: {
          "Authorization": `Bearer ${session.accessToken}`
        }
      });

      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
    enabled: status === 'authenticated' && !!session?.accessToken && !!orgId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return { 
    projects, 
    loading: isLoading, 
    error: error instanceof Error ? error.message : null,
    refresh: refetch 
  };
}

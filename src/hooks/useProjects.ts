import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface Project {
  id: string;
  name: string;
  status: string;
}

export function useProjects(orgId: string | undefined) {
  const { data: session, status } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    if (!orgId || status !== 'authenticated' || !session?.accessToken) return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/organizations/${orgId}/projects`, {
        headers: {
          "Authorization": `Bearer ${session.accessToken}`
        }
      });

      if (res.ok) {
        const data: Project[] = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error('Failed to fetch projects', err);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, status, orgId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return { projects, loading, refresh: fetchProjects };
}

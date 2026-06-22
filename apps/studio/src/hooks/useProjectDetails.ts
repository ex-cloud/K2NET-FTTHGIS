import { useState, useEffect, useCallback } from 'react';
import { httpClient } from '@/lib/httpClient';
import { getBackendBaseUrl } from '@/lib/api-config';
import { useSession } from 'next-auth/react';

export interface ProjectDetail {
  id: string;
  name: string;
}

export function useProjectDetails(orgId: string, projectId: string | undefined) {
  const { data: session, status } = useSession();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProject = useCallback(async () => {
    if (!projectId || status !== 'authenticated' || !session?.accessToken) return;
    
    try {
      setLoading(true);
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/organizations/${orgId}/projects/${projectId}`, {
        token: session.accessToken,
      });

      if (res.ok) {
        const data: ProjectDetail = await res.json();
        setProject(data);
      }
    } catch (err) {
      console.error('Failed to fetch project details', err);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, status, orgId, projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  return { project, loading };
}

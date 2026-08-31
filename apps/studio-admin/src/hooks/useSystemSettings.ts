import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '@/lib/httpClient';
import { getBackendBaseUrl } from '@/lib/api-config';
import { useSession } from '@/lib/auth-compat';

export interface SystemSetting {
  key: string;
  value: string;
  category: string;
  description: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface SmtpTestData {
  host: string;
  port: number;
  username?: string;
  password?: string;
}


export function useSystemSettings() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();

  const {
    data: settings = [],
    isLoading,
    error,
    refetch
  } = useQuery<SystemSetting[]>({
    queryKey: ['system-settings', session?.accessToken],
    queryFn: async () => {
      if (!session?.accessToken) {
        return [];
      }
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/system/settings`, {
        token: session.accessToken,
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          return [];
        }
        const errorText = await res.text().catch(() => 'Unknown error');
        throw new Error(`Failed to fetch system settings: ${res.status} - ${errorText}`);
      }

      return res.json();
    },
    enabled: status === 'authenticated' && !!session?.accessToken,
    staleTime: 30 * 1000,
    retry: 1,
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedValues: Record<string, string>) => {
      if (!session?.accessToken) throw new Error("Not authenticated");
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/system/settings`, {
        method: 'PUT',
        body: JSON.stringify(updatedValues),
        token: session.accessToken,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to update system settings');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: async (smtpData: SmtpTestData) => {
      if (!session?.accessToken) throw new Error("Not authenticated");
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/system/settings/test-email`, {
        method: 'POST',
        body: JSON.stringify(smtpData),
        token: session.accessToken,
      });

      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.message || 'SMTP Connection test failed');
      }

      return responseData;
    }
  });

  return {
    settings,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refresh: refetch,
    updateSettings: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    testEmail: testEmailMutation.mutateAsync,
    isTestingEmail: testEmailMutation.isPending,
  };
}

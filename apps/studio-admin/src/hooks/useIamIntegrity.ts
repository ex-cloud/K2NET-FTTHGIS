import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '@/lib/httpClient';
import { getBackendBaseUrl } from '@/lib/api-config';
import { useSession } from '@/lib/auth-compat';

export interface IamIntegrityFinding {
  keycloakUserId: string;
  realm: string;
  username?: string | null;
  email?: string | null;
  enabled: boolean;
  createdAt?: string | null;
  ageHours: number;
  findingType: "ORPHAN_ELIGIBLE" | "ORPHAN_GRACE_PERIOD" | "UUID_DRIFT" | string;
  purgeable: boolean;
  hasActiveSessions: boolean;
  dbUserId?: string | null;
  reason?: string | null;
}

export interface IamIntegrityScanSummary {
  scannedAt: string;
  dryRun: boolean;
  autoPurgeEnabled: boolean;
  circuitBreakerTriggered: boolean;
  circuitBreakerReason?: string | null;
  gracePeriodHours: number;
  maxPurgePerRun: number;
  scannedRealms: string[];
  totalKeycloakUsers: number;
  totalDatabaseUsers: number;
  healthyCount: number;
  orphanEligibleCount: number;
  orphanGracePeriodCount: number;
  uuidDriftCount: number;
  protectedSkippedCount: number;
  purgedCount: number;
  failedPurgeCount: number;
  findings: IamIntegrityFinding[];
}

function parseErrorMessage(errorText: string, fallback: string): string {
  if (!errorText) return fallback;
  try {
    const parsed = JSON.parse(errorText) as { message?: string; error?: string };
    return parsed.message || parsed.error || fallback;
  } catch {
    return errorText || fallback;
  }
}

export function useIamIntegrity() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const baseUrl = getBackendBaseUrl();
  const token = session?.accessToken;

  const iamIntegrityQuery = useQuery<IamIntegrityScanSummary>({
    queryKey: ['system-iam-integrity', baseUrl, token],
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated');
      const res = await httpClient(`${baseUrl}/system/security/iam-integrity/scan`, { token });
      if (!res.ok) {
        throw new Error(parseErrorMessage(await res.text(), 'Failed to scan IAM integrity'));
      }
      return res.json();
    },
    enabled: status === 'authenticated' && !!token,
  });

  const purgeAllOrphansMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error('Not authenticated');
      const res = await httpClient(`${baseUrl}/system/security/iam-integrity/purge`, {
        method: 'POST',
        token,
      });
      if (!res.ok) {
        throw new Error(parseErrorMessage(await res.text(), 'Failed to purge eligible orphan accounts'));
      }
      return res.json() as Promise<IamIntegrityScanSummary>;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['system-iam-integrity', baseUrl, token], updated);
      queryClient.invalidateQueries({ queryKey: ['system-security-alerts'] });
    },
  });

  const purgeSingleOrphanMutation = useMutation({
    mutationFn: async (params: { realm: string; keycloakUserId: string }) => {
      if (!token) throw new Error('Not authenticated');
      const res = await httpClient(
        `${baseUrl}/system/security/iam-integrity/orphans/${encodeURIComponent(params.realm)}/${encodeURIComponent(params.keycloakUserId)}`,
        {
          method: 'DELETE',
          token,
        }
      );
      if (!res.ok) {
        throw new Error(parseErrorMessage(await res.text(), 'Failed to purge orphan Keycloak account'));
      }
      return res.json() as Promise<IamIntegrityScanSummary>;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['system-iam-integrity', baseUrl, token], updated);
      queryClient.invalidateQueries({ queryKey: ['system-security-alerts'] });
    },
  });

  return {
    iamIntegrity: iamIntegrityQuery.data,
    loadingIamIntegrity: iamIntegrityQuery.isLoading,
    isScanningIamIntegrity: iamIntegrityQuery.isFetching,
    rescanIamIntegrity: iamIntegrityQuery.refetch,
    purgeAllOrphans: purgeAllOrphansMutation.mutateAsync,
    isPurgingAllOrphans: purgeAllOrphansMutation.isPending,
    purgeSingleOrphan: purgeSingleOrphanMutation.mutateAsync,
    isPurgingSingleOrphan: purgeSingleOrphanMutation.isPending,
  };
}

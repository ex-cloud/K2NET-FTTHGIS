import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '@/lib/httpClient';
import { getBackendBaseUrl } from '@/lib/api-config';
import { useSession } from 'next-auth/react';

export interface RealmConfig {
  registrationAllowed: boolean;
  verifyEmail: boolean;
  resetPasswordAllowed: boolean;
}

export interface ActiveSession {
  id: string;
  username: string;
  ipAddress: string;
  start: number;
  lastAccess: number;
  clients: string[];
}

export interface SsoProvider {
  alias: string;
  providerId: string;
  enabled: boolean;
  clientId: string;
}

export interface SsoUpdateRequest {
  providerId: string;
  clientId: string;
  clientSecret: string;
}

export interface SecurityEvent {
  id: number;
  eventType: string;
  severity: string;
  userId: string | null;
  username: string;
  ipAddress: string;
  location: string | null;
  os: string | null;
  browser: string | null;
  details: string;
  createdAt: string;
}

export interface BlockedIp {
  id: number;
  ipAddressOrCidr: string;
  reason: string;
  createdAt: string;
}

export function useSecuritySettings() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const baseUrl = getBackendBaseUrl();
  const token = session?.accessToken;

  // 1. Realm Config
  const realmConfigQuery = useQuery<RealmConfig>({
    queryKey: ['system-realm-config', token],
    queryFn: async () => {
      if (!token) return { registrationAllowed: false, verifyEmail: false, resetPasswordAllowed: false };
      const res = await httpClient(`${baseUrl}/system/security/realm-config`, { token });
      if (!res.ok) throw new Error('Failed to fetch realm config');
      return res.json();
    },
    enabled: status === 'authenticated' && !!token,
  });

  const updateRealmConfigMutation = useMutation({
    mutationFn: async (config: RealmConfig) => {
      if (!token) throw new Error('Not authenticated');
      const res = await httpClient(`${baseUrl}/system/security/realm-config`, {
        method: 'PUT',
        body: JSON.stringify(config),
        token,
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to update realm config');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-realm-config'] });
    },
  });

  // 2. Active Sessions
  const activeSessionsQuery = useQuery<ActiveSession[]>({
    queryKey: ['system-sessions', token],
    queryFn: async () => {
      if (!token) return [];
      const res = await httpClient(`${baseUrl}/system/security/sessions`, { token });
      if (!res.ok) throw new Error('Failed to fetch active sessions');
      return res.json();
    },
    enabled: status === 'authenticated' && !!token,
  });

  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      if (!token) throw new Error('Not authenticated');
      const res = await httpClient(`${baseUrl}/system/security/sessions/${sessionId}`, {
        method: 'DELETE',
        token,
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to revoke session');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-sessions'] });
    },
  });

  // 3. SSO Providers
  const ssoProvidersQuery = useQuery<SsoProvider[]>({
    queryKey: ['system-sso-providers', token],
    queryFn: async () => {
      if (!token) return [];
      const res = await httpClient(`${baseUrl}/system/security/sso-providers`, { token });
      if (!res.ok) throw new Error('Failed to fetch SSO providers');
      return res.json();
    },
    enabled: status === 'authenticated' && !!token,
  });

  const updateSsoProviderMutation = useMutation({
    mutationFn: async (request: SsoUpdateRequest) => {
      if (!token) throw new Error('Not authenticated');
      const res = await httpClient(`${baseUrl}/system/security/sso-providers`, {
        method: 'PUT',
        body: JSON.stringify(request),
        token,
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to update SSO provider');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-sso-providers'] });
    },
  });

  // 4. Security Alerts
  const securityAlertsQuery = useQuery<SecurityEvent[]>({
    queryKey: ['system-security-alerts', token],
    queryFn: async () => {
      if (!token) return [];
      const res = await httpClient(`${baseUrl}/system/security/alerts`, { token });
      if (!res.ok) throw new Error('Failed to fetch security alerts');
      return res.json();
    },
    enabled: status === 'authenticated' && !!token,
    refetchInterval: 5000, // Auto-refresh every 5 seconds for live feed
  });

  const clearAlertsMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error('Not authenticated');
      const res = await httpClient(`${baseUrl}/system/security/alerts`, {
        method: 'DELETE',
        token,
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to clear alerts');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-security-alerts'] });
    },
  });

  const simulateTravelMutation = useMutation({
    mutationFn: async (params: { userId: string; username: string; ipAddress: string }) => {
      if (!token) throw new Error('Not authenticated');
      const queryParams = new URLSearchParams(params).toString();
      const res = await httpClient(`${baseUrl}/system/security/alerts/simulate-travel?${queryParams}`, {
        method: 'POST',
        token,
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to simulate travel');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-security-alerts'] });
    },
  });

  const simulateFailMutation = useMutation({
    mutationFn: async (params: { username: string; ipAddress: string; count: number }) => {
      if (!token) throw new Error('Not authenticated');
      const queryParams = new URLSearchParams({
        username: params.username,
        ipAddress: params.ipAddress,
        count: String(params.count)
      }).toString();
      const res = await httpClient(`${baseUrl}/system/security/alerts/simulate-fail?${queryParams}`, {
        method: 'POST',
        token,
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to simulate failed login');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-security-alerts'] });
    },
  });

  // 5. Blocked IPs
  const blockedIpsQuery = useQuery<BlockedIp[]>({
    queryKey: ['system-blocked-ips', token],
    queryFn: async () => {
      if (!token) return [];
      const res = await httpClient(`${baseUrl}/system/security/blocked-ips`, { token });
      if (!res.ok) throw new Error('Failed to fetch blocked IPs');
      return res.json();
    },
    enabled: status === 'authenticated' && !!token,
  });

  const blockIpMutation = useMutation({
    mutationFn: async (request: { ipAddressOrCidr: string; reason: string }) => {
      if (!token) throw new Error('Not authenticated');
      const res = await httpClient(`${baseUrl}/system/security/blocked-ips`, {
        method: 'POST',
        body: JSON.stringify(request),
        token,
      });
      if (!res.ok) {
        const errorText = await res.text();
        try {
          const parsed = JSON.parse(errorText);
          throw new Error(parsed.message || 'Failed to block IP/CIDR');
        } catch {
          throw new Error(errorText || 'Failed to block IP/CIDR');
        }
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-blocked-ips'] });
    },
  });

  const unblockIpMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!token) throw new Error('Not authenticated');
      const res = await httpClient(`${baseUrl}/system/security/blocked-ips/${id}`, {
        method: 'DELETE',
        token,
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to unblock IP/CIDR');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-blocked-ips'] });
    },
  });

  return {
    realmConfig: realmConfigQuery.data,
    loadingRealmConfig: realmConfigQuery.isLoading,
    updateRealmConfig: updateRealmConfigMutation.mutateAsync,
    isUpdatingRealmConfig: updateRealmConfigMutation.isPending,

    sessions: activeSessionsQuery.data || [],
    loadingSessions: activeSessionsQuery.isLoading,
    revokeSession: revokeSessionMutation.mutateAsync,
    isRevokingSession: revokeSessionMutation.isPending,

    ssoProviders: ssoProvidersQuery.data || [],
    loadingSsoProviders: ssoProvidersQuery.isLoading,
    updateSsoProvider: updateSsoProviderMutation.mutateAsync,
    isUpdatingSsoProvider: updateSsoProviderMutation.isPending,

    alerts: securityAlertsQuery.data || [],
    loadingAlerts: securityAlertsQuery.isLoading,
    clearAlerts: clearAlertsMutation.mutateAsync,
    simulateTravel: simulateTravelMutation.mutateAsync,
    simulateFail: simulateFailMutation.mutateAsync,
    isSimulating: simulateTravelMutation.isPending || simulateFailMutation.isPending,

    blockedIps: blockedIpsQuery.data || [],
    loadingBlockedIps: blockedIpsQuery.isLoading,
    blockIp: blockIpMutation.mutateAsync,
    isBlockingIp: blockIpMutation.isPending,
    unblockIp: unblockIpMutation.mutateAsync,
    isUnblockingIp: unblockIpMutation.isPending,
  };
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useSession } from "@/lib/auth-compat";

export type LicenseStatus =
  | "ACTIVE"
  | "GRACE_PERIOD"
  | "RESTRICTED_READ_ONLY"
  | "SUSPENDED"
  | "REVOKED";

export interface LicenseEntitlements {
  maxProjects: number;
  maxOdps: number;
  maxOdcs: number;
  maxCustomers: number;
  maxStorageGb: number;
  ssoEnabled: boolean;
  apiEnabled: boolean;
  aiCopilotEnabled: boolean;
  customDomainEnabled: boolean;
  calculationSource?: string;
}

export interface LicenseItem {
  id: string;
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
  planName: string;
  licenseKey: string;
  maskedLicenseKey: string;
  status: LicenseStatus;
  activationType: string;
  validFrom: string;
  validUntil: string;
  gracePeriodUntil?: string;
  daysRemaining: number;
  graceDaysRemaining: number;
  machineFingerprint?: string;
  issuedBy: string;
  notes?: string;
  entitlements: LicenseEntitlements;
  createdAt: string;
}

export interface LicenseOverviewKpi {
  totalLicenses: number;
  activeLicenses: number;
  gracePeriodLicenses: number;
  readOnlyLicenses: number;
  suspendedLicenses: number;
  expiringIn30Days: number;
  expiringIn7Days?: number;
  monthlyRecurringRevenue?: number;
  tierDistribution: Record<string, number>;
}

export interface IssueLicensePayload {
  organizationId: string;
  planName: string;
  durationMonths: number;
  activationType?: string;
  overrideMaxProjects?: number;
  overrideMaxOdps?: number;
  overrideMaxOdcs?: number;
  overrideMaxCustomers?: number;
  overrideMaxStorageGb?: number;
  featureSsoEnabled?: boolean;
  featureApiEnabled?: boolean;
  featureAiCopilotEnabled?: boolean;
  featureCustomDomainEnabled?: boolean;
  machineFingerprint?: string;
  notes?: string;
}

export interface ExtendLicensePayload {
  organizationId: string;
  licenseId: string;
  additionalMonths: number;
  notes?: string;
}

export interface RevokeLicensePayload {
  organizationId: string;
  licenseId: string;
  reason: string;
}

export function useLicenseOverview() {
  const { data: session, status } = useSession();
  const activeToken =
    session?.accessToken ||
    (typeof window !== "undefined"
      ? (window as unknown as { __K2NET_AUTH__?: { token?: string } }).__K2NET_AUTH__?.token
      : undefined);

  return useQuery<LicenseOverviewKpi>({
    queryKey: ["license-overview", activeToken],
    queryFn: async () => {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/system/licenses/overview`, {
        token: activeToken,
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch license overview: ${res.status}`);
      }
      return res.json();
    },
    enabled: status !== "unauthenticated" && (!!activeToken || typeof window !== "undefined"),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function useAllLicenses() {
  const { data: session, status } = useSession();
  const activeToken =
    session?.accessToken ||
    (typeof window !== "undefined"
      ? (window as unknown as { __K2NET_AUTH__?: { token?: string } }).__K2NET_AUTH__?.token
      : undefined);

  return useQuery<LicenseItem[]>({
    queryKey: ["all-licenses", activeToken],
    queryFn: async () => {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/system/licenses`, {
        token: activeToken,
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch all licenses: ${res.status}`);
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: status !== "unauthenticated" && (!!activeToken || typeof window !== "undefined"),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function useOrganizationLicenses(orgId?: string) {
  const { data: session, status } = useSession();

  return useQuery<LicenseItem[]>({
    queryKey: ["org-licenses", orgId, session?.accessToken],
    queryFn: async () => {
      if (!orgId) return [];
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/system/organizations/${orgId}/licenses`, {
        token: session?.accessToken ?? undefined,
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch licenses for org ${orgId}: ${res.status}`);
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: status === "authenticated" && !!session?.accessToken && !!orgId,
    staleTime: 30 * 1000,
  });
}

export function useIssueManualLicense() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: IssueLicensePayload) => {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(
        `${baseUrl}/system/organizations/${payload.organizationId}/licenses`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          token: session?.accessToken ?? undefined,
        }
      );

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");
        throw new Error(`Failed to issue license: ${res.status} - ${errorText}`);
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["license-overview"] });
      queryClient.invalidateQueries({ queryKey: ["all-licenses"] });
      queryClient.invalidateQueries({ queryKey: ["org-licenses", variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}

export function useExtendLicense() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ExtendLicensePayload) => {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(
        `${baseUrl}/system/organizations/${payload.organizationId}/licenses/${payload.licenseId}/extend`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            additionalMonths: payload.additionalMonths,
            notes: payload.notes,
          }),
          token: session?.accessToken ?? undefined,
        }
      );

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");
        throw new Error(`Failed to extend license: ${res.status} - ${errorText}`);
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["license-overview"] });
      queryClient.invalidateQueries({ queryKey: ["all-licenses"] });
      queryClient.invalidateQueries({ queryKey: ["org-licenses", variables.organizationId] });
    },
  });
}

export function useRevokeLicense() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RevokeLicensePayload) => {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(
        `${baseUrl}/system/organizations/${payload.organizationId}/licenses/${payload.licenseId}/revoke`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: payload.reason }),
          token: session?.accessToken ?? undefined,
        }
      );

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");
        throw new Error(`Failed to revoke license: ${res.status} - ${errorText}`);
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["license-overview"] });
      queryClient.invalidateQueries({ queryKey: ["all-licenses"] });
      queryClient.invalidateQueries({ queryKey: ["org-licenses", variables.organizationId] });
    },
  });
}

export async function fetchOfflineLicenseCertificate(
  orgId: string,
  licenseId: string,
  token?: string
): Promise<string> {
  const baseUrl = getBackendBaseUrl();
  const res = await httpClient(
    `${baseUrl}/system/organizations/${orgId}/licenses/${licenseId}/export-cert`,
    {
      method: "GET",
      token,
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to export certificate: ${res.status}`);
  }
  return res.text();
}

export interface LicenseNotificationLog {
  id: string;
  organizationId: string;
  licenseId: string;
  channel: string;
  stage: string;
  recipient: string;
  subject?: string;
  status: string;
  messageContent?: string;
  errorDetails?: string;
  triggeredBy: string;
  sentAt: string;
}

export function useLicenseNotificationLogs(orgId?: string, licenseId?: string) {
  const { data: session } = useSession();

  return useQuery<LicenseNotificationLog[]>({
    queryKey: ["license-notifications", orgId, licenseId, session?.accessToken],
    queryFn: async () => {
      if (!orgId || !licenseId) return [];
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(
        `${baseUrl}/system/organizations/${orgId}/licenses/${licenseId}/notifications`,
        {
          token: session?.accessToken ?? undefined,
        }
      );

      if (!res.ok) {
        return [];
      }
      return res.json();
    },
    enabled: !!orgId && !!licenseId,
    staleTime: 30 * 1000,
  });
}

export function useSendManualLicenseReminder() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orgId, licenseId }: { orgId: string; licenseId: string }) => {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(
        `${baseUrl}/system/organizations/${orgId}/licenses/${licenseId}/send-reminder`,
        {
          method: "POST",
          token: session?.accessToken ?? undefined,
        }
      );

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");
        throw new Error(`Failed to dispatch reminder: ${res.status} - ${errorText}`);
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["license-notifications", variables.orgId, variables.licenseId],
      });
      queryClient.invalidateQueries({ queryKey: ["all-licenses"] });
    },
  });
}

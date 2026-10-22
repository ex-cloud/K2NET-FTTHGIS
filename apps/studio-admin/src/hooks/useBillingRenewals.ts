import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useSession } from "@/lib/auth-compat";

export interface RenewalQueueItem {
  licenseId: string;
  organizationId: string;
  organizationName: string;
  organizationSlug?: string;
  planName: string;
  status: string;
  validUntil?: string;
  daysRemaining: number;
  dunningStage: string;
  lastNotifiedStage?: string;
  lastNotifiedAt?: string;
  billingContactEmail?: string;
  billingContactPhone?: string;
  outstandingInvoicesCount?: number;
}

export interface RenewalDispatchLog {
  id: string;
  organizationId?: string;
  organizationName?: string;
  organizationSlug?: string;
  licenseId?: string;
  licenseKey?: string;
  maskedLicenseKey?: string;
  channel: "EMAIL" | "WHATSAPP" | string;
  stage: string;
  recipient: string;
  subject?: string;
  status: "SENT" | "FAILED" | string;
  messageContent?: string;
  errorDetails?: string;
  triggeredBy?: string;
  sentAt: string;
}

export function useRenewalQueue() {
  const { data: session } = useSession();

  return useQuery<RenewalQueueItem[]>({
    queryKey: ["billing-renewal-queue", session?.accessToken],
    queryFn: async () => {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/system/billing/dunning/queue`, {
        token: session?.accessToken ?? undefined,
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch renewal queue: ${res.statusText}`);
      }
      return res.json();
    },
    staleTime: 30 * 1000,
  });
}

export function useRenewalDispatchLogs() {
  const { data: session } = useSession();

  return useQuery<RenewalDispatchLog[]>({
    queryKey: ["billing-renewal-logs", session?.accessToken],
    queryFn: async () => {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/system/licenses/notifications`, {
        token: session?.accessToken ?? undefined,
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch dispatch logs: ${res.statusText}`);
      }
      return res.json();
    },
    staleTime: 15 * 1000,
  });
}

export function useRetryNotification() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (logId: string) => {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/system/billing/dunning/retry/${logId}`, {
        method: "POST",
        token: session?.accessToken ?? undefined,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to retry notification dispatch");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-renewal-logs"] });
      queryClient.invalidateQueries({ queryKey: ["billing-renewal-queue"] });
    },
  });
}

export function useTriggerLicenseReminder() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async ({
      orgId,
      licenseId,
    }: {
      orgId: string;
      licenseId: string;
    }) => {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(
        `${baseUrl}/system/organizations/${orgId}/licenses/${licenseId}/send-reminder`,
        {
          method: "POST",
          token: session?.accessToken ?? undefined,
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to trigger reminder");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-renewal-logs"] });
      queryClient.invalidateQueries({ queryKey: ["billing-renewal-queue"] });
    },
  });
}

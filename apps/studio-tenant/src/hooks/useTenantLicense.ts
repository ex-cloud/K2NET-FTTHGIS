import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/api-client";
import { toast } from "sonner";
import { useTranslation } from "@k2net/i18n";

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

export interface TenantLicenseDetails {
  id: string;
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
  planName: string;
  licenseKey: string;
  maskedLicenseKey: string;
  status: "ACTIVE" | "GRACE_PERIOD" | "EXPIRED" | "SUSPENDED" | "REVOKED";
  activationType: string;
  validFrom: string;
  validUntil: string;
  gracePeriodUntil?: string | null;
  daysRemaining: number;
  graceDaysRemaining: number;
  machineFingerprint?: string | null;
  issuedBy?: string | null;
  notes?: string | null;
  entitlements: LicenseEntitlements;
  createdAt: string;
}

export interface BillingInvoiceItem {
  id: string;
  organizationId: string;
  organizationName: string;
  invoiceNumber: string;
  description?: string | null;
  amount: number;
  currency: string;
  status: "PAID" | "PENDING" | "OVERDUE" | "CANCELLED" | "REFUNDED";
  dueDate?: string | null;
  paidAt?: string | null;
  paymentMethod?: string | null;
  paymentChannel?: string | null;
  externalInvoiceUrl?: string | null;
  externalReferenceId?: string | null;
  createdAt: string;
}

export function useTenantLicense() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const currentLicenseQuery = useQuery<TenantLicenseDetails | null>({
    queryKey: ["tenant-current-license"],
    queryFn: async () => {
      try {
        const res = await apiClient<TenantLicenseDetails>("/api/v1/tenant/license/current");
        return res ?? null;
      } catch (err: unknown) {
        const status = (err as { status?: number })?.status;
        if (status === 404) {
          return null;
        }
        throw err;
      }
    },
    staleTime: 30 * 1000,
    retry: 1,
  });

  const billingInvoicesQuery = useQuery<BillingInvoiceItem[]>({
    queryKey: ["tenant-billing-invoices"],
    queryFn: async () => {
      try {
        const res = await apiClient<BillingInvoiceItem[]>("/api/v1/tenant/license/invoices");
        return Array.isArray(res) ? res : [];
      } catch (err) {
        console.warn("Failed to fetch tenant billing invoices:", err);
        return [];
      }
    },
    staleTime: 30 * 1000,
  });

  const activateMutation = useMutation({
    mutationFn: async (licenseKey: string) => {
      return apiClient<TenantLicenseDetails>("/api/v1/tenant/license/activate", {
        method: "POST",
        body: JSON.stringify({ licenseKey: licenseKey.trim() }),
      });
    },
    onSuccess: () => {
      toast.success(t("license.tenant.activation_success"));
      queryClient.invalidateQueries({ queryKey: ["tenant-current-license"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-subscription-summary"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-billing-invoices"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : t("license.tenant.activation_failed");
      toast.error(msg);
    },
  });

  return {
    license: currentLicenseQuery.data,
    isLoading: currentLicenseQuery.isLoading,
    isError: currentLicenseQuery.isError,
    error: currentLicenseQuery.error,
    refetchLicense: currentLicenseQuery.refetch,

    invoices: billingInvoicesQuery.data || [],
    isInvoicesLoading: billingInvoicesQuery.isLoading,
    refetchInvoices: billingInvoicesQuery.refetch,

    activateLicense: activateMutation.mutateAsync,
    isActivating: activateMutation.isPending,
  };
}

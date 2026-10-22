import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useSession } from "@/lib/auth-compat";

export interface BillingInvoiceItem {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationSlug?: string;
  subscriptionId?: string;
  invoiceNumber: string;
  description: string;
  amount: number;
  currency: string;
  status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED" | string;
  dueDate: string;
  paidAt?: string;
  paymentMethod?: string;
  paymentChannel?: string;
  externalInvoiceUrl?: string;
  externalReferenceId?: string;
  createdAt: string;
}

export interface CreateBillingInvoiceInput {
  organizationId: string;
  subscriptionId?: string;
  description: string;
  amount: number;
  dueDays?: number;
  paymentMethod?: string;
  notes?: string;
}

export function useBillingInvoices() {
  const { data: session } = useSession();

  return useQuery<BillingInvoiceItem[]>({
    queryKey: ["all-billing-invoices", session?.accessToken],
    queryFn: async () => {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/system/billing/invoices`, {
        token: session?.accessToken ?? undefined,
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch billing invoices: ${res.statusText}`);
      }
      return res.json();
    },
    staleTime: 30 * 1000,
  });
}

export function useCreateBillingInvoice() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (input: CreateBillingInvoiceInput) => {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/system/billing/invoices`, {
        method: "POST",
        token: session?.accessToken ?? undefined,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to create invoice");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-billing-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["all-tenant-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["billing-overview"] });
    },
  });
}

export function useSettleBillingInvoice() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async ({
      invoiceId,
      paymentMethod,
      paymentChannel,
    }: {
      invoiceId: string;
      paymentMethod?: string;
      paymentChannel?: string;
    }) => {
      const baseUrl = getBackendBaseUrl();
      const params = new URLSearchParams();
      if (paymentMethod) params.append("paymentMethod", paymentMethod);
      if (paymentChannel) params.append("paymentChannel", paymentChannel);

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const res = await httpClient(`${baseUrl}/system/billing/invoices/${invoiceId}/settle${queryString}`, {
        method: "POST",
        token: session?.accessToken ?? undefined,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to settle invoice");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-billing-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["all-tenant-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["all-licenses"] });
      queryClient.invalidateQueries({ queryKey: ["billing-overview"] });
    },
  });
}

export function useCancelBillingInvoice() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async ({
      invoiceId,
      reason,
    }: {
      invoiceId: string;
      reason?: string;
    }) => {
      const baseUrl = getBackendBaseUrl();
      const params = new URLSearchParams();
      if (reason) params.append("reason", reason);

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const res = await httpClient(`${baseUrl}/system/billing/invoices/${invoiceId}/cancel${queryString}`, {
        method: "POST",
        token: session?.accessToken ?? undefined,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to cancel invoice");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-billing-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["billing-overview"] });
    },
  });
}

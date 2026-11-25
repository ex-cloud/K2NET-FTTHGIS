import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-compat";
import { httpClient } from "@/lib/httpClient";
import { getTenantUrl } from "@/lib/domain";
import { useActiveImpersonation } from "@/hooks/useActiveImpersonation";
import type { EnrichedOrganization } from "../types";

export function useImpersonateTenantState(
  organization: EnrichedOrganization | null,
  isOpen: boolean,
  onClose: () => void
) {
  const { data: session } = useSession();
  const { activeSession, refetch: refetchActiveSession } = useActiveImpersonation();
  const [reason, setReason] = useState("");
  const [ticketReference, setTicketReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  const hasDifferentActiveSession = Boolean(
    activeSession?.hasActiveSession &&
      (activeSession.remainingSeconds ?? 0) > 0 &&
      organization &&
      activeSession.targetOrgSlug !== organization.slug
  );

  const isReasonValid = reason.trim().length >= 10;

  const handleSuccess = useCallback(
    async (data: { exchangeCode?: string; targetTenantSlug?: string }) => {
      if (!organization) return;
      const tenantBaseUrl = getTenantUrl(data.targetTenantSlug || organization.slug);
      const targetUrl = `${tenantBaseUrl}/?impersonate_code=${data.exchangeCode}`;

      toast.success(`Sesi Impersonasi Aktif: ${organization.name}`, {
        description: "Membuka portal tenant di tab baru...",
      });

      window.open(targetUrl, "_blank");
      await refetchActiveSession();
      onClose();
      setReason("");
      setTicketReference("");
    },
    [organization, refetchActiveSession, onClose]
  );

  const triggerStart = useCallback(
    async (overrideReason?: string, overrideTicket?: string, autoSwitch: boolean = false) => {
      if (!organization) return;
      setSubmitting(true);
      setConflictError(null);

      const finalReason = (overrideReason ?? reason).trim();
      const finalTicket = (overrideTicket ?? ticketReference).trim();
      const shouldAutoSwitch = autoSwitch || hasDifferentActiveSession;

      try {
        const tenantIdentifier = organization.id || organization.slug;
        const res = await httpClient(`/api/v1/system/tenants/${tenantIdentifier}/impersonate/start`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          token: session?.accessToken ?? undefined,
          body: JSON.stringify({
            reason: finalReason,
            ticketReference: finalTicket || undefined,
            autoSwitch: shouldAutoSwitch,
            refreshToken: session?.refreshToken || undefined,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (res.status === 409) {
          setConflictError(data.details || data.message || "Anda masih memiliki sesi impersonasi aktif untuk tenant lain.");
          return;
        }

        if (!res.ok) {
          toast.error("Gagal Memulai Impersonasi", {
            description: data.details || data.message || "Terjadi kesalahan pada sistem.",
          });
          return;
        }

        await handleSuccess(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Pastikan koneksi internet stabil.";
        toast.error("Terjadi Kesalahan Jaringan", { description: msg });
      } finally {
        setSubmitting(false);
      }
    },
    [
      organization,
      reason,
      ticketReference,
      hasDifferentActiveSession,
      session?.accessToken,
      session?.refreshToken,
      handleSuccess,
    ]
  );

  useEffect(() => {
    if (!isOpen || !organization) return;
    setConflictError(null);
  }, [isOpen, organization]);

  return {
    reason,
    setReason,
    ticketReference,
    setTicketReference,
    submitting,
    conflictError,
    activeSession,
    hasDifferentActiveSession,
    isReasonValid,
    triggerStart,
  };
}

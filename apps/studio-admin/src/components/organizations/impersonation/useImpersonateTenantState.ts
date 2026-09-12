import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-compat";
import { getTenantUrl } from "@/lib/domain";
import { useActiveImpersonation } from "@/hooks/useActiveImpersonation";
import type { EnrichedOrganization } from "../types";

function isStepUpAuthRequired(status: number, data: { error?: string; message?: string; details?: string }): boolean {
  if (status !== 403) return false;
  const str = `${data.error || ""} ${data.message || ""} ${data.details || ""}`.toLowerCase();
  return str.includes("step_up") || str.includes("step-up") || str.includes("120 detik");
}

export function useImpersonateTenantState(
  organization: EnrichedOrganization | null,
  isOpen: boolean,
  onClose: () => void
) {
  const { data: session, signIn } = useSession();
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

  const handleStepUpAuth = useCallback(
    async (finalReason: string, finalTicket: string, autoSwitch: boolean) => {
      if (!organization) return;
      toast.info("Verifikasi Kredensial Diperlukan", {
        description: "Mengalihkan ke Keycloak untuk verifikasi kata sandi ulang...",
      });

      sessionStorage.setItem(
        "pending_impersonate",
        JSON.stringify({
          orgId: organization.id,
          orgSlug: organization.slug,
          reason: finalReason,
          ticketReference: finalTicket,
          autoSwitch,
        })
      );

      await signIn(undefined, {
        prompt: "login",
        maxAge: 0,
        redirectUri: window.location.href,
      });
    },
    [organization, signIn]
  );

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
        const res = await fetch(`/api/v1/system/tenants/${tenantIdentifier}/impersonate/start`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.accessToken}`,
          },
          body: JSON.stringify({
            reason: finalReason,
            ticketReference: finalTicket || undefined,
            autoSwitch: shouldAutoSwitch,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (isStepUpAuthRequired(res.status, data)) {
          await handleStepUpAuth(finalReason, finalTicket, shouldAutoSwitch);
          return;
        }

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
      handleStepUpAuth,
      handleSuccess,
    ]
  );

  useEffect(() => {
    if (!isOpen || !organization) return;
    setConflictError(null);

    const pending = sessionStorage.getItem("pending_impersonate");
    if (pending) {
      try {
        const parsed = JSON.parse(pending);
        if (
          parsed.orgId === organization.id ||
          parsed.orgSlug === organization.slug ||
          parsed.orgId === organization.slug
        ) {
          sessionStorage.removeItem("pending_impersonate");
          setReason(parsed.reason || "");
          setTicketReference(parsed.ticketReference || "");
          setTimeout(() => {
            triggerStart(parsed.reason, parsed.ticketReference, parsed.autoSwitch ?? false);
          }, 300);
        }
      } catch (e) {
        console.error("Failed to parse pending impersonate", e);
      }
    }
  }, [isOpen, organization, triggerStart]);

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

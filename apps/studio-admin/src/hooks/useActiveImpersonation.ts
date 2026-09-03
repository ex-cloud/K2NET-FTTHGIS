import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/auth-compat";
import { toast } from "sonner";
import { getTenantUrl } from "@/lib/domain";

export interface ActiveImpersonationSession {
  hasActiveSession: boolean;
  sessionId?: string;
  targetOrgId?: string;
  targetOrgSlug?: string;
  targetOrgName?: string;
  startedAt?: string;
  expiresAt?: string;
  remainingSeconds?: number;
}

export function useActiveImpersonation() {
  const { data: session } = useSession();
  const [activeSession, setActiveSession] = useState<ActiveImpersonationSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [terminating, setTerminating] = useState(false);

  const fetchActiveSession = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const res = await fetch("/api/v1/system/impersonate/active-session", {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveSession(data);
      }
    } catch {
      // ignore network glitches
    }
  }, [session?.accessToken]);

  useEffect(() => {
    fetchActiveSession();
    // Poll every 15 seconds
    const interval = setInterval(fetchActiveSession, 15000);
    return () => clearInterval(interval);
  }, [fetchActiveSession]);

  const stopActiveSession = useCallback(async () => {
    if (!session?.accessToken) return;
    setTerminating(true);
    try {
      const res = await fetch("/api/v1/system/impersonate/exit-active", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (res.ok) {
        toast.success("Sesi Impersonasi Diakhiri", {
          description: "Sesi operasional tenant telah ditutup secara aman.",
        });
        setActiveSession({ hasActiveSession: false });
        await fetchActiveSession();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error("Gagal Mengakhiri Sesi", {
          description: err.message || "Silakan coba beberapa saat lagi.",
        });
      }
    } catch (e: any) {
      toast.error("Kesalahan Jaringan", { description: e.message });
    } finally {
      setTerminating(false);
    }
  }, [session?.accessToken, fetchActiveSession]);

  const reopenTenantPortal = useCallback(async (slug: string) => {
    if (!session?.accessToken) {
      const url = getTenantUrl(slug);
      window.open(url, "_blank");
      return;
    }

    try {
      const res = await fetch("/api/v1/system/impersonate/reopen", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const tenantBaseUrl = getTenantUrl(data.targetTenantSlug || slug);
        const targetUrl = `${tenantBaseUrl}/?impersonate_code=${data.exchangeCode}`;
        window.open(targetUrl, "_blank");
      } else {
        const url = getTenantUrl(slug);
        window.open(url, "_blank");
      }
    } catch {
      const url = getTenantUrl(slug);
      window.open(url, "_blank");
    }
  }, [session?.accessToken]);

  return {
    activeSession,
    loading,
    terminating,
    refetch: fetchActiveSession,
    stopActiveSession,
    reopenTenantPortal,
  };
}

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/auth-compat";
import { toast } from "sonner";
import { getTenantUrl } from "@/lib/domain";

export interface ImpersonationSessionItem {
  id: string;
  actorId: string;
  actorEmail: string;
  actorName: string;
  targetOrgId: string;
  targetOrgSlug: string;
  targetOrgName: string;
  targetOrgPlan: string;
  reason: string;
  ticketReference?: string;
  stepUpVerifiedAt: string;
  startedAt: string;
  expiresAt: string;
  revokedAt?: string;
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
  durationSeconds: number;
  remainingSeconds: number;
}

export interface ImpersonationStats {
  activeCount: number;
  todayCount: number;
  total7dCount: number;
  avgDurationSeconds: number;
  uniqueTenants7dCount: number;
  forceRevokedCount: number;
}

export function useImpersonationCenter() {
  const { data: session } = useSession();

  const [stats, setStats] = useState<ImpersonationStats>({
    activeCount: 0,
    todayCount: 0,
    total7dCount: 0,
    avgDurationSeconds: 0,
    uniqueTenants7dCount: 0,
    forceRevokedCount: 0,
  });

  const [activeSessions, setActiveSessions] = useState<ImpersonationSessionItem[]>([]);
  const [historySessions, setHistorySessions] = useState<ImpersonationSessionItem[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [page, setPage] = useState(0);
  const [pageSize] = useState(15);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);

    try {
      // 1. Fetch Stats & Active Sessions in parallel
      const [statsRes, activeRes] = await Promise.all([
        fetch("/api/v1/system/impersonate/stats", {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }),
        fetch("/api/v1/system/impersonate/active-sessions", {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (activeRes.ok) {
        const activeData = await activeRes.json();
        setActiveSessions(activeData || []);
      }

      // 2. Fetch Paginated Audit History
      const params = new URLSearchParams({
        page: String(page),
        size: String(pageSize),
      });
      if (statusFilter && statusFilter !== "ALL") {
        params.append("status", statusFilter);
      }
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      const historyRes = await fetch(`/api/v1/system/impersonate/sessions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistorySessions(historyData.content || []);
        setTotalPages(historyData.totalPages || 0);
        setTotalElements(historyData.totalElements || 0);
      }
    } catch {
      // ignore transient network glitches
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, page, pageSize, statusFilter, searchQuery]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const emergencyRevoke = async (sessionId: string, tenantName: string) => {
    if (!session?.accessToken) return;
    setActionLoadingId(sessionId);

    try {
      const res = await fetch(`/api/v1/system/impersonate/sessions/${sessionId}/revoke`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (res.ok) {
        toast.success(`Akses Impersonasi ${tenantName} Berhasil Diputus`, {
          description: "Sesi darurat telah dicabut dan token segera dimatikan.",
        });
        await fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error("Gagal Mencabut Sesi", {
          description: err.message || "Terjadi kesalahan sistem.",
        });
      }
    } catch (e: any) {
      toast.error("Kesalahan Jaringan", { description: e.message });
    } finally {
      setActionLoadingId(null);
    }
  };

  const reopenPortal = async (slug: string) => {
    if (!session?.accessToken) {
      window.open(getTenantUrl(slug), "_blank");
      return;
    }

    try {
      const res = await fetch("/api/v1/system/impersonate/reopen", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        const tenantBaseUrl = getTenantUrl(data.targetTenantSlug || slug);
        window.open(`${tenantBaseUrl}/?impersonate_code=${data.exchangeCode}`, "_blank");
      } else {
        window.open(getTenantUrl(slug), "_blank");
      }
    } catch {
      window.open(getTenantUrl(slug), "_blank");
    }
  };

  return {
    stats,
    activeSessions,
    historySessions,
    loading,
    actionLoadingId,
    page,
    setPage,
    totalPages,
    totalElements,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    refresh: fetchData,
    emergencyRevoke,
    reopenPortal,
  };
}

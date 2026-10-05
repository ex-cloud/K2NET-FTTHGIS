import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient, getApiAuthToken, getImpersonationSessionId } from "../lib/api-client";
import { useTenantInfo } from "./useTenantInfo";
import type {
  PageResponse,
  TenantAuditEvent,
  TenantAuditFilterState,
  TenantAuditScope,
  TenantAuditStats,
} from "../types/tenant-audit";

export interface UseTenantAuditOptions {
  scope: TenantAuditScope;
  projectId?: string;
  initialCategory?: string;
  autoRefreshInterval?: number; // In ms: 0 (off), 15000, 30000, 60000
}

const DEFAULT_FILTERS: TenantAuditFilterState = {
  search: "",
  category: "ALL",
  severity: "ALL",
  action: "",
  actorId: "",
  dateRange: {
    from: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 Hours
    to: new Date(),
  },
  page: 0,
  pageSize: 50,
};

export function useTenantAudit(options: UseTenantAuditOptions) {
  const { scope, projectId, initialCategory, autoRefreshInterval = 30000 } = options;
  const { slug } = useTenantInfo();

  const [filters, setFilters] = React.useState<TenantAuditFilterState>(() => ({
    ...DEFAULT_FILTERS,
    category: initialCategory || "ALL",
  }));

  const [isExporting, setIsExporting] = React.useState(false);

  // --------------------------------------------------------------------------
  // 1. Construct Endpoint URLs
  // --------------------------------------------------------------------------
  const getEventsUrl = React.useCallback(() => {
    if (!slug) return null;
    if (scope === "PROJECT") {
      if (!projectId) return null;
      return `/api/v1/tenants/${encodeURIComponent(slug)}/projects/${encodeURIComponent(projectId)}/audit-events`;
    }
    return `/api/v1/tenants/${encodeURIComponent(slug)}/audit-events`;
  }, [slug, scope, projectId]);

  const getStatsUrl = React.useCallback(() => {
    if (!slug) return null;
    if (scope === "PROJECT") {
      if (!projectId) return null;
      return `/api/v1/tenants/${encodeURIComponent(slug)}/projects/${encodeURIComponent(projectId)}/audit-events/stats`;
    }
    return `/api/v1/tenants/${encodeURIComponent(slug)}/audit-events/stats`;
  }, [slug, scope, projectId]);

  const getExportUrl = React.useCallback(() => {
    if (!slug) return null;
    if (scope === "PROJECT") {
      if (!projectId) return null;
      return `/api/v1/tenants/${encodeURIComponent(slug)}/projects/${encodeURIComponent(projectId)}/audit-events/export`;
    }
    return `/api/v1/tenants/${encodeURIComponent(slug)}/audit-events/export`;
  }, [slug, scope, projectId]);

  // --------------------------------------------------------------------------
  // 2. Build Query Params
  // --------------------------------------------------------------------------
  const queryParams = React.useMemo(() => {
    const params: Record<string, string | number | boolean | undefined> = {
      page: filters.page,
      size: filters.pageSize,
      sortDirection: "DESC",
    };

    if (filters.search?.trim()) params.search = filters.search.trim();
    if (filters.category && filters.category !== "ALL") params.category = filters.category;
    if (filters.severity && filters.severity !== "ALL") params.severity = filters.severity;
    if (filters.action?.trim()) params.action = filters.action.trim();
    if (filters.actorId?.trim()) params.actorId = filters.actorId.trim();

    if (filters.dateRange?.from) {
      params.startDate = filters.dateRange.from.toISOString();
    }
    if (filters.dateRange?.to) {
      params.endDate = filters.dateRange.to.toISOString();
    }

    return params;
  }, [filters]);

  // --------------------------------------------------------------------------
  // 3. React Query: Fetch Events Stream
  // --------------------------------------------------------------------------
  const eventsEndpoint = getEventsUrl();

  const {
    data: eventsPage,
    isLoading: isEventsLoading,
    isFetching,
    error: eventsError,
    refetch: refetchEvents,
  } = useQuery<PageResponse<TenantAuditEvent>>({
    queryKey: ["tenant-audit-events", eventsEndpoint, slug, scope, projectId, queryParams, filters.pageSize],
    queryFn: async () => {
      if (!eventsEndpoint) {
        return {
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: filters.pageSize,
          number: 0,
          first: true,
          last: true,
          empty: true,
        };
      }
      return await apiClient<PageResponse<TenantAuditEvent>>(eventsEndpoint, {
        params: queryParams,
      });
    },
    enabled: !!slug && (scope !== "PROJECT" || !!projectId),
    refetchInterval: autoRefreshInterval > 0 ? autoRefreshInterval : false,
    staleTime: 10 * 1000,
  });

  // --------------------------------------------------------------------------
  // 4. React Query: Fetch Summary Statistics
  // --------------------------------------------------------------------------
  const statsEndpoint = getStatsUrl();

  const {
    data: stats,
    isLoading: isStatsLoading,
    refetch: refetchStats,
  } = useQuery<TenantAuditStats | null>({
    queryKey: ["tenant-audit-stats", statsEndpoint, slug, scope, projectId],
    queryFn: async () => {
      if (!statsEndpoint) return null;
      try {
        return await apiClient<TenantAuditStats>(statsEndpoint);
      } catch (err) {
        console.warn("Failed to fetch tenant audit stats:", err);
        return null;
      }
    },
    enabled: !!slug && (scope !== "PROJECT" || !!projectId),
    staleTime: 30 * 1000,
  });

  // --------------------------------------------------------------------------
  // 5. CSV Export Action
  // --------------------------------------------------------------------------
  const exportCsv = React.useCallback(async () => {
    const exportBase = getExportUrl();
    if (!exportBase) {
      toast.error("Tidak dapat mengekspor log: Konteks tenant belum siap.");
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading("Menyiapkan berkas audit CSV...");

    try {
      const query = new URLSearchParams();
      if (filters.search?.trim()) query.append("search", filters.search.trim());
      if (filters.category && filters.category !== "ALL") query.append("category", filters.category);
      if (filters.severity && filters.severity !== "ALL") query.append("severity", filters.severity);
      if (filters.action?.trim()) query.append("action", filters.action.trim());
      if (filters.actorId?.trim()) query.append("actorId", filters.actorId.trim());
      if (filters.dateRange?.from) query.append("startDate", filters.dateRange.from.toISOString());
      if (filters.dateRange?.to) query.append("endDate", filters.dateRange.to.toISOString());

      const url = `${exportBase}?${query.toString()}`;
      const headers: Record<string, string> = {};

      const token = getApiAuthToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const impersonationId = getImpersonationSessionId();
      if (impersonationId) headers["X-Impersonation-Session-Id"] = impersonationId;

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`Ekspor gagal dengan kode ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;

      // Extract filename from header or fallback
      const contentDisposition = response.headers.get("content-disposition");
      let filename = `audit_logs_${scope.toLowerCase()}_${Date.now()}.csv`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success("Berkas audit CSV berhasil diunduh.", { id: toastId });
    } catch (err) {
      console.error("Export CSV error:", err);
      toast.error("Gagal mengunduh berkas audit CSV.", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  }, [getExportUrl, filters, scope]);

  // --------------------------------------------------------------------------
  // 6. Action Handlers
  // --------------------------------------------------------------------------
  const refetchAll = React.useCallback(() => {
    refetchEvents();
    refetchStats();
  }, [refetchEvents, refetchStats]);

  const setPage = React.useCallback((newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  }, []);

  const resetFilters = React.useCallback(() => {
    setFilters({
      ...DEFAULT_FILTERS,
      category: initialCategory || "ALL",
    });
  }, [initialCategory]);

  return {
    events: eventsPage?.content || [],
    stats: stats || null,
    totalElements: eventsPage?.totalElements || 0,
    totalPages: eventsPage?.totalPages || 0,
    currentPage: eventsPage?.number || 0,
    pageSize: eventsPage?.size || filters.pageSize,
    isLoading: isEventsLoading || isStatsLoading,
    isFetching,
    error: eventsError,
    filters,
    setFilters,
    setPage,
    resetFilters,
    refetch: refetchAll,
    exportCsv,
    isExporting,
  };
}

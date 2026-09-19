import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-compat";
import type { RecentOperationsData } from "@/components/system/overview/recent-operations-types";

const POLL_INTERVAL_MS = 30_000;

const DEFAULT_DATA: RecentOperationsData = {
  organizations: [],
  securityAudits: [],
  backgroundJobs: [],
  systemAlerts: [],
  billingEvents: [],
  summaryCounts: {
    activeAlertsCount: 0,
    runningJobsCount: 0,
    securityWarningsCount: 0,
    totalOrganizationsCount: 0,
    recentBillingEventsCount: 0,
  },
};

export function useRecentOperations() {
  const { data: session, status } = useSession();

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<RecentOperationsData>({
    queryKey: ["recent-operations", session?.accessToken],
    queryFn: async () => {
      if (!session?.accessToken) return DEFAULT_DATA;

      const res = await fetch("/api/v1/system/recent-operations", {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load recent operations: ${res.statusText}`);
      }

      return res.json();
    },
    enabled: status === "authenticated" && !!session?.accessToken,
    staleTime: 30_000, // 30 seconds stale-while-revalidate
    gcTime: 300_000, // 5 minutes in-memory cache
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: false,
  });

  return {
    data: data ?? DEFAULT_DATA,
    loading: isLoading && !data,
    isFetching,
    error: error instanceof Error ? error.message : null,
    refresh: refetch,
  };
}

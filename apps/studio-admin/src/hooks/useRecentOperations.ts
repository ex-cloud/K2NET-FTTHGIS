import { useState, useEffect, useCallback, useRef } from "react";
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
  const { data: session } = useSession();
  const [data, setData] = useState<RecentOperationsData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (!session?.accessToken || isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const res = await fetch("/api/v1/system/recent-operations", {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const json: RecentOperationsData = await res.json();
        setData(json);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load recent operations");
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [session?.accessToken]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh: fetchData,
  };
}



import { useState, useEffect, useCallback } from "react";
import { useSession } from '@/lib/auth-compat';
import { httpClient } from '@/lib/httpClient';
import { getBackendBaseUrl } from '@/lib/api-config';

export interface TaskSummary {
  totalOpen: number;
  urgentCount: number;
  resolvedToday: number;
}

interface UseTaskSummaryResult {
  summary: TaskSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const POLL_INTERVAL_MS = 30_000;

/**
 * Hook to fetch task KPI summary for the Overview metric card.
 * Returns: totalOpen (all non-terminal tasks), urgentCount, resolvedToday.
 * Tenant-scoped automatically by the backend Hibernate Filter.
 */
export function useTaskSummary(): UseTaskSummaryResult {
  const { data: session } = useSession();
  const [summary, setSummary] = useState<TaskSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!session?.accessToken) {
      return;
    }
    try {
      setError(null);
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/summary`, { token: session.accessToken });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: TaskSummary = await res.json();
      setSummary(data);
    } catch (err: any) {
      setError(err.message ?? "Gagal memuat task summary");
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchSummary]);

  return { summary, loading, error, refresh: fetchSummary };
}

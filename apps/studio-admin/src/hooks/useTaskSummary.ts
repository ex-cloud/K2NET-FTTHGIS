"use client";

import { useState, useEffect, useCallback } from "react";

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
  const [summary, setSummary] = useState<TaskSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/v1/tasks/summary");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: TaskSummary = await res.json();
      setSummary(data);
    } catch (err: any) {
      setError(err.message ?? "Gagal memuat task summary");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchSummary]);

  return { summary, loading, error, refresh: fetchSummary };
}

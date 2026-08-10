"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from 'next-auth/react';
import { httpClient } from '@/lib/httpClient';
import { getBackendBaseUrl } from '@/lib/api-config';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TaskScope = "PLATFORM_INTERNAL" | "TENANT_TO_PLATFORM" | "TENANT_INTERNAL";

export interface Task {
  id: string;
  type: "TICKET" | "PROJECT";
  status: string;
  priority: string;
  scope: TaskScope;
  title: string;
  description?: string;
  reporterId: string;
  assigneeId?: string;
  organizationId?: string;
  referenceType?: string;
  referenceId?: string;
  parentTaskId?: string;
  dueDate?: string;
  resolvedAt?: string;
  obsidianRef?: string;
  comments?: TaskComment[];
  createdAt: string;
  createdBy?: string;
  updatedAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

interface UseTasksQueryResult {
  tasks: Task[];
  task?: Task;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const POLL_INTERVAL_MS = 30_000;

/**
 * Hook to fetch the task list, or a single task by ID.
 * Polls every 30 seconds to keep data fresh.
 *
 * @param taskId  - if provided, fetches a single task by ID
 * @param scope   - filter by scope (e.g. "PLATFORM_INTERNAL" | "TENANT_TO_PLATFORM")
 *                  If undefined, the backend default is applied (Super Admin sees
 *                  PLATFORM_INTERNAL + TENANT_TO_PLATFORM combined).
 */
export function useTasksQuery(taskId?: string, scope?: TaskScope): UseTasksQueryResult {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [task, setTask] = useState<Task | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!session?.accessToken) {
      return;
    }
    try {
      setError(null);
      const baseUrl = getBackendBaseUrl();

      let url: string;
      if (taskId) {
        url = `${baseUrl}/tasks/${taskId}`;
      } else {
        const params = new URLSearchParams({
          size: "100",
          sort: "createdAt",
          direction: "DESC",
        });
        if (scope) params.set("scope", scope);
        url = `${baseUrl}/tasks?${params.toString()}`;
      }

      const res = await httpClient(url, { token: session.accessToken });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      if (taskId) {
        setTask(data as Task);
      } else {
        // Spring Page response: { content: Task[], totalElements, ... }
        setTasks(data.content ?? (Array.isArray(data) ? data : []));
      }
    } catch (err: any) {
      setError(err.message ?? "Gagal memuat data task");
    } finally {
      setLoading(false);
    }
  }, [taskId, scope, session?.accessToken]);

  useEffect(() => {
    setLoading(true);
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { tasks, task, loading, error, refresh: fetchData };
}

"use client";

import { useState, useEffect, useCallback } from "react";

export interface Task {
  id: string;
  type: "TICKET" | "PROJECT";
  status: string;
  priority: string;
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
 * Data is scoped automatically by the backend Hibernate Filter (JWT org context).
 */
export function useTasksQuery(taskId?: string): UseTasksQueryResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [task, setTask] = useState<Task | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const url = taskId ? `/api/v1/tasks/${taskId}` : `/api/v1/tasks?size=100&sort=createdAt&direction=DESC`;
      const res = await fetch(url);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      if (taskId) {
        setTask(data as Task);
      } else {
        // Spring Page response
        setTasks(data.content ?? (Array.isArray(data) ? data : []));
      }
    } catch (err: any) {
      setError(err.message ?? "Gagal memuat data task");
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { tasks, task, loading, error, refresh: fetchData };
}

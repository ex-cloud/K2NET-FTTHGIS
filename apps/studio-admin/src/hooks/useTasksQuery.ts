

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "@/lib/auth-compat";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";

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
  loadingMore: boolean;
  hasMore: boolean;
  totalElements: number;
  error: string | null;
  refresh: () => void;
  fetchMore: () => void;
}

const PAGE_SIZE = 20;
const POLL_INTERVAL_MS = 30_000;

/**
 * Hook to fetch the task list with infinite-scroll pagination, or a single task by ID.
 *
 * @param taskId  - if provided, fetches a single task by ID (no pagination)
 * @param scope   - filter by scope (e.g. "PLATFORM_INTERNAL" | "TENANT_TO_PLATFORM")
 */
export function useTasksQuery(taskId?: string, scope?: TaskScope): UseTasksQueryResult {
  const { data: session } = useSession();

  // Single-task mode
  const [task, setTask] = useState<Task | undefined>();

  // List mode with pagination
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track current page for incremental fetch
  const pageRef = useRef(0);
  const isFetchingMore = useRef(false);

  // ── Fetch a single page and append/replace ─────────────────────────────────

  const fetchPage = useCallback(
    async (page: number, append: boolean) => {
      if (!session?.accessToken) return;

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        setError(null);
        const baseUrl = getBackendBaseUrl();

        // Single task mode
        if (taskId) {
          const res = await httpClient(`${baseUrl}/tasks/${taskId}`, {
            token: session.accessToken,
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          setTask(data as Task);
          return;
        }

        // List mode
        const params = new URLSearchParams({
          page: String(page),
          size: String(PAGE_SIZE),
          sort: "createdAt",
          direction: "DESC",
        });
        if (scope) params.set("scope", scope);

        const res = await httpClient(`${baseUrl}/tasks?${params.toString()}`, {
          token: session.accessToken,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // Spring Page: { content, totalElements, totalPages, last, ... }
        const content: Task[] = data.content ?? (Array.isArray(data) ? data : []);
        const total: number = data.totalElements ?? content.length;
        const isLast: boolean = data.last ?? true;

        setTotalElements(total);
        setHasMore(!isLast);

        if (append) {
          setTasks((prev) => {
            // Deduplicate by id
            const existing = new Set(prev.map((t) => t.id));
            const newItems = content.filter((t) => !existing.has(t.id));
            return [...prev, ...newItems];
          });
        } else {
          setTasks(content);
          pageRef.current = 0;
        }
      } catch (err: any) {
        setError(err.message ?? "Gagal memuat data task");
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isFetchingMore.current = false;
      }
    },
    [taskId, scope, session?.accessToken]
  );

  // ── Initial load + polling ─────────────────────────────────────────────────

  const refresh = useCallback(() => {
    pageRef.current = 0;
    fetchPage(0, false);
  }, [fetchPage]);

  useEffect(() => {
    refresh();
    if (taskId) return; // no polling for single task for simplicity
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh, taskId]);

  // ── Fetch next page (infinite scroll) ─────────────────────────────────────

  const fetchMore = useCallback(() => {
    if (isFetchingMore.current || !hasMore || loadingMore || loading) return;
    isFetchingMore.current = true;
    const nextPage = pageRef.current + 1;
    pageRef.current = nextPage;
    fetchPage(nextPage, true);
  }, [fetchPage, hasMore, loadingMore, loading]);

  return {
    tasks,
    task,
    loading,
    loadingMore,
    hasMore,
    totalElements,
    error,
    refresh,
    fetchMore,
  };
}

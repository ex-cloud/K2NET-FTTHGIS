

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { type Task, type TaskScope } from "./useTasksQuery";

interface UseTaskBatchActionsProps {
  filteredTasks: Task[];
  sessionToken?: string;
  onSaveTask: (itemId: string, fields: Partial<Task>) => Promise<void>;
  refresh: () => void;
  setLocalTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export function useTaskBatchActions({
  filteredTasks,
  sessionToken,
  onSaveTask,
  refresh,
  setLocalTasks,
}: UseTaskBatchActionsProps) {
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleToggleSelectTask = useCallback(
    (id: string, shiftKey?: boolean) => {
      setSelectedTaskIds((prev) => {
        const next = new Set(prev);
        const currentIndex = filteredTasks.findIndex((t) => t.id === id);

        if (shiftKey && lastSelectedIndex !== null && currentIndex !== -1) {
          const start = Math.min(lastSelectedIndex, currentIndex);
          const end = Math.max(lastSelectedIndex, currentIndex);
          for (let i = start; i <= end; i++) {
            next.add(filteredTasks[i].id);
          }
        } else {
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
          setLastSelectedIndex(currentIndex);
        }
        return next;
      });
    },
    [filteredTasks, lastSelectedIndex]
  );

  const handleSelectAllTasks = useCallback(() => {
    setSelectedTaskIds((prev) => {
      if (prev.size === filteredTasks.length) {
        return new Set();
      }
      return new Set(filteredTasks.map((t) => t.id));
    });
  }, [filteredTasks]);

  const handleClearSelection = useCallback(() => {
    setSelectedTaskIds(new Set());
  }, []);

  const handleBatchUpdateStatus = useCallback(
    async (status: string) => {
      const ids = Array.from(selectedTaskIds);
      if (ids.length === 0) return;
      const count = ids.length;
      toast.info(`Updating ${count} tasks to ${status}...`);

      setLocalTasks((prev) =>
        prev.map((t) => (selectedTaskIds.has(t.id) ? { ...t, status } : t))
      );

      try {
        await Promise.all(ids.map((id) => onSaveTask(id, { status })));
        toast.success(`Updated ${count} tasks to ${status}`);
        setSelectedTaskIds(new Set());
        refresh();
      } catch (err: any) {
        toast.error("Batch status update failed: " + err.message);
        refresh();
      }
    },
    [selectedTaskIds, onSaveTask, refresh, setLocalTasks]
  );

  const handleBatchUpdatePriority = useCallback(
    async (priority: string) => {
      const ids = Array.from(selectedTaskIds);
      if (ids.length === 0) return;
      const count = ids.length;
      toast.info(`Updating ${count} tasks to ${priority}...`);

      setLocalTasks((prev) =>
        prev.map((t) => (selectedTaskIds.has(t.id) ? { ...t, priority } : t))
      );

      try {
        await Promise.all(ids.map((id) => onSaveTask(id, { priority })));
        toast.success(`Updated ${count} tasks to ${priority}`);
        setSelectedTaskIds(new Set());
        refresh();
      } catch (err: any) {
        toast.error("Batch priority update failed: " + err.message);
        refresh();
      }
    },
    [selectedTaskIds, onSaveTask, refresh, setLocalTasks]
  );

  const handleBatchUpdateAssignee = useCallback(
    async (assigneeId: string | null) => {
      const ids = Array.from(selectedTaskIds);
      if (ids.length === 0) return;
      const count = ids.length;
      toast.info(`Assigning ${count} tasks...`);

      setLocalTasks((prev) =>
        prev.map((t) => (selectedTaskIds.has(t.id) ? { ...t, assigneeId: assigneeId || undefined } : t))
      );

      try {
        await Promise.all(ids.map((id) => onSaveTask(id, { assigneeId: assigneeId || undefined })));
        toast.success(`Reassigned ${count} tasks`);
        setSelectedTaskIds(new Set());
        refresh();
      } catch (err: any) {
        toast.error("Batch assign failed: " + err.message);
        refresh();
      }
    },
    [selectedTaskIds, onSaveTask, refresh, setLocalTasks]
  );

  const handleBatchUpdateScope = useCallback(
    async (scope: string) => {
      const ids = Array.from(selectedTaskIds);
      if (ids.length === 0) return;
      const count = ids.length;
      toast.info(`Updating scope for ${count} tasks...`);

      setLocalTasks((prev) =>
        prev.map((t) => (selectedTaskIds.has(t.id) ? { ...t, scope: scope as TaskScope } : t))
      );

      try {
        await Promise.all(ids.map((id) => onSaveTask(id, { scope: scope as TaskScope })));
        toast.success(`Updated scope for ${count} tasks`);
        setSelectedTaskIds(new Set());
        refresh();
      } catch (err: any) {
        toast.error("Batch scope update failed: " + err.message);
        refresh();
      }
    },
    [selectedTaskIds, onSaveTask, refresh, setLocalTasks]
  );

  // Trigger modal confirmation
  const handleRequestBatchDelete = useCallback(() => {
    if (selectedTaskIds.size === 0) return;
    setDeleteConfirmOpen(true);
  }, [selectedTaskIds.size]);

  // Execute actual deletion after user confirms in dialog
  const handleConfirmBatchDelete = useCallback(async () => {
    const ids = Array.from(selectedTaskIds);
    if (ids.length === 0) return;

    const count = ids.length;
    setDeleteLoading(true);

    try {
      const baseUrl = getBackendBaseUrl();
      const responses = await Promise.all(
        ids.map((id) =>
          httpClient(`${baseUrl}/tasks/${id}`, {
            method: "DELETE",
            token: sessionToken ?? "",
          })
        )
      );

      const failedResponses = responses.filter((r) => !r.ok);
      if (failedResponses.length > 0) {
        throw new Error(`Gagal menghapus ${failedResponses.length} task (HTTP ${failedResponses[0].status})`);
      }

      setLocalTasks((prev) => prev.filter((t) => !selectedTaskIds.has(t.id)));
      toast.success(`Berhasil menghapus ${count} task`);
      setSelectedTaskIds(new Set());
      setDeleteConfirmOpen(false);
      refresh();
    } catch (err: any) {
      toast.error("Gagal menghapus tugas: " + err.message);
      refresh();
    } finally {
      setDeleteLoading(false);
    }
  }, [selectedTaskIds, sessionToken, refresh, setLocalTasks]);

  return {
    selectedTaskIds,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    deleteLoading,
    handleToggleSelectTask,
    handleSelectAllTasks,
    handleClearSelection,
    handleBatchUpdateStatus,
    handleBatchUpdatePriority,
    handleBatchUpdateAssignee,
    handleBatchUpdateScope,
    handleRequestBatchDelete,
    handleConfirmBatchDelete,
  };
}

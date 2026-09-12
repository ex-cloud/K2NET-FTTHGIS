import { useState, useEffect, useCallback } from "react";
import { useRouter } from "@/lib/navigation-compat";
import { toast } from "sonner";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useTaskBatchActions } from "@/hooks/useTaskBatchActions";
import { useLinearShortcuts } from "@/hooks/useLinearShortcuts";
import type { Task } from "@/hooks/useTasksQuery";

interface UseTasksPageOperationsProps {
  filteredTasks: Task[];
  sessionToken?: string;
  refresh: () => void;
  dialogOpen: boolean;
  sheetOpen: boolean;
  onOpenSheet: (task: Task) => void;
  setDialogOpen: (open: boolean) => void;
  setShortcutsHelpOpen: (setter: (prev: boolean) => boolean) => void;
}

export function useTasksPageOperations({
  filteredTasks,
  sessionToken,
  refresh,
  dialogOpen,
  sheetOpen,
  onOpenSheet,
  setDialogOpen,
  setShortcutsHelpOpen,
}: UseTasksPageOperationsProps) {
  const router = useRouter();
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  useEffect(() => {
    setLocalTasks(filteredTasks);
  }, [filteredTasks]);

  const handleSaveTask = useCallback(
    async (itemId: string, fields: Partial<Task>) => {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/${itemId}`, {
        method: "PUT",
        token: sessionToken ?? "",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (!res.ok) {
        const msg = `HTTP ${res.status}`;
        toast.error("Failed to update: " + msg);
        throw new Error(msg);
      }
      refresh();
    },
    [sessionToken, refresh]
  );

  const handleUpdateTask = useCallback(
    async (itemId: string, fields: Partial<Task>) => {
      setLocalTasks((prev) => prev.map((t) => (t.id === itemId ? { ...t, ...fields } : t)));
      try {
        await handleSaveTask(itemId, fields);
        toast.success("Task updated");
      } catch {
        setLocalTasks(filteredTasks);
      }
    },
    [handleSaveTask, filteredTasks]
  );

  const handleDeleteTask = useCallback(
    async (itemId: string) => {
      setLocalTasks((prev) => prev.filter((t) => t.id !== itemId));
      try {
        const baseUrl = getBackendBaseUrl();
        const res = await httpClient(`${baseUrl}/tasks/${itemId}`, {
          method: "DELETE",
          token: sessionToken ?? "",
        });
        if (!res.ok) {
          if (res.status === 403) throw new Error("Forbidden — Super Admin only.");
          throw new Error(`HTTP ${res.status}`);
        }
        toast.success("Task deleted");
        refresh();
      } catch (err: unknown) {
        toast.error("Failed to delete: " + (err instanceof Error ? err.message : "System error"));
        setLocalTasks(filteredTasks);
      }
    },
    [sessionToken, filteredTasks, refresh]
  );

  // Batch Actions Hook
  const batchActions = useTaskBatchActions({
    filteredTasks,
    sessionToken,
    onSaveTask: handleSaveTask,
    refresh,
    setLocalTasks,
  });

  // Keyboard Shortcuts
  useLinearShortcuts({
    onNewTask: () => setDialogOpen(true),
    onNewProject: () => router.push("/tasks/projects"),
    onNextRow: () => setFocusedIndex((prev) => Math.min(filteredTasks.length - 1, prev + 1)),
    onPrevRow: () => setFocusedIndex((prev) => Math.max(0, prev - 1)),
    onOpenSelected: () => {
      if (focusedIndex >= 0 && filteredTasks[focusedIndex]) {
        onOpenSheet(filteredTasks[focusedIndex]);
      }
    },
    onToggleSelectRow: () => {
      if (focusedIndex >= 0 && filteredTasks[focusedIndex]) {
        batchActions.handleToggleSelectTask(filteredTasks[focusedIndex].id);
      }
    },
    onClearSelection: batchActions.handleClearSelection,
    onToggleHelp: () => setShortcutsHelpOpen((prev) => !prev),
    enabled: !dialogOpen && !sheetOpen,
  });

  const handleCardDrop = useCallback(
    (itemId: string, targetStatus: string) => {
      handleUpdateTask(itemId, { status: targetStatus });
    },
    [handleUpdateTask]
  );

  return {
    localTasks,
    focusedIndex,
    handleSaveTask,
    handleUpdateTask,
    handleDeleteTask,
    handleCardDrop,
    ...batchActions,
  };
}

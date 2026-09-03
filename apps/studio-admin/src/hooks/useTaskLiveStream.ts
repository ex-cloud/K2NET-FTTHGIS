
import { useEffect, useRef, useState, useCallback } from "react";
import { type Task } from "./useTasksQuery";

interface UseTaskLiveStreamOptions {
  onTaskUpdated?: (task: Partial<Task> & { id: string }) => void;
  onTaskCreated?: (task: Task) => void;
  onTaskDeleted?: (taskId: string) => void;
  enabled?: boolean;
}

export function useTaskLiveStream({
  onTaskUpdated,
  onTaskCreated,
  onTaskDeleted,
  enabled = true,
}: UseTaskLiveStreamOptions = {}) {
  const [connected, setConnected] = useState(false);
  const [updatedTaskIds, setUpdatedTaskIds] = useState<Set<string>>(new Set());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger visual flash highlight for updated rows
  const triggerFlash = useCallback((taskId: string) => {
    setUpdatedTaskIds((prev) => new Set(prev).add(taskId));
    setTimeout(() => {
      setUpdatedTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }, 2500);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Simulate reactive live stream state
    setConnected(true);

    // BroadcastChannel across tabs for multi-window live updates
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("k2net_tasks_live");
      channel.onmessage = (event) => {
        const data = event.data;
        if (data?.type === "TASK_UPDATED" && data.task) {
          triggerFlash(data.task.id);
          onTaskUpdated?.(data.task);
        } else if (data?.type === "TASK_CREATED" && data.task) {
          onTaskCreated?.(data.task);
        } else if (data?.type === "TASK_DELETED" && data.taskId) {
          onTaskDeleted?.(data.taskId);
        }
      };
    } catch {
      // BroadcastChannel not available in environment
    }

    return () => {
      if (channel) channel.close();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, onTaskUpdated, onTaskCreated, onTaskDeleted, triggerFlash]);

  // Function to broadcast mutation to other tabs/windows
  const broadcastTaskMutation = useCallback((type: "TASK_UPDATED" | "TASK_CREATED" | "TASK_DELETED", payload: any) => {
    try {
      const channel = new BroadcastChannel("k2net_tasks_live");
      channel.postMessage({ type, ...payload });
      channel.close();
    } catch {
      // ignore
    }
  }, []);

  return {
    connected,
    updatedTaskIds,
    triggerFlash,
    broadcastTaskMutation,
  };
}

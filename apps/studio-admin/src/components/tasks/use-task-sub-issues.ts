import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-compat";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { type Task } from "@/hooks/useTasksQuery";

interface UseTaskSubIssuesParams {
  parentTask: Task;
  onCountChange?: (count: number) => void;
}

export function useTaskSubIssues({ parentTask, onCountChange }: UseTaskSubIssuesParams) {
  const { data: session } = useSession();
  const [subIssues, setSubIssues] = useState<Task[]>([]);
  const [_loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newStatus, setNewStatus] = useState("TODO");
  const [newPriority, setNewPriority] = useState("NORMAL");
  const [newAssigneeId, setNewAssigneeId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const fetchSubIssues = useCallback(async () => {
    if (!parentTask.id) return;
    setLoading(true);
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/${parentTask.id}/subtasks`, {
        token: session?.accessToken ?? "",
      });
      if (res.ok) {
        const data: Task[] = await res.json();
        setSubIssues(data);
        if (onCountChange) onCountChange(data.length);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [parentTask.id, session?.accessToken, onCountChange]);

  useEffect(() => {
    fetchSubIssues();
  }, [fetchSubIssues]);

  useEffect(() => {
    if (isAdding) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isAdding]);

  const resolvedCount = subIssues.filter(
    (t) => t.status === "RESOLVED" || t.status === "CLOSED"
  ).length;
  const totalCount = subIssues.length;
  const isAllComplete = resolvedCount === totalCount && totalCount > 0;

  const handleCreateSubIssue = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks`, {
        method: "POST",
        token: session?.accessToken ?? "",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          scope: parentTask.scope,
          type: parentTask.type,
          priority: newPriority,
          status: newStatus,
          assigneeId: newAssigneeId ?? undefined,
          parentTaskId: parentTask.id,
          obsidianRef: parentTask.obsidianRef,
        }),
      });

      if (!res.ok) {
        toast.error(`Gagal membuat sub-issue: HTTP ${res.status}`);
        return;
      }

      const created: Task = await res.json();
      setSubIssues((prev) => [...prev, created]);
      setNewTitle("");
      setNewStatus("TODO");
      setNewPriority("NORMAL");
      setNewAssigneeId(null);
      setIsAdding(false);
      toast.success("Sub-issue ditambahkan");
    } catch {
      toast.error("Gagal terhubung ke server");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (sub: Task) => {
    const nextStatus =
      sub.status === "RESOLVED" || sub.status === "CLOSED" ? "TODO" : "RESOLVED";

    setSubIssues((prev) =>
      prev.map((item) =>
        item.id === sub.id ? { ...item, status: nextStatus } : item
      )
    );

    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/${sub.id}`, {
        method: "PUT",
        token: session?.accessToken ?? "",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        fetchSubIssues();
      }
    } catch {
      fetchSubIssues();
    }
  };

  const handleDeleteSubIssue = async (subId: string) => {
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/${subId}`, {
        method: "DELETE",
        token: session?.accessToken ?? "",
      });
      if (res.ok) {
        setSubIssues((prev) => prev.filter((item) => item.id !== subId));
        toast.success("Sub-issue dihapus");
      } else {
        toast.error("Hanya Super Admin yang dapat menghapus task");
      }
    } catch {
      toast.error("Gagal menghapus sub-issue");
    }
  };

  return {
    subIssues,
    isExpanded,
    setIsExpanded,
    isAdding,
    setIsAdding,
    creating,
    newTitle,
    setNewTitle,
    newStatus,
    setNewStatus,
    newPriority,
    setNewPriority,
    inputRef,
    resolvedCount,
    totalCount,
    isAllComplete,
    handleCreateSubIssue,
    handleToggleStatus,
    handleDeleteSubIssue,
  };
}

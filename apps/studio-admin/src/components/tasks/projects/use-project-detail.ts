import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import type { Task, TaskComment } from "@/hooks/useTasksQuery";
import { exportProjectMarkdownSpec } from "./project-spec-export";
import { useProjectIssues } from "./use-project-issues";

interface UseProjectDetailProps {
  id?: string;
  sessionToken?: string;
  projectTask?: Task | null;
  refresh: () => void;
}

function getChangedFields(fields: Partial<Task>, projectTask: Task): Partial<Task> | null {
  const changed: Partial<Task> = {};
  let hasChanges = false;

  if (fields.title !== undefined && fields.title.trim() !== (projectTask.title ?? "")) {
    changed.title = fields.title.trim();
    hasChanges = true;
  }
  if (fields.description !== undefined && fields.description !== (projectTask.description ?? "")) {
    changed.description = fields.description;
    hasChanges = true;
  }
  if (fields.status !== undefined && fields.status !== projectTask.status) {
    changed.status = fields.status;
    hasChanges = true;
  }
  if (fields.priority !== undefined && fields.priority !== projectTask.priority) {
    changed.priority = fields.priority;
    hasChanges = true;
  }
  if (fields.assigneeId !== undefined && fields.assigneeId !== (projectTask.assigneeId ?? null)) {
    changed.assigneeId = fields.assigneeId;
    hasChanges = true;
  }
  if (fields.dueDate !== undefined && fields.dueDate !== (projectTask.dueDate ?? undefined)) {
    changed.dueDate = fields.dueDate;
    hasChanges = true;
  }

  return hasChanges ? changed : null;
}

export function useProjectDetail({
  id,
  sessionToken,
  projectTask,
  refresh,
}: UseProjectDetailProps) {
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [, setSubtasksLoading] = useState(true);

  const fetchSubtasks = useCallback(async () => {
    if (!sessionToken || !id) return;
    try {
      setSubtasksLoading(true);
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/${id}/subtasks`, {
        token: sessionToken,
      });
      if (res.ok) {
        const data = await res.json();
        setSubtasks(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Failed to fetch project subtasks:", e);
    } finally {
      setSubtasksLoading(false);
    }
  }, [id, sessionToken]);

  useEffect(() => {
    fetchSubtasks();
  }, [fetchSubtasks]);

  // Editable fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("IN_PROGRESS");
  const [priority, setPriority] = useState("NORMAL");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string | undefined>();
  const [healthStatus] = useState<"On track" | "At risk" | "Off track">("On track");

  // Activity update draft
  const [updateMode, setUpdateMode] = useState<"update" | "comment">("update");
  const [updateText, setUpdateText] = useState("");
  const [postingUpdate, setPostingUpdate] = useState(false);
  const [comments, setComments] = useState<TaskComment[]>([]);

  // Sync project data
  useEffect(() => {
    if (projectTask) {
      setTitle(projectTask.title);
      setDescription(projectTask.description ?? "");
      setStatus(projectTask.status);
      setPriority(projectTask.priority);
      setAssigneeId(projectTask.assigneeId ?? null);
      setDueDate(projectTask.dueDate);
      setComments(projectTask.comments ?? []);
      document.title = `Projects › ${projectTask.title} | FTTH GIS K2NET`;
    }
  }, [projectTask]);

  const projectIssues = subtasks;
  const resolvedIssuesCount = projectIssues.filter(
    (t) => t.status === "RESOLVED" || t.status === "CLOSED"
  ).length;
  const totalIssuesCount = projectIssues.length;
  const progressPercent =
    totalIssuesCount > 0
      ? Math.round((resolvedIssuesCount / totalIssuesCount) * 100)
      : status === "RESOLVED" || status === "CLOSED"
      ? 100
      : 0;

  const handleSaveField = async (fields: Partial<Task>) => {
    if (!projectTask || !id) return;
    const changed = getChangedFields(fields, projectTask);
    if (!changed) return;

    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/${id}`, {
        method: "PUT",
        token: sessionToken ?? "",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changed),
      });
      if (res.ok) {
        toast.success("Project updated");
        refresh();
      }
    } catch {
      toast.error("Failed to update project");
    }
  };

  const handlePostUpdate = async () => {
    if (!updateText.trim() || !id) return;
    setPostingUpdate(true);
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/${id}/comments`, {
        method: "POST",
        token: sessionToken ?? "",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: updateText.trim() }),
      });
      if (res.ok) {
        const comment: TaskComment = await res.json();
        setComments((prev) => [...prev, comment]);
        setUpdateText("");
        toast.success("Project update posted");
      }
    } catch {
      toast.error("Failed to post update");
    } finally {
      setPostingUpdate(false);
    }
  };

  const issuesOps = useProjectIssues({
    id,
    sessionToken,
    projectTask: projectTask ?? null,
    fetchSubtasks,
    refresh,
  });

  const handleExportMarkdown = () => {
    exportProjectMarkdownSpec({
      projectTask: projectTask ?? null,
      assigneeId,
      dueDate,
      healthStatus,
      description,
      projectIssues,
      resolvedIssuesCount,
      totalIssuesCount,
      progressPercent,
    });
  };

  return {
    subtasks,
    fetchSubtasks,
    title,
    setTitle,
    description,
    setDescription,
    status,
    setStatus,
    priority,
    setPriority,
    assigneeId,
    setAssigneeId,
    dueDate,
    setDueDate,
    healthStatus,
    updateMode,
    setUpdateMode,
    updateText,
    setUpdateText,
    postingUpdate,
    comments,
    projectIssues,
    resolvedIssuesCount,
    totalIssuesCount,
    progressPercent,
    handleSaveField,
    handlePostUpdate,
    handleExportMarkdown,
    ...issuesOps,
  };
}

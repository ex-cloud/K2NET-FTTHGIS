import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useTranslation } from "@k2net/i18n";
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
  const { t } = useTranslation();
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
      document.title = `Workspace › ${projectTask.title} | FTTH GIS K2NET`;
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

  // Real dynamic healthStatus derived from latest status update or schedule/progress
  const latestStatusUpdate = [...comments].reverse().find((c) => c.content.startsWith("[STATUS_UPDATE:"));
  let healthStatus: "On track" | "At risk" | "Off track" = "On track";
  if (latestStatusUpdate) {
    const match = latestStatusUpdate.content.match(/^\[STATUS_UPDATE:\s*([^|]+)\s*\|/);
    if (match && ["On track", "At risk", "Off track"].includes(match[1].trim())) {
      healthStatus = match[1].trim() as "On track" | "At risk" | "Off track";
    }
  } else if (dueDate) {
    const diffDays = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0 && progressPercent < 100) {
      healthStatus = "Off track";
    } else if (diffDays <= 7 && progressPercent < 100) {
      healthStatus = "At risk";
    }
  }

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
        toast.success(t("workspace.toast_workspace_updated"));
        refresh();
      }
    } catch {
      toast.error(t("workspace.toast_workspace_update_failed"));
    }
  };

  const handlePostUpdate = async (overrideContent?: string) => {
    const textToSend = (overrideContent ?? updateText).trim();
    if (!textToSend || !id) return;
    setPostingUpdate(true);
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/${id}/comments`, {
        method: "POST",
        token: sessionToken ?? "",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: textToSend }),
      });
      if (res.ok) {
        const comment: TaskComment = await res.json();
        setComments((prev) => [...prev, comment]);
        setUpdateText("");
        toast.success(
          updateMode === "update"
            ? t("workspace.toast_status_update_posted")
            : t("workspace.toast_comment_posted")
        );
      }
    } catch {
      toast.error(t("workspace.toast_post_failed"));
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

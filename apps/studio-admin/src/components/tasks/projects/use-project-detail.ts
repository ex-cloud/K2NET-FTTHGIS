import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useTranslation } from "@k2net/i18n";
import { type Task, type TaskComment } from "@/hooks/useTasksQuery";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { exportProjectMarkdownSpec } from "./project-spec-export";
import { useProjectIssues } from "./use-project-issues";

interface UseProjectDetailProps {
  id?: string;
  sessionToken?: string;
  projectTask: Task | null;
  refresh: () => void;
}

function getChangedFields(fields: Partial<Task>, projectTask: Task) {
  const changed: Record<string, unknown> = {};
  let hasChanges = false;

  if (fields.title !== undefined && fields.title !== projectTask.title) {
    changed.title = fields.title;
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

function calculateProgress(subtasks: Task[], status: string) {
  const resolvedIssuesCount = subtasks.filter(
    (t) => t.status === "RESOLVED" || t.status === "CLOSED"
  ).length;
  const totalIssuesCount = subtasks.length;
  const progressPercent =
    totalIssuesCount > 0
      ? Math.round((resolvedIssuesCount / totalIssuesCount) * 100)
      : status === "RESOLVED" || status === "CLOSED"
      ? 100
      : 0;

  return { resolvedIssuesCount, totalIssuesCount, progressPercent };
}

function calculateHealthStatus(comments: TaskComment[], dueDate?: string, progressPercent = 0) {
  const latestStatusUpdate = [...comments].reverse().find((c) => c.content.startsWith("[STATUS_UPDATE:"));
  if (latestStatusUpdate) {
    const match = latestStatusUpdate.content.match(/^\[STATUS_UPDATE:\s*([^|]+)\s*\|/);
    if (match && ["On track", "At risk", "Off track"].includes(match[1].trim())) {
      return match[1].trim() as "On track" | "At risk" | "Off track";
    }
  }
  if (dueDate) {
    const diffDays = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0 && progressPercent < 100) {
      return "Off track";
    }
    if (diffDays <= 7 && progressPercent < 100) {
      return "At risk";
    }
  }
  return "On track";
}

async function postAuditComment(
  baseUrl: string,
  id: string,
  token: string | undefined,
  content: string
): Promise<TaskComment | null> {
  try {
    const res = await httpClient(`${baseUrl}/tasks/${id}/comments`, {
      method: "POST",
      token: token ?? "",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Non-blocking
  }
  return null;
}

function triggerFieldAuditEvents(
  changed: Partial<Task>,
  projectTask: Task,
  recordEvent: (content: string) => void
) {
  if (changed.status && changed.status !== projectTask.status) {
    recordEvent(`[SYSTEM_EVENT: STATUS_CHANGE | ${projectTask.status} ➔ ${changed.status}]`);
  }
  if (changed.priority && changed.priority !== projectTask.priority) {
    recordEvent(`[SYSTEM_EVENT: PRIORITY_CHANGE | ${projectTask.priority} ➔ ${changed.priority}]`);
  }
  if (changed.assigneeId !== undefined && changed.assigneeId !== projectTask.assigneeId) {
    recordEvent(`[SYSTEM_EVENT: LEAD_CHANGE | ${changed.assigneeId ? "Updated" : "Unassigned"}]`);
  }
  if (changed.dueDate !== undefined && changed.dueDate !== projectTask.dueDate) {
    recordEvent(`[SYSTEM_EVENT: TARGET_DATE_CHANGE | ${changed.dueDate || "Unset"}]`);
  }
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

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("IN_PROGRESS");
  const [priority, setPriority] = useState("NORMAL");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string | undefined>();
  const [updateText, setUpdateText] = useState("");
  const [postingUpdate, setPostingUpdate] = useState(false);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

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

  const { resolvedIssuesCount, totalIssuesCount, progressPercent } =
    calculateProgress(subtasks, status);
  const healthStatus = calculateHealthStatus(comments, dueDate, progressPercent);

  const recordSystemEvent = useCallback(
    async (content: string) => {
      if (!id) return;
      const baseUrl = getBackendBaseUrl();
      const comment = await postAuditComment(baseUrl, id, sessionToken, content);
      if (comment) setComments((prev) => [...prev, comment]);
    },
    [id, sessionToken]
  );

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
        triggerFieldAuditEvents(changed, projectTask, recordSystemEvent);
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
      const comment = await postAuditComment(baseUrl, id, sessionToken, textToSend);
      if (comment) {
        setComments((prev) => [...prev, comment]);
        setUpdateText("");
        toast.success(t("workspace.toast_comment_posted"));
      }
    } catch {
      toast.error(t("workspace.toast_post_failed"));
    } finally {
      setPostingUpdate(false);
    }
  };

  const handleSavePlan = async () => {
    if (!id || !projectTask) return;
    setIsSavingPlan(true);
    try {
      const isContentChanged =
        description !== (projectTask.description ?? "") || title !== projectTask.title;
      await handleSaveField({ title, description });
      if (isContentChanged) {
        recordSystemEvent("[SYSTEM_EVENT: SPEC_UPDATED | canvas markdown]");
      }
      setLastSaved(new Date());
      toast.success(t("projects.plan_saved_success"));
    } catch {
      toast.error(t("projects.plan_saved_fail"));
    } finally {
      setIsSavingPlan(false);
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
      projectIssues: subtasks,
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
    updateText,
    setUpdateText,
    postingUpdate,
    comments,
    projectIssues: subtasks,
    resolvedIssuesCount,
    totalIssuesCount,
    progressPercent,
    handleSaveField,
    handlePostUpdate,
    handleExportMarkdown,
    handleSavePlan,
    isSavingPlan,
    lastSaved,
    ...issuesOps,
  };
}

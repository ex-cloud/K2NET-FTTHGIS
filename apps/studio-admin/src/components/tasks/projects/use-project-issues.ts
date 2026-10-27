import { toast } from "sonner";
import { useTranslation } from "@k2net/i18n";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import type { Task } from "@/hooks/useTasksQuery";

interface UseProjectIssuesProps {
  id?: string;
  sessionToken?: string;
  projectTask: Task | null;
  fetchSubtasks: () => void;
  refresh: () => void;
}

export function useProjectIssues({
  id,
  sessionToken,
  projectTask,
  fetchSubtasks,
  refresh,
}: UseProjectIssuesProps) {
  const { t } = useTranslation();

  const handleUpdateIssue = async (issueId: string, fields: Partial<Task>) => {
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/${issueId}`, {
        method: "PUT",
        token: sessionToken ?? "",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        toast.success(t("workspace.toast_issue_updated"));
        fetchSubtasks();
        refresh();
      } else {
        toast.error(t("workspace.toast_issue_update_failed"));
      }
    } catch {
      toast.error(t("workspace.toast_issue_update_failed"));
    }
  };

  const handleToggleIssueStatus = async (issue: Task) => {
    const nextStatus =
      issue.status === "RESOLVED" || issue.status === "CLOSED" ? "TODO" : "RESOLVED";
    await handleUpdateIssue(issue.id, { status: nextStatus });
  };

  const handleDeleteIssue = async (issueId: string) => {
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/${issueId}`, {
        method: "DELETE",
        token: sessionToken ?? "",
      });
      if (res.ok) {
        toast.success(t("workspace.toast_issue_deleted"));
        fetchSubtasks();
        refresh();
      } else {
        toast.error(t("workspace.toast_issue_delete_failed"));
      }
    } catch {
      toast.error(t("workspace.toast_issue_delete_failed"));
    }
  };

  const handleQuickCreateIssue = async (quickTitle: string) => {
    if (!id) return;
    try {
      const baseUrl = getBackendBaseUrl();
      const payload = {
        type: "TICKET",
        title: quickTitle,
        priority: "NORMAL",
        status: "TODO",
        scope: projectTask?.scope ?? "PLATFORM_INTERNAL",
        parentTaskId: id,
        obsidianRef: projectTask?.obsidianRef || undefined,
        referenceType: "TASK",
        referenceId: id,
      };
      const res = await httpClient(`${baseUrl}/tasks`, {
        method: "POST",
        token: sessionToken ?? "",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(t("workspace.toast_issue_created", { title: quickTitle }));
        fetchSubtasks();
        refresh();
      } else {
        toast.error(t("workspace.toast_issue_create_failed"));
      }
    } catch {
      toast.error(t("workspace.toast_issue_create_failed"));
    }
  };

  return {
    handleUpdateIssue,
    handleToggleIssueStatus,
    handleDeleteIssue,
    handleQuickCreateIssue,
  };
}

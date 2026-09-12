import { toast } from "sonner";
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
        toast.success("Issue updated");
        fetchSubtasks();
        refresh();
      } else {
        toast.error("Failed to update issue");
      }
    } catch {
      toast.error("Network error while updating issue");
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
        toast.success("Issue deleted successfully");
        fetchSubtasks();
        refresh();
      } else {
        toast.error("Failed to delete issue");
      }
    } catch {
      toast.error("Network error while deleting issue");
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
        referenceType: "PROJECT",
        referenceId: id,
      };
      const res = await httpClient(`${baseUrl}/tasks`, {
        method: "POST",
        token: sessionToken ?? "",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(`Issue "${quickTitle}" created`);
        fetchSubtasks();
        refresh();
      } else {
        toast.error("Failed to create issue");
      }
    } catch {
      toast.error("Network error while creating issue");
    }
  };

  return {
    handleUpdateIssue,
    handleToggleIssueStatus,
    handleDeleteIssue,
    handleQuickCreateIssue,
  };
}

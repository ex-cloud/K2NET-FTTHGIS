import { useCallback } from "react";
import { toast } from "sonner";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";

interface UseProjectActionsParams {
  accessToken?: string;
  refresh: () => void;
}

export function useProjectActions({ accessToken, refresh }: UseProjectActionsParams) {
  const recordSystemEvent = useCallback(
    async (projectId: string, content: string) => {
      try {
        const baseUrl = getBackendBaseUrl();
        await httpClient(`${baseUrl}/tasks/${projectId}/comments`, {
          method: "POST",
          token: accessToken ?? "",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
      } catch {
        // Non-blocking
      }
    },
    [accessToken]
  );

  const handleUpdateStatus = useCallback(async (projectId: string, status: string) => {
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/${projectId}`, {
        method: "PUT",
        token: accessToken ?? "",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(`Project status updated to ${status}`);
        recordSystemEvent(projectId, `[SYSTEM_EVENT: STATUS_CHANGE | ${status}]`);
        refresh();
      } else {
        toast.error("Failed to update project status");
      }
    } catch {
      toast.error("Network error while updating status");
    }
  }, [accessToken, refresh, recordSystemEvent]);

  const handleUpdatePriority = useCallback(async (projectId: string, priority: string) => {
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/${projectId}`, {
        method: "PUT",
        token: accessToken ?? "",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority }),
      });
      if (res.ok) {
        toast.success(`Project priority updated to ${priority}`);
        recordSystemEvent(projectId, `[SYSTEM_EVENT: PRIORITY_CHANGE | ${priority}]`);
        refresh();
      } else {
        toast.error("Failed to update project priority");
      }
    } catch {
      toast.error("Network error while updating priority");
    }
  }, [accessToken, refresh, recordSystemEvent]);

  const handleUpdateLead = useCallback(async (projectId: string, lead: string) => {
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/${projectId}`, {
        method: "PUT",
        token: accessToken ?? "",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId: lead === "Unassigned" ? null : lead }),
      });
      if (res.ok) {
        toast.success(`Project lead updated to ${lead}`);
        recordSystemEvent(projectId, `[SYSTEM_EVENT: LEAD_CHANGE | ${lead}]`);
        refresh();
      } else {
        toast.error("Failed to update project lead");
      }
    } catch {
      toast.error("Network error while updating lead");
    }
  }, [accessToken, refresh, recordSystemEvent]);

  const handleUpdateDueDate = useCallback(async (projectId: string, dueDate?: string) => {
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/${projectId}`, {
        method: "PUT",
        token: accessToken ?? "",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate: dueDate || null }),
      });
      if (res.ok) {
        toast.success("Target date updated");
        recordSystemEvent(projectId, `[SYSTEM_EVENT: TARGET_DATE_CHANGE | ${dueDate || "Unset"}]`);
        refresh();
      } else {
        toast.error("Failed to update target date");
      }
    } catch {
      toast.error("Network error while updating target date");
    }
  }, [accessToken, refresh, recordSystemEvent]);

  const handleUpdateHealth = useCallback((_projectId: string, health: string) => {
    toast.success(`Project health updated to ${health}`);
  }, []);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/${projectId}`, {
        method: "DELETE",
        token: accessToken ?? "",
      });
      if (res.ok) {
        toast.success("Project deleted successfully");
        refresh();
      } else {
        toast.error("Failed to delete project");
      }
    } catch {
      toast.error("Network error while deleting project");
    }
  }, [accessToken, refresh]);

  return {
    handleUpdateStatus,
    handleUpdatePriority,
    handleUpdateLead,
    handleUpdateDueDate,
    handleUpdateHealth,
    handleDeleteProject,
  };
}

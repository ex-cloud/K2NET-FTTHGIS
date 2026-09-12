import { useMemo, useEffect } from "react";
import { toast } from "sonner";
import { useTasksQuery, type TaskScope } from "@/hooks/useTasksQuery";
import { useTaskSummary } from "@/hooks/useTaskSummary";
import { useTeamUsers } from "@/hooks/useTeamUsers";
import { useTaskLiveStream } from "@/hooks/useTaskLiveStream";
import { useTaskStore } from "@/store/task-store";
import { useSession } from "@/lib/auth-compat";

export function useTaskPageData(scopeParam: TaskScope | null) {
  const { data: session } = useSession();

  const {
    tasks,
    loading,
    loadingMore,
    hasMore,
    totalElements,
    error,
    refresh,
    fetchMore,
  } = useTasksQuery(undefined, scopeParam ?? undefined);

  const { summary } = useTaskSummary();

  // B2B badge sync
  const { tasks: b2bTasks } = useTasksQuery(undefined, "TENANT_TO_PLATFORM");
  const b2bCount = b2bTasks.filter((t) => t.status !== "RESOLVED" && t.status !== "CLOSED").length;
  const setUnreadCount = useTaskStore((state) => state.setUnreadCount);
  useEffect(() => {
    setUnreadCount(b2bCount);
  }, [b2bCount, setUnreadCount]);

  if (error) toast.error("Failed to load tasks: " + error);

  const { users: teamUsers } = useTeamUsers();

  useTaskLiveStream({
    onTaskUpdated: () => refresh(),
    onTaskCreated: () => refresh(),
    onTaskDeleted: () => refresh(),
  });

  const assigneesList = useMemo(() => {
    const ids = new Set<string>();
    teamUsers.forEach((u) => {
      if (u.email) ids.add(u.email);
    });
    tasks.forEach((t) => {
      if (t.assigneeId) ids.add(t.assigneeId);
    });
    return Array.from(ids);
  }, [teamUsers, tasks]);

  const dynamicProjectsList = useMemo(() => {
    const names = new Set<string>();
    tasks.forEach((t) => {
      if (t.obsidianRef && t.obsidianRef.length > 2) names.add(t.obsidianRef);
      else if (t.type === "PROJECT" && t.title) names.add(t.title);
    });
    return Array.from(names);
  }, [tasks]);

  const userIdentifiers = useMemo(() => {
    return [
      session?.user?.id,
      session?.user?.email,
      session?.user?.username,
      session?.user?.name,
    ].filter(Boolean) as string[];
  }, [session?.user?.id, session?.user?.email, session?.user?.username, session?.user?.name]);

  return {
    session,
    tasks,
    loading,
    loadingMore,
    hasMore,
    totalElements,
    refresh,
    fetchMore,
    summary,
    assigneesList,
    dynamicProjectsList,
    userIdentifiers,
  };
}

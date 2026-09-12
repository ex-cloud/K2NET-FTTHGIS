import { useMemo } from "react";
import { applyViewFilter, type QuickView } from "@/components/tasks/taskViewFilters";
import type { Task } from "@/hooks/useTasksQuery";
import type { TaskFilterState } from "@/components/tasks/TaskFilterMenu";
import type {
  ViewOrdering,
  ShowClosedFilter,
} from "@/components/tasks/LinearDisplayOptionsPopover";

interface FilterParams {
  tasks: Task[];
  quickParam: QuickView;
  userIdentifiers: string[];
  searchQuery: string;
  filters: TaskFilterState;
  selectedProject: string | null;
  projectParam: string | null;
  typeParam: string | null;
  showClosed: ShowClosedFilter;
  ordering: ViewOrdering;
}

export function useFilteredTasks({
  tasks,
  quickParam,
  userIdentifiers,
  searchQuery,
  filters,
  selectedProject,
  projectParam,
  typeParam,
  showClosed,
  ordering,
}: FilterParams) {
  return useMemo(() => {
    // Exclude master PROJECT containers from /tasks (All Issues / Active Tasks) unless typeParam specifically requests PROJECT
    const baseTasks = typeParam
      ? tasks.filter((t) => t.type === typeParam)
      : tasks.filter((t) => t.type !== "PROJECT");
    let result = applyViewFilter(baseTasks, quickParam, userIdentifiers);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q));
    }
    if (filters.status.length > 0) result = result.filter((t) => filters.status.includes(t.status));
    if (filters.priority.length > 0) result = result.filter((t) => filters.priority.includes(t.priority));
    if (filters.scope.length > 0) result = result.filter((t) => filters.scope.includes(t.scope));
    if (filters.assigneeId) result = result.filter((t) => t.assigneeId === filters.assigneeId);
    if (typeParam) result = result.filter((t) => t.type === typeParam);

    const activeProject = selectedProject || projectParam;
    if (activeProject) {
      result = result.filter(
        (t) =>
          t.obsidianRef === activeProject ||
          (t.parentTaskId && t.parentTaskId === activeProject) ||
          t.title.toLowerCase().includes(activeProject.toLowerCase()) ||
          t.title === activeProject
      );
    }

    if (showClosed === "open") {
      result = result.filter((t) => t.status !== "RESOLVED" && t.status !== "CLOSED");
    } else if (showClosed === "closed") {
      result = result.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED");
    }

    if (ordering === "created") {
      result = [...result].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (ordering === "dueDate") {
      result = [...result].sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    } else if (ordering === "priority") {
      const pWeights: Record<string, number> = { URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 };
      result = [...result].sort((a, b) => (pWeights[b.priority] ?? 0) - (pWeights[a.priority] ?? 0));
    } else if (ordering === "title") {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [
    tasks,
    quickParam,
    filters,
    searchQuery,
    userIdentifiers,
    projectParam,
    selectedProject,
    typeParam,
    ordering,
    showClosed,
  ]);
}

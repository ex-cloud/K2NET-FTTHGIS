import { type Task } from "@/hooks/useTasksQuery";
import {
  type ViewOrdering,
  type ShowClosedFilter,
} from "@/components/tasks/LinearDisplayOptionsPopover";

export interface ProjectPlanItem {
  id: string;
  name: string;
  obsidianRef?: string;
  health: "On track" | "At risk" | "Off track";
  priority: string;
  lead: string;
  dueDate?: string;
  createdAt?: string;
  issuesCount: number;
  completedCount: number;
  percentage: number;
  status: string;
}

export type SortField =
  | "name"
  | "health"
  | "priority"
  | "lead"
  | "dueDate"
  | "createdAt"
  | "issuesCount"
  | "percentage";
export type SortDir = "asc" | "desc";

export function aggregateProjectsFromTasks(tasks: Task[]): ProjectPlanItem[] {
  if (!tasks || tasks.length === 0) return [];

  const projectTasks = tasks.filter((t) => t.type === "PROJECT");
  const childTasks = tasks.filter((t) => t.type !== "PROJECT");

  return projectTasks.map((p) => {
    const linkedChildren = childTasks.filter(
      (c) =>
        (c.parentTaskId && c.parentTaskId === p.id) ||
        (p.obsidianRef && c.obsidianRef === p.obsidianRef) ||
        (c.referenceId && c.referenceId === p.id)
    );
    const totalChildren = linkedChildren.length;
    const completedChildren = linkedChildren.filter((c) =>
      ["RESOLVED", "CLOSED"].includes(c.status)
    ).length;

    let pct = 0;
    if (["RESOLVED", "CLOSED"].includes(p.status)) {
      pct = 100;
    } else if (totalChildren > 0) {
      pct = Math.round((completedChildren / totalChildren) * 100);
    } else if (p.status === "IN_PROGRESS") {
      pct = 40;
    } else if (p.status === "TODO") {
      pct = 0;
    }

    let health: "On track" | "At risk" | "Off track" = "On track";
    if (p.priority === "URGENT") health = "At risk";
    if (p.dueDate && new Date(p.dueDate) < new Date() && pct < 100) health = "Off track";

    return {
      id: p.id,
      name: p.title,
      obsidianRef: p.obsidianRef,
      health,
      priority: p.priority || "NORMAL",
      lead: p.assigneeId || "Unassigned",
      dueDate: p.dueDate,
      createdAt: p.createdAt,
      issuesCount: totalChildren,
      completedCount: completedChildren,
      percentage: pct,
      status: p.status,
    };
  });
}

interface FilterSortProjectsParams {
  projects: ProjectPlanItem[];
  searchQuery: string;
  statusFilter: string;
  priorityFilter: string;
  showClosed: ShowClosedFilter;
  ordering: ViewOrdering;
  sortField: SortField | null;
  sortDir: SortDir;
}

export function filterAndSortProjects({
  projects,
  searchQuery,
  statusFilter,
  priorityFilter,
  showClosed,
  ordering,
  sortField,
  sortDir,
}: FilterSortProjectsParams): ProjectPlanItem[] {
  const list = projects.filter((p) => {
    const matchSearch =
      searchQuery === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.obsidianRef && p.obsidianRef.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.lead.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "IN_PROGRESS" && p.status === "IN_PROGRESS") ||
      (statusFilter === "TODO" && ["TODO", "BACKLOG", "PLANNED"].includes(p.status)) ||
      (statusFilter === "RESOLVED" && ["RESOLVED", "CLOSED"].includes(p.status));

    const matchPriority =
      priorityFilter === "ALL" || p.priority === priorityFilter;

    const matchShowClosed =
      showClosed === "all" ||
      (showClosed === "open" && p.status !== "RESOLVED" && p.status !== "CLOSED") ||
      (showClosed === "closed" && (p.status === "RESOLVED" || p.status === "CLOSED"));

    return matchSearch && matchStatus && matchPriority && matchShowClosed;
  });

  if (ordering === "created") {
    list.sort((a, b) => new Date(b.createdAt ?? "").getTime() - new Date(a.createdAt ?? "").getTime());
  } else if (ordering === "dueDate") {
    list.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  } else if (ordering === "priority") {
    const pWeights: Record<string, number> = { URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 };
    list.sort((a, b) => (pWeights[b.priority] ?? 0) - (pWeights[a.priority] ?? 0));
  } else if (ordering === "title") {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortField) {
    list.sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";
      if (sortField === "name") { valA = a.name; valB = b.name; }
      else if (sortField === "health") { valA = a.health; valB = b.health; }
      else if (sortField === "priority") { valA = a.priority; valB = b.priority; }
      else if (sortField === "lead") { valA = a.lead; valB = b.lead; }
      else if (sortField === "dueDate") { valA = a.dueDate ?? ""; valB = b.dueDate ?? ""; }
      else if (sortField === "createdAt") { valA = a.createdAt ?? ""; valB = b.createdAt ?? ""; }
      else if (sortField === "issuesCount") { valA = a.issuesCount; valB = b.issuesCount; }
      else if (sortField === "percentage") { valA = a.percentage; valB = b.percentage; }

      if (typeof valA === "string" && typeof valB === "string") {
        return sortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }

  return list;
}

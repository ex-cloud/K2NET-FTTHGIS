import { type Task } from "@/hooks/useTasksQuery";

export type QuickView =
  | "all"
  | "active"
  | "overdue"
  | "no-assignee"
  | "upcoming"
  | "resolved"
  | "my-issues"
  | "created-by-me";

export const VIEW_LABELS: Record<QuickView, string> = {
  "all": "All Issues",
  "active": "Active Issues",
  "overdue": "Overdue Issues",
  "no-assignee": "Unassigned Issues",
  "upcoming": "Upcoming 7 Days",
  "resolved": "Resolved & Closed",
  "my-issues": "My Assigned Issues",
  "created-by-me": "Created by Me",
};

export function applyViewFilter(tasks: Task[], view: QuickView, userId: string, excludeProjects: boolean = false): Task[] {
  const targetTasks = excludeProjects ? tasks.filter((t) => t.type !== "PROJECT") : tasks;
  const now = new Date();
  const in7d = new Date();
  in7d.setDate(now.getDate() + 7);

  switch (view) {
    case "active":
      return targetTasks.filter((t) => !["RESOLVED", "CLOSED"].includes(t.status));
    case "overdue":
      return targetTasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < now && !["RESOLVED", "CLOSED"].includes(t.status)
      );
    case "no-assignee":
      return targetTasks.filter((t) => !t.assigneeId);
    case "upcoming":
      return targetTasks.filter(
        (t) =>
          t.dueDate &&
          new Date(t.dueDate) >= now &&
          new Date(t.dueDate) <= in7d &&
          !["RESOLVED", "CLOSED"].includes(t.status)
      );
    case "resolved":
      return targetTasks.filter((t) => ["RESOLVED", "CLOSED"].includes(t.status));
    case "my-issues":
      return targetTasks.filter(
        (t) => t.assigneeId === userId && !["RESOLVED", "CLOSED"].includes(t.status)
      );
    case "created-by-me":
      return targetTasks.filter((t) => t.reporterId === userId);
    default:
      return targetTasks;
  }
}

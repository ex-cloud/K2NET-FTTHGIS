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
  "active": "Active Tasks",
  "overdue": "Overdue",
  "no-assignee": "No Assignee",
  "upcoming": "Upcoming 7 Days",
  "resolved": "Resolved & Closed",
  "my-issues": "My Issues",
  "created-by-me": "Created by Me",
};

export function applyViewFilter(tasks: Task[], view: QuickView, userId: string): Task[] {
  const now = new Date();
  const in7d = new Date();
  in7d.setDate(now.getDate() + 7);

  switch (view) {
    case "active":
      return tasks.filter((t) => !["RESOLVED", "CLOSED"].includes(t.status));
    case "overdue":
      return tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < now && !["RESOLVED", "CLOSED"].includes(t.status)
      );
    case "no-assignee":
      return tasks.filter((t) => !t.assigneeId);
    case "upcoming":
      return tasks.filter(
        (t) =>
          t.dueDate &&
          new Date(t.dueDate) >= now &&
          new Date(t.dueDate) <= in7d &&
          !["RESOLVED", "CLOSED"].includes(t.status)
      );
    case "resolved":
      return tasks.filter((t) => ["RESOLVED", "CLOSED"].includes(t.status));
    case "my-issues":
      return tasks.filter(
        (t) => t.assigneeId === userId && !["RESOLVED", "CLOSED"].includes(t.status)
      );
    case "created-by-me":
      return tasks.filter((t) => t.reporterId === userId);
    default:
      return tasks;
  }
}

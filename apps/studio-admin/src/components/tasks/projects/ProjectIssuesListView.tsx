import { Link } from "@/lib/navigation-compat";
import { Circle, User } from "lucide-react";
import { type Task, type TaskScope } from "@/hooks/useTasksQuery";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "@/components/tasks/configs";
import { TaskContextMenu } from "@/components/tasks/TaskContextMenu";
import { cn } from "@/lib/utils";

interface ProjectIssuesListViewProps {
  issues: Task[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleIssueStatus: (issue: Task) => Promise<void>;
  onUpdateIssue: (issueId: string, fields: Partial<Task>) => Promise<void>;
  onDeleteIssue: (issueId: string) => Promise<void>;
}

export function ProjectIssuesListView({
  issues,
  selectedIds,
  onToggleSelect,
  onToggleIssueStatus,
  onUpdateIssue,
  onDeleteIssue,
}: ProjectIssuesListViewProps) {
  return (
    <div className="space-y-1.5">
      {issues.map((issue) => {
        const isDone = issue.status === "RESOLVED" || issue.status === "CLOSED";
        const isSelected = selectedIds.has(issue.id);
        const StatusIcon = STATUS_CONFIG[issue.status]?.icon ?? Circle;

        return (
          <TaskContextMenu
            key={issue.id}
            task={issue}
            onUpdateStatus={(st) => onUpdateIssue(issue.id, { status: st })}
            onUpdatePriority={(pr) => onUpdateIssue(issue.id, { priority: pr })}
            onUpdateScope={(sc) => onUpdateIssue(issue.id, { scope: sc as TaskScope })}
            onDelete={() => onDeleteIssue(issue.id)}
          >
            <div
              className={cn(
                "flex items-center justify-between p-2.5 rounded-xl border transition-colors group",
                isSelected
                  ? "bg-primary/5 border-primary/40 shadow-xs"
                  : "bg-card/40 border-border/40 hover:border-border hover:bg-card/70"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {/* Select Checkbox */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect(issue.id)}
                  className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary/40 cursor-pointer accent-primary ml-1 shrink-0"
                />

                {/* Status Toggle Button */}
                <button
                  type="button"
                  onClick={() => onToggleIssueStatus(issue)}
                  className={cn(
                    "shrink-0 p-0.5 rounded hover:bg-muted transition-colors cursor-pointer",
                    isDone ? "text-green-500" : "text-muted-foreground"
                  )}
                  title="Click to toggle status"
                >
                  <StatusIcon className="w-4 h-4" />
                </button>

                {/* Issue Title */}
                <Link
                  href={`/tasks/${issue.id}`}
                  className={cn(
                    "text-xs font-medium hover:text-primary transition-colors truncate max-w-[400px]",
                    isDone ? "line-through text-muted-foreground/60" : "text-foreground"
                  )}
                >
                  {issue.title}
                </Link>
              </div>

              <div className="flex items-center gap-3 shrink-0 text-xs">
                {issue.priority && issue.priority !== "NORMAL" && (
                  <span
                    className={cn(
                      "text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold",
                      PRIORITY_CONFIG[issue.priority]?.className ?? ""
                    )}
                  >
                    {issue.priority}
                  </span>
                )}

                <div className="w-5 h-5 rounded-full bg-muted/60 text-muted-foreground flex items-center justify-center text-[10px] font-mono">
                  {issue.assigneeId ? issue.assigneeId.substring(0, 1).toUpperCase() : <User className="w-3 h-3" />}
                </div>

                <span className="text-[11px] font-mono text-muted-foreground">
                  {new Date(issue.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                </span>
              </div>
            </div>
          </TaskContextMenu>
        );
      })}
    </div>
  );
}

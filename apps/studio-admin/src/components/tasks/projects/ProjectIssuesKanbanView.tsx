import { Link } from "@/lib/navigation-compat";
import { Circle, Clock, CheckCircle2, Check, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@k2net/ui";
import { type Task, type TaskScope } from "@/hooks/useTasksQuery";
import { PRIORITY_CONFIG } from "@/components/tasks/configs";
import { TaskContextMenu } from "@/components/tasks/TaskContextMenu";
import { cn } from "@/lib/utils";

export const KANBAN_COLS = [
  { id: "TODO", label: "To Do", icon: Circle, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { id: "IN_PROGRESS", label: "In Progress", icon: Clock, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  { id: "RESOLVED", label: "Resolved", icon: CheckCircle2, color: "text-primary bg-primary/10 border-primary/20" },
  { id: "CLOSED", label: "Closed", icon: Check, color: "text-muted-foreground bg-muted border-border/40" },
];

interface ProjectIssuesKanbanViewProps {
  issues: Task[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onUpdateIssue: (issueId: string, fields: Partial<Task>) => Promise<void>;
  onDeleteIssue: (issueId: string) => Promise<void>;
}

export function ProjectIssuesKanbanView({
  issues,
  selectedIds,
  onToggleSelect,
  onUpdateIssue,
  onDeleteIssue,
}: ProjectIssuesKanbanViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {KANBAN_COLS.map((col) => {
        const colIssues = issues.filter((t) => {
          if (col.id === "TODO") return t.status === "TODO" || t.status === "BACKLOG" || t.status === "PLANNED";
          return t.status === col.id;
        });
        const ColIcon = col.icon;

        return (
          <div
            key={col.id}
            className="flex flex-col bg-card/30 border border-border/50 rounded-xl p-3 min-h-[350px] space-y-3"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <div className="flex items-center gap-1.5">
                <ColIcon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-bold text-foreground">{col.label}</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-muted-foreground bg-muted px-1.5 py-0.2 rounded-full">
                {colIssues.length}
              </span>
            </div>

            {/* Column Cards */}
            <div className="space-y-2 flex-1 overflow-y-auto">
              {colIssues.length === 0 ? (
                <div className="h-24 flex items-center justify-center border border-dashed border-border/30 rounded-lg text-muted-foreground/50 text-[11px]">
                  No issues
                </div>
              ) : (
                colIssues.map((issue) => {
                  const isSelected = selectedIds.has(issue.id);
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
                          "p-3 rounded-lg border bg-card/80 text-foreground transition-all hover:border-primary/50 shadow-2xs space-y-2 group",
                          isSelected ? "border-primary bg-primary/5" : "border-border/60"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => onToggleSelect(issue.id)}
                              className="w-3 h-3 rounded border-border text-primary focus:ring-primary/40 cursor-pointer accent-primary shrink-0"
                            />
                            <Link
                              href={`/tasks/${issue.id}`}
                              className="text-xs font-semibold text-foreground hover:text-primary transition-colors line-clamp-2"
                            >
                              {issue.title}
                            </Link>
                          </div>

                          {/* Status changer dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                                title="Change status"
                              >
                                <MoreHorizontal className="w-3 h-3" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36 z-[1000]">
                              {KANBAN_COLS.map((st) => (
                                <DropdownMenuItem
                                  key={st.id}
                                  onClick={() => onUpdateIssue(issue.id, { status: st.id })}
                                  className="text-xs cursor-pointer"
                                >
                                  <span>{st.label}</span>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Card Footer */}
                        <div className="flex items-center justify-between pt-1 border-t border-border/30 text-[10px]">
                          <div className="flex items-center gap-1.5">
                            {issue.priority && issue.priority !== "NORMAL" && (
                              <span
                                className={cn(
                                  "px-1 py-0.2 rounded font-mono font-semibold",
                                  PRIORITY_CONFIG[issue.priority]?.className ?? ""
                                )}
                              >
                                {issue.priority}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-muted-foreground font-mono">
                            <div className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[8px] font-bold flex items-center justify-center">
                              {issue.assigneeId ? issue.assigneeId.substring(0, 1).toUpperCase() : "?"}
                            </div>
                            <span>
                              {new Date(issue.createdAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TaskContextMenu>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

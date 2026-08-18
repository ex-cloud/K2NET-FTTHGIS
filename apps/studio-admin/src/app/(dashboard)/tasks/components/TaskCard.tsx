import React from "react";
import { Clock } from "lucide-react";
import { type Task } from "@/hooks/useTasksQuery";
import { cn } from "@/lib/utils";
import { ScopeBadge } from "./ScopeBadge";
import { PRIORITY_CONFIG } from "./configs";
import { TaskContextMenu } from "./TaskContextMenu";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onUpdateStatus?: (status: string) => void;
  onUpdatePriority?: (priority: string) => void;
  onUpdateScope?: (scope: string) => void;
  onDelete?: () => void;
}

export function TaskCard({
  task,
  onClick,
  onUpdateStatus,
  onUpdatePriority,
  onUpdateScope,
  onDelete,
}: TaskCardProps) {
  const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.NORMAL;
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "RESOLVED" &&
    task.status !== "CLOSED";
  const formattedDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString("id-ID")
    : null;

  return (
    <TaskContextMenu
      task={task}
      onUpdateStatus={onUpdateStatus}
      onUpdatePriority={onUpdatePriority}
      onUpdateScope={onUpdateScope}
      onDelete={onDelete}
    >
      <div
        onClick={onClick}
        className="bg-card border border-border/70 rounded-xl p-3.5 shadow-sm hover:shadow-md cursor-pointer hover:border-border transition-all flex flex-col gap-3 group relative overflow-hidden"
      >
        {/* Indicator border for urgent/high priority tasks */}
        {task.priority === "URGENT" && (
          <div className="absolute top-0 left-0 w-1 h-full bg-destructive" />
        )}
        {task.priority === "HIGH" && (
          <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
        )}

        <div className="flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <span className="font-semibold text-foreground text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
              {task.title}
            </span>
          </div>

          {task.obsidianRef && (
            <span className="text-[10px] text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded w-fit">
              {task.obsidianRef}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/30 mt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-semibold", priority.className)}>
              {priority.label}
            </span>
            <ScopeBadge scope={task.scope} />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {formattedDate && (
              <span className={cn("inline-flex items-center gap-1 text-[10px]", isOverdue ? "text-destructive font-semibold" : "")}>
                <Clock className="h-3 w-3" />
                {formattedDate}
              </span>
            )}

            <div
              className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-[10px] uppercase border border-primary/20"
              title={task.assigneeId ?? "Unassigned"}
            >
              {task.assigneeId ? task.assigneeId.substring(0, 2) : "?"}
            </div>
          </div>
        </div>
      </div>
    </TaskContextMenu>
  );
}

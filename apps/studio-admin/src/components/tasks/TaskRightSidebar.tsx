import { X } from "lucide-react";
import { TaskSecondarySidebar } from "@/components/tasks/TaskSecondarySidebar";
import type { Task } from "@/hooks/useTasksQuery";

interface TaskRightSidebarProps {
  open: boolean;
  onClose: () => void;
  tasks: Task[];
}

export function TaskRightSidebar({ open, onClose, tasks }: TaskRightSidebarProps) {
  if (!open) return null;

  return (
    <div className="w-72 shrink-0 flex flex-col min-h-0 border border-border bg-card/10 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 shrink-0">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Overview
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <TaskSecondarySidebar tasks={tasks} />
      </div>
    </div>
  );
}

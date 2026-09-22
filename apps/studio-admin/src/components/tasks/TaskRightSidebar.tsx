import { X } from "lucide-react";
import { SecondarySidebarHeader } from "@k2net/ui";
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
      <SecondarySidebarHeader
        title="Overview"
        className="bg-transparent border-border/60"
        actions={
          <button
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto">
        <TaskSecondarySidebar tasks={tasks} />
      </div>
    </div>
  );
}

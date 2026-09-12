import { ChevronLeft, Loader2, ExternalLink } from "lucide-react";
import { useRouter } from "@/lib/navigation-compat";
import { ScopeBadge } from "./ScopeBadge";
import type { Task } from "@/hooks/useTasksQuery";

interface TaskDetailTopBarProps {
  task: Task;
  saving: boolean;
  isDirty: boolean;
}

export function TaskDetailTopBar({ task, saving, isDirty }: TaskDetailTopBarProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-border/60 bg-background/95 backdrop-blur-sm shrink-0">
      <div className="flex items-center gap-2 text-xs">
        <button
          onClick={() => router.push(task.type === "PROJECT" ? "/tasks/projects" : "/tasks")}
          className="text-muted-foreground hover:text-foreground font-medium transition-colors flex items-center gap-1"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>{task.type === "PROJECT" ? "Projects" : "Tasks & Tickets"}</span>
        </button>
        <span className="text-muted-foreground/50">›</span>
        {task.obsidianRef ? (
          <span className="text-foreground/80 font-medium font-mono">
            {task.obsidianRef}
          </span>
        ) : (
          <span className="text-foreground/80 font-medium">
            {task.scope === "PLATFORM_INTERNAL" ? "Internal K2NET" : "B2B Mitra"}
          </span>
        )}
        <span className="text-muted-foreground/50">›</span>
        <span className="font-semibold text-foreground truncate max-w-[220px]">
          {task.title}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <ScopeBadge scope={task.scope} />
        {saving && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
            <Loader2 className="h-3 w-3 animate-spin" /> Saving...
          </span>
        )}
        {isDirty && !saving && (
          <span className="text-amber-500 text-[10px]">● Unsaved</span>
        )}
        {task.obsidianRef && (
          <a
            href={`obsidian://open?vault=K2NET_Engineering_Vault&file=${task.obsidianRef}`}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/60 px-2 py-1 rounded-md transition-colors"
            title="Open in Obsidian"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Obsidian
          </a>
        )}
      </div>
    </div>
  );
}

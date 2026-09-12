import { Link } from "@/lib/navigation-compat";
import { Box, ExternalLink, FileDown, Plus } from "lucide-react";
import type { Task } from "@/hooks/useTasksQuery";

interface ProjectDetailHeaderProps {
  title: string;
  projectTask: Task;
  onExportMarkdown: () => void;
  onOpenNewIssue: () => void;
}

export function ProjectDetailHeader({
  title,
  projectTask,
  onExportMarkdown,
  onOpenNewIssue,
}: ProjectDetailHeaderProps) {
  return (
    <div className="px-6 py-3.5 border-b border-border/50 shrink-0 flex items-center justify-between bg-background/95 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-xs">
        <Link
          href="/tasks/projects"
          className="text-muted-foreground hover:text-foreground font-medium transition-colors"
        >
          Projects
        </Link>
        <span className="text-muted-foreground/60">›</span>
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <Box className="w-3.5 h-3.5 text-purple-400" />
          <span>{title || projectTask.title}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {projectTask.obsidianRef && (
          <a
            href={`obsidian://open?vault=K2NET_Engineering_Vault&file=${projectTask.obsidianRef}`}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted/70 px-2 py-1 rounded-md transition-colors font-mono"
          >
            <ExternalLink className="w-3 h-3" />
            <span>{projectTask.obsidianRef}</span>
          </a>
        )}
        <button
          onClick={onExportMarkdown}
          className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-border hover:bg-muted text-foreground text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          title="Copy Spec as Markdown"
        >
          <FileDown className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="hidden sm:inline">Export Spec</span>
        </button>
        <button
          onClick={onOpenNewIssue}
          className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          <span>Add issue</span>
        </button>
      </div>
    </div>
  );
}

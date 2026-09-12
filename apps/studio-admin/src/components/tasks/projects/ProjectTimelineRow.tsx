import { FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectTimelineItem } from "./ProjectTimelineView";

interface ProjectTimelineRowProps {
  project: ProjectTimelineItem;
  totalGridWidth: number;
  leftPx: number;
  widthPx: number;
  onProjectClick: (id: string) => void;
}

export function ProjectTimelineRow({
  project,
  totalGridWidth,
  leftPx,
  widthPx,
  onProjectClick,
}: ProjectTimelineRowProps) {
  return (
    <div className="flex items-stretch hover:bg-muted/10 transition-colors group relative">
      {/* Frozen Left Project Info (Sticky Left) */}
      <div
        onClick={() => onProjectClick(project.id)}
        className="sticky left-0 z-30 w-[300px] shrink-0 px-4 py-3 border-r border-border/70 bg-background/95 backdrop-blur-md flex items-center justify-between min-w-0 cursor-pointer shadow-xs group-hover:bg-muted/30 transition-colors"
      >
        <div className="min-w-0 pr-3 flex-1">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="font-semibold text-xs text-foreground truncate group-hover:text-primary transition-colors">
              {project.name}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
            <span className="truncate max-w-[100px]">{project.lead}</span>
            <span>•</span>
            <span className="font-mono">{project.completedCount}/{project.issuesCount} issues</span>
          </div>
        </div>

        {/* Health Indicator & Progress Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono font-bold text-foreground">
            {project.percentage}%
          </span>
          <span
            className={cn(
              "w-2.5 h-2.5 rounded-full shrink-0",
              project.health === "On track"
                ? "bg-primary shadow-[0_0_6px_var(--primary)]"
                : project.health === "At risk"
                ? "bg-amber-500 shadow-[0_0_6px_#f59e0b]"
                : "bg-destructive shadow-[0_0_6px_#ef4444]"
            )}
            title={project.health}
          />
        </div>
      </div>

      {/* Right Timeline Canvas Row with Floating Pill */}
      <div
        className="relative h-14 flex items-center"
        style={{ width: `${totalGridWidth}px` }}
      >
        {/* Floating Gantt Duration Bar */}
        <div
          onClick={() => onProjectClick(project.id)}
          style={{
            left: `${leftPx}px`,
            width: `${widthPx}px`,
          }}
          className={cn(
            "absolute h-8 rounded-xl border flex items-center px-3 text-[11px] font-semibold shadow-sm transition-all cursor-pointer hover:brightness-110 hover:shadow-md z-15 active:scale-[0.99]",
            project.health === "On track"
              ? "bg-primary/20 border-primary/60 text-foreground dark:text-primary"
              : project.health === "At risk"
              ? "bg-amber-500/20 border-amber-500/60 text-foreground dark:text-amber-400"
              : "bg-destructive/20 border-destructive/60 text-foreground dark:text-destructive"
          )}
        >
          {/* Progress Fill Background inside Pill */}
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-xl opacity-25 pointer-events-none",
              project.health === "On track"
                ? "bg-primary"
                : project.health === "At risk"
                ? "bg-amber-500"
                : "bg-destructive"
            )}
            style={{ width: `${project.percentage}%` }}
          />

          {/* Title text */}
          <span className="truncate relative z-10 font-semibold">{project.name}</span>

          {/* Due date tag */}
          {project.dueDate && (
            <span className="ml-auto text-[10px] font-mono opacity-80 pl-2 shrink-0 relative z-10">
              {new Date(project.dueDate).toLocaleDateString("id-ID", { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

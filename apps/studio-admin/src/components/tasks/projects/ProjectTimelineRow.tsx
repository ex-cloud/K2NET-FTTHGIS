import { FolderKanban } from "lucide-react";
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

        {/* Progress Badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-mono font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded-full border border-border/50">
            {project.percentage}%
          </span>
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
          className="absolute h-8 rounded-xl border border-border/80 bg-muted/50 text-foreground flex items-center px-3 text-[11px] font-semibold shadow-xs transition-all cursor-pointer hover:bg-muted/70 hover:shadow-sm z-15 active:scale-[0.99] overflow-hidden"
        >
          {/* Progress Fill Background inside Pill */}
          <div
            className="absolute inset-y-0 left-0 bg-foreground/10 pointer-events-none"
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

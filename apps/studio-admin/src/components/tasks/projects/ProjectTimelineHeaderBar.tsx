import { FolderKanban, Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimelineGranularity } from "./use-project-timeline";

interface ProjectTimelineHeaderBarProps {
  granularity: TimelineGranularity;
  setGranularity: (g: TimelineGranularity) => void;
  onScrollToToday: () => void;
}

export function ProjectTimelineHeaderBar({
  granularity,
  setGranularity,
  onScrollToToday,
}: ProjectTimelineHeaderBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/70 bg-muted/40 shrink-0 text-xs z-30">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <FolderKanban className="w-4 h-4 text-primary" />
          <span className="font-bold text-foreground">Projects Roadmap</span>
        </div>

        <span className="text-muted-foreground/30">|</span>

        {/* Timescale / Granularity Switcher */}
        <div className="flex items-center bg-card border border-border/50 rounded-lg p-0.5 shadow-xs">
          {(["Month", "Quarter", "Year"] as TimelineGranularity[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setGranularity(mode)}
              className={cn(
                "px-2.5 py-1 rounded-md font-semibold text-[11px] transition-colors cursor-pointer",
                granularity === mode
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Jump to Today Button */}
        <button
          type="button"
          onClick={onScrollToToday}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-foreground font-semibold text-[11px] transition-all cursor-pointer shadow-xs active:scale-95"
          title="Scroll to current date"
        >
          <Crosshair className="w-3.5 h-3.5 text-primary" />
          <span>Today</span>
        </button>
      </div>

      {/* Status Health Legend */}
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-medium">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span>On track</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>At risk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-destructive" />
          <span>Off track</span>
        </div>
      </div>
    </div>
  );
}

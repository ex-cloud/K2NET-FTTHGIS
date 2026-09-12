import { cn } from "@/lib/utils";
import type { TimelineMonth } from "./use-project-timeline";

interface ProjectTimelineHeaderScaleProps {
  totalProjects: number;
  timelineMonths: TimelineMonth[];
  monthColWidth: number;
  totalGridWidth: number;
  todayLeftPx: number;
}

export function ProjectTimelineHeaderScale({
  totalProjects,
  timelineMonths,
  monthColWidth,
  totalGridWidth,
  todayLeftPx,
}: ProjectTimelineHeaderScaleProps) {
  return (
    <div className="sticky top-0 z-40 flex border-b border-border/80 bg-background/95 backdrop-blur-md shadow-xs">
      {/* Frozen Left Title Header (Sticky Top-Left) */}
      <div className="sticky left-0 z-50 w-[300px] shrink-0 px-4 py-3 border-r border-border/70 bg-background/95 backdrop-blur-md flex items-center justify-between shadow-xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Initiative / Project
        </span>
        <span className="text-[10px] text-muted-foreground/60 font-mono">
          {totalProjects} Total
        </span>
      </div>

      {/* Horizontal Months + Weeks Scale Header */}
      <div className="flex relative" style={{ width: `${totalGridWidth}px` }}>
        {timelineMonths.map((m) => {
          const isCurrentMonth =
            new Date().getFullYear() === m.year && new Date().getMonth() === m.monthIndex;

          return (
            <div
              key={`${m.year}-${m.monthIndex}`}
              style={{ width: `${monthColWidth}px` }}
              className={cn(
                "shrink-0 border-r border-border/40 last:border-r-0 flex flex-col justify-between py-1.5 px-2 text-center",
                isCurrentMonth && "bg-primary/5"
              )}
            >
              {/* Month Label */}
              <div className="flex items-center justify-center gap-1">
                <span className={cn(
                  "text-[11px] font-bold uppercase tracking-wider",
                  isCurrentMonth ? "text-primary" : "text-foreground"
                )}>
                  {m.shortName}
                </span>
                <span className="text-[10px] text-muted-foreground/60 font-mono">
                  {m.year}
                </span>
              </div>

              {/* Week Sub-ticks (Linear Standard: e.g. 4, 11, 18, 25) */}
              <div className="flex items-center justify-between px-1 text-[10px] text-muted-foreground/60 font-mono pt-1">
                {m.weeks.map((wDay) => (
                  <span key={wDay} className="w-5 text-center">
                    {wDay}
                  </span>
                ))}
              </div>
            </div>
          );
        })}

        {/* Today Pill Header Marker */}
        {todayLeftPx >= 0 && (
          <div
            className="absolute top-1 -translate-x-1/2 z-30 pointer-events-none"
            style={{ left: `${todayLeftPx}px` }}
          >
            <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md">
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

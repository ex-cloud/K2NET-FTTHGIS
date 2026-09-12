import { useProjectTimeline } from "./use-project-timeline";
import { ProjectTimelineHeaderBar } from "./ProjectTimelineHeaderBar";
import { ProjectTimelineHeaderScale } from "./ProjectTimelineHeaderScale";
import { ProjectTimelineRow } from "./ProjectTimelineRow";

export interface ProjectTimelineItem {
  id: string;
  name: string;
  obsidianRef?: string;
  health: "On track" | "At risk" | "Off track";
  priority: string;
  lead: string;
  dueDate?: string;
  createdAt?: string;
  issuesCount: number;
  completedCount: number;
  percentage: number;
  status: string;
}

interface ProjectTimelineViewProps {
  projects: ProjectTimelineItem[];
  onProjectClick: (projectId: string) => void;
}

export function ProjectTimelineView({
  projects,
  onProjectClick,
}: ProjectTimelineViewProps) {
  const {
    granularity,
    setGranularity,
    scrollContainerRef,
    monthColWidth,
    timelineMonths,
    totalGridWidth,
    todayLeftPx,
    scrollToToday,
    computeBarGeometry,
  } = useProjectTimeline();

  return (
    <div className="flex flex-col h-full overflow-hidden bg-card/20 select-none border border-border/60 rounded-xl">
      {/* ── Top Header Controls Bar ────────────────────────────────────────── */}
      <ProjectTimelineHeaderBar
        granularity={granularity}
        setGranularity={setGranularity}
        onScrollToToday={() => scrollToToday(true)}
      />

      {/* ── Unified Dual-Axis Scroll Container ─────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-x-auto overflow-y-auto relative custom-scrollbar-thin bg-background/50"
      >
        <div
          className="relative flex flex-col"
          style={{ width: `${300 + totalGridWidth}px` }}
        >
          {/* ── Sticky Top Header Bar (Sticky Top) ─────────────────────────── */}
          <ProjectTimelineHeaderScale
            totalProjects={projects.length}
            timelineMonths={timelineMonths}
            monthColWidth={monthColWidth}
            totalGridWidth={totalGridWidth}
            todayLeftPx={todayLeftPx}
          />

          {/* ── Project Rows Container ──────────────────────────────────────── */}
          <div className="relative divide-y divide-border/30">
            {/* Global Vertical Grid Lines & Today Marker */}
            <div
              className="absolute top-0 bottom-0 left-[300px] pointer-events-none z-10 flex"
              style={{ width: `${totalGridWidth}px` }}
            >
              {timelineMonths.map((m) => (
                <div
                  key={`grid-${m.year}-${m.monthIndex}`}
                  style={{ width: `${monthColWidth}px` }}
                  className="shrink-0 border-r border-border/20 last:border-r-0 h-full"
                />
              ))}

              {/* Glowing Today Vertical Line through all rows */}
              {todayLeftPx >= 0 && (
                <div
                  className="absolute top-0 bottom-0 w-[2px] bg-primary z-20 pointer-events-none shadow-[0_0_10px_var(--primary)]"
                  style={{ left: `${todayLeftPx}px` }}
                />
              )}
            </div>

            {/* Empty State */}
            {projects.length === 0 ? (
              <div className="py-20 text-center text-xs text-muted-foreground italic w-full">
                Tidak ada data roadmap project untuk filter ini.
              </div>
            ) : (
              projects.map((p) => {
                const { leftPx, widthPx } = computeBarGeometry(p.createdAt, p.dueDate);
                return (
                  <ProjectTimelineRow
                    key={p.id}
                    project={p}
                    totalGridWidth={totalGridWidth}
                    leftPx={leftPx}
                    widthPx={widthPx}
                    onProjectClick={onProjectClick}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useMemo } from "react";
import { type Task } from "@/hooks/useTasksQuery";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "./configs";
import { cn } from "@/lib/utils";
import { FolderKanban, ClipboardList } from "lucide-react";

interface TaskTimelineViewProps {
  tasks: Task[];
  onRowClick: (id: string) => void;
  displayProperties: {
    priority: boolean;
    status: boolean;
    assignee: boolean;
    dueDate: boolean;
    obsidianRef: boolean;
  };
}

export function TaskTimelineView({
  tasks,
  onRowClick,
  displayProperties,
}: TaskTimelineViewProps) {
  // ── Setup Timeline Window: 3 months ago to 3 months ahead ─────────────────
  const { start, end, totalMs, months } = useMemo(() => {
    const now = new Date();
    
    // Start window: 3 months ago (first day of that month)
    const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    
    // End window: 3 months ahead (last day of that month)
    const end = new Date(now.getFullYear(), now.getMonth() + 4, 0);
    
    const totalMs = end.getTime() - start.getTime();

    // Generate list of months in between for grid headers
    const months: { label: string; year: number }[] = [];
    let current = new Date(start);
    while (current <= end) {
      months.push({
        label: current.toLocaleString("default", { month: "short" }),
        year: current.getFullYear(),
      });
      // Move to next month
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }

    return { start, end, totalMs, months };
  }, []);

  // Today marker percent position
  const todayPercent = useMemo(() => {
    const now = new Date();
    if (now < start || now > end) return -1;
    return ((now.getTime() - start.getTime()) / totalMs) * 100;
  }, [start, end, totalMs]);

  // Bar colors mapped by status
  const barColors: Record<string, string> = {
    BACKLOG: "bg-muted-foreground/30 border-muted-foreground/45",
    TODO: "bg-foreground/20 border-foreground/35",
    IN_PROGRESS: "bg-primary/20 border-primary/40 text-primary",
    WAITING_ON_CLIENT: "bg-amber-500/20 border-amber-500/40 text-amber-500",
    RESOLVED: "bg-[hsl(151_55%_42%)]/20 border-[hsl(151_55%_42%)]/40 text-[hsl(151_55%_42%)]",
    CLOSED: "bg-muted-foreground/15 border-muted-foreground/25",
  };

  return (
    <div className="flex flex-col h-full bg-card border border-border/80 rounded-xl overflow-hidden">
      {/* ── Timeline Grid Header ── */}
      <div className="flex border-b border-border/60 shrink-0 select-none bg-muted/30">
        {/* Left task list spacer */}
        <div className="w-80 border-r border-border/60 p-3 shrink-0 flex items-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Task Name
          </span>
        </div>

        {/* Right timeline month slots */}
        <div className="flex-1 flex min-w-0 relative">
          {months.map((m, idx) => (
            <div
              key={idx}
              className="flex-1 border-r border-border/40 last:border-r-0 py-3 text-center shrink-0 min-w-[100px]"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/80 dark:text-muted-foreground">
                {m.label} <span className="opacity-60">{m.year}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Scrollable rows container ── */}
      <div className="flex-1 overflow-y-auto relative min-h-0">
        
        {/* Today Marker Line (Vertical through all rows) */}
        {todayPercent >= 0 && (
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-primary z-10 pointer-events-none shadow-[0_0_8px_var(--primary)]"
            style={{ left: `calc(320px + (100% - 320px) * ${todayPercent / 100})` }}
          >
            {/* Today indicator flag */}
            <span className="absolute top-0 -translate-x-1/2 bg-primary text-primary-foreground text-[9px] font-bold uppercase px-1 rounded shadow-md z-20">
              Today
            </span>
          </div>
        )}

        {tasks.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground italic">
            Belum ada task dalam rentang waktu ini.
          </div>
        ) : (
          tasks.map((task) => {
            const taskStart = new Date(task.createdAt);
            // Default to 1 week duration if dueDate is missing
            const taskEnd = task.dueDate
              ? new Date(task.dueDate)
              : new Date(taskStart.getTime() + 7 * 24 * 60 * 60 * 1000);

            // Clamp positions to viewport start/end
            const clampedStart = new Date(Math.max(taskStart.getTime(), start.getTime()));
            const clampedEnd = new Date(Math.min(taskEnd.getTime(), end.getTime()));

            const leftOffset = ((clampedStart.getTime() - start.getTime()) / totalMs) * 100;
            const barWidth = Math.max(
              ((clampedEnd.getTime() - clampedStart.getTime()) / totalMs) * 100,
              1.5 // Ensure bar has at least a tiny visible width
            );

            const isProject = task.type === "PROJECT";
            const statusCfg = STATUS_CONFIG[task.status];
            const priorityCfg = PRIORITY_CONFIG[task.priority];

            return (
              <div
                key={task.id}
                onClick={() => onRowClick(task.id)}
                className="flex border-b border-border/40 hover:bg-muted/30 transition-colors group cursor-pointer"
              >
                {/* Left side: Info column */}
                <div className="w-80 border-r border-border/60 px-4 py-3 shrink-0 flex items-center justify-between min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {isProject ? (
                      <FolderKanban className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <ClipboardList className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {task.title}
                      </p>
                      {displayProperties.obsidianRef && task.obsidianRef && (
                        <p className="text-[10px] text-muted-foreground/75 font-mono">
                          {task.obsidianRef}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {displayProperties.priority && priorityCfg && (
                      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", priorityCfg.className)}>
                        {priorityCfg.label}
                      </span>
                    )}
                    {displayProperties.status && statusCfg && (
                      <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded", statusCfg.className)}>
                        {statusCfg.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right side: Gantt plot area */}
                <div className="flex-1 flex min-w-0 relative items-center py-2 bg-card/20">
                  
                  {/* Task Bar */}
                  <div
                    className={cn(
                      "h-7 rounded-lg border px-2 flex items-center relative text-[10px] font-bold transition-all shadow-sm truncate",
                      barColors[task.status] ?? "bg-muted/40 border-border"
                    )}
                    style={{
                      marginLeft: `${leftOffset}%`,
                      width: `${barWidth}%`,
                    }}
                    title={`${task.title} (${taskStart.toLocaleDateString()} - ${taskEnd.toLocaleDateString()})`}
                  >
                    <span className="truncate pr-1">
                      {task.obsidianRef ?? `…${task.id.slice(-8)}`}
                    </span>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

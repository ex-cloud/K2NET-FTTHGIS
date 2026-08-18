"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import { type Task } from "@/hooks/useTasksQuery";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "./configs";
import { cn } from "@/lib/utils";
import { FolderKanban, ClipboardList, Crosshair, ChevronLeft, ChevronRight } from "lucide-react";

interface TaskTimelineViewProps {
  tasks: Task[];
  onRowClick: (task: Task) => void;
  displayProperties?: {
    priority: boolean;
    status: boolean;
    assignee: boolean;
    dueDate: boolean;
    obsidianRef: boolean;
  };
}

interface TimelineMonth {
  year: number;
  monthIndex: number;
  name: string;
  shortName: string;
  weeks: number[];
  startMs: number;
  endMs: number;
}

export function TaskTimelineView({
  tasks,
  onRowClick,
  displayProperties,
}: TaskTimelineViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const monthColWidth = 180;

  // ── Setup 18-Month Timeline Window (Past 4 months to Future 14 months) ──────
  const { timelineMonths, startTimelineMs, endTimelineMs, totalTimelineMs } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const startDate = new Date(currentYear, currentMonth - 4, 1);
    const endDate = new Date(currentYear, currentMonth + 14, 0, 23, 59, 59);

    const startTimelineMs = startDate.getTime();
    const endTimelineMs = endDate.getTime();
    const totalTimelineMs = endTimelineMs - startTimelineMs;

    const timelineMonths: TimelineMonth[] = [];
    let cur = new Date(startDate);

    const MONTH_SHORTS = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    while (cur <= endDate) {
      const year = cur.getFullYear();
      const monthIndex = cur.getMonth();
      const mStart = new Date(year, monthIndex, 1).getTime();
      const mEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59).getTime();

      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      const weeks: number[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dObj = new Date(year, monthIndex, day);
        if (dObj.getDay() === 1 || day === 1 || day === 15) {
          if (!weeks.includes(day)) weeks.push(day);
        }
      }
      weeks.sort((a, b) => a - b);

      timelineMonths.push({
        year,
        monthIndex,
        name: MONTH_SHORTS[monthIndex],
        shortName: MONTH_SHORTS[monthIndex],
        weeks: weeks.slice(0, 4),
        startMs: mStart,
        endMs: mEnd,
      });

      cur = new Date(year, monthIndex + 1, 1);
    }

    return { timelineMonths, startTimelineMs, endTimelineMs, totalTimelineMs };
  }, []);

  const totalGridWidth = timelineMonths.length * monthColWidth;

  // ── Today Marker Position ──────────────────────────────────────────────────
  const nowMs = Date.now();
  const todayLeftPx = useMemo(() => {
    if (nowMs < startTimelineMs || nowMs > endTimelineMs) return -1;
    const progress = (nowMs - startTimelineMs) / totalTimelineMs;
    return progress * totalGridWidth;
  }, [nowMs, startTimelineMs, endTimelineMs, totalTimelineMs, totalGridWidth]);

  // ── Scroll to Today ────────────────────────────────────────────────────────
  const scrollToToday = (smooth = true) => {
    if (!scrollContainerRef.current || todayLeftPx < 0) return;
    const containerWidth = scrollContainerRef.current.clientWidth;
    const targetScrollLeft = todayLeftPx - containerWidth / 2 + 150;
    scrollContainerRef.current.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior: smooth ? "smooth" : "auto",
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => scrollToToday(false), 80);
    return () => clearTimeout(timer);
  }, [todayLeftPx]);

  // ── Compute Task Duration Bar ──────────────────────────────────────────────
  const computeBarGeometry = (createdAt?: string, dueDate?: string) => {
    const defaultStart = createdAt ? new Date(createdAt).getTime() : nowMs - 7 * 86400000;
    const defaultEnd = dueDate ? new Date(dueDate).getTime() : defaultStart + 14 * 86400000;

    const clampedStart = Math.max(startTimelineMs, defaultStart);
    const clampedEnd = Math.min(endTimelineMs, Math.max(defaultEnd, clampedStart + 86400000));

    const leftFrac = (clampedStart - startTimelineMs) / totalTimelineMs;
    const widthFrac = (clampedEnd - clampedStart) / totalTimelineMs;

    const leftPx = Math.max(0, leftFrac * totalGridWidth);
    const widthPx = Math.max(48, widthFrac * totalGridWidth);

    return { leftPx, widthPx };
  };

  return (
    <div className="flex flex-col h-full bg-card border border-border/80 rounded-xl overflow-hidden select-none">
      {/* ── Top Header Controls Bar ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/70 bg-muted/40 shrink-0 text-xs z-30">
        <div className="flex items-center gap-3">
          <span className="font-bold text-foreground">Timeline View</span>
          <span className="text-muted-foreground/30">|</span>
          <button
            type="button"
            onClick={() => scrollToToday(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-foreground font-semibold text-[11px] transition-all cursor-pointer shadow-xs active:scale-95"
            title="Scroll to today"
          >
            <Crosshair className="w-3.5 h-3.5 text-primary" />
            <span>Today</span>
          </button>
        </div>

        <div className="text-[11px] text-muted-foreground font-mono">
          {tasks.length} tasks scheduled
        </div>
      </div>

      {/* ── Unified Dual-Axis Scroll Container ── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-x-auto overflow-y-auto relative custom-scrollbar-thin bg-background/50"
      >
        <div
          className="relative flex flex-col"
          style={{ width: `${300 + totalGridWidth}px` }}
        >
          {/* ── Sticky Header Bar ── */}
          <div className="sticky top-0 z-40 flex border-b border-border/80 bg-background/95 backdrop-blur-md shadow-xs">
            {/* Frozen Left Title Header */}
            <div className="sticky left-0 z-50 w-[300px] shrink-0 px-4 py-3 border-r border-border/70 bg-background/95 backdrop-blur-md flex items-center justify-between shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Task Name
              </span>
              <span className="text-[10px] text-muted-foreground/60 font-mono">
                Status
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

          {/* ── Rows Container ── */}
          <div className="relative divide-y divide-border/30">
            {/* Global Vertical Grid Lines & Today Line */}
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

              {todayLeftPx >= 0 && (
                <div
                  className="absolute top-0 bottom-0 w-[2px] bg-primary z-20 pointer-events-none shadow-[0_0_10px_var(--primary)]"
                  style={{ left: `${todayLeftPx}px` }}
                />
              )}
            </div>

            {/* Task Rows */}
            {tasks.length === 0 ? (
              <div className="py-20 text-center text-xs text-muted-foreground italic w-full">
                Belum ada task dalam rentang waktu ini.
              </div>
            ) : (
              tasks.map((task) => {
                const { leftPx, widthPx } = computeBarGeometry(task.createdAt, task.dueDate);
                const statusCfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.TODO;
                const priorityCfg = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.NORMAL;
                const StatusIcon = statusCfg.icon;

                return (
                  <div
                    key={task.id}
                    className="flex items-stretch hover:bg-muted/10 transition-colors group relative"
                  >
                    {/* Frozen Left Info (Sticky Left) */}
                    <div
                      onClick={() => onRowClick(task)}
                      className="sticky left-0 z-30 w-[300px] shrink-0 px-4 py-3 border-r border-border/70 bg-background/95 backdrop-blur-md flex items-center justify-between min-w-0 cursor-pointer shadow-xs group-hover:bg-muted/30 transition-colors"
                    >
                      <div className="min-w-0 pr-3 flex-1">
                        <div className="flex items-center gap-2">
                          <StatusIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="font-semibold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                            {task.title}
                          </span>
                        </div>
                        {task.obsidianRef && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {task.obsidianRef}
                          </span>
                        )}
                      </div>

                      <span
                        className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0",
                          priorityCfg.className
                        )}
                      >
                        {task.priority}
                      </span>
                    </div>

                    {/* Right Timeline Canvas Row with Duration Bar */}
                    <div
                      className="relative h-14 flex items-center"
                      style={{ width: `${totalGridWidth}px` }}
                    >
                      <div
                        onClick={() => onRowClick(task)}
                        style={{
                          left: `${leftPx}px`,
                          width: `${widthPx}px`,
                        }}
                        className={cn(
                          "absolute h-8 rounded-xl border flex items-center px-3 text-[11px] font-semibold shadow-sm transition-all cursor-pointer hover:brightness-110 hover:shadow-md z-15 active:scale-[0.99]",
                          task.status === "RESOLVED" || task.status === "CLOSED"
                            ? "bg-primary/20 border-primary/60 text-foreground dark:text-primary"
                            : task.priority === "URGENT" || task.priority === "HIGH"
                            ? "bg-amber-500/20 border-amber-500/60 text-foreground dark:text-amber-400"
                            : "bg-muted/60 border-border text-foreground hover:border-primary/50"
                        )}
                      >
                        <span className="truncate relative z-10 font-semibold">{task.title}</span>
                        {task.dueDate && (
                          <span className="ml-auto text-[10px] font-mono opacity-80 pl-2 shrink-0 relative z-10">
                            {new Date(task.dueDate).toLocaleDateString("id-ID", { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

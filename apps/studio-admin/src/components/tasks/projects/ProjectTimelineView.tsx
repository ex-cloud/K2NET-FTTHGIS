

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  FolderKanban,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Flame,
  Calendar,
  Layers,
  Crosshair,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

type TimelineGranularity = "Month" | "Quarter" | "Year";

interface TimelineMonth {
  year: number;
  monthIndex: number; // 0..11
  name: string;
  shortName: string;
  weeks: number[]; // days of month for weeks (e.g. 4, 11, 18, 25)
  startMs: number;
  endMs: number;
}

export function ProjectTimelineView({
  projects,
  onProjectClick,
}: ProjectTimelineViewProps) {
  const [granularity, setGranularity] = useState<TimelineGranularity>("Month");
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Month column width in pixels based on zoom granularity
  const monthColWidth = granularity === "Month" ? 180 : granularity === "Quarter" ? 120 : 90;

  // ── Setup 24-Month Timeline Window (Past 6 months to Future 18 months) ──────
  const { timelineMonths, startTimelineMs, endTimelineMs, totalTimelineMs } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Start 6 months ago
    const startDate = new Date(currentYear, currentMonth - 6, 1);
    // End 18 months in future
    const endDate = new Date(currentYear, currentMonth + 18, 0, 23, 59, 59);

    const startTimelineMs = startDate.getTime();
    const endTimelineMs = endDate.getTime();
    const totalTimelineMs = endTimelineMs - startTimelineMs;

    const timelineMonths: TimelineMonth[] = [];
    let cur = new Date(startDate);

    const MONTH_NAMES = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const MONTH_SHORTS = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    while (cur <= endDate) {
      const year = cur.getFullYear();
      const monthIndex = cur.getMonth();
      const mStart = new Date(year, monthIndex, 1).getTime();
      const mEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59).getTime();

      // Find Monday / weekly dates within this month
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
        name: MONTH_NAMES[monthIndex],
        shortName: MONTH_SHORTS[monthIndex],
        weeks: weeks.slice(0, 4),
        startMs: mStart,
        endMs: mEnd,
      });

      // Next month
      cur = new Date(year, monthIndex + 1, 1);
    }

    return { timelineMonths, startTimelineMs, endTimelineMs, totalTimelineMs };
  }, []);

  const totalGridWidth = timelineMonths.length * monthColWidth;

  // ── Today Marker Position ──────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/purity
  const [nowMs] = useState(() => Date.now());
  const todayLeftPx = useMemo(() => {
    if (nowMs < startTimelineMs || nowMs > endTimelineMs) return -1;
    const progress = (nowMs - startTimelineMs) / totalTimelineMs;
    return progress * totalGridWidth;
  }, [nowMs, startTimelineMs, endTimelineMs, totalTimelineMs, totalGridWidth]);

  // ── Scroll to Today on Mount or on Button Click ─────────────────────────────
  const scrollToToday = (smooth = true) => {
    if (!scrollContainerRef.current || todayLeftPx < 0) return;
    const containerWidth = scrollContainerRef.current.clientWidth;
    const targetScrollLeft = todayLeftPx - containerWidth / 2 + 150; // offset for left frozen column
    scrollContainerRef.current.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior: smooth ? "smooth" : "auto",
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => scrollToToday(false), 80);
    return () => clearTimeout(timer);
  }, [todayLeftPx, granularity]);

  // ── Compute Project Duration Bar (Left Px and Width Px) ─────────────────────
  const computeBarGeometry = (createdAt?: string, dueDate?: string) => {
    const defaultStart = createdAt ? new Date(createdAt).getTime() : nowMs - 14 * 86400000;
    const defaultEnd = dueDate ? new Date(dueDate).getTime() : defaultStart + 30 * 86400000;

    const clampedStart = Math.max(startTimelineMs, defaultStart);
    const clampedEnd = Math.min(endTimelineMs, Math.max(defaultEnd, clampedStart + 86400000));

    const leftFrac = (clampedStart - startTimelineMs) / totalTimelineMs;
    const widthFrac = (clampedEnd - clampedStart) / totalTimelineMs;

    const leftPx = Math.max(0, leftFrac * totalGridWidth);
    const widthPx = Math.max(48, widthFrac * totalGridWidth);

    return { leftPx, widthPx };
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-card/20 select-none border border-border/60 rounded-xl">
      {/* ── Top Header Controls Bar ────────────────────────────────────────── */}
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
            onClick={() => scrollToToday(true)}
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
          <div className="sticky top-0 z-40 flex border-b border-border/80 bg-background/95 backdrop-blur-md shadow-xs">
            {/* Frozen Left Title Header (Sticky Top-Left) */}
            <div className="sticky left-0 z-50 w-[300px] shrink-0 px-4 py-3 border-r border-border/70 bg-background/95 backdrop-blur-md flex items-center justify-between shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Initiative / Project
              </span>
              <span className="text-[10px] text-muted-foreground/60 font-mono">
                {projects.length} Total
              </span>
            </div>

            {/* Horizontal Months + Weeks Scale Header */}
            <div className="flex relative" style={{ width: `${totalGridWidth}px` }}>
              {timelineMonths.map((m, idx) => {
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
                  <div
                    key={p.id}
                    className="flex items-stretch hover:bg-muted/10 transition-colors group relative"
                  >
                    {/* Frozen Left Project Info (Sticky Left) */}
                    <div
                      onClick={() => onProjectClick(p.id)}
                      className="sticky left-0 z-30 w-[300px] shrink-0 px-4 py-3 border-r border-border/70 bg-background/95 backdrop-blur-md flex items-center justify-between min-w-0 cursor-pointer shadow-xs group-hover:bg-muted/30 transition-colors"
                    >
                      <div className="min-w-0 pr-3 flex-1">
                        <div className="flex items-center gap-2">
                          <FolderKanban className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="font-semibold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                            {p.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                          <span className="truncate max-w-[100px]">{p.lead}</span>
                          <span>•</span>
                          <span className="font-mono">{p.completedCount}/{p.issuesCount} issues</span>
                        </div>
                      </div>

                      {/* Health Indicator & Progress Badge */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-mono font-bold text-foreground">
                          {p.percentage}%
                        </span>
                        <span
                          className={cn(
                            "w-2.5 h-2.5 rounded-full shrink-0",
                            p.health === "On track"
                              ? "bg-primary shadow-[0_0_6px_var(--primary)]"
                              : p.health === "At risk"
                              ? "bg-amber-500 shadow-[0_0_6px_#f59e0b]"
                              : "bg-destructive shadow-[0_0_6px_#ef4444]"
                          )}
                          title={p.health}
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
                        onClick={() => onProjectClick(p.id)}
                        style={{
                          left: `${leftPx}px`,
                          width: `${widthPx}px`,
                        }}
                        className={cn(
                          "absolute h-8 rounded-xl border flex items-center px-3 text-[11px] font-semibold shadow-sm transition-all cursor-pointer hover:brightness-110 hover:shadow-md z-15 active:scale-[0.99]",
                          p.health === "On track"
                            ? "bg-primary/20 border-primary/60 text-foreground dark:text-primary"
                            : p.health === "At risk"
                            ? "bg-amber-500/20 border-amber-500/60 text-foreground dark:text-amber-400"
                            : "bg-destructive/20 border-destructive/60 text-foreground dark:text-destructive"
                        )}
                      >
                        {/* Progress Fill Background inside Pill */}
                        <div
                          className={cn(
                            "absolute inset-y-0 left-0 rounded-xl opacity-25 pointer-events-none",
                            p.health === "On track"
                              ? "bg-primary"
                              : p.health === "At risk"
                              ? "bg-amber-500"
                              : "bg-destructive"
                          )}
                          style={{ width: `${p.percentage}%` }}
                        />

                        {/* Title text */}
                        <span className="truncate relative z-10 font-semibold">{p.name}</span>

                        {/* Due date tag */}
                        {p.dueDate && (
                          <span className="ml-auto text-[10px] font-mono opacity-80 pl-2 shrink-0 relative z-10">
                            {new Date(p.dueDate).toLocaleDateString("id-ID", { month: "short", day: "numeric" })}
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

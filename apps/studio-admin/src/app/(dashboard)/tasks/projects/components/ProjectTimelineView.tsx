"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Flame,
  Calendar,
  Layers,
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

export function ProjectTimelineView({
  projects,
  onProjectClick,
}: ProjectTimelineViewProps) {
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [granularity, setGranularity] = useState<TimelineGranularity>("Quarter");

  const quarters = useMemo(() => [
    { id: "Q1", label: "Q1 (Jan - Mar)", startMonth: 0, endMonth: 2 },
    { id: "Q2", label: "Q2 (Apr - Jun)", startMonth: 3, endMonth: 5 },
    { id: "Q3", label: "Q3 (Jul - Sep)", startMonth: 6, endMonth: 8 },
    { id: "Q4", label: "Q4 (Oct - Dec)", startMonth: 9, endMonth: 11 },
  ], []);

  const months = useMemo(() => [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ], []);

  // Helper to compute horizontal bar position in percentage [0..100]
  const computeBarRange = (createdAt?: string, dueDate?: string) => {
    const yearStart = new Date(currentYear, 0, 1).getTime();
    const yearEnd = new Date(currentYear, 11, 31).getTime();
    const totalYearMs = yearEnd - yearStart;

    const start = createdAt ? Math.max(yearStart, new Date(createdAt).getTime()) : yearStart;
    const end = dueDate ? Math.min(yearEnd, new Date(dueDate).getTime()) : yearStart + totalYearMs * 0.4;

    const leftPct = Math.max(0, Math.min(95, ((start - yearStart) / totalYearMs) * 100));
    const rawWidthPct = Math.max(5, ((Math.max(start, end) - start) / totalYearMs) * 100);
    const widthPct = Math.min(100 - leftPct, rawWidthPct);

    return { left: `${leftPct.toFixed(1)}%`, width: `${widthPct.toFixed(1)}%` };
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-card/20 select-none">
      {/* ── Timeline Navigation Header ─────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-muted/30 shrink-0 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentYear((y) => y - 1)}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-foreground font-mono px-1.5 text-sm">{currentYear}</span>
            <button
              type="button"
              onClick={() => setCurrentYear((y) => y + 1)}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-muted-foreground/30">|</span>

          {/* Granularity Switcher */}
          <div className="flex items-center bg-card border border-border/50 rounded-lg p-0.5">
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
        </div>

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

      {/* ── Main Gantt Chart Grid ──────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar-thin">
        <div className="min-w-[900px] flex flex-col">
          {/* Header Scale */}
          <div className="sticky top-0 z-20 grid grid-cols-[280px_1fr] border-b border-border/70 bg-background/95 backdrop-blur-md text-xs font-semibold text-muted-foreground">
            <div className="px-4 py-2.5 border-r border-border/50">Initiative / Project</div>
            <div className="grid grid-cols-4 divide-x divide-border/40 text-center">
              {granularity === "Quarter" ? (
                quarters.map((q) => (
                  <div key={q.id} className="py-2.5 px-2">
                    <span className="font-bold text-foreground">{q.id}</span>
                    <span className="text-[10px] text-muted-foreground ml-1">({q.label.split("(")[1]}</span>
                  </div>
                ))
              ) : granularity === "Month" ? (
                <div className="col-span-4 grid grid-cols-12 divide-x divide-border/30 text-center">
                  {months.map((m) => (
                    <div key={m} className="py-2.5 text-[11px] font-semibold text-foreground">
                      {m}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="col-span-4 grid grid-cols-3 divide-x divide-border/30 text-center">
                  {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                    <div key={y} className="py-2.5 font-bold text-foreground">
                      {y}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Project Rows */}
          <div className="divide-y divide-border/30">
            {projects.length === 0 ? (
              <div className="py-16 text-center text-xs text-muted-foreground">
                Tidak ada data roadmap project untuk filter ini.
              </div>
            ) : (
              projects.map((p) => {
                const bar = computeBarRange(p.createdAt, p.dueDate);
                return (
                  <div
                    key={p.id}
                    onClick={() => onProjectClick(p.id)}
                    className="grid grid-cols-[280px_1fr] items-center hover:bg-muted/15 cursor-pointer transition-colors group"
                  >
                    {/* Left Info Column */}
                    <div className="px-4 py-3 border-r border-border/40 flex items-center justify-between min-w-0">
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <FolderKanban className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="font-semibold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                            {p.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                          <span className="truncate">{p.lead}</span>
                          <span>•</span>
                          <span className="font-mono">{p.percentage}%</span>
                        </div>
                      </div>

                      <span
                        className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          p.health === "On track"
                            ? "bg-primary"
                            : p.health === "At risk"
                            ? "bg-amber-500"
                            : "bg-destructive"
                        )}
                        title={p.health}
                      />
                    </div>

                    {/* Right Timeline Duration Bar Column */}
                    <div className="relative h-12 w-full px-2 flex items-center">
                      {/* Grid background lines */}
                      <div className="absolute inset-0 grid grid-cols-4 divide-x divide-border/20 pointer-events-none" />

                      {/* Floating Gantt Duration Bar */}
                      <div
                        style={{ left: bar.left, width: bar.width }}
                        className={cn(
                          "absolute h-7 rounded-xl border flex items-center px-2.5 text-[11px] font-semibold text-foreground shadow-xs transition-all hover:brightness-110",
                          p.health === "On track"
                            ? "bg-primary/20 border-primary/50 text-primary"
                            : p.health === "At risk"
                            ? "bg-amber-500/20 border-amber-500/50 text-amber-500"
                            : "bg-destructive/20 border-destructive/50 text-destructive"
                        )}
                      >
                        <span className="truncate">{p.name}</span>
                        {p.dueDate && (
                          <span className="ml-auto text-[9px] font-mono opacity-80 pl-1 shrink-0">
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

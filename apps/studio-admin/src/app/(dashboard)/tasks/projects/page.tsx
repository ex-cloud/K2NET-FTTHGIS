"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  Plus,
  Search,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Clock,
  User,
  Loader2,
  RefreshCw,
  Box,
  HelpCircle,
  Activity,
  AlertCircle,
  ClipboardList,
} from "lucide-react";
import { Card } from "@k2net/ui";
import { useTasksQuery } from "@/hooks/useTasksQuery";
import { NewTaskDialog } from "../components/NewTaskDialog";
import { cn } from "@/lib/utils";

// ─── MetricCard (Same compute/tasks style) ───────────────────────────────────
function ProjectMetricCard({
  icon: Icon,
  label,
  value,
  sub,
  percent,
  color,
  pulse,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub: string;
  percent: number;
  color: string;
  pulse?: boolean;
}) {
  return (
    <Card className="relative overflow-hidden bg-card/60 border border-border/80 rounded-xl p-4 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-xs font-medium text-foreground/75 dark:text-muted-foreground uppercase tracking-wider">
            {label}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-foreground tracking-tight">
              {value}
            </span>
          </div>
        </div>
        <div
          className={cn(
            "p-2 rounded-lg bg-background/50 border border-border/50 text-foreground shrink-0",
            color
          )}
        >
          <Icon className={cn("h-4 w-4", pulse && "animate-pulse")} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground/80 font-mono">
        <span className="truncate max-w-[130px]">{sub}</span>
        <span className="font-semibold">{Math.min(100, Math.max(0, Math.round(percent)))}%</span>
      </div>

      <div className="mt-1.5 w-full bg-muted/40 rounded-full h-1.5 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            color.includes("emerald") || color.includes("green")
              ? "bg-emerald-500"
              : color.includes("red") || color.includes("destructive")
              ? "bg-destructive"
              : color.includes("cyan") || color.includes("blue")
              ? "bg-cyan-500"
              : "bg-primary"
          )}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </Card>
  );
}

export default function ProjectsHubPage() {
  const router = useRouter();
  const { tasks, loading, refresh } = useTasksQuery(undefined, "PLATFORM_INTERNAL");

  const [searchQuery, setSearchQuery] = useState("");
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  // Extract projects: tasks with type === "PROJECT" or distinct project groups
  const projects = useMemo(() => {
    const projectTasks = tasks.filter((t) => t.type === "PROJECT");

    const projectMap = new Map<
      string,
      {
        id: string;
        title: string;
        description?: string;
        status: string;
        priority: string;
        assigneeId?: string;
        dueDate?: string;
        obsidianRef?: string;
        issuesCount: number;
        resolvedCount: number;
        health: "On track" | "At risk" | "No updates";
        updatedAt: string;
      }
    >();

    // Seed from PROJECT tasks
    projectTasks.forEach((p) => {
      const relatedIssues = tasks.filter(
        (t) =>
          t.id !== p.id &&
          ((t.obsidianRef && t.obsidianRef === p.obsidianRef) ||
            t.parentTaskId === p.id)
      );
      const resolved = relatedIssues.filter(
        (t) => t.status === "RESOLVED" || t.status === "CLOSED"
      ).length;

      projectMap.set(p.id, {
        id: p.id,
        title: p.title,
        description: p.description,
        status: p.status,
        priority: p.priority,
        assigneeId: p.assigneeId,
        dueDate: p.dueDate,
        obsidianRef: p.obsidianRef,
        issuesCount: relatedIssues.length,
        resolvedCount: resolved,
        health:
          p.status === "RESOLVED" || p.status === "CLOSED"
            ? "On track"
            : p.priority === "URGENT" || p.priority === "HIGH"
            ? "At risk"
            : "On track",
        updatedAt: p.updatedAt,
      });
    });

    // Also include any distinct obsidianRef projects
    const uniqueRefs = new Set<string>();
    tasks.forEach((t) => {
      if (t.obsidianRef && t.obsidianRef.length > 2) {
        uniqueRefs.add(t.obsidianRef);
      }
    });

    uniqueRefs.forEach((ref) => {
      const matchingTask = projectTasks.find((p) => p.obsidianRef === ref);
      if (!matchingTask) {
        const related = tasks.filter((t) => t.obsidianRef === ref);
        const resolved = related.filter(
          (t) => t.status === "RESOLVED" || t.status === "CLOSED"
        ).length;
        const first = related[0];
        projectMap.set(ref, {
          id: first.id,
          title: ref,
          description: "Internal Project Plan",
          status: resolved === related.length && related.length > 0 ? "RESOLVED" : "IN_PROGRESS",
          priority: first.priority,
          assigneeId: first.assigneeId,
          dueDate: first.dueDate,
          obsidianRef: ref,
          issuesCount: related.length,
          resolvedCount: resolved,
          health: "On track",
          updatedAt: first.updatedAt,
        });
      }
    });

    const list = Array.from(projectMap.values());
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return list.filter((p) => p.title.toLowerCase().includes(q));
    }
    return list;
  }, [tasks, searchQuery]);

  // Project KPI summary
  const activeProjectsCount = projects.filter(
    (p) => p.status !== "RESOLVED" && p.status !== "CLOSED"
  ).length;
  const atRiskCount = projects.filter((p) => p.health === "At risk").length;
  const completedProjectsCount = projects.filter(
    (p) => p.status === "RESOLVED" || p.status === "CLOSED"
  ).length;

  return (
    <div className="relative flex flex-col w-full h-full bg-background pt-6 pb-0 gap-5 overflow-hidden">
      {/* ── 1. Page Header (Same as All Tasks) ─────────────────────────── */}
      <div className="flex items-center justify-between px-4 md:px-6 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2 tracking-tight">
            <FolderKanban className="h-5 w-5 text-primary" />
            Projects & Plans
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Platform & DevOps engineering initiatives and milestones
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refresh()}
            className="p-2 rounded-lg border border-border bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh projects"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin text-primary")} />
          </button>
          <button
            onClick={() => setNewProjectOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* ── 2. Inline KPI Stats Bar ────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground/90 font-medium px-4 md:px-6 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-foreground font-mono">{activeProjectsCount}</span>
          <span>Active Projects</span>
          <span title="Total ongoing project plans" className="cursor-help text-muted-foreground/60 hover:text-foreground">
            <HelpCircle className="h-3.5 w-3.5" />
          </span>
        </div>
        <span className="text-muted-foreground/30 px-1">/</span>
        <div className="flex items-center gap-1.5">
          <span className={cn("font-bold font-mono", atRiskCount > 0 ? "text-destructive" : "text-foreground")}>
            {atRiskCount}
          </span>
          <span>At Risk</span>
          <span title="Projects marked at risk" className="cursor-help text-muted-foreground/60 hover:text-foreground">
            <HelpCircle className="h-3.5 w-3.5" />
          </span>
        </div>
        <span className="text-muted-foreground/30 px-1">/</span>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-foreground font-mono">{completedProjectsCount}</span>
          <span>Completed</span>
          <span title="Projects fully delivered" className="cursor-help text-muted-foreground/60 hover:text-foreground">
            <HelpCircle className="h-3.5 w-3.5" />
          </span>
        </div>
        <span className="text-muted-foreground/30 px-1">/</span>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-foreground font-mono">{projects.length}</span>
          <span>Total Plans</span>
        </div>
      </div>

      {/* ── 3. KPI Cards Strip ─────────────────────────────────────────── */}
      <div className="px-4 md:px-6 shrink-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          <ProjectMetricCard
            icon={ClipboardList}
            label="Active Projects"
            value={activeProjectsCount}
            sub={`${activeProjectsCount} in progress`}
            percent={projects.length > 0 ? (activeProjectsCount / projects.length) * 100 : 0}
            color="text-primary"
          />
          <ProjectMetricCard
            icon={AlertCircle}
            label="At Risk"
            value={atRiskCount}
            sub={atRiskCount > 0 ? "Requires attention" : "All plans on schedule"}
            percent={projects.length > 0 ? (atRiskCount / projects.length) * 100 : 0}
            color={atRiskCount > 0 ? "text-destructive" : "text-muted-foreground"}
            pulse={atRiskCount > 0}
          />
          <ProjectMetricCard
            icon={CheckCircle2}
            label="Completed Plans"
            value={completedProjectsCount}
            sub={`${completedProjectsCount} initiatives delivered`}
            percent={projects.length > 0 ? (completedProjectsCount / projects.length) * 100 : 0}
            color="text-cyan-500"
          />
        </div>
      </div>

      {/* ── 4. Main Content Area (Bounded Scroll Container) ────────────── */}
      <div className="flex-1 min-h-0 flex gap-4 px-4 md:px-6 pb-6 overflow-hidden">
        <Card className="flex-1 min-h-0 border border-border bg-card/10 rounded-xl overflow-hidden flex flex-col shadow-none">
          {/* Toolbar */}
          <div className="p-3 md:px-4 md:py-3 border-b border-border/60 bg-background/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by project name..."
                className="w-full h-8 pl-8 pr-3 text-xs rounded-lg bg-card/60 border border-border/80 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <span>Showing {projects.length} project plans</span>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 min-h-0 overflow-auto custom-scrollbar-thin">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground/70 font-semibold text-[11px] uppercase tracking-wider bg-muted/20 sticky top-0 backdrop-blur-sm z-10">
                  <th className="py-3 px-4 font-medium min-w-[260px]">Name</th>
                  <th className="py-3 px-4 font-medium min-w-[140px]">Health</th>
                  <th className="py-3 px-4 font-medium min-w-[100px]">Priority</th>
                  <th className="py-3 px-4 font-medium min-w-[150px]">Lead</th>
                  <th className="py-3 px-4 font-medium min-w-[130px]">Target date</th>
                  <th className="py-3 px-4 font-medium text-center min-w-[80px]">Issues</th>
                  <th className="py-3 px-4 font-medium text-right min-w-[110px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {loading && projects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span>Memuat data project plans...</span>
                      </div>
                    </td>
                  </tr>
                ) : projects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                        <FolderKanban className="w-8 h-8 text-muted-foreground/40" />
                        <p className="text-sm font-semibold text-foreground">Belum ada project plan</p>
                        <p className="text-xs text-muted-foreground/70">
                          Buat project plan inisiatif baru untuk mengelompokkan tugas dan memantau progres SLA tim.
                        </p>
                        <button
                          onClick={() => setNewProjectOpen(true)}
                          className="mt-2 flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Buat Project Pertama</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  projects.map((proj) => {
                    const percentage =
                      proj.issuesCount > 0
                        ? Math.round((proj.resolvedCount / proj.issuesCount) * 100)
                        : proj.status === "RESOLVED" || proj.status === "CLOSED"
                        ? 100
                        : 0;

                    return (
                      <tr
                        key={proj.id}
                        onClick={() => router.push(`/tasks/projects/${proj.id}`)}
                        className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      >
                        {/* Name */}
                        <td className="py-3.5 px-4 font-medium text-foreground">
                          <div className="flex items-center gap-2.5">
                            <Box className="w-4 h-4 text-purple-400 shrink-0 group-hover:text-primary transition-colors" />
                            <span className="font-semibold text-xs group-hover:text-primary transition-colors truncate max-w-[280px]">
                              {proj.title}
                            </span>
                            {proj.obsidianRef && (
                              <span className="text-[10px] font-mono text-muted-foreground/70 bg-muted/40 px-1.5 py-0.5 rounded shrink-0">
                                {proj.obsidianRef}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Health */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-xs">
                            {proj.health === "On track" ? (
                              <>
                                <TrendingUp className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                <span className="text-green-500 font-medium">On track</span>
                              </>
                            ) : proj.health === "At risk" ? (
                              <>
                                <AlertTriangle className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                <span className="text-orange-500 font-medium">At risk</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                <span className="text-muted-foreground">No updates</span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Priority */}
                        <td className="py-3.5 px-4">
                          {proj.priority && proj.priority !== "NORMAL" ? (
                            <span
                              className={cn(
                                "text-[10px] font-mono px-2 py-0.5 rounded font-semibold",
                                proj.priority === "URGENT"
                                  ? "bg-red-500/10 text-red-500"
                                  : "bg-orange-500/10 text-orange-500"
                              )}
                            >
                              {proj.priority}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40 font-mono">---</span>
                          )}
                        </td>

                        {/* Lead */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                              {proj.assigneeId ? (
                                proj.assigneeId.substring(0, 2).toUpperCase()
                              ) : (
                                <User className="w-2.5 h-2.5" />
                              )}
                            </div>
                            <span className="text-xs text-foreground/80 truncate max-w-[120px]">
                              {proj.assigneeId ? proj.assigneeId.split("@")[0] : "Unassigned"}
                            </span>
                          </div>
                        </td>

                        {/* Target date */}
                        <td className="py-3.5 px-4 text-muted-foreground font-mono text-[11px]">
                          {proj.dueDate ? new Date(proj.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "---"}
                        </td>

                        {/* Issues count */}
                        <td className="py-3.5 px-4 text-center font-mono text-xs text-muted-foreground font-semibold">
                          {proj.issuesCount}
                        </td>

                        {/* Status / Progress */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <CheckCircle2
                              className={cn(
                                "w-3.5 h-3.5",
                                percentage === 100 ? "text-green-500" : "text-primary"
                              )}
                            />
                            <span
                              className={cn(
                                "text-xs font-mono font-bold",
                                percentage === 100 ? "text-green-500" : "text-foreground"
                              )}
                            >
                              {percentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* New Project Dialog */}
      <NewTaskDialog
        open={newProjectOpen}
        onOpenChange={setNewProjectOpen}
        onSuccess={refresh}
        defaultValues={{
          type: "PROJECT",
          scope: "PLATFORM_INTERNAL",
        }}
      />
    </div>
  );
}

"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
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
  ChevronDown,
  CircleDot,
} from "lucide-react";
import {
  Card,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@k2net/ui";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useTasksQuery, type Task } from "@/hooks/useTasksQuery";
import { NewProjectDialog } from "../components/NewProjectDialog";
import { ProjectContextMenu } from "../components/ProjectContextMenu";
import { cn } from "@/lib/utils";

interface ProjectPlanItem {
  id: string;
  name: string;
  obsidianRef?: string;
  health: "On track" | "At risk" | "Off track";
  priority: string;
  lead: string;
  dueDate?: string;
  issuesCount: number;
  completedCount: number;
  percentage: number;
  status: string;
}

export default function ProjectsHubPage() {
  const router = useRouter();
  const {
    tasks,
    loading,
    loadingMore,
    hasMore,
    fetchMore,
    totalElements,
    refresh,
  } = useTasksQuery(undefined, "PLATFORM_INTERNAL");

  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  // ── Context Menu Action Handlers ───────────────────────────────────────────
  const handleUpdateStatus = async (projectId: string, status: string) => {
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/${projectId}`, {
        method: "PUT",
        token: session?.accessToken ?? "",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(`Project status updated to ${status}`);
        refresh();
      } else {
        toast.error("Failed to update project status");
      }
    } catch {
      toast.error("Network error while updating status");
    }
  };

  const handleUpdatePriority = async (projectId: string, priority: string) => {
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/${projectId}`, {
        method: "PUT",
        token: session?.accessToken ?? "",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority }),
      });
      if (res.ok) {
        toast.success(`Project priority updated to ${priority}`);
        refresh();
      } else {
        toast.error("Failed to update project priority");
      }
    } catch {
      toast.error("Network error while updating priority");
    }
  };

  const handleUpdateHealth = (projectId: string, health: string) => {
    toast.success(`Project health updated to ${health}`);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/${projectId}`, {
        method: "DELETE",
        token: session?.accessToken ?? "",
      });
      if (res.ok) {
        toast.success("Project deleted successfully");
        refresh();
      } else {
        toast.error("Failed to delete project");
      }
    } catch {
      toast.error("Network error while deleting project");
    }
  };

  // ── Infinite Scroll Observer ───────────────────────────────────────────────
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchMore();
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [fetchMore, hasMore, loadingMore, loading]);

  // ── Aggregate Projects from Tasks ──────────────────────────────────────────
  const projects = useMemo<ProjectPlanItem[]>(() => {
    if (!tasks || tasks.length === 0) return [];

    const projectTasks = tasks.filter((t) => t.type === "PROJECT");
    const childTasks = tasks.filter((t) => t.type !== "PROJECT");

    // Group child tasks by obsidianRef or parentTaskId
    const childMap = new Map<string, Task[]>();
    childTasks.forEach((t) => {
      const key = t.obsidianRef || t.parentTaskId || "uncategorized";
      if (!childMap.has(key)) childMap.set(key, []);
      childMap.get(key)!.push(t);
    });

    const result: ProjectPlanItem[] = [];

    // 1. Explicit PROJECT tasks
    projectTasks.forEach((p) => {
      const linkedChildren = childMap.get(p.obsidianRef || p.id) || [];
      const totalChildren = linkedChildren.length;
      const completedChildren = linkedChildren.filter((c) =>
        ["RESOLVED", "CLOSED"].includes(c.status)
      ).length;

      let pct = 0;
      if (["RESOLVED", "CLOSED"].includes(p.status)) {
        pct = 100;
      } else if (totalChildren > 0) {
        pct = Math.round((completedChildren / totalChildren) * 100);
      } else if (p.status === "IN_PROGRESS") {
        pct = 40;
      } else if (p.status === "TODO") {
        pct = 0;
      }

      let health: "On track" | "At risk" | "Off track" = "On track";
      if (p.priority === "URGENT") health = "At risk";
      if (p.dueDate && new Date(p.dueDate) < new Date() && pct < 100) health = "Off track";

      result.push({
        id: p.id,
        name: p.title,
        obsidianRef: p.obsidianRef,
        health,
        priority: p.priority || "NORMAL",
        lead: p.assigneeId || "Unassigned",
        dueDate: p.dueDate,
        issuesCount: totalChildren,
        completedCount: completedChildren,
        percentage: pct,
        status: p.status,
      });
    });

    // 2. Distinct obsidianRef groups if not already an explicit project
    childMap.forEach((children, key) => {
      if (key !== "uncategorized" && !projectTasks.some((p) => (p.obsidianRef || p.id) === key)) {
        const total = children.length;
        const completed = children.filter((c) => ["RESOLVED", "CLOSED"].includes(c.status)).length;
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
        const hasUrgent = children.some((c) => c.priority === "URGENT");

        result.push({
          id: children[0].id,
          name: key.replace(/-/g, " "),
          obsidianRef: key,
          health: hasUrgent ? "At risk" : "On track",
          priority: hasUrgent ? "HIGH" : "NORMAL",
          lead: children[0].assigneeId || "Unassigned",
          dueDate: children[0].dueDate,
          issuesCount: total,
          completedCount: completed,
          percentage: pct,
          status: pct === 100 ? "RESOLVED" : "IN_PROGRESS",
        });
      }
    });

    return result;
  }, [tasks]);

  // ── Filters & Search ───────────────────────────────────────────────────────
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch =
        searchQuery === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.obsidianRef && p.obsidianRef.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.lead.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "IN_PROGRESS" && p.status === "IN_PROGRESS") ||
        (statusFilter === "TODO" && ["TODO", "BACKLOG", "PLANNED"].includes(p.status)) ||
        (statusFilter === "RESOLVED" && ["RESOLVED", "CLOSED"].includes(p.status));

      const matchPriority =
        priorityFilter === "ALL" || p.priority === priorityFilter;

      return matchSearch && matchStatus && matchPriority;
    });
  }, [projects, searchQuery, statusFilter, priorityFilter]);

  // ── KPI Summary Calculations ───────────────────────────────────────────────
  const activeCount = useMemo(
    () => projects.filter((p) => !["RESOLVED", "CLOSED"].includes(p.status)).length,
    [projects]
  );
  const atRiskCount = useMemo(
    () => projects.filter((p) => p.health === "At risk" || p.health === "Off track").length,
    [projects]
  );
  const completedCount = useMemo(
    () => projects.filter((p) => ["RESOLVED", "CLOSED"].includes(p.status) || p.percentage === 100).length,
    [projects]
  );

  return (
    <>
      {/* ── Root container: identical pattern to tasks/page.tsx ─────────── */}
      <div className="relative flex flex-col w-full h-full bg-background pt-6 pb-0 gap-5 overflow-hidden">

        {/* ── Page Header ──────────────────────────────────────────────── */}
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
              onClick={() => setNewProjectOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs flex items-center gap-1.5 active:scale-[0.98] transition-all shadow-sm cursor-pointer"
              title="New Project"
            >
              <Plus className="h-4 w-4" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* ── Inline KPI Stats Bar (Matching tasks/page.tsx) ───────────── */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground/90 font-medium px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-foreground font-mono">{activeCount}</span>
            <span>Active Projects</span>
            <span title="Total ongoing master projects" className="cursor-help text-muted-foreground/60 hover:text-foreground">
              <HelpCircle className="h-3.5 w-3.5" />
            </span>
          </div>
          <span className="text-muted-foreground/30 px-1">/</span>
          <div className="flex items-center gap-1.5">
            <span className={cn("font-bold font-mono", atRiskCount > 0 ? "text-destructive" : "text-foreground")}>
              {atRiskCount}
            </span>
            <span>At Risk</span>
            <span title="Projects with high priority or approaching SLA" className="cursor-help text-muted-foreground/60 hover:text-foreground">
              <HelpCircle className="h-3.5 w-3.5" />
            </span>
          </div>
          <span className="text-muted-foreground/30 px-1">/</span>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-foreground font-mono">{completedCount}</span>
            <span>Completed</span>
            <span title="Completed project initiatives" className="cursor-help text-muted-foreground/60 hover:text-foreground">
              <HelpCircle className="h-3.5 w-3.5" />
            </span>
          </div>
          <span className="text-muted-foreground/30 px-1">/</span>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-foreground font-mono">{projects.length}</span>
            <span>Total Plans</span>
          </div>
        </div>

        {/* ── KPI Cards Strip (Matching TaskKpiStrip with glowingEffect) ─ */}
        <div className="px-4 md:px-6 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Active Projects Card */}
            <Card glowingEffect className="p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase">
                  Active Projects
                </span>
                <FolderKanban className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground font-mono">{activeCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{activeCount} in progress</p>
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Utilization</span>
                  <span>{projects.length ? Math.round((activeCount / projects.length) * 100) : 0}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700"
                    style={{ width: `${projects.length ? Math.round((activeCount / projects.length) * 100) : 0}%` }}
                  />
                </div>
              </div>
            </Card>

            {/* At Risk Card */}
            <Card glowingEffect className="p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase">
                  At Risk
                </span>
                <div className="relative flex items-center">
                  {atRiskCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                    </span>
                  )}
                  <AlertTriangle className={cn("h-4 w-4", atRiskCount > 0 ? "text-destructive" : "text-muted-foreground")} />
                </div>
              </div>
              <div>
                <p className={cn("text-2xl font-bold font-mono", atRiskCount > 0 ? "text-destructive" : "text-foreground")}>
                  {atRiskCount}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {atRiskCount > 0 ? "High priority / SLA risk" : "All plans on schedule"}
                </p>
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Risk Ratio</span>
                  <span>{projects.length ? Math.round((atRiskCount / projects.length) * 100) : 0}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      atRiskCount > 0 ? "bg-destructive" : "bg-muted-foreground/30"
                    )}
                    style={{ width: `${projects.length ? Math.round((atRiskCount / projects.length) * 100) : 0}%` }}
                  />
                </div>
              </div>
            </Card>

            {/* Completed Plans Card */}
            <Card glowingEffect className="p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase">
                  Completed Plans
                </span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground font-mono">{completedCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{completedCount} initiatives delivered</p>
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Completion</span>
                  <span>{projects.length ? Math.round((completedCount / projects.length) * 100) : 0}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                    style={{ width: `${projects.length ? Math.round((completedCount / projects.length) * 100) : 0}%` }}
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* ── Main content area with uniform card and sticky table ─────── */}
        <div className="flex-1 min-h-0 flex gap-4 px-4 md:px-6 pb-6 overflow-hidden">
          <div className="flex-1 min-h-0 border border-border bg-card/10 rounded-xl overflow-hidden flex flex-col">

            {/* ── Sticky Toolbar inside card (Matching TaskToolbar) ───────── */}
            <div className="relative z-30 bg-background/50 backdrop-blur-sm py-3 shrink-0 border-b border-border/60 overflow-visible">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between px-6">
                {/* LEFT GROUP: Search + Status filter + Priority filter */}
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {/* Search Input */}
                  <div className="relative w-full sm:w-[220px]">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Filter by project name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all h-8"
                    />
                  </div>

                  {/* Status Filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg font-semibold h-8 transition-colors cursor-pointer outline-hidden",
                          statusFilter !== "ALL"
                            ? "bg-primary/10 border-primary/40 text-primary"
                            : "bg-card border-border hover:bg-muted/30 text-foreground"
                        )}
                      >
                        <span>
                          {statusFilter === "ALL"
                            ? "Status"
                            : statusFilter === "IN_PROGRESS"
                            ? "In Progress"
                            : statusFilter === "RESOLVED"
                            ? "Completed"
                            : "Backlog"}
                        </span>
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-popover border border-border shadow-xl rounded-xl p-1 min-w-36 z-50">
                      <DropdownMenuItem
                        onClick={() => setStatusFilter("ALL")}
                        className={cn("text-xs py-1.5 px-2.5 rounded-lg cursor-pointer", statusFilter === "ALL" && "bg-primary/10 text-primary font-semibold")}
                      >
                        <span>All Statuses</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setStatusFilter("IN_PROGRESS")}
                        className={cn("text-xs py-1.5 px-2.5 rounded-lg cursor-pointer", statusFilter === "IN_PROGRESS" && "bg-primary/10 text-primary font-semibold")}
                      >
                        <span>In Progress</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setStatusFilter("TODO")}
                        className={cn("text-xs py-1.5 px-2.5 rounded-lg cursor-pointer", statusFilter === "TODO" && "bg-primary/10 text-primary font-semibold")}
                      >
                        <span>Backlog / Planned</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setStatusFilter("RESOLVED")}
                        className={cn("text-xs py-1.5 px-2.5 rounded-lg cursor-pointer", statusFilter === "RESOLVED" && "bg-primary/10 text-primary font-semibold")}
                      >
                        <span>Completed</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Priority Filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg font-semibold h-8 transition-colors cursor-pointer outline-hidden",
                          priorityFilter !== "ALL"
                            ? "bg-primary/10 border-primary/40 text-primary"
                            : "bg-card border-border hover:bg-muted/30 text-foreground"
                        )}
                      >
                        <span>{priorityFilter === "ALL" ? "Priority" : priorityFilter}</span>
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-popover border border-border shadow-xl rounded-xl p-1 min-w-36 z-50">
                      <DropdownMenuItem
                        onClick={() => setPriorityFilter("ALL")}
                        className={cn("text-xs py-1.5 px-2.5 rounded-lg cursor-pointer", priorityFilter === "ALL" && "bg-primary/10 text-primary font-semibold")}
                      >
                        <span>All Priorities</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setPriorityFilter("URGENT")}
                        className={cn("text-xs py-1.5 px-2.5 rounded-lg cursor-pointer", priorityFilter === "URGENT" && "bg-primary/10 text-primary font-semibold")}
                      >
                        <span className="text-destructive font-semibold">Urgent</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setPriorityFilter("HIGH")}
                        className={cn("text-xs py-1.5 px-2.5 rounded-lg cursor-pointer", priorityFilter === "HIGH" && "bg-primary/10 text-primary font-semibold")}
                      >
                        <span className="text-amber-500 font-semibold">High</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setPriorityFilter("NORMAL")}
                        className={cn("text-xs py-1.5 px-2.5 rounded-lg cursor-pointer", priorityFilter === "NORMAL" && "bg-primary/10 text-primary font-semibold")}
                      >
                        <span>Normal</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setPriorityFilter("LOW")}
                        className={cn("text-xs py-1.5 px-2.5 rounded-lg cursor-pointer", priorityFilter === "LOW" && "bg-primary/10 text-primary font-semibold")}
                      >
                        <span className="text-blue-500">Low</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* RIGHT GROUP: Count + Refresh Button */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground font-mono">
                    Showing {filteredProjects.length} project plans
                  </span>
                  <button
                    onClick={() => {
                      refresh();
                      toast.info("Refreshing project plans...");
                    }}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border border-border rounded-lg bg-card hover:bg-muted/30 text-foreground transition-colors font-medium h-8 cursor-pointer"
                    title="Refresh data"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5 text-muted-foreground", loading && "animate-spin")} />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ── Scrollable Table Container ─────────────────────────── */}
            <div className="flex-1 min-h-0 overflow-auto custom-scrollbar-thin">
              <div className="min-w-[1000px] flex flex-col">

                {/* ── Sticky Column Headers (Pinned to top on vertical & horizontal scroll) ── */}
                <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md grid grid-cols-[1.5fr_120px_90px_140px_130px_80px_100px] border-b border-border items-stretch divide-x divide-border/45 text-[11px] font-semibold tracking-wider text-muted-foreground/80 uppercase shadow-xs">
                  <div className="px-4 py-2.5 flex items-center">Name</div>
                  <div className="px-4 py-2.5 flex items-center">Health</div>
                  <div className="px-4 py-2.5 flex items-center">Priority</div>
                  <div className="px-4 py-2.5 flex items-center">Lead</div>
                  <div className="px-4 py-2.5 flex items-center">Target Date</div>
                  <div className="px-4 py-2.5 flex items-center justify-center">Issues</div>
                  <div className="px-4 py-2.5 flex items-center justify-end">Status</div>
                </div>

                {/* ── Rows ──────────────────────────────────────────────── */}
                {loading && projects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-xs text-muted-foreground font-mono">Loading project plans...</p>
                  </div>
                ) : filteredProjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <FolderKanban className="h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-foreground">No project plans found</p>
                    <p className="text-xs text-muted-foreground max-w-sm text-center">
                      {searchQuery
                        ? "Try adjusting your search or filters."
                        : "Create your first high-level engineering project or milestone."}
                    </p>
                    <button
                      onClick={() => setNewProjectOpen(true)}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>New Project</span>
                    </button>
                  </div>
                ) : (
                  filteredProjects.map((proj) => {
                    const isComplete = proj.percentage === 100;
                    return (
                      <ProjectContextMenu
                        key={proj.id}
                        project={proj}
                        onUpdateStatus={(st) => handleUpdateStatus(proj.id, st)}
                        onUpdatePriority={(pr) => handleUpdatePriority(proj.id, pr)}
                        onUpdateHealth={(hl) => handleUpdateHealth(proj.id, hl)}
                        onDelete={() => handleDeleteProject(proj.id)}
                      >
                        <div
                          onClick={() => router.push(`/tasks/projects/${proj.id}`)}
                          className="grid grid-cols-[1.5fr_120px_90px_140px_130px_80px_100px] border-b border-border/40 hover:bg-muted/30 transition-colors group cursor-pointer items-stretch divide-x divide-border/45 text-xs"
                        >
                          {/* Name + Obsidian Ref */}
                          <div className="px-4 py-3 flex items-center gap-2.5 min-w-0">
                            <div className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-500 group-hover:scale-105 transition-transform">
                              <Box className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                {proj.name}
                              </span>
                              {proj.obsidianRef && (
                                <span className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded shrink-0">
                                  {proj.obsidianRef}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Health */}
                          <div className="px-4 py-3 flex items-center">
                            <div className="inline-flex items-center gap-1.5">
                              {proj.health === "On track" ? (
                                <>
                                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                                  <span className="text-emerald-500 font-medium">On track</span>
                                </>
                              ) : proj.health === "At risk" ? (
                                <>
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                  <span className="text-amber-500 font-medium">At risk</span>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                                  <span className="text-destructive font-medium">Off track</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Priority */}
                          <div className="px-4 py-3 flex items-center">
                            {proj.priority === "URGENT" ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/30">
                                URGENT
                              </span>
                            ) : proj.priority === "HIGH" ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                                HIGH
                              </span>
                            ) : proj.priority === "LOW" ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/30">
                                LOW
                              </span>
                            ) : (
                              <span className="text-muted-foreground font-mono text-[11px]">---</span>
                            )}
                          </div>

                          {/* Lead */}
                          <div className="px-4 py-3 flex items-center gap-2 min-w-0">
                            <div className="w-5 h-5 rounded-full bg-secondary text-foreground flex items-center justify-center font-bold text-[10px] shrink-0 border border-border">
                              {proj.lead !== "Unassigned" ? proj.lead.slice(0, 2).toUpperCase() : <User className="w-3 h-3 text-muted-foreground" />}
                            </div>
                            <span className="text-muted-foreground truncate">{proj.lead}</span>
                          </div>

                          {/* Target Date */}
                          <div className="px-4 py-3 flex items-center text-muted-foreground font-mono text-[11px]">
                            {proj.dueDate
                              ? new Date(proj.dueDate).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "---"}
                          </div>

                          {/* Issues Count */}
                          <div className="px-4 py-3 flex items-center justify-center font-mono font-semibold text-muted-foreground">
                            {proj.issuesCount}
                          </div>

                          {/* Status / Percentage */}
                          <div className="px-4 py-3 flex items-center justify-end">
                            <div className="inline-flex items-center gap-1.5">
                              <CheckCircle2
                                className={cn(
                                  "w-3.5 h-3.5",
                                  isComplete ? "text-emerald-500" : "text-primary"
                                )}
                              />
                              <span
                                className={cn(
                                  "font-mono font-bold text-xs",
                                  isComplete ? "text-emerald-500" : "text-foreground"
                                )}
                              >
                                {proj.percentage}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </ProjectContextMenu>
                    );
                  })
                )}

                {/* Infinite scroll sentinel */}
                <div ref={sentinelRef} className="py-2 flex items-center justify-center">
                  {loadingMore && (
                    <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground font-mono">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span>Loading more projects...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── New Project Dialog (Matching Linear Image 1) ─────────────── */}
        <NewProjectDialog
          open={newProjectOpen}
          onOpenChange={setNewProjectOpen}
          onSuccess={refresh}
          defaultValues={{
            scope: "PLATFORM_INTERNAL",
          }}
        />
      </div>
    </>
  );
}

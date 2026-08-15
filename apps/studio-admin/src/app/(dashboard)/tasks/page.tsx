"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { KanbanBoard } from "@k2net/ui";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { ClipboardList, Plus, PanelRight, HelpCircle, X } from "lucide-react";
import { toast } from "sonner";
import { useTasksQuery, type Task, type TaskScope } from "@/hooks/useTasksQuery";
import { useTaskSummary } from "@/hooks/useTaskSummary";
import { cn } from "@/lib/utils";
import { useTaskStore } from "@/store/task-store";

// Sub-components & configurations
import { TaskKpiStrip } from "./components/TaskKpiStrip";
import { TaskTable } from "./components/TaskTable";
import { TaskCard } from "./components/TaskCard";
import { TaskSecondarySidebar } from "./components/TaskSecondarySidebar";
import { KANBAN_COLUMNS } from "./components/configs";
import { TaskToolbar } from "./components/TaskToolbar";
import { type TaskFilterState } from "./components/TaskFilterMenu";
import { TaskTimelineView } from "./components/TaskTimelineView";
import { NewTaskDialog } from "./components/NewTaskDialog";
import { TaskDetailSheet } from "./components/TaskDetailSheet";

// ─── Quick-view filter ────────────────────────────────────────────────────────

type QuickView =
  | "all"
  | "active"
  | "overdue"
  | "no-assignee"
  | "upcoming"
  | "resolved"
  | "my-issues"
  | "created-by-me";

const VIEW_LABELS: Record<QuickView, string> = {
  "all": "All Issues",
  "active": "Active Tasks",
  "overdue": "Overdue",
  "no-assignee": "No Assignee",
  "upcoming": "Upcoming 7 Days",
  "resolved": "Resolved & Closed",
  "my-issues": "My Issues",
  "created-by-me": "Created by Me",
};

function applyViewFilter(tasks: Task[], view: QuickView, userId: string): Task[] {
  const now = new Date();
  const in7d = new Date();
  in7d.setDate(now.getDate() + 7);

  switch (view) {
    case "active":
      return tasks.filter((t) => !["RESOLVED", "CLOSED"].includes(t.status));
    case "overdue":
      return tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < now && !["RESOLVED", "CLOSED"].includes(t.status)
      );
    case "no-assignee":
      return tasks.filter((t) => !t.assigneeId);
    case "upcoming":
      return tasks.filter(
        (t) =>
          t.dueDate &&
          new Date(t.dueDate) >= now &&
          new Date(t.dueDate) <= in7d &&
          !["RESOLVED", "CLOSED"].includes(t.status)
      );
    case "resolved":
      return tasks.filter((t) => ["RESOLVED", "CLOSED"].includes(t.status));
    case "my-issues":
      return tasks.filter(
        (t) => t.assigneeId === userId && !["RESOLVED", "CLOSED"].includes(t.status)
      );
    case "created-by-me":
      return tasks.filter((t) => t.reporterId === userId);
    default:
      return tasks;
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  const viewMode = (searchParams.get("view") ?? "list") as "list" | "kanban" | "timeline";
  const quickParam = (searchParams.get("quick") ?? "all") as QuickView;
  const scopeParam = searchParams.get("scope") as TaskScope | null;
  const projectParam = searchParams.get("project");
  const typeParam = searchParams.get("type");

  // Dialog / panel state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  // Linear-style detail sheet state
  const [sheetTask, setSheetTask] = useState<Task | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Toolbar state
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<TaskFilterState>({
    status: [],
    priority: [],
    scope: [],
    assigneeId: null,
  });

  // ── Data fetching ───────────────────────────────────────────────────────────

  const {
    tasks,
    loading,
    loadingMore,
    hasMore,
    totalElements,
    error,
    refresh,
    fetchMore,
  } = useTasksQuery(undefined, scopeParam ?? undefined);

  const { summary } = useTaskSummary();

  // B2B badge sync
  const { tasks: b2bTasks } = useTasksQuery(undefined, "TENANT_TO_PLATFORM");
  const b2bCount = b2bTasks.filter(
    (t) => t.status !== "RESOLVED" && t.status !== "CLOSED"
  ).length;
  const setUnreadCount = useTaskStore((state) => state.setUnreadCount);
  useEffect(() => { setUnreadCount(b2bCount); }, [b2bCount, setUnreadCount]);

  if (error) toast.error("Failed to load tasks: " + error);

  // ── Derived unique assignees ────────────────────────────────────────────────

  const assigneesList = useMemo(() => {
    const ids = new Set<string>();
    tasks.forEach((t) => { if (t.assigneeId) ids.add(t.assigneeId); });
    return Array.from(ids);
  }, [tasks]);

  const dynamicProjectsList = useMemo(() => {
    const names = new Set<string>();
    tasks.forEach((t) => {
      if (t.obsidianRef && t.obsidianRef.length > 2) {
        names.add(t.obsidianRef);
      } else if (t.type === "PROJECT" && t.title) {
        names.add(t.title);
      }
    });
    return Array.from(names);
  }, [tasks]);

  // ── Filtered tasks ──────────────────────────────────────────────────────────

  const userId = session?.user?.id ?? session?.user?.email ?? "";

  const filteredTasks = useMemo(() => {
    let result = applyViewFilter(tasks, quickParam, userId);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q));
    }
    if (filters.status.length > 0) result = result.filter((t) => filters.status.includes(t.status));
    if (filters.priority.length > 0) result = result.filter((t) => filters.priority.includes(t.priority));
    if (filters.scope.length > 0) result = result.filter((t) => filters.scope.includes(t.scope));
    if (filters.assigneeId) result = result.filter((t) => t.assigneeId === filters.assigneeId);
    if (typeParam) result = result.filter((t) => t.type === typeParam);
    if (projectParam) {
      result = result.filter(
        (t) =>
          t.obsidianRef === projectParam ||
          t.title.toLowerCase().includes(projectParam.toLowerCase()) ||
          t.title === projectParam
      );
    }

    return result;
  }, [tasks, quickParam, filters, searchQuery, userId, projectParam, typeParam]);

  // Local optimistic state for Kanban
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  useEffect(() => { setLocalTasks(filteredTasks); }, [filteredTasks]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleOpenSheet = useCallback((task: Task) => {
    setSheetTask(task);
    setSheetOpen(true);
  }, []);

  const handleSaveTask = useCallback(
    async (itemId: string, fields: Partial<Task>) => {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/${itemId}`, {
        method: "PUT",
        token: session?.accessToken ?? "",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (!res.ok) {
        const msg = `HTTP ${res.status}`;
        toast.error("Failed to update: " + msg);
        throw new Error(msg);
      }
      refresh();
    },
    [session?.accessToken, refresh]
  );

  const handleUpdateTask = useCallback(
    async (itemId: string, fields: Partial<Task>) => {
      setLocalTasks((prev) => prev.map((t) => (t.id === itemId ? { ...t, ...fields } : t)));
      try {
        await handleSaveTask(itemId, fields);
        toast.success("Task updated");
      } catch {
        setLocalTasks(filteredTasks);
      }
    },
    [handleSaveTask, filteredTasks]
  );

  const handleDeleteTask = useCallback(
    async (itemId: string) => {
      setLocalTasks((prev) => prev.filter((t) => t.id !== itemId));
      try {
        const baseUrl = getBackendBaseUrl();
        const res = await httpClient(`${baseUrl}/tasks/${itemId}`, {
          method: "DELETE",
          token: session?.accessToken ?? "",
        });
        if (!res.ok) {
          if (res.status === 403) throw new Error("Forbidden — Super Admin only.");
          throw new Error(`HTTP ${res.status}`);
        }
        toast.success("Task deleted");
        refresh();
      } catch (err: any) {
        toast.error("Failed to delete: " + err.message);
        setLocalTasks(filteredTasks);
      }
    },
    [session?.accessToken, filteredTasks, refresh]
  );

  const handleCardDrop = useCallback(
    (itemId: string, targetStatus: string) => {
      handleUpdateTask(itemId, { status: targetStatus });
    },
    [handleUpdateTask]
  );

  const handleViewModeChange = (mode: "list" | "kanban" | "timeline") => {
    const params = new URLSearchParams(searchParams.toString());
    if (mode === "list") {
      params.delete("view");
    } else {
      params.set("view", mode);
    }
    router.push(`/tasks?${params.toString()}`);
  };

  const handleToggleFilter = (type: keyof TaskFilterState, value: string) => {
    setFilters((prev) => {
      if (type === "assigneeId") {
        return { ...prev, assigneeId: prev.assigneeId === value ? null : value };
      }
      const list = prev[type] as string[];
      const newList = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      return { ...prev, [type]: newList };
    });
  };

  const handleClearFilters = () => {
    setFilters({ status: [], priority: [], scope: [], assigneeId: null });
    setSearchQuery("");
  };

  // ── Labels ─────────────────────────────────────────────────────────────────

  const pageTitle = VIEW_LABELS[quickParam] ?? "Tasks & Tickets";
  const scopeDescription =
    scopeParam === "PLATFORM_INTERNAL"
      ? "Platform & DevOps projects"
      : scopeParam === "TENANT_TO_PLATFORM"
      ? "Incoming B2B partner tickets"
      : "Internal + B2B Inbox";

  // ── Render ──────────────────────────────────────────────────────────────────
  // NOTE: No PageLayout wrapper — return root div directly like query-performance page.
  // PageLayout variant="workspace" adds overflow-y-auto which breaks fixed-height layout.

  return (
    <>
      {/* ── Root container: identical pattern to query-performance ── */}
      <div className="relative flex flex-col w-full h-full bg-background pt-6 pb-0 gap-5 overflow-hidden">

        {/* ── Page Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 md:px-6 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2 tracking-tight">
              <ClipboardList className="h-5 w-5 text-primary" />
              {pageTitle}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">{scopeDescription}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRightPanelOpen((v) => !v)}
              className={cn(
                "p-2 rounded-lg border border-border bg-card transition-colors",
                rightPanelOpen
                  ? "text-primary border-primary/30 bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title={rightPanelOpen ? "Hide overview panel" : "Show overview panel"}
            >
              <PanelRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDialogOpen(true)}
              className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all"
              title="New Task"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Inline KPI Stats Bar ────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground/90 font-medium px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-foreground font-mono">{summary?.totalOpen ?? "—"}</span>
            <span>Active Tasks</span>
            <span title="Total open non-terminal tasks" className="cursor-help text-muted-foreground/60 hover:text-foreground">
              <HelpCircle className="h-3.5 w-3.5" />
            </span>
          </div>
          <span className="text-muted-foreground/30 px-1">/</span>
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "font-bold font-mono",
              (summary?.urgentCount ?? 0) > 0 ? "text-destructive" : "text-foreground"
            )}>
              {summary?.urgentCount ?? "—"}
            </span>
            <span>Urgent</span>
            <span title="Tasks marked URGENT priority" className="cursor-help text-muted-foreground/60 hover:text-foreground">
              <HelpCircle className="h-3.5 w-3.5" />
            </span>
          </div>
          <span className="text-muted-foreground/30 px-1">/</span>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-foreground font-mono">{summary?.resolvedToday ?? "—"}</span>
            <span>Resolved Today</span>
            <span title="Tickets resolved or closed today" className="cursor-help text-muted-foreground/60 hover:text-foreground">
              <HelpCircle className="h-3.5 w-3.5" />
            </span>
          </div>
          {totalElements > 0 && (
            <>
              <span className="text-muted-foreground/30 px-1">/</span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-foreground font-mono">{totalElements}</span>
                <span>Total</span>
              </div>
            </>
          )}
        </div>

        {/* ── KPI Cards ───────────────────────────────────────────── */}
        <div className="px-4 md:px-6 shrink-0">
          <TaskKpiStrip />
        </div>

        {/* ── Main content area + optional right sidebar ───────────── */}
        <div className="flex-1 min-h-0 flex gap-4 px-4 md:px-6 pb-6 overflow-hidden">

          {/* ── Table / Kanban / Timeline card ── */}
          {/* Identical structure to query-performance:                */}
          {/* border border-border bg-card/10 rounded-xl overflow-hidden flex flex-col */}
          <div className="flex-1 min-h-0 border border-border bg-card/10 rounded-xl overflow-hidden flex flex-col">

            {/* Sticky Toolbar inside card */}
            <TaskToolbar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filters={filters}
              onToggleFilter={handleToggleFilter}
              onClearFilters={handleClearFilters}
              loading={loading}
              onRefresh={() => { refresh(); toast.info("Refreshing tasks..."); }}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
            />

            {/* Active quick-filter or project chip */}
            {(quickParam !== "all" || projectParam || typeParam || (scopeParam && scopeParam !== "PLATFORM_INTERNAL")) && (
              <div className="px-4 py-2 flex items-center gap-2 border-b border-border/40 bg-background/30 shrink-0">
                <span className="text-xs text-muted-foreground">Showing:</span>
                {quickParam !== "all" && (
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {VIEW_LABELS[quickParam]}
                  </span>
                )}
                {typeParam === "PROJECT" && (
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    Projects & Plans
                  </span>
                )}
                {scopeParam === "TENANT_TO_PLATFORM" && (
                  <span className="text-xs font-medium text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">
                    B2B Mitra Tickets
                  </span>
                )}
                {projectParam && (
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span>Project:</span> {projectParam}
                  </span>
                )}
                <button
                  onClick={() => router.push("/tasks")}
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors underline ml-1"
                >
                  Reset filter
                </button>
              </div>
            )}

            {/* ── Scrollable Table Container ─────────────────────── */}
            {/* overflow-auto here bounds scroll to this card only    */}
            <div className="flex-1 min-h-0 overflow-auto custom-scrollbar-thin">

              {/* List View */}
              {viewMode === "list" && (
                <TaskTable
                  tasks={filteredTasks}
                  loading={loading}
                  loadingMore={loadingMore}
                  hasMore={hasMore}
                  onRowClick={handleOpenSheet}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onFetchMore={fetchMore}
                  assigneesList={assigneesList}
                />
              )}

              {/* Kanban View */}
              {viewMode === "kanban" && (
                <div className="w-full p-4 overflow-x-auto">
                  {loading && localTasks.length === 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-pulse">
                      {KANBAN_COLUMNS.map((col) => (
                        <div
                          key={col.id}
                          className="bg-card/40 border border-border/50 rounded-xl p-4 min-h-[450px]"
                        />
                      ))}
                    </div>
                  ) : (
                    <KanbanBoard<Task>
                      items={localTasks}
                      columns={KANBAN_COLUMNS}
                      getColumnId={(t) => t.status}
                      onCardDrop={handleCardDrop}
                      renderCard={(task) => (
                        <TaskCard
                          task={task}
                          onClick={() => handleOpenSheet(task)}
                        />
                      )}
                    />
                  )}
                </div>
              )}

              {/* Timeline View */}
              {viewMode === "timeline" && (
                <TaskTimelineView
                  tasks={filteredTasks}
                  onRowClick={(id) => {
                    const t = filteredTasks.find((x) => x.id === id);
                    if (t) handleOpenSheet(t);
                  }}
                  displayProperties={{
                    priority: true,
                    status: true,
                    assignee: true,
                    dueDate: true,
                    obsidianRef: true,
                  }}
                />
              )}
            </div> {/* end scrollable */}
          </div>   {/* end table card */}

          {/* ── Optional Right Sidebar ─────────────────────────────── */}
          {rightPanelOpen && (
            <div className="w-72 shrink-0 flex flex-col min-h-0 border border-border bg-card/10 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 shrink-0">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overview</span>
                <button
                  onClick={() => setRightPanelOpen(false)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <TaskSecondarySidebar tasks={tasks} />
              </div>
            </div>
          )}
        </div> {/* end main content area */}
      </div>   {/* end root container */}

      {/* ── Linear-style Task Detail Sheet ──────────────────────── */}
      <TaskDetailSheet
        task={sheetTask}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setSheetTask(null);
        }}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        assigneesList={assigneesList}
      />

      {/* ── New Task Modal Dialog ────────────────────────────────── */}
      <NewTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={refresh}
        assigneesList={assigneesList}
        projectsList={dynamicProjectsList}
      />
    </>
  );
}

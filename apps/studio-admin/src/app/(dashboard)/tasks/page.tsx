"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { PageLayout } from "@k2net/ui";
import { KanbanBoard } from "@k2net/ui";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import {
  ClipboardList,
  Plus,
  PanelRight,
  HelpCircle,
} from "lucide-react";
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
import { TaskFilterMenu, type TaskFilterState } from "./components/TaskFilterMenu";
import { TaskTimelineView } from "./components/TaskTimelineView";
import { NewTaskDialog } from "./components/NewTaskDialog";

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

  // URL-driven viewMode, quickParam, and scopeParam (updated via SystemSecondarySidebar)
  const viewMode = (searchParams.get("view") ?? "list") as "list" | "kanban" | "timeline";
  const quickParam = (searchParams.get("quick") ?? "all") as QuickView;
  const scopeParam = searchParams.get("scope") as TaskScope | null;

  // NewTaskDialog state
  const [dialogOpen, setDialogOpen] = useState(false);

  // Right stats panel toggle
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  // Toolbar search query
  const [searchQuery, setSearchQuery] = useState("");

  // Filters state
  const [filters, setFilters] = useState<TaskFilterState>({
    status: [],
    priority: [],
    scope: [],
    assigneeId: null,
  });

  // Fetch data — scope filter driven by URL ?scope= param
  const { tasks, loading, error, refresh } = useTasksQuery(
    undefined,
    scopeParam ?? undefined
  );

  // Task summary for inline stats bar
  const { summary } = useTaskSummary();

  // Derive unique assignees present in the tasks list
  const assigneesList = useMemo(() => {
    const ids = new Set<string>();
    tasks.forEach((t) => {
      if (t.assigneeId) ids.add(t.assigneeId);
    });
    return Array.from(ids);
  }, [tasks]);

  // Apply quick-view filter + rich options filters + sorting locally
  const userId = session?.user?.id ?? session?.user?.email ?? "";
  const filteredTasks = useMemo(() => {
    let result = applyViewFilter(tasks, quickParam, userId);

    // Apply search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q));
    }

    // Apply custom filters
    if (filters.status.length > 0) {
      result = result.filter((t) => filters.status.includes(t.status));
    }
    if (filters.priority.length > 0) {
      result = result.filter((t) => filters.priority.includes(t.priority));
    }
    if (filters.scope.length > 0) {
      result = result.filter((t) => filters.scope.includes(t.scope));
    }
    if (filters.assigneeId) {
      result = result.filter((t) => t.assigneeId === filters.assigneeId);
    }

    // Default sort: newest created first
    result = [...result].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return result;
  }, [tasks, quickParam, filters, searchQuery, userId]);

  // Kanban optimistic update local state
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  React.useEffect(() => {
    setLocalTasks(filteredTasks);
  }, [filteredTasks]);

  // B2B inbox count badge for Zustand store (sidebar badge sync)
  const { tasks: b2bTasks } = useTasksQuery(undefined, "TENANT_TO_PLATFORM");
  const b2bCount = b2bTasks.filter(
    (t) => t.status !== "RESOLVED" && t.status !== "CLOSED"
  ).length;

  const setUnreadCount = useTaskStore((state) => state.setUnreadCount);
  React.useEffect(() => {
    setUnreadCount(b2bCount);
  }, [b2bCount, setUnreadCount]);

  if (error) toast.error("Gagal memuat task: " + error);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleRefresh = useCallback(() => {
    refresh();
    toast.info("Memuat ulang daftar task...");
  }, [refresh]);

  const handleUpdateTask = useCallback(
    async (itemId: string, fields: Partial<Task>) => {
      // Optimistic update
      setLocalTasks((prev) =>
        prev.map((t) => (t.id === itemId ? { ...t, ...fields } : t))
      );
      try {
        const baseUrl = getBackendBaseUrl();
        const res = await httpClient(`${baseUrl}/tasks/${itemId}`, {
          method: "PUT",
          token: session?.accessToken ?? "",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fields),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        toast.success("Task berhasil diperbarui");
        refresh();
      } catch (err: any) {
        toast.error("Gagal memperbarui: " + err.message);
        setLocalTasks(filteredTasks);
      }
    },
    [session?.accessToken, filteredTasks, refresh]
  );

  const handleDeleteTask = useCallback(
    async (itemId: string) => {
      // Optimistic delete
      setLocalTasks((prev) => prev.filter((t) => t.id !== itemId));
      try {
        const baseUrl = getBackendBaseUrl();
        const res = await httpClient(`${baseUrl}/tasks/${itemId}`, {
          method: "DELETE",
          token: session?.accessToken ?? "",
        });
        if (!res.ok) {
          if (res.status === 403) {
            throw new Error("Anda tidak memiliki izin (Super Admin) untuk menghapus task.");
          }
          throw new Error(`HTTP ${res.status}`);
        }
        toast.success("Task berhasil dihapus");
        refresh();
      } catch (err: any) {
        toast.error("Gagal menghapus: " + err.message);
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
      const currentList = prev[type] as string[];
      const newList = currentList.includes(value)
        ? currentList.filter((v) => v !== value)
        : [...currentList, value];
      return { ...prev, [type]: newList };
    });
  };

  const handleClearFilters = () => {
    setFilters({ status: [], priority: [], scope: [], assigneeId: null });
    setSearchQuery("");
  };

  // ── Derived breadcrumb label ──────────────────────────────────────────────────

  const pageTitle = VIEW_LABELS[quickParam] ?? "Tasks & Tickets";
  const scopeDescription =
    scopeParam === "PLATFORM_INTERNAL"
      ? "Proyek platform & DevOps alerts"
      : scopeParam === "TENANT_TO_PLATFORM"
      ? "Tiket masuk dari mitra ISP"
      : "Internal + B2B Inbox";

  // Filter columns based on showEmptyColumns switch
  const activeKanbanColumns = useMemo(() => {
    return KANBAN_COLUMNS;
  }, []);

  return (
    <PageLayout
      variant="workspace"
      sidePanel={
        rightPanelOpen ? (
          <TaskSecondarySidebar tasks={tasks} />
        ) : null
      }
      spaceY="space-y-0"
      maxWidth="w-full"
    >
      <div className="relative flex flex-col w-full h-full bg-background pt-6 pb-0 gap-6 overflow-hidden select-none">

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2 tracking-tight">
              <ClipboardList className="h-5 w-5 text-primary" />
              {pageTitle}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {scopeDescription}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle right stats panel */}
            <button
              onClick={() => setRightPanelOpen((v) => !v)}
              className={cn(
                "p-2 rounded-lg border border-border bg-card transition-colors",
                rightPanelOpen
                  ? "text-primary border-primary/30 bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title={rightPanelOpen ? "Sembunyikan panel overview" : "Tampilkan panel overview"}
            >
              <PanelRight className="h-4 w-4" />
            </button>

            {/* New Task dialog trigger */}
            <button
              onClick={() => setDialogOpen(true)}
              className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all"
              title="New Task"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Inline KPI Stats Bar (like query-performance) ─────────────── */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground/90 font-medium px-6 -mt-4">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-foreground font-mono">
              {summary?.totalOpen ?? "—"}
            </span>
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
            <span className="font-bold text-foreground font-mono">
              {summary?.resolvedToday ?? "—"}
            </span>
            <span>Resolved Today</span>
            <span title="Tasks resolved or closed today" className="cursor-help text-muted-foreground/60 hover:text-foreground">
              <HelpCircle className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>

        {/* ── KPI Cards (compute-style MetricCard) ─────────────────────── */}
        <div className="px-6 -mt-2">
          <TaskKpiStrip />
        </div>

        {/* ── Content area: Toolbar + View ──────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-0 border border-border/50 bg-card/10 rounded-xl mx-6 mb-6 overflow-hidden">
          {/* Sticky Toolbar */}
          <TaskToolbar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filters={filters}
            onToggleFilter={handleToggleFilter}
            onClearFilters={handleClearFilters}
            loading={loading}
            onRefresh={handleRefresh}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
          />

          {/* Active quick-filter chip */}
          {quickParam !== "all" && (
            <div className="px-6 py-2 flex items-center gap-2 border-b border-border/40">
              <span className="text-xs text-muted-foreground">Showing:</span>
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {VIEW_LABELS[quickParam]}
              </span>
              <button
                onClick={() => router.push("/tasks")}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors underline"
              >
                Reset filter
              </button>
            </div>
          )}

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar-thin">
            {/* ── List View ─────────────────────────────────────────── */}
            {viewMode === "list" && (
              <TaskTable
                tasks={filteredTasks}
                loading={loading}
                onRowClick={(id) => router.push(`/tasks/${id}`)}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                assigneesList={assigneesList}
              />
            )}

            {/* ── Kanban View ───────────────────────────────────────── */}
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
                    columns={activeKanbanColumns}
                    getColumnId={(t) => t.status}
                    onCardDrop={handleCardDrop}
                    renderCard={(task) => (
                      <TaskCard
                        task={task}
                        onClick={() => router.push(`/tasks/${task.id}`)}
                      />
                    )}
                  />
                )}
              </div>
            )}

            {/* ── Timeline View ── */}
            {viewMode === "timeline" && (
              <TaskTimelineView
                tasks={filteredTasks}
                onRowClick={(id) => router.push(`/tasks/${id}`)}
                displayProperties={{
                  priority: true,
                  status: true,
                  assignee: true,
                  dueDate: true,
                  obsidianRef: true,
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── New Task Modal Dialog Overlay ── */}
      <NewTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={refresh}
        assigneesList={assigneesList}
      />
    </PageLayout>
  );
}

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
  RefreshCw,
  List,
  Kanban,
  PanelRight,
} from "lucide-react";
import { toast } from "sonner";
import { useTasksQuery, type Task, type TaskScope } from "@/hooks/useTasksQuery";
import { cn } from "@/lib/utils";
import { useTaskStore } from "@/store/task-store";

// Sub-components & configurations
import { TaskKpiStrip } from "./components/TaskKpiStrip";
import { TaskTable } from "./components/TaskTable";
import { TaskCard } from "./components/TaskCard";
import { TaskLeftSidebar } from "./components/TaskLeftSidebar";
import { TaskSecondarySidebar } from "./components/TaskSecondarySidebar";
import { KANBAN_COLUMNS } from "./components/configs";

// ─── View filter helper ───────────────────────────────────────────────────────

type QuickView = "all" | "active" | "overdue" | "no-assignee" | "upcoming" | "resolved" | "my-issues" | "created-by-me";

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
      return tasks.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED");
    case "my-issues":
      return tasks.filter((t) => t.assigneeId === userId && !["RESOLVED", "CLOSED"].includes(t.status));
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
  const view = searchParams.get("view") ?? "list";

  // ── Scope state (driven by left sidebar or tab) ──────────────────────────────
  const [activeScope, setActiveScope] = useState<"ALL" | TaskScope>("ALL");
  const [activeView, setActiveView] = useState<QuickView>("all");
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  const scopeParam: TaskScope | undefined =
    activeScope === "ALL" ? undefined : (activeScope as TaskScope);

  const { tasks, loading, error, refresh } = useTasksQuery(undefined, scopeParam);

  // ── Apply quick-view filter locally (no extra network request) ───────────────
  const userId = session?.user?.id ?? session?.user?.email ?? "";
  const filteredTasks = useMemo(
    () => applyViewFilter(tasks, activeView, userId),
    [tasks, activeView, userId]
  );

  // ── Local state for Kanban optimistic updates ────────────────────────────────
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  React.useEffect(() => {
    setLocalTasks(filteredTasks);
  }, [filteredTasks]);

  // ── B2B inbox badge count (always fetched regardless of scope filter) ─────────
  const { tasks: b2bTasks } = useTasksQuery(undefined, "TENANT_TO_PLATFORM");
  const b2bCount = b2bTasks.filter(
    (t) => t.status !== "RESOLVED" && t.status !== "CLOSED"
  ).length;

  const setUnreadCount = useTaskStore((state) => state.setUnreadCount);
  React.useEffect(() => {
    setUnreadCount(b2bCount);
  }, [b2bCount, setUnreadCount]);

  // ── Error handling ────────────────────────────────────────────────────────────
  if (error) toast.error("Gagal memuat task: " + error);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleRefresh = useCallback(() => {
    refresh();
    toast.info("Memuat ulang daftar task...");
  }, [refresh]);

  const handleCardDrop = useCallback(async (itemId: string, targetStatus: string) => {
    // 1. Optimistic Update
    setLocalTasks((prev) =>
      prev.map((t) => (t.id === itemId ? { ...t, status: targetStatus } : t))
    );
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/${itemId}`, {
        method: "PUT",
        token: session?.accessToken ?? "",
        body: JSON.stringify({ status: targetStatus }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success("Status task berhasil diperbarui");
      refresh();
    } catch (err: any) {
      toast.error("Gagal memperbarui status: " + err.message);
      setLocalTasks(filteredTasks);
    }
  }, [session?.accessToken, filteredTasks, refresh]);

  const handleScopeChange = useCallback((scope: "ALL" | TaskScope) => {
    setActiveScope(scope);
  }, []);

  const handleViewChange = useCallback((v: string) => {
    setActiveView(v as QuickView);
  }, []);

  // ── View mode label ──────────────────────────────────────────────────────────

  const viewLabel: Record<QuickView, string> = {
    "all": "All Issues",
    "active": "Active Tasks",
    "overdue": "Overdue",
    "no-assignee": "No Assignee",
    "upcoming": "Upcoming 7 Days",
    "resolved": "Resolved & Closed",
    "my-issues": "My Issues",
    "created-by-me": "Created by Me",
  };

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
      {/* ── Tri-pane: Left Sidebar + Main Content ───────────────────────── */}
      <div className="flex h-full min-h-0 w-full">

        {/* Left Task Navigator */}
        <TaskLeftSidebar
          tasks={tasks}
          activeScope={activeScope}
          activeView={activeView}
          b2bCount={b2bCount}
          onScopeChange={handleScopeChange}
          onViewChange={handleViewChange}
        />

        {/* ── Main Content ──────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* ── Page Header ───────────────────────────────────────────── */}
          <div className="shrink-0 flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/60">
            <div>
              <h1 className="text-2xl font-light text-foreground tracking-tight flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                {viewLabel[activeView] ?? "Tasks & Tickets"}
              </h1>
              <p className="text-xs text-foreground/75 dark:text-muted-foreground mt-0.5">
                {activeScope === "ALL"
                  ? "Internal + B2B Inbox"
                  : activeScope === "PLATFORM_INTERNAL"
                  ? "Proyek platform & DevOps alerts"
                  : "Tiket masuk dari mitra ISP"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* View toggle List/Kanban */}
              <div className="flex items-center gap-0 border border-border rounded-lg p-0.5 bg-card">
                <button
                  onClick={() => router.push("/tasks")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                    view === "list"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <List className="h-3.5 w-3.5" />
                  List
                </button>
                <button
                  onClick={() => router.push("/tasks?view=kanban")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                    view === "kanban"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Kanban className="h-3.5 w-3.5" />
                  Kanban
                </button>
              </div>

              {/* Refresh */}
              <button
                onClick={handleRefresh}
                className="p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
                title="Refresh"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </button>

              {/* Toggle right panel */}
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

              {/* New Task CTA */}
              <button
                onClick={() => router.push("/tasks/new")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                <Plus className="h-4 w-4" />
                New Task
              </button>
            </div>
          </div>

          {/* ── KPI Strip ─────────────────────────────────────────────── */}
          <div className="shrink-0 px-6 pt-4">
            <TaskKpiStrip />
          </div>

          {/* ── Scrollable Content Area ───────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-6 pb-8 pt-4 min-h-0">

            {/* Active filter label */}
            {activeView !== "all" && (
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Menampilkan:</span>
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {viewLabel[activeView]}
                </span>
                <button
                  onClick={() => {
                    setActiveView("all");
                    setActiveScope("ALL");
                  }}
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors underline"
                >
                  Reset filter
                </button>
              </div>
            )}

            {/* ── List View ──────────────────────────────────────────── */}
            {view === "list" && (
              <TaskTable
                tasks={filteredTasks}
                loading={loading}
                onRowClick={(id) => router.push(`/tasks/${id}`)}
              />
            )}

            {/* ── Kanban View ────────────────────────────────────────── */}
            {view === "kanban" && (
              <div className="w-full overflow-hidden">
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
                        onClick={() => router.push(`/tasks/${task.id}`)}
                      />
                    )}
                  />
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </PageLayout>
  );
}

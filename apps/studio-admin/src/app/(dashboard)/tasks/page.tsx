"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageLayout, KanbanBoard } from "@k2net/ui";
import { useSession } from "next-auth/react";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import {
  ClipboardList,
  Plus,
  RefreshCw,
  List,
  Kanban,
  Cpu,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { useTasksQuery, type Task, type TaskScope } from "@/hooks/useTasksQuery";
import { cn } from "@/lib/utils";
import { useTaskStore } from "@/store/task-store";

// Sub-components & configurations
import { TaskKpiStrip } from "./components/TaskKpiStrip";
import { TaskTable } from "./components/TaskTable";
import { TaskCard } from "./components/TaskCard";
import { KANBAN_COLUMNS } from "./components/configs";

// ─── Scope Tab config ─────────────────────────────────────────────────────────

type ScopeTab = "ALL" | "PLATFORM_INTERNAL" | "TENANT_TO_PLATFORM";

const SCOPE_TABS: { id: ScopeTab; label: string; icon: React.ElementType; desc: string }[] = [
  {
    id: "ALL",
    label: "Semua",
    icon: ClipboardList,
    desc: "Internal + B2B Inbox",
  },
  {
    id: "PLATFORM_INTERNAL",
    label: "Internal K2NET",
    icon: Cpu,
    desc: "Proyek platform & DevOps alerts",
  },
  {
    id: "TENANT_TO_PLATFORM",
    label: "B2B Inbox",
    icon: Inbox,
    desc: "Tiket masuk dari mitra ISP",
  },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? "list";

  // Scope tab state — default ALL means backend shows PLATFORM_INTERNAL + TENANT_TO_PLATFORM
  const [activeScope, setActiveScope] = useState<ScopeTab>("ALL");

  const scopeParam: TaskScope | undefined =
    activeScope === "ALL" ? undefined : (activeScope as TaskScope);

  const { tasks, loading, error, refresh } = useTasksQuery(undefined, scopeParam);

  // Synchronize local tasks state for Kanban optimistic updates
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  React.useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // B2B inbox count for badge
  const { tasks: b2bTasks } = useTasksQuery(undefined, "TENANT_TO_PLATFORM");
  const b2bCount = b2bTasks.filter(
    (t) => t.status !== "RESOLVED" && t.status !== "CLOSED"
  ).length;

  // Synchronize count to global Zustand store for the sidebar badge
  const setUnreadCount = useTaskStore((state) => state.setUnreadCount);
  React.useEffect(() => {
    setUnreadCount(b2bCount);
  }, [b2bCount, setUnreadCount]);

  const handleRefresh = () => {
    refresh();
    toast.info("Memuat ulang daftar task...");
  };

  const handleCardDrop = async (itemId: string, targetStatus: string) => {
    // 1. Optimistic Update on local UI state
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

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      toast.success("Status task berhasil diperbarui");
      // Silent refresh to sync background updates (Obsidian references, statistics, etc.)
      refresh();
    } catch (err: any) {
      toast.error("Gagal memperbarui status: " + err.message);
      // Revert optimistic update to original server state
      setLocalTasks(tasks);
    }
  };

  if (error) {
    toast.error("Gagal memuat task: " + error);
  }

  return (
    <PageLayout variant="dashboard">
      <div className="max-w-[95rem] mx-auto px-4 sm:px-6 py-6">

        {/* ── Header ───────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-primary" />
              Tasks &amp; Tickets
            </h1>
            <p className="text-foreground/75 dark:text-muted-foreground text-sm mt-1">
              Platform engineering projects, DevOps alerts &amp; B2B support inbox
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
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

            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
              title="Refresh"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </button>

            <button
              onClick={() => router.push("/tasks/new")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Task
            </button>
          </div>
        </div>

        {/* ── KPI Strip ────────────────────────────────────────── */}
        <TaskKpiStrip />

        {/* ── Scope Tabs ────────────────────────────────────────── */}
        <div className="flex items-center gap-1 mb-4 border border-border rounded-xl p-1 bg-card w-fit">
          {SCOPE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeScope === tab.id;
            const showBadge = tab.id === "TENANT_TO_PLATFORM" && b2bCount > 0;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveScope(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {/* B2B inbox unread badge */}
                {showBadge && (
                  <span
                    className={cn(
                      "absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1",
                      isActive
                        ? "bg-white text-primary"
                        : "bg-destructive text-white"
                    )}
                  >
                    {b2bCount > 9 ? "9+" : b2bCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Scope description hint */}
        <p className="text-xs text-muted-foreground mb-4">
          {SCOPE_TABS.find((t) => t.id === activeScope)?.desc}
          {activeScope === "TENANT_TO_PLATFORM" && b2bCount > 0 && (
            <span className="ml-2 text-violet-500 font-medium">
              · {b2bCount} tiket belum diselesaikan
            </span>
          )}
        </p>

        {/* ── Task Table / Kanban ───────────────────────────────── */}
        {view === "list" && (
          <TaskTable
            tasks={tasks}
            loading={loading}
            onRowClick={(id) => router.push(`/tasks/${id}`)}
          />
        )}

        {view === "kanban" && (
          <div className="w-full overflow-hidden">
            {loading && localTasks.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-pulse">
                {KANBAN_COLUMNS.map((col) => (
                  <div key={col.id} className="bg-card/40 border border-border/50 rounded-xl p-4 min-h-[450px]" />
                ))}
              </div>
            ) : (
              <KanbanBoard<Task>
                items={localTasks}
                columns={KANBAN_COLUMNS}
                getColumnId={(t) => t.status}
                onCardDrop={handleCardDrop}
                renderCard={(task) => (
                  <TaskCard task={task} onClick={() => router.push(`/tasks/${task.id}`)} />
                )}
              />
            )}
          </div>
        )}

      </div>
    </PageLayout>
  );
}

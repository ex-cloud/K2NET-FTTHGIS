"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageLayout } from "@k2net/ui";
import {
  ClipboardList,
  Plus,
  RefreshCw,
  List,
  Kanban,
  AlertCircle,
  Clock,
  CheckCircle2,
  Circle,
  ArrowUpCircle,
  Timer,
  Building2,
  Cpu,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { useTasksQuery, type Task, type TaskScope } from "@/hooks/useTasksQuery";
import { useTaskSummary } from "@/hooks/useTaskSummary";
import { cn } from "@/lib/utils";

// ─── Config maps ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  BACKLOG: { label: "Backlog", icon: Circle, className: "text-muted-foreground bg-muted" },
  TODO: { label: "Todo", icon: Circle, className: "text-foreground bg-muted" },
  IN_PROGRESS: { label: "In Progress", icon: Timer, className: "text-primary bg-primary/10" },
  WAITING_ON_CLIENT: { label: "Waiting", icon: Clock, className: "text-amber-500 bg-amber-500/10" },
  RESOLVED: { label: "Resolved", icon: CheckCircle2, className: "text-green-500 bg-green-500/10" },
  CLOSED: { label: "Closed", icon: CheckCircle2, className: "text-muted-foreground bg-muted" },
};

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  URGENT: { label: "URGENT", className: "text-destructive bg-destructive/10" },
  HIGH: { label: "HIGH", className: "text-orange-500 bg-orange-500/10" },
  NORMAL: { label: "NORMAL", className: "text-foreground bg-muted" },
  LOW: { label: "LOW", className: "text-muted-foreground bg-muted" },
};

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

// ─── Scope badge ──────────────────────────────────────────────────────────────

function ScopeBadge({ scope }: { scope?: string }) {
  if (scope === "TENANT_TO_PLATFORM") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-semibold bg-violet-500/10 text-violet-500 border border-violet-500/20">
        <Building2 className="h-2.5 w-2.5" />
        B2B
      </span>
    );
  }
  if (scope === "PLATFORM_INTERNAL") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
        <Cpu className="h-2.5 w-2.5" />
        Internal
      </span>
    );
  }
  return null;
}

// ─── KPI Summary Strip ────────────────────────────────────────────────────────

function TaskKpiStrip() {
  const { summary, loading } = useTaskSummary();

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {[
        {
          label: "Active Tasks",
          value: loading ? "—" : summary?.totalOpen ?? 0,
          icon: ClipboardList,
          accent: "text-primary",
        },
        {
          label: "Urgent",
          value: loading ? "—" : summary?.urgentCount ?? 0,
          icon: AlertCircle,
          accent: (summary?.urgentCount ?? 0) > 0 ? "text-destructive" : "text-muted-foreground",
          pulse: (summary?.urgentCount ?? 0) > 0,
        },
        {
          label: "Resolved Today",
          value: loading ? "—" : summary?.resolvedToday ?? 0,
          icon: CheckCircle2,
          accent: "text-green-500",
        },
      ].map((kpi) => (
        <div
          key={kpi.label}
          className="bg-card border border-border rounded-xl p-4 flex items-center gap-3"
        >
          <div className={cn("p-2 rounded-lg bg-muted", kpi.accent)}>
            <kpi.icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-foreground/75 dark:text-muted-foreground text-xs font-medium">
              {kpi.label}
            </p>
            <div className="flex items-center gap-1.5">
              <p className={cn("text-xl font-semibold text-foreground", kpi.accent)}>
                {kpi.value}
              </p>
              {kpi.pulse && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Task Table ───────────────────────────────────────────────────────────────

function TaskTable({
  tasks,
  loading,
  onRowClick,
}: {
  tasks: Task[];
  loading: boolean;
  onRowClick: (id: string) => void;
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["Judul", "Scope", "Tipe", "Prioritas", "Status", "Assignee", "Tenggat"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-foreground/75 dark:text-muted-foreground uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : tasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <ClipboardList className="h-10 w-10 opacity-30" />
                    <p className="text-sm">Belum ada task di tampilan ini.</p>
                  </div>
                </td>
              </tr>
            ) : (
              tasks.map((task) => {
                const status = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.TODO;
                const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.NORMAL;
                const StatusIcon = status.icon;

                return (
                  <tr
                    key={task.id}
                    className="hover:bg-muted/40 cursor-pointer transition-colors group"
                    onClick={() => onRowClick(task.id)}
                  >
                    {/* Title + obsidianRef */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground text-sm line-clamp-1">
                          {task.title}
                        </span>
                        {task.obsidianRef && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {task.obsidianRef}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Scope badge */}
                    <td className="px-4 py-3">
                      <ScopeBadge scope={task.scope} />
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                        {task.type}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3">
                      <span className={cn("text-xs px-2 py-0.5 rounded-md font-semibold", priority.className)}>
                        {priority.label}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md", status.className)}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                    </td>

                    {/* Assignee */}
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {task.assigneeId ?? "—"}
                    </td>

                    {/* Due Date */}
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString("id-ID")
                        : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? "list";

  // Scope tab state — default ALL means backend shows PLATFORM_INTERNAL + TENANT_TO_PLATFORM
  const [activeScope, setActiveScope] = useState<ScopeTab>("ALL");

  const scopeParam: TaskScope | undefined =
    activeScope === "ALL" ? undefined : (activeScope as TaskScope);

  const { tasks, loading, error, refresh } = useTasksQuery(undefined, scopeParam);

  // B2B inbox count for badge
  const { tasks: b2bTasks } = useTasksQuery(undefined, "TENANT_TO_PLATFORM");
  const b2bCount = b2bTasks.filter(
    (t) => t.status !== "RESOLVED" && t.status !== "CLOSED"
  ).length;

  const handleRefresh = () => {
    refresh();
    toast.info("Memuat ulang daftar task...");
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
          <div className="flex items-center justify-center h-64 bg-card border border-border rounded-xl text-muted-foreground">
            <div className="text-center">
              <Kanban className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Kanban view akan tersedia di Fase 6</p>
            </div>
          </div>
        )}

      </div>
    </PageLayout>
  );
}

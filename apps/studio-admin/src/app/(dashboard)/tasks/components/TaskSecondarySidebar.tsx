"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronDown,
  LayoutGrid,
  BarChart3,
  Flag,
  Users,
  Globe,
  BookOpen,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { type Task } from "@/hooks/useTasksQuery";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "./configs";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TaskSecondarySidebarProps {
  tasks: Task[];
  obsidianStatus?: "connected" | "disconnected" | "syncing";
  lastSyncTime?: string;
}

// ─── Collapsible section wrapper ─────────────────────────────────────────────

function SidebarSection({
  title,
  icon: Icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border/60 last:border-b-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/40 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
            {title}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
            !open && "-rotate-90"
          )}
        />
      </button>
      {open && <div className="px-4 pb-3 pt-1">{children}</div>}
    </div>
  );
}

// ─── Mini Progress Bar ────────────────────────────────────────────────────────

function MiniProgressBar({
  label,
  count,
  total,
  colorClass,
}: {
  label: string;
  count: number;
  total: number;
  colorClass: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="flex items-center gap-2 py-1">
      <span className="w-20 shrink-0 text-xs text-foreground/75 dark:text-muted-foreground truncate">
        {label}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", colorClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs text-muted-foreground shrink-0">{count}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TaskSecondarySidebar({
  tasks,
  obsidianStatus = "connected",
  lastSyncTime,
}: TaskSecondarySidebarProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  // ── Derived metrics ─────────────────────────────────────────────────────────

  const derived = useMemo(() => {
    const total = tasks.length;
    const projects = tasks.filter((t) => t.type === "PROJECT").length;
    const tickets = tasks.filter((t) => t.type === "TICKET").length;
    const overdue = tasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) < new Date() &&
        t.status !== "RESOLVED" &&
        t.status !== "CLOSED"
    ).length;

    // Status breakdown
    const statusMap: Record<string, number> = {};
    for (const t of tasks) {
      statusMap[t.status] = (statusMap[t.status] ?? 0) + 1;
    }

    // Priority breakdown
    const priorityMap: Record<string, number> = {};
    for (const t of tasks) {
      priorityMap[t.priority] = (priorityMap[t.priority] ?? 0) + 1;
    }

    // Assignee workload
    const assigneeMap: Record<string, number> = {};
    for (const t of tasks) {
      if (t.assigneeId) {
        assigneeMap[t.assigneeId] = (assigneeMap[t.assigneeId] ?? 0) + 1;
      } else {
        assigneeMap["__unassigned__"] = (assigneeMap["__unassigned__"] ?? 0) + 1;
      }
    }

    // Scope ratio
    const internalCount = tasks.filter((t) => t.scope === "PLATFORM_INTERNAL").length;
    const b2bCount = tasks.filter((t) => t.scope === "TENANT_TO_PLATFORM").length;

    return { total, projects, tickets, overdue, statusMap, priorityMap, assigneeMap, internalCount, b2bCount };
  }, [tasks]);

  // ── Trigger Obsidian Sync ───────────────────────────────────────────────────

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      // Fire-and-forget: backend publishes pending tasks to obsidian:sync Redis queue
      await fetch("/api/tasks/trigger-sync", { method: "POST" });
      toast.success("Obsidian sync dipicu — berkas akan diperbarui dalam beberapa momen.");
    } catch {
      toast.error("Gagal memicu Obsidian sync. Cek koneksi gateway-task.");
    } finally {
      setTimeout(() => setIsSyncing(false), 2000);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const getInitials = (id: string) => {
    if (id === "__unassigned__") return "?";
    // Use last 2 chars of UUID segment as proxy initials
    const parts = id.split("-");
    return (parts[0]?.slice(0, 2) ?? "??").toUpperCase();
  };

  const priorityOrder = ["URGENT", "HIGH", "NORMAL", "LOW"];
  const statusOrder = ["BACKLOG", "TODO", "IN_PROGRESS", "WAITING_ON_CLIENT", "RESOLVED", "CLOSED"];

  const statusBarColors: Record<string, string> = {
    BACKLOG: "bg-muted-foreground/50",
    TODO: "bg-foreground/60",
    IN_PROGRESS: "bg-primary",
    WAITING_ON_CLIENT: "bg-amber-500",
    // emerald-500 is explicitly allowed for semantic SUCCESS status (styles.md §3.B)
    RESOLVED: "bg-[hsl(151_55%_42%)]" ,
    CLOSED: "bg-muted-foreground/30",
  };

  const priorityDotColors: Record<string, string> = {
    URGENT: "bg-destructive",
    HIGH: "bg-orange-500",
    NORMAL: "bg-primary",
    LOW: "bg-muted-foreground",
  };

  return (
    <aside className="w-72 shrink-0 h-full flex flex-col bg-sidebar border-l border-border/80 overflow-y-auto">

      {/* ── Panel Header ──────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-border/60">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Task Overview
        </p>
      </div>

      {/* ── ① Overview ────────────────────────────────────────────────────── */}
      <SidebarSection title="Overview" icon={LayoutGrid}>
        <div className="space-y-1.5">
          {[
            { label: "Total Issues", value: derived.total },
            { label: "Projects", value: derived.projects },
            { label: "Tickets", value: derived.tickets },
            {
              label: "Overdue",
              value: derived.overdue,
              accent: derived.overdue > 0 ? "text-destructive font-semibold" : "",
            },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-xs text-foreground/75 dark:text-muted-foreground">
                {row.label}
              </span>
              <span className={cn("text-xs font-medium text-foreground", row.accent)}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </SidebarSection>

      {/* ── ② Status Breakdown ────────────────────────────────────────────── */}
      <SidebarSection title="Status Breakdown" icon={BarChart3}>
        <div className="space-y-0.5">
          {statusOrder.map((key) => {
            const cfg = STATUS_CONFIG[key];
            const count = derived.statusMap[key] ?? 0;
            return (
              <MiniProgressBar
                key={key}
                label={cfg?.label ?? key}
                count={count}
                total={derived.total}
                colorClass={statusBarColors[key] ?? "bg-muted-foreground"}
              />
            );
          })}
        </div>
      </SidebarSection>

      {/* ── ③ Priority Distribution ───────────────────────────────────────── */}
      <SidebarSection title="Priority" icon={Flag}>
        <div className="space-y-1.5">
          {priorityOrder.map((key) => {
            const cfg = PRIORITY_CONFIG[key];
            const count = derived.priorityMap[key] ?? 0;
            const isUrgent = key === "URGENT" && count > 0;

            return (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full shrink-0",
                      priorityDotColors[key],
                      isUrgent && "animate-pulse"
                    )}
                  />
                  <span className="text-xs text-foreground/75 dark:text-muted-foreground">
                    {cfg?.label ?? key}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    isUrgent ? "text-destructive" : "text-foreground"
                  )}
                >
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </SidebarSection>

      {/* ── ④ Assignee Workload ────────────────────────────────────────────── */}
      <SidebarSection title="Assignees" icon={Users} defaultOpen={false}>
        {Object.keys(derived.assigneeMap).length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Belum ada assignee.</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(derived.assigneeMap)
              .sort(([, a], [, b]) => b - a)
              .map(([assigneeId, count]) => {
                const isUnassigned = assigneeId === "__unassigned__";
                const isOverloaded = count >= 5;
                const initials = getInitials(assigneeId);

                return (
                  <div key={assigneeId} className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                        isUnassigned
                          ? "bg-muted text-muted-foreground border border-border"
                          : isOverloaded
                          ? "bg-destructive/20 text-destructive border border-destructive/30"
                          : "bg-primary/15 text-primary border border-primary/20"
                      )}
                    >
                      {initials}
                    </div>
                    <span className="flex-1 text-xs text-foreground/80 dark:text-muted-foreground truncate">
                      {isUnassigned ? "Unassigned" : `…${assigneeId.slice(-8)}`}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-semibold shrink-0",
                        isOverloaded ? "text-destructive" : "text-foreground"
                      )}
                    >
                      {count}
                    </span>
                    {isOverloaded && (
                      <span className="text-[9px] text-destructive font-bold uppercase shrink-0">
                        Overload
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </SidebarSection>

      {/* ── ⑤ Scope Isolation Ratio ────────────────────────────────────────── */}
      <SidebarSection title="Scope Ratio" icon={Globe} defaultOpen={false}>
        <div className="space-y-2">
          <MiniProgressBar
            label="Internal"
            count={derived.internalCount}
            total={derived.total}
            colorClass="bg-primary"
          />
          <MiniProgressBar
            label="B2B Inbox"
            count={derived.b2bCount}
            total={derived.total}
            colorClass="bg-violet-500"
          />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            Internal{" "}
            <span className="text-foreground font-medium">
              {derived.total > 0
                ? Math.round((derived.internalCount / derived.total) * 100)
                : 0}
              %
            </span>
          </span>
          <span className="text-[10px] text-muted-foreground">
            B2B{" "}
            <span className="text-violet-500 font-medium">
              {derived.total > 0
                ? Math.round((derived.b2bCount / derived.total) * 100)
                : 0}
              %
            </span>
          </span>
        </div>
      </SidebarSection>

      {/* ── ⑥ Obsidian Vault Sync ─────────────────────────────────────────── */}
      <SidebarSection title="Obsidian Sync" icon={BookOpen} defaultOpen={false}>
        <div className="space-y-3">
          {/* Status indicator */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-2 w-2 rounded-full shrink-0",
                obsidianStatus === "connected"
                  // emerald-500 explicitly allowed for success/online semantics (styles.md §3.B)
                  ? "bg-[hsl(151_55%_42%)] shadow-[0_0_6px_hsl(151_55%_42%_/_0.6)] animate-pulse"
                  : obsidianStatus === "syncing"
                  ? "bg-primary animate-pulse"
                  : "bg-destructive"
              )}
            />
            <span className="text-xs text-foreground/75 dark:text-muted-foreground capitalize">
              {obsidianStatus === "connected"
                ? "Connected"
                : obsidianStatus === "syncing"
                ? "Syncing…"
                : "Disconnected"}
            </span>
          </div>

          {/* Last sync time */}
          {lastSyncTime && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Last sync</span>
              <span className="font-mono text-[10px] text-muted-foreground">{lastSyncTime}</span>
            </div>
          )}

          {/* Trigger sync button */}
          <button
            onClick={handleTriggerSync}
            disabled={isSyncing || obsidianStatus === "disconnected"}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg",
              "border border-border text-xs font-medium transition-all",
              isSyncing || obsidianStatus === "disconnected"
                ? "opacity-50 cursor-not-allowed text-muted-foreground bg-muted/30"
                : "text-foreground bg-card hover:bg-muted hover:border-primary/40 active:scale-[0.98]"
            )}
          >
            {isSyncing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {isSyncing ? "Syncing…" : "Trigger Sync Now"}
          </button>
        </div>
      </SidebarSection>

    </aside>
  );
}

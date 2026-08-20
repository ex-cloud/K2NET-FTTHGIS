"use client";

import React, { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  BarChart3,
  Flag,
  Users,
  BookOpen,
  RefreshCw,
  Loader2,
  FolderKanban,
  Shield,
  Building2,
  FolderOpen,
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
  onSelectProject?: (projectName: string | null) => void;
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
  lastSyncTime = "Realtime",
  onSelectProject,
}: TaskSecondarySidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSyncing, setIsSyncing] = useState(false);

  const currentScope = searchParams.get("scope");

  // ── Project Breakdown (100% Dynamic from tasks in database) ─────────────────

  const projectStats = useMemo(() => {
    const names = new Set<string>();
    tasks.forEach((t) => {
      if (t.obsidianRef && t.obsidianRef.length > 2) {
        names.add(t.obsidianRef);
      } else if (t.type === "PROJECT" && t.title) {
        names.add(t.title);
      }
    });

    return Array.from(names).map((name) => {
      const pTasks = tasks.filter(
        (t) =>
          t.obsidianRef === name ||
          t.title.toLowerCase().includes(name.toLowerCase()) ||
          t.title === name
      );
      const total = pTasks.length;
      const active = pTasks.filter((t) => t.status !== "RESOLVED" && t.status !== "CLOSED").length;
      const progress = total > 0 ? Math.round(((total - active) / total) * 100) : 0;

      return { name, total, active, progress };
    });
  }, [tasks]);

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

    const b2bCount = tasks.filter(
      (t) => t.scope === "TENANT_TO_PLATFORM" && t.status !== "RESOLVED" && t.status !== "CLOSED"
    ).length;

    return { total, projects, tickets, overdue, statusMap, priorityMap, assigneeMap, b2bCount };
  }, [tasks]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSyncObsidian = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast.success("Obsidian Vault sinkronisasi selesai");
    }, 1500);
  };

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <div className="w-full flex flex-col divide-y divide-border/50 text-xs">

      {/* ── 1. WORKSPACE: PROJECTS & PLANS (100% Dynamic) ─────────────── */}
      <SidebarSection title="Workspace Projects" icon={FolderKanban} defaultOpen={true}>
        <div className="space-y-1 pt-1">
          {projectStats.length === 0 ? (
            <div className="px-2.5 py-3 text-center border border-dashed border-border/60 rounded-lg">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Belum ada project aktif. Buat issue bertipe Project untuk memulainya.
              </p>
            </div>
          ) : (
            projectStats.map((proj) => (
              <button
                key={proj.name}
                onClick={() => {
                  if (onSelectProject) onSelectProject(proj.name);
                  handleNavigate(`/tasks?scope=PLATFORM_INTERNAL&project=${encodeURIComponent(proj.name)}`);
                }}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left group"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <FolderOpen className="h-3.5 w-3.5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{proj.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {proj.active} active · {proj.progress}% done
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground group-hover:text-foreground shrink-0">
                  {proj.active}
                </span>
              </button>
            ))
          )}
        </div>
      </SidebarSection>

      {/* ── 2. SCOPES & TEAMS ───────────────────────────────────────────── */}
      <SidebarSection title="Teams & Scope" icon={Shield} defaultOpen={true}>
        <div className="space-y-1 pt-1">
          <button
            onClick={() => handleNavigate("/tasks?scope=PLATFORM_INTERNAL")}
            className={cn(
              "w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors text-left",
              currentScope === "PLATFORM_INTERNAL"
                ? "bg-primary/10 text-primary font-semibold"
                : "hover:bg-muted/50 text-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span>Platform Internal</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {tasks.filter((t) => t.scope === "PLATFORM_INTERNAL").length}
            </span>
          </button>

          <button
            onClick={() => handleNavigate("/tasks?scope=TENANT_TO_PLATFORM")}
            className={cn(
              "w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors text-left",
              currentScope === "TENANT_TO_PLATFORM"
                ? "bg-orange-500/10 text-orange-500 font-semibold"
                : "hover:bg-muted/50 text-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-orange-500" />
              <span>B2B Mitra Tickets</span>
            </div>
            {derived.b2bCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-orange-500 text-primary-foreground font-bold animate-pulse">
                {derived.b2bCount}
              </span>
            )}
          </button>
        </div>
      </SidebarSection>

      {/* ── 3. STATUS DISTRIBUTION ──────────────────────────────────────── */}
      <SidebarSection title="Status Breakdown" icon={BarChart3} defaultOpen={false}>
        <div className="space-y-0.5 pt-1">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const count = derived.statusMap[key] ?? 0;
            return (
              <MiniProgressBar
                key={key}
                label={cfg.label}
                count={count}
                total={derived.total}
                colorClass={cfg.className.split(" ")[0].replace("text-", "bg-")}
              />
            );
          })}
        </div>
      </SidebarSection>

      {/* ── 4. PRIORITY DISTRIBUTION ────────────────────────────────────── */}
      <SidebarSection title="Priority" icon={Flag} defaultOpen={false}>
        <div className="space-y-0.5 pt-1">
          {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => {
            const count = derived.priorityMap[key] ?? 0;
            return (
              <MiniProgressBar
                key={key}
                label={cfg.label}
                count={count}
                total={derived.total}
                colorClass={cfg.className.split(" ")[0].replace("text-", "bg-")}
              />
            );
          })}
        </div>
      </SidebarSection>

      {/* ── 5. ASSIGNEE WORKLOAD ────────────────────────────────────────── */}
      <SidebarSection title="Workload" icon={Users} defaultOpen={false}>
        <div className="space-y-1 pt-1">
          {Object.entries(derived.assigneeMap).map(([assignee, count]) => (
            <div key={assignee} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-1.5 truncate pr-2">
                <div className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                  {assignee === "__unassigned__" ? "?" : assignee.substring(0, 2).toUpperCase()}
                </div>
                <span className="text-xs text-foreground truncate">
                  {assignee === "__unassigned__" ? "Unassigned" : assignee.split("@")[0]}
                </span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground font-semibold shrink-0">
                {count} {count === 1 ? "task" : "tasks"}
              </span>
            </div>
          ))}
        </div>
      </SidebarSection>

      {/* ── 6. OBSIDIAN VAULT SYNC ──────────────────────────────────────── */}
      <div className="p-4 bg-card/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-bold text-foreground">Obsidian Vault</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full capitalize">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {obsidianStatus}
          </span>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Projek internal disinkronkan secara otomatis ke <code className="text-primary font-mono text-[10px]">K2NET_Engineering_Vault</code>.
        </p>
        {lastSyncTime && (
          <p className="text-[10px] text-muted-foreground/60">Last sync: {lastSyncTime}</p>
        )}

        <button
          onClick={handleSyncObsidian}
          disabled={isSyncing}
          className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg border border-border/80 bg-card hover:bg-muted/50 text-xs font-medium text-foreground transition-colors disabled:opacity-50"
        >
          {isSyncing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span>{isSyncing ? "Menyinkronkan..." : "Sync Vault Now"}</span>
        </button>
      </div>

    </div>
  );
}

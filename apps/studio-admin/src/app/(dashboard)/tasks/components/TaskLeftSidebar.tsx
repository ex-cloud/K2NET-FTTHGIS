"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  AlertTriangle,
  Inbox,
  Eye,
  CheckCircle2,
  UserX,
  CalendarClock,
  FolderKanban,
  Plus,
  ChevronDown,
  Cpu,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type Task, type TaskScope } from "@/hooks/useTasksQuery";
import { useSession } from "next-auth/react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TaskLeftSidebarProps {
  tasks: Task[];
  /** Currently active scope filter — controls highlight */
  activeScope: "ALL" | TaskScope;
  /** Currently active quick-view filter */
  activeView: string;
  b2bCount: number;
  onScopeChange: (scope: "ALL" | TaskScope) => void;
  onViewChange: (view: string) => void;
}

// ─── Collapsible group ────────────────────────────────────────────────────────

function NavGroup({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-1 group"
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 group-hover:text-muted-foreground transition-colors">
          {title}
        </span>
        <ChevronDown
          className={cn(
            "h-3 w-3 text-muted-foreground/50 transition-transform duration-150",
            !open && "-rotate-90"
          )}
        />
      </button>
      {open && <div className="mt-0.5">{children}</div>}
    </div>
  );
}

// ─── Single nav item ──────────────────────────────────────────────────────────

function NavItem({
  icon: Icon,
  label,
  badge,
  badgeVariant = "default",
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  badge?: number | string;
  badgeVariant?: "default" | "danger" | "purple";
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors text-left",
        active
          ? "bg-primary/10 text-primary font-medium"
          : "text-sidebar-foreground/75 hover:bg-muted/50 hover:text-foreground font-medium"
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && badge !== 0 && (
        <span
          className={cn(
            "text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
            badgeVariant === "danger"
              ? "bg-destructive/15 text-destructive"
              : badgeVariant === "purple"
              ? "bg-violet-500/15 text-violet-500"
              : "bg-muted text-muted-foreground"
          )}
        >
          {typeof badge === "number" && badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TaskLeftSidebar({
  tasks,
  activeScope,
  activeView,
  b2bCount,
  onScopeChange,
  onViewChange,
}: TaskLeftSidebarProps) {
  const router = useRouter();
  const { data: session } = useSession();

  // ── Derived counts ──────────────────────────────────────────────────────────

  const derived = useMemo(() => {
    const userId = session?.user?.id ?? session?.user?.email ?? "";

    const myTasks = userId
      ? tasks.filter(
          (t) =>
            t.assigneeId === userId &&
            t.status !== "RESOLVED" &&
            t.status !== "CLOSED"
        ).length
      : 0;

    const createdByMe = userId
      ? tasks.filter((t) => t.reporterId === userId).length
      : 0;

    const active = tasks.filter(
      (t) => !["RESOLVED", "CLOSED"].includes(t.status)
    ).length;

    const overdue = tasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) < new Date() &&
        !["RESOLVED", "CLOSED"].includes(t.status)
    ).length;

    const noAssignee = tasks.filter((t) => !t.assigneeId).length;

    const upcoming7d = tasks.filter((t) => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      const now = new Date();
      const in7 = new Date();
      in7.setDate(now.getDate() + 7);
      return due >= now && due <= in7 && !["RESOLVED", "CLOSED"].includes(t.status);
    }).length;

    // Projects list
    const projects = tasks
      .filter((t) => t.type === "PROJECT")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);

    const internalCount = tasks.filter(
      (t) => t.scope === "PLATFORM_INTERNAL" && !["RESOLVED", "CLOSED"].includes(t.status)
    ).length;

    return { myTasks, createdByMe, active, overdue, noAssignee, upcoming7d, projects, internalCount };
  }, [tasks, session]);

  return (
    <aside className="w-56 shrink-0 h-full flex flex-col bg-sidebar border-r border-border/80 overflow-y-auto py-3 px-1.5">

      {/* ── GROUP 1: Personal ─────────────────────────────────────────── */}
      <NavGroup title="Personal">
        <NavItem
          icon={ClipboardList}
          label="My Issues"
          badge={derived.myTasks}
          active={activeView === "my-issues"}
          onClick={() => onViewChange("my-issues")}
        />
        <NavItem
          icon={Cpu}
          label="Created by Me"
          badge={derived.createdByMe}
          active={activeView === "created-by-me"}
          onClick={() => onViewChange("created-by-me")}
        />
        <NavItem
          icon={Inbox}
          label="B2B Inbox"
          badge={b2bCount}
          badgeVariant="purple"
          active={activeScope === "TENANT_TO_PLATFORM"}
          onClick={() => {
            onScopeChange("TENANT_TO_PLATFORM");
            onViewChange("all");
          }}
        />
      </NavGroup>

      <div className="my-2 border-t border-border/40" />

      {/* ── GROUP 2: Views ────────────────────────────────────────────── */}
      <NavGroup title="Views">
        <NavItem
          icon={Eye}
          label="All Issues"
          badge={tasks.length}
          active={activeView === "all" && activeScope === "ALL"}
          onClick={() => {
            onScopeChange("ALL");
            onViewChange("all");
          }}
        />
        <NavItem
          icon={ClipboardList}
          label="Active"
          badge={derived.active}
          active={activeView === "active"}
          onClick={() => {
            onScopeChange("ALL");
            onViewChange("active");
          }}
        />
        <NavItem
          icon={AlertTriangle}
          label="Overdue"
          badge={derived.overdue}
          badgeVariant={derived.overdue > 0 ? "danger" : "default"}
          active={activeView === "overdue"}
          onClick={() => {
            onScopeChange("ALL");
            onViewChange("overdue");
          }}
        />
        <NavItem
          icon={UserX}
          label="No Assignee"
          badge={derived.noAssignee}
          active={activeView === "no-assignee"}
          onClick={() => {
            onScopeChange("ALL");
            onViewChange("no-assignee");
          }}
        />
        <NavItem
          icon={CalendarClock}
          label="Upcoming 7d"
          badge={derived.upcoming7d}
          active={activeView === "upcoming"}
          onClick={() => {
            onScopeChange("ALL");
            onViewChange("upcoming");
          }}
        />
        <NavItem
          icon={CheckCircle2}
          label="Resolved"
          active={activeView === "resolved"}
          onClick={() => {
            onScopeChange("ALL");
            onViewChange("resolved");
          }}
        />
      </NavGroup>

      <div className="my-2 border-t border-border/40" />

      {/* ── GROUP 3: Projects ─────────────────────────────────────────── */}
      <NavGroup title="Projects">
        {derived.projects.length === 0 ? (
          <p className="px-3 py-1 text-xs text-muted-foreground italic">Belum ada project.</p>
        ) : (
          derived.projects.map((p) => {
            const isResolved = p.status === "RESOLVED" || p.status === "CLOSED";
            return (
              <button
                key={p.id}
                onClick={() => router.push(`/tasks/${p.id}`)}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-colors text-left group hover:bg-muted/50"
              >
                <FolderKanban className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground/75 group-hover:text-foreground truncate">
                    {p.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 font-mono truncate">
                    {p.obsidianRef ?? p.id.slice(0, 8)}
                  </p>
                </div>
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full shrink-0",
                    isResolved
                      ? "bg-[hsl(151_55%_42%)]"
                      : p.status === "IN_PROGRESS"
                      ? "bg-primary animate-pulse"
                      : "bg-muted-foreground/50"
                  )}
                />
              </button>
            );
          })
        )}
        <button
          onClick={() => router.push("/tasks/new?type=PROJECT")}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          New Project
        </button>
      </NavGroup>

      <div className="my-2 border-t border-border/40" />

      {/* ── GROUP 4: Scope ────────────────────────────────────────────── */}
      <NavGroup title="Scope" defaultOpen={true}>
        <NavItem
          icon={Cpu}
          label="Internal K2NET"
          badge={derived.internalCount}
          active={activeScope === "PLATFORM_INTERNAL"}
          onClick={() => {
            onScopeChange("PLATFORM_INTERNAL");
            onViewChange("all");
          }}
        />
        <NavItem
          icon={Building2}
          label="B2B Inbox"
          badge={b2bCount}
          badgeVariant="purple"
          active={activeScope === "TENANT_TO_PLATFORM"}
          onClick={() => {
            onScopeChange("TENANT_TO_PLATFORM");
            onViewChange("all");
          }}
        />
      </NavGroup>

    </aside>
  );
}

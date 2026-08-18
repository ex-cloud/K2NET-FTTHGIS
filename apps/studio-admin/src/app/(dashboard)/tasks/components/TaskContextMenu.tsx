"use client";

import React from "react";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@k2net/ui";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  CalendarDays,
  Copy,
  ExternalLink,
  Trash2,
  Flame,
  ArrowUp,
  ArrowDown,
  CircleDot,
  Minus,
  Shield,
  Building2,
  Tag,
  GitBranch,
} from "lucide-react";
import { toast } from "sonner";
import { type Task } from "@/hooks/useTasksQuery";

interface TaskContextMenuProps {
  task: Task;
  onUpdateStatus?: (status: string) => void;
  onUpdatePriority?: (priority: string) => void;
  onUpdateScope?: (scope: string) => void;
  onDelete?: () => void;
  children: React.ReactNode;
}

export function TaskContextMenu({
  task,
  onUpdateStatus,
  onUpdatePriority,
  onUpdateScope,
  onDelete,
  children,
}: TaskContextMenuProps) {
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const gitBranchName = `issue/${task.obsidianRef || task.id.slice(0, 8)}-${task.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 30)}`;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56 bg-popover/95 backdrop-blur-xl border-border shadow-2xl text-xs z-[9999]">
        {/* 1. Status Submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <CircleDot className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Status</span>
            <ContextMenuShortcut>S</ContextMenuShortcut>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48 bg-popover/95 backdrop-blur-xl border-border shadow-2xl z-[10000]">
            <ContextMenuItem
              onClick={() => onUpdateStatus?.("BACKLOG")}
              className={task.status === "BACKLOG" ? "font-bold text-primary" : ""}
            >
              <Minus className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Backlog</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onUpdateStatus?.("TODO")}
              className={task.status === "TODO" ? "font-bold text-primary" : ""}
            >
              <CircleDot className="mr-2 h-3.5 w-3.5 text-blue-400" />
              <span>To Do</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onUpdateStatus?.("IN_PROGRESS")}
              className={task.status === "IN_PROGRESS" ? "font-bold text-primary" : ""}
            >
              <Clock className="mr-2 h-3.5 w-3.5 text-amber-500" />
              <span>In Progress</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onUpdateStatus?.("WAITING_ON_CLIENT")}
              className={task.status === "WAITING_ON_CLIENT" ? "font-bold text-primary" : ""}
            >
              <Clock className="mr-2 h-3.5 w-3.5 text-purple-400" />
              <span>Waiting on Client</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onUpdateStatus?.("RESOLVED")}
              className={task.status === "RESOLVED" ? "font-bold text-primary" : ""}
            >
              <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-emerald-500" />
              <span>Resolved</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onUpdateStatus?.("CLOSED")}
              className={task.status === "CLOSED" ? "font-bold text-primary" : ""}
            >
              <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Closed</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* 2. Priority Submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Flame className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Priority</span>
            <ContextMenuShortcut>P</ContextMenuShortcut>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-40 bg-popover/95 backdrop-blur-xl border-border shadow-2xl z-[10000]">
            <ContextMenuItem
              onClick={() => onUpdatePriority?.("URGENT")}
              className="text-destructive font-semibold"
            >
              <AlertCircle className="mr-2 h-3.5 w-3.5 text-destructive" />
              <span>Urgent</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onUpdatePriority?.("HIGH")}
              className="text-amber-500 font-semibold"
            >
              <ArrowUp className="mr-2 h-3.5 w-3.5 text-amber-500" />
              <span>High</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onUpdatePriority?.("NORMAL")}>
              <Minus className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Normal</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onUpdatePriority?.("LOW")}>
              <ArrowDown className="mr-2 h-3.5 w-3.5 text-blue-500" />
              <span>Low</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* 3. Scope Submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Shield className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Scope</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48 bg-popover/95 backdrop-blur-xl border-border shadow-2xl z-[10000]">
            <ContextMenuItem
              onClick={() => onUpdateScope?.("PLATFORM_INTERNAL")}
              className={task.scope === "PLATFORM_INTERNAL" ? "font-bold text-primary" : ""}
            >
              <Shield className="mr-2 h-3.5 w-3.5 text-blue-400" />
              <span>Platform Internal</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onUpdateScope?.("TENANT_TO_PLATFORM")}
              className={task.scope === "TENANT_TO_PLATFORM" ? "font-bold text-primary" : ""}
            >
              <Building2 className="mr-2 h-3.5 w-3.5 text-emerald-400" />
              <span>B2B Tenant Ticket</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        {/* 4. Copy Submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Copy className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Copy</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-52 bg-popover/95 backdrop-blur-xl border-border shadow-2xl z-[10000]">
            <ContextMenuItem
              onClick={() =>
                handleCopy(
                  `${window.location.origin}/tasks?issue=${task.id}`,
                  "Issue Link"
                )
              }
            >
              <span>Copy issue link</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleCopy(task.title, "Issue Title")}>
              <span>Copy title</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleCopy(gitBranchName, "Git Branch")}>
              <GitBranch className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Copy branch name</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleCopy(task.id, "Issue ID")}>
              <span>Copy ID</span>
              <ContextMenuShortcut className="font-mono text-[9px]">UUID</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* 5. Open in New Tab */}
        <ContextMenuItem
          onClick={() => window.open(`/tasks?issue=${task.id}`, "_blank")}
        >
          <ExternalLink className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          <span>Open in new tab</span>
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* 6. Delete Action */}
        <ContextMenuItem
          variant="destructive"
          onClick={() => onDelete?.()}
        >
          <Trash2 className="mr-2 h-3.5 w-3.5 text-destructive" />
          <span>Delete issue</span>
          <ContextMenuShortcut>Ctrl ⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

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
  Calendar,
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
  FolderKanban,
  Star,
  Bell,
  Sparkles,
  Link2,
  FolderPlus,
  Bookmark,
  FileCode,
} from "lucide-react";
import { toast } from "sonner";
import { type Task } from "@/hooks/useTasksQuery";
import { useTeamUsers } from "@/hooks/useTeamUsers";

interface TaskContextMenuProps {
  task: Task;
  onUpdateStatus?: (status: string) => void;
  onUpdatePriority?: (priority: string) => void;
  onUpdateAssignee?: (assigneeId?: string) => void;
  onUpdateDueDate?: (dueDate?: string) => void;
  onUpdateScope?: (scope: string) => void;
  onDelete?: () => void;
  children: React.ReactNode;
}

export function TaskContextMenu({
  task,
  onUpdateStatus,
  onUpdatePriority,
  onUpdateAssignee,
  onUpdateDueDate,
  onUpdateScope,
  onDelete,
  children,
}: TaskContextMenuProps) {
  const { users: teamUsers } = useTeamUsers();

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleRemindMe = (timeLabel: string) => {
    toast.success(`Reminder set for "${task.title}" (${timeLabel})`);
  };

  const gitBranchName = `issue/${task.obsidianRef || task.id.slice(0, 8)}-${task.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 30)}`;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-60 bg-popover/95 backdrop-blur-xl border-border/80 shadow-2xl text-xs z-[9999] py-1.5 rounded-xl">
        {/* 1. Status Submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="cursor-pointer">
            <CircleDot className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Status</span>
            <ContextMenuShortcut>S</ContextMenuShortcut>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48 bg-popover/95 backdrop-blur-xl border-border shadow-2xl z-[10000] rounded-xl p-1">
            <ContextMenuItem
              onClick={() => onUpdateStatus?.("BACKLOG")}
              className="cursor-pointer"
            >
              <Minus className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Backlog</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onUpdateStatus?.("TODO")}
              className="cursor-pointer"
            >
              <CircleDot className="mr-2 h-3.5 w-3.5 text-blue-400" />
              <span>To Do</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onUpdateStatus?.("IN_PROGRESS")}
              className="cursor-pointer"
            >
              <Clock className="mr-2 h-3.5 w-3.5 text-amber-500" />
              <span>In Progress</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onUpdateStatus?.("WAITING_ON_CLIENT")}
              className="cursor-pointer"
            >
              <Clock className="mr-2 h-3.5 w-3.5 text-purple-400" />
              <span>Waiting on Client</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onUpdateStatus?.("RESOLVED")}
              className="cursor-pointer font-medium text-emerald-500"
            >
              <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-emerald-500" />
              <span>Resolved</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onUpdateStatus?.("CLOSED")}
              className="cursor-pointer text-muted-foreground"
            >
              <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Closed</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* 2. Priority Submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="cursor-pointer">
            <Flame className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Priority</span>
            <ContextMenuShortcut>P</ContextMenuShortcut>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-44 bg-popover/95 backdrop-blur-xl border-border shadow-2xl z-[10000] rounded-xl p-1">
            <ContextMenuItem
              onClick={() => onUpdatePriority?.("URGENT")}
              className="text-destructive font-semibold cursor-pointer"
            >
              <AlertCircle className="mr-2 h-3.5 w-3.5 text-destructive" />
              <span>Urgent</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onUpdatePriority?.("HIGH")}
              className="text-amber-500 font-semibold cursor-pointer"
            >
              <ArrowUp className="mr-2 h-3.5 w-3.5 text-amber-500" />
              <span>High</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onUpdatePriority?.("NORMAL")}
              className="cursor-pointer"
            >
              <Minus className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Normal</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onUpdatePriority?.("LOW")}
              className="cursor-pointer"
            >
              <ArrowDown className="mr-2 h-3.5 w-3.5 text-blue-500" />
              <span>Low</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* 3. Assignee Submenu (Dynamic Live Keycloak Directory) */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="cursor-pointer">
            <User className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Assignee</span>
            <ContextMenuShortcut>A</ContextMenuShortcut>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-56 max-h-60 overflow-y-auto bg-popover/95 backdrop-blur-xl border-border shadow-2xl z-[10000] rounded-xl p-1">
            <ContextMenuItem
              onClick={() => onUpdateAssignee?.(undefined)}
              className="text-muted-foreground cursor-pointer"
            >
              <span>Unassigned</span>
            </ContextMenuItem>
            {teamUsers.map((u) => (
              <ContextMenuItem
                key={u.id}
                onClick={() => onUpdateAssignee?.(u.name || u.email)}
                className="cursor-pointer flex items-center gap-2"
              >
                <div className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[9px] shrink-0">
                  {(u.name || u.email).substring(0, 1).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="truncate">{u.name || u.email}</span>
                  <span className="text-[10px] text-muted-foreground">{u.role}</span>
                </div>
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* 4. Due Date Submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="cursor-pointer">
            <Calendar className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Due date</span>
            <ContextMenuShortcut>⇧ D</ContextMenuShortcut>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48 bg-popover/95 backdrop-blur-xl border-border shadow-2xl z-[10000] rounded-xl p-1">
            <ContextMenuItem
              onClick={() => {
                const d = new Date();
                onUpdateDueDate?.(d.toISOString());
              }}
              className="cursor-pointer"
            >
              <span>Today</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() + 1);
                onUpdateDueDate?.(d.toISOString());
              }}
              className="cursor-pointer"
            >
              <span>Tomorrow</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() + 7);
                onUpdateDueDate?.(d.toISOString());
              }}
              className="cursor-pointer"
            >
              <span>Next week</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                const d = new Date();
                d.setMonth(d.getMonth() + 1);
                onUpdateDueDate?.(d.toISOString());
              }}
              className="cursor-pointer"
            >
              <span>Next month</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onUpdateDueDate?.(undefined)}
              className="text-muted-foreground cursor-pointer"
            >
              <span>Clear due date</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* 5. Labels Submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="cursor-pointer">
            <Tag className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Labels</span>
            <ContextMenuShortcut>L</ContextMenuShortcut>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48 bg-popover/95 backdrop-blur-xl border-border shadow-2xl z-[10000] rounded-xl p-1">
            {["Bug", "Feature", "Improvement", "Security", "GIS", "Network"].map((lbl) => (
              <ContextMenuItem
                key={lbl}
                onClick={() => toast.success(`Label "${lbl}" tagged`)}
                className="cursor-pointer flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span>{lbl}</span>
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* 6. Project Submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="cursor-pointer">
            <FolderKanban className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Project</span>
            <ContextMenuShortcut>⇧ P</ContextMenuShortcut>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48 bg-popover/95 backdrop-blur-xl border-border shadow-2xl z-[10000] rounded-xl p-1">
            <ContextMenuItem
              onClick={() => toast.info(`Project ref: ${task.obsidianRef || "None"}`)}
              className="cursor-pointer"
            >
              <span>{task.obsidianRef || "No Project Linked"}</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* 7. Scope Submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="cursor-pointer">
            <Shield className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Scope</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48 bg-popover/95 backdrop-blur-xl border-border shadow-2xl z-[10000] rounded-xl p-1">
            <ContextMenuItem
              onClick={() => onUpdateScope?.("PLATFORM_INTERNAL")}
              className="cursor-pointer"
            >
              <Shield className="mr-2 h-3.5 w-3.5 text-blue-400" />
              <span>Platform Internal</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onUpdateScope?.("TENANT_TO_PLATFORM")}
              className="cursor-pointer"
            >
              <Building2 className="mr-2 h-3.5 w-3.5 text-emerald-400" />
              <span>B2B Tenant Ticket</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator className="my-1" />

        {/* 8. Copy Submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="cursor-pointer">
            <Copy className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Copy</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-52 bg-popover/95 backdrop-blur-xl border-border shadow-2xl z-[10000] rounded-xl p-1">
            <ContextMenuItem
              onClick={() =>
                handleCopy(
                  `${window.location.origin}/tasks?issue=${task.id}`,
                  "Issue Link"
                )
              }
              className="cursor-pointer"
            >
              <ExternalLink className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Copy issue link</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => handleCopy(task.title, "Issue Title")}
              className="cursor-pointer"
            >
              <span>Copy title</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => handleCopy(gitBranchName, "Git Branch")}
              className="cursor-pointer"
            >
              <GitBranch className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Copy branch name</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => handleCopy(task.id, "Issue ID")}
              className="cursor-pointer"
            >
              <Bookmark className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Copy ID</span>
              <ContextMenuShortcut className="font-mono text-[9px]">UUID</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() =>
                handleCopy(
                  `[${task.obsidianRef || task.id.slice(0, 8)}](${window.location.origin}/tasks?issue=${task.id}) - ${task.title}`,
                  "Markdown Link"
                )
              }
              className="cursor-pointer"
            >
              <FileCode className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Copy markdown link</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator className="my-1" />

        {/* 9. Favorite Action */}
        <ContextMenuItem
          onClick={() => toast.success(`Task "${task.title}" added to favorites`)}
          className="cursor-pointer"
        >
          <Star className="mr-2 h-3.5 w-3.5 text-amber-400" />
          <span>Favorite</span>
          <ContextMenuShortcut>Alt F</ContextMenuShortcut>
        </ContextMenuItem>

        {/* 10. Remind Me Submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="cursor-pointer">
            <Clock className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Remind me</span>
            <ContextMenuShortcut>H</ContextMenuShortcut>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-52 bg-popover/95 backdrop-blur-xl border-border shadow-2xl z-[10000] rounded-xl p-1">
            <ContextMenuItem onClick={() => handleRemindMe("In 1 hour")} className="cursor-pointer">
              <span>An hour from now</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleRemindMe("Tomorrow 09:00")} className="cursor-pointer">
              <span>Tomorrow (09:00)</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleRemindMe("Next week")} className="cursor-pointer">
              <span>Next week</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleRemindMe("Next month")} className="cursor-pointer">
              <span>A month from now</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator className="my-1" />

        {/* 11. Open in Obsidian Desktop App */}
        {task.obsidianRef && (
          <ContextMenuItem
            onClick={() => {
              window.location.href = `obsidian://open?vault=K2NET_Engineering_Vault&file=02_Tickets/DevOps_Internal/${task.obsidianRef}`;
            }}
            className="cursor-pointer"
          >
            <FolderKanban className="mr-2 h-3.5 w-3.5 text-purple-400" />
            <span>Open in Obsidian</span>
            <ContextMenuShortcut>Ctrl ↵</ContextMenuShortcut>
          </ContextMenuItem>
        )}

        {/* 12. Open in New Tab */}
        <ContextMenuItem
          onClick={() => window.open(`/tasks?issue=${task.id}`, "_blank")}
          className="cursor-pointer"
        >
          <ExternalLink className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          <span>Open in new tab</span>
        </ContextMenuItem>

        <ContextMenuSeparator className="my-1" />

        {/* 13. Delete Action */}
        <ContextMenuItem
          variant="destructive"
          onClick={() => onDelete?.()}
          className="cursor-pointer"
        >
          <Trash2 className="mr-2 h-3.5 w-3.5 text-destructive" />
          <span>Delete issue</span>
          <ContextMenuShortcut>Ctrl ⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

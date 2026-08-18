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
  Users,
  Calendar,
  Target,
  Tag,
  Copy,
  ExternalLink,
  Trash2,
  TrendingUp,
  AlertTriangle,
  Flame,
  ArrowUp,
  ArrowDown,
  CircleDot,
  Minus,
  Star,
  Bell,
  MessageSquare,
  Sparkles,
  GitBranch,
  FolderKanban,
  FileText,
  Bookmark,
} from "lucide-react";
import { toast } from "sonner";
import { useTeamUsers } from "@/hooks/useTeamUsers";

export interface ProjectData {
  id: string;
  name: string;
  obsidianRef?: string;
  status: string;
  priority: string;
  health: string;
  lead: string;
  dueDate?: string;
  createdAt?: string;
  percentage: number;
  issuesCount: number;
}

interface ProjectContextMenuProps {
  project: ProjectData;
  onUpdateStatus?: (status: string) => void;
  onUpdatePriority?: (priority: string) => void;
  onUpdateHealth?: (health: string) => void;
  onUpdateLead?: (lead: string) => void;
  onUpdateDueDate?: (dueDate?: string) => void;
  onDelete?: () => void;
  children: React.ReactNode;
}

export function ProjectContextMenu({
  project,
  onUpdateStatus,
  onUpdatePriority,
  onUpdateHealth,
  onUpdateLead,
  onUpdateDueDate,
  onDelete,
  children,
}: ProjectContextMenuProps) {
  const { users: teamUsers } = useTeamUsers();

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleRemindMe = (timeLabel: string) => {
    toast.success(`Reminder set for "${project.name}" (${timeLabel})`);
  };

  const handleSetFavorite = () => {
    toast.success(`Project "${project.name}" added to favorites`);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-60 bg-popover/95 backdrop-blur-xl border-border/80 shadow-2xl text-xs z-[9999] py-1.5 rounded-xl">
        {/* 1. Status Submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="cursor-pointer">
            <CircleDot className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Status</span>
            <ContextMenuShortcut>P then S</ContextMenuShortcut>
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
              <span>Planned / To Do</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onUpdateStatus?.("IN_PROGRESS")}
              className="cursor-pointer"
            >
              <Clock className="mr-2 h-3.5 w-3.5 text-amber-500" />
              <span>In Progress</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onUpdateStatus?.("PAUSED")}
              className="cursor-pointer"
            >
              <AlertTriangle className="mr-2 h-3.5 w-3.5 text-orange-400" />
              <span>Paused</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onUpdateStatus?.("RESOLVED")}
              className="cursor-pointer font-medium text-emerald-500"
            >
              <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-emerald-500" />
              <span>Completed</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onUpdateStatus?.("CLOSED")}
              className="cursor-pointer text-muted-foreground"
            >
              <Minus className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Cancelled</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* 2. Priority Submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="cursor-pointer">
            <Flame className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Priority</span>
            <ContextMenuShortcut>P then P</ContextMenuShortcut>
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

        {/* 3. Project Lead Submenu (Dynamic Live Keycloak Directory) */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="cursor-pointer">
            <User className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Project lead</span>
            <ContextMenuShortcut>P then A</ContextMenuShortcut>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-56 max-h-60 overflow-y-auto bg-popover/95 backdrop-blur-xl border-border shadow-2xl z-[10000] rounded-xl p-1">
            <ContextMenuItem
              onClick={() => onUpdateLead?.("Unassigned")}
              className="text-muted-foreground cursor-pointer"
            >
              <span>Unassign Lead</span>
            </ContextMenuItem>
            {teamUsers.map((u) => (
              <ContextMenuItem
                key={u.id}
                onClick={() => onUpdateLead?.(u.name || u.email)}
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

        {/* 4. Members Submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="cursor-pointer">
            <Users className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Members</span>
            <ContextMenuShortcut>P then M</ContextMenuShortcut>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-52 bg-popover/95 backdrop-blur-xl border-border shadow-2xl z-[10000] rounded-xl p-1">
            <ContextMenuItem
              onClick={() => toast.info(`Managing team members for ${project.name}`)}
              className="cursor-pointer"
            >
              <span>{teamUsers.length} Active Engineers</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* 5. Target Date Submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="cursor-pointer">
            <Target className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Target date...</span>
            <ContextMenuShortcut>Ctrl Alt D</ContextMenuShortcut>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-44 bg-popover/95 backdrop-blur-xl border-border shadow-2xl z-[10000] rounded-xl p-1">
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
              onClick={() => {
                const d = new Date();
                d.setMonth(d.getMonth() + 3);
                onUpdateDueDate?.(d.toISOString());
              }}
              className="cursor-pointer"
            >
              <span>Next quarter (Q+1)</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onUpdateDueDate?.(undefined)}
              className="text-muted-foreground cursor-pointer"
            >
              <span>Clear target date</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* 6. Labels Submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="cursor-pointer">
            <Tag className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Labels</span>
            <ContextMenuShortcut>P then L</ContextMenuShortcut>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48 bg-popover/95 backdrop-blur-xl border-border shadow-2xl z-[10000] rounded-xl p-1">
            {["Core Upgrade", "Fiber Rollout", "Platform SaaS", "Infrastructure", "Security"].map((lbl) => (
              <ContextMenuItem
                key={lbl}
                onClick={() => toast.success(`Label "${lbl}" tagged to project`)}
                className="cursor-pointer flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span>{lbl}</span>
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* 7. More Properties Submenu (Health & Scope) */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="cursor-pointer">
            <TrendingUp className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>More properties</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-44 bg-popover/95 backdrop-blur-xl border-border shadow-2xl z-[10000] rounded-xl p-1">
            <ContextMenuItem
              onClick={() => onUpdateHealth?.("On track")}
              className="text-emerald-500 font-medium cursor-pointer"
            >
              <TrendingUp className="mr-2 h-3.5 w-3.5 text-emerald-500" />
              <span>On track</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onUpdateHealth?.("At risk")}
              className="text-amber-500 font-medium cursor-pointer"
            >
              <AlertTriangle className="mr-2 h-3.5 w-3.5 text-amber-500" />
              <span>At risk</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onUpdateHealth?.("Off track")}
              className="text-destructive font-medium cursor-pointer"
            >
              <AlertCircle className="mr-2 h-3.5 w-3.5 text-destructive" />
              <span>Off track</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator className="my-1" />

        {/* 8. Copy Submenu (Linear Spec) */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="cursor-pointer">
            <Copy className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Copy</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-52 bg-popover/95 backdrop-blur-xl border-border shadow-2xl z-[10000] rounded-xl p-1">
            <ContextMenuItem
              onClick={() =>
                handleCopy(
                  `${window.location.origin}/tasks/projects/${project.id}`,
                  "Project Link"
                )
              }
              className="cursor-pointer"
            >
              <ExternalLink className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Copy project link</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => handleCopy(project.name, "Project Name")}
              className="cursor-pointer"
            >
              <FileText className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Copy name</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => handleCopy(project.obsidianRef || project.id, "Project Ref")}
              className="cursor-pointer"
            >
              <Bookmark className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Copy project ref</span>
              <ContextMenuShortcut className="font-mono text-[9px]">{project.obsidianRef || "ID"}</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() =>
                handleCopy(
                  `feature/${(project.obsidianRef || project.name).toLowerCase().replace(/\s+/g, "-")}`,
                  "Git Branch Name"
                )
              }
              className="cursor-pointer"
            >
              <GitBranch className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Copy git branch name</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator className="my-1" />

        {/* 9. Favorite Action */}
        <ContextMenuItem
          onClick={handleSetFavorite}
          className="cursor-pointer"
        >
          <Star className="mr-2 h-3.5 w-3.5 text-amber-400" />
          <span>Favorite</span>
          <ContextMenuShortcut>Alt F</ContextMenuShortcut>
        </ContextMenuItem>

        {/* 10. Subscribe Notifications */}
        <ContextMenuItem
          onClick={() => toast.success(`Subscribed to notifications for "${project.name}"`)}
          className="cursor-pointer"
        >
          <Bell className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          <span>Subscribe</span>
        </ContextMenuItem>

        {/* 11. Remind Me Submenu */}
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
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* 12. New comment */}
        <ContextMenuItem
          onClick={() => window.open(`/tasks/projects/${project.id}`, "_self")}
          className="cursor-pointer"
        >
          <MessageSquare className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          <span>New comment...</span>
          <ContextMenuShortcut>N then C</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator className="my-1" />

        {/* 13. Open in Obsidian Desktop App */}
        {project.obsidianRef && (
          <ContextMenuItem
            onClick={() => {
              window.location.href = `obsidian://open?vault=K2NET_Engineering_Vault&file=01_Projects/Platform/${project.obsidianRef}`;
            }}
            className="cursor-pointer"
          >
            <FolderKanban className="mr-2 h-3.5 w-3.5 text-purple-400" />
            <span>Open in Obsidian</span>
            <ContextMenuShortcut>Ctrl ↵</ContextMenuShortcut>
          </ContextMenuItem>
        )}

        {/* 14. Open in New Tab */}
        <ContextMenuItem
          onClick={() => window.open(`/tasks/projects/${project.id}`, "_blank")}
          className="cursor-pointer"
        >
          <ExternalLink className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          <span>Open in new tab</span>
        </ContextMenuItem>

        <ContextMenuSeparator className="my-1" />

        {/* 15. Delete Project Action */}
        <ContextMenuItem
          variant="destructive"
          onClick={() => onDelete?.()}
          className="cursor-pointer"
        >
          <Trash2 className="mr-2 h-3.5 w-3.5 text-destructive" />
          <span>Delete</span>
          <ContextMenuShortcut>Ctrl ⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

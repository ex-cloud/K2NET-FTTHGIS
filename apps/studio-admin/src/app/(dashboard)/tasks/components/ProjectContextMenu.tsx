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
} from "lucide-react";
import { toast } from "sonner";

export interface ProjectData {
  id: string;
  name: string;
  obsidianRef?: string;
  status: string;
  priority: string;
  health: string;
  lead: string;
  dueDate?: string;
  percentage: number;
  issuesCount: number;
}

interface ProjectContextMenuProps {
  project: ProjectData;
  onUpdateStatus?: (status: string) => void;
  onUpdatePriority?: (priority: string) => void;
  onUpdateHealth?: (health: string) => void;
  onDelete?: () => void;
  children: React.ReactNode;
}

export function ProjectContextMenu({
  project,
  onUpdateStatus,
  onUpdatePriority,
  onUpdateHealth,
  onDelete,
  children,
}: ProjectContextMenuProps) {
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56 bg-popover/95 backdrop-blur-xl border-border shadow-2xl text-xs z-[9999]">
        {/* 1. Status Submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <CircleDot className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Status</span>
            <ContextMenuShortcut>P then S</ContextMenuShortcut>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-44 bg-popover/95 backdrop-blur-xl border-border shadow-2xl z-[10000]">
            <ContextMenuItem
              onClick={() => onUpdateStatus?.("BACKLOG")}
              className={project.status === "BACKLOG" ? "font-bold text-primary" : ""}
            >
              <Minus className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Backlog</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onUpdateStatus?.("TODO")}
              className={project.status === "TODO" ? "font-bold text-primary" : ""}
            >
              <CircleDot className="mr-2 h-3.5 w-3.5 text-blue-400" />
              <span>To Do</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onUpdateStatus?.("IN_PROGRESS")}
              className={project.status === "IN_PROGRESS" ? "font-bold text-primary" : ""}
            >
              <Clock className="mr-2 h-3.5 w-3.5 text-amber-500" />
              <span>In Progress</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onUpdateStatus?.("RESOLVED")}
              className={project.status === "RESOLVED" ? "font-bold text-primary" : ""}
            >
              <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-emerald-500" />
              <span>Done / Completed</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* 2. Priority Submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Flame className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Priority</span>
            <ContextMenuShortcut>P then P</ContextMenuShortcut>
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

        {/* 3. Health Submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <TrendingUp className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Health</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-36 bg-popover/95 backdrop-blur-xl border-border shadow-2xl z-[10000]">
            <ContextMenuItem
              onClick={() => onUpdateHealth?.("On track")}
              className="text-emerald-500 font-medium"
            >
              <TrendingUp className="mr-2 h-3.5 w-3.5 text-emerald-500" />
              <span>On track</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onUpdateHealth?.("At risk")}
              className="text-amber-500 font-medium"
            >
              <AlertTriangle className="mr-2 h-3.5 w-3.5 text-amber-500" />
              <span>At risk</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onUpdateHealth?.("Off track")}
              className="text-destructive font-medium"
            >
              <AlertCircle className="mr-2 h-3.5 w-3.5 text-destructive" />
              <span>Off track</span>
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
          <ContextMenuSubContent className="w-44 bg-popover/95 backdrop-blur-xl border-border shadow-2xl z-[10000]">
            <ContextMenuItem
              onClick={() =>
                handleCopy(
                  `${window.location.origin}/tasks/projects/${project.id}`,
                  "Project Link"
                )
              }
            >
              <span>Copy project link</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleCopy(project.name, "Project Name")}>
              <span>Copy name</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleCopy(project.id, "Project ID")}>
              <span>Copy ID</span>
              <ContextMenuShortcut className="font-mono text-[9px]">UUID</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* 5. Open in New Tab */}
        <ContextMenuItem
          onClick={() => window.open(`/tasks/projects/${project.id}`, "_blank")}
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
          <span>Delete project</span>
          <ContextMenuShortcut>Ctrl ⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

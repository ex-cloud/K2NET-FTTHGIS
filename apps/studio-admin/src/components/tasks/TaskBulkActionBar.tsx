

import React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Button,
} from "@k2net/ui";
import {
  CircleDot,
  Clock,
  CheckCircle2,
  AlertCircle,
  Flame,
  ArrowUp,
  ArrowDown,
  User,
  Shield,
  Trash2,
  X,
  Minus,
  Building2,
  Layers,
} from "lucide-react";
import { useTeamUsers } from "@/hooks/useTeamUsers";
import { cn } from "@/lib/utils";

interface TaskBulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBatchUpdateStatus: (status: string) => void;
  onBatchUpdatePriority: (priority: string) => void;
  onBatchUpdateAssignee: (assigneeId: string | null) => void;
  onBatchUpdateScope: (scope: string) => void;
  onBatchDelete: () => void;
}

export function TaskBulkActionBar({
  selectedCount,
  onClearSelection,
  onBatchUpdateStatus,
  onBatchUpdatePriority,
  onBatchUpdateAssignee,
  onBatchUpdateScope,
  onBatchDelete,
}: TaskBulkActionBarProps) {
  const { users: teamUsers } = useTeamUsers();

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in-0 slide-in-from-bottom-6 duration-200">
      <div className="flex items-center gap-2 bg-popover/95 backdrop-blur-xl border border-border/80 text-foreground shadow-2xl rounded-2xl px-4 py-2 text-xs">
        {/* Selected Count & Clear */}
        <div className="flex items-center gap-2 pr-3 border-r border-border/60">
          <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground font-bold text-[11px] flex items-center justify-center">
            {selectedCount}
          </span>
          <span className="font-semibold text-foreground whitespace-nowrap">
            {selectedCount === 1 ? "1 task selected" : `${selectedCount} tasks selected`}
          </span>
          <button
            type="button"
            onClick={onClearSelection}
            className="p-1 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Deselect all (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 1. Batch Status Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/40 hover:bg-muted/80 text-foreground border border-border/50 font-medium transition-colors cursor-pointer"
            >
              <CircleDot className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Status</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="top" className="w-44 z-[1000]">
            <DropdownMenuItem onClick={() => onBatchUpdateStatus("BACKLOG")} className="cursor-pointer">
              <Minus className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Backlog</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onBatchUpdateStatus("TODO")} className="cursor-pointer">
              <CircleDot className="mr-2 h-3.5 w-3.5 text-blue-400" />
              <span>To Do</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onBatchUpdateStatus("IN_PROGRESS")} className="cursor-pointer">
              <Clock className="mr-2 h-3.5 w-3.5 text-amber-500" />
              <span>In Progress</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onBatchUpdateStatus("RESOLVED")} className="cursor-pointer text-primary font-semibold">
              <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-primary" />
              <span>Resolved</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onBatchUpdateStatus("CLOSED")} className="cursor-pointer text-muted-foreground">
              <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Closed</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 2. Batch Priority Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/40 hover:bg-muted/80 text-foreground border border-border/50 font-medium transition-colors cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Priority</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="top" className="w-40 z-[1000]">
            <DropdownMenuItem onClick={() => onBatchUpdatePriority("URGENT")} className="text-destructive font-semibold cursor-pointer">
              <AlertCircle className="mr-2 h-3.5 w-3.5 text-destructive" />
              <span>Urgent</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onBatchUpdatePriority("HIGH")} className="text-amber-500 font-semibold cursor-pointer">
              <ArrowUp className="mr-2 h-3.5 w-3.5 text-amber-500" />
              <span>High</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onBatchUpdatePriority("NORMAL")} className="cursor-pointer">
              <Minus className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Normal</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onBatchUpdatePriority("LOW")} className="cursor-pointer">
              <ArrowDown className="mr-2 h-3.5 w-3.5 text-blue-500" />
              <span>Low</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 3. Batch Assignee Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/40 hover:bg-muted/80 text-foreground border border-border/50 font-medium transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Assignee</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="top" className="w-56 max-h-60 overflow-y-auto z-[1000]">
            <DropdownMenuItem onClick={() => onBatchUpdateAssignee(null)} className="text-muted-foreground cursor-pointer">
              <span>Unassign</span>
            </DropdownMenuItem>
            {teamUsers.map((u) => (
              <DropdownMenuItem
                key={u.id}
                onClick={() => onBatchUpdateAssignee(u.name || u.email)}
                className="cursor-pointer flex items-center gap-2"
              >
                <div className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[9px] shrink-0">
                  {(u.name || u.email).substring(0, 1).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="truncate">{u.name || u.email}</span>
                  <span className="text-[10px] text-muted-foreground">{u.role}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 4. Batch Scope Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/40 hover:bg-muted/80 text-foreground border border-border/50 font-medium transition-colors cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Scope</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="top" className="w-48 z-[1000]">
            <DropdownMenuItem onClick={() => onBatchUpdateScope("PLATFORM_INTERNAL")} className="cursor-pointer">
              <Shield className="mr-2 h-3.5 w-3.5 text-blue-400" />
              <span>Platform Internal</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onBatchUpdateScope("TENANT_TO_PLATFORM")} className="cursor-pointer">
              <Building2 className="mr-2 h-3.5 w-3.5 text-primary" />
              <span>B2B Mitra Ticket</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 5. Batch Delete Button */}
        <button
          type="button"
          onClick={onBatchDelete}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 font-semibold transition-colors cursor-pointer ml-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete ({selectedCount})</span>
        </button>
      </div>
    </div>
  );
}

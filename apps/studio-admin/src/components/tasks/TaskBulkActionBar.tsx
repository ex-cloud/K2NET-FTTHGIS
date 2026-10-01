

import React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  ActionTooltip,
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
} from "lucide-react";
import { useTeamUsers } from "@/hooks/useTeamUsers";
import { usePermissions } from "@/hooks/use-permissions";
import { useTranslation } from "@k2net/i18n";

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
  const { t } = useTranslation();
  const { users: teamUsers } = useTeamUsers();
  const { canAccess } = usePermissions();
  const canManage = canAccess("system.task.manage");

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 max-w-[95vw] overflow-x-auto animate-in fade-in-0 slide-in-from-bottom-6 duration-200">
      <div className="flex items-center gap-2 bg-popover/95 backdrop-blur-xl border border-border/80 text-foreground shadow-lg rounded-md px-3.5 py-1.5 text-xs whitespace-nowrap">
        {/* Selected Count & Clear */}
        <div className="flex items-center gap-2 pr-3 border-r border-border/60">
          <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground font-bold text-[11px] flex items-center justify-center">
            {selectedCount}
          </span>
          <span className="font-semibold text-foreground whitespace-nowrap">
            {t("tasks.selected_count", { count: selectedCount })}
          </span>
          <button
            type="button"
            onClick={onClearSelection}
            className="p-1 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title={t("tasks.deselect_all")}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 1. Batch Status Dropdown */}
        <ActionTooltip label={canManage ? t("tasks.change_status_tooltip") : t("tasks.read_only_manage_permission")}>
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={!canManage}>
                <button
                  type="button"
                  disabled={!canManage}
                  className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md bg-muted/40 hover:bg-muted/80 text-foreground border border-border/50 font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CircleDot className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Status</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" side="top" className="w-44 z-[1000]">
                <DropdownMenuItem onClick={() => onBatchUpdateStatus("BACKLOG")} className="cursor-pointer">
                  <Minus className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  <span>{t("tasks.status_backlog")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBatchUpdateStatus("TODO")} className="cursor-pointer">
                  <CircleDot className="mr-2 h-3.5 w-3.5 text-blue-400" />
                  <span>{t("tasks.status_todo")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBatchUpdateStatus("IN_PROGRESS")} className="cursor-pointer">
                  <Clock className="mr-2 h-3.5 w-3.5 text-amber-500" />
                  <span>{t("tasks.status_in_progress")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBatchUpdateStatus("RESOLVED")} className="cursor-pointer text-primary font-semibold">
                  <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-primary" />
                  <span>{t("tasks.status_resolved")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBatchUpdateStatus("CLOSED")} className="cursor-pointer text-muted-foreground">
                  <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  <span>{t("tasks.status_closed")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </ActionTooltip>

        {/* 2. Batch Priority Dropdown */}
        <ActionTooltip label={canManage ? t("tasks.change_priority_tooltip") : t("tasks.read_only_manage_permission")}>
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={!canManage}>
                <button
                  type="button"
                  disabled={!canManage}
                  className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md bg-muted/40 hover:bg-muted/80 text-foreground border border-border/50 font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Flame className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{t("tasks.priority")}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" side="top" className="w-40 z-[1000]">
                <DropdownMenuItem onClick={() => onBatchUpdatePriority("URGENT")} className="text-destructive font-semibold cursor-pointer">
                  <AlertCircle className="mr-2 h-3.5 w-3.5 text-destructive" />
                  <span>{t("tasks.priority_urgent")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBatchUpdatePriority("HIGH")} className="text-amber-500 font-semibold cursor-pointer">
                  <ArrowUp className="mr-2 h-3.5 w-3.5 text-amber-500" />
                  <span>{t("tasks.priority_high")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBatchUpdatePriority("NORMAL")} className="cursor-pointer">
                  <Minus className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  <span>{t("tasks.priority_normal")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBatchUpdatePriority("LOW")} className="cursor-pointer">
                  <ArrowDown className="mr-2 h-3.5 w-3.5 text-blue-500" />
                  <span>{t("tasks.priority_low")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </ActionTooltip>

        {/* 3. Batch Assignee Dropdown */}
        <ActionTooltip label={canManage ? t("tasks.assign_tooltip") : t("tasks.read_only_manage_permission")}>
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={!canManage}>
                <button
                  type="button"
                  disabled={!canManage}
                  className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md bg-muted/40 hover:bg-muted/80 text-foreground border border-border/50 font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{t("tasks.assignee")}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" side="top" className="w-56 max-h-60 overflow-y-auto z-[1000]">
                <DropdownMenuItem onClick={() => onBatchUpdateAssignee(null)} className="text-muted-foreground cursor-pointer">
                  <span>{t("tasks.unassign")}</span>
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
          </div>
        </ActionTooltip>

        {/* 4. Batch Scope Dropdown */}
        <ActionTooltip label={canManage ? t("tasks.change_scope_tooltip") : t("tasks.read_only_manage_permission")}>
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={!canManage}>
                <button
                  type="button"
                  disabled={!canManage}
                  className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md bg-muted/40 hover:bg-muted/80 text-foreground border border-border/50 font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{t("tasks.col_scope")}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" side="top" className="w-48 z-[1000]">
                <DropdownMenuItem onClick={() => onBatchUpdateScope("PLATFORM_INTERNAL")} className="cursor-pointer">
                  <Shield className="mr-2 h-3.5 w-3.5 text-blue-400" />
                  <span>{t("tasks.platform_internal")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBatchUpdateScope("TENANT_TO_PLATFORM")} className="cursor-pointer">
                  <Building2 className="mr-2 h-3.5 w-3.5 text-primary" />
                  <span>{t("tasks.b2b_mitra_tickets")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </ActionTooltip>

        {/* 5. Batch Delete Button */}
        <ActionTooltip label={canManage ? t("tasks.delete_selected_tooltip", { count: selectedCount }) : t("tasks.read_only_manage_permission")}>
          <button
            type="button"
            onClick={onBatchDelete}
            disabled={!canManage}
            className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 font-medium transition-colors cursor-pointer ml-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t("common.delete")} ({selectedCount})</span>
          </button>
        </ActionTooltip>
      </div>
    </div>
  );
}

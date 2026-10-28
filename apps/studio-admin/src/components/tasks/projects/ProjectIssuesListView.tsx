import { Link } from "@/lib/navigation-compat";
import {
  Circle,
  User,
  Calendar,
  MoreHorizontal,
  Trash2,
  Check,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { type Task, type TaskScope } from "@/hooks/useTasksQuery";
import { STATUS_CONFIG, PRIORITY_CONFIG, getIssueSubtypeConfig } from "@/components/tasks/configs";
import { TaskContextMenu } from "@/components/tasks/TaskContextMenu";
import { cn } from "@/lib/utils";

interface ProjectIssuesListViewProps {
  issues: Task[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleIssueStatus: (issue: Task) => Promise<void>;
  onUpdateIssue: (issueId: string, fields: Partial<Task>) => Promise<void>;
  onDeleteIssue: (issueId: string) => Promise<void>;
}


export function ProjectIssuesListView({
  issues,
  selectedIds,
  onToggleSelect,
  onToggleIssueStatus,
  onUpdateIssue,
  onDeleteIssue,
}: ProjectIssuesListViewProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-1.5">
      {issues.map((issue, idx) => {
        const isDone = issue.status === "RESOLVED" || issue.status === "CLOSED";
        const isSelected = selectedIds.has(issue.id);
        const StatusIcon = STATUS_CONFIG[issue.status]?.icon ?? Circle;
        const subtype = getIssueSubtypeConfig(issue.referenceType);
        const SubtypeIcon = subtype.icon;
        const assigneeHandle = issue.assigneeId ? issue.assigneeId.split("@")[0] : null;

        return (
          <TaskContextMenu
            key={issue.id}
            task={issue}
            onUpdateStatus={(st) => onUpdateIssue(issue.id, { status: st })}
            onUpdatePriority={(pr) => onUpdateIssue(issue.id, { priority: pr })}
            onUpdateScope={(sc) => onUpdateIssue(issue.id, { scope: sc as TaskScope })}
            onDelete={() => onDeleteIssue(issue.id)}
          >
            <div
              className={cn(
                "flex items-center justify-between p-2.5 rounded-xl border transition-colors group gap-3",
                isSelected
                  ? "bg-primary/5 border-primary/40 shadow-xs"
                  : "bg-card/40 border-border/40 hover:border-border hover:bg-card/70"
              )}
            >
              {/* Left Group: Checkbox + Subtype + Status + Ref + Title */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {/* Multi-Select Checkbox (Only visible during batch selection mode) */}
                {selectedIds.size > 0 && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(issue.id)}
                    className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary/40 cursor-pointer accent-primary ml-0.5 shrink-0"
                  />
                )}

                {/* Instant Binary Status Checkbox (TODO ↔ RESOLVED) */}
                <button
                  type="button"
                  onClick={() => onToggleIssueStatus(issue)}
                  className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer shrink-0 ml-0.5",
                    isDone
                      ? "bg-primary border-primary text-primary-foreground shadow-2xs"
                      : "border-border/80 hover:border-primary/80 bg-background/50 hover:bg-muted/40"
                  )}
                  title={isDone ? t("workspace.action_mark_todo") : t("workspace.action_mark_done")}
                >
                  {isDone && <Check className="w-3 h-3 stroke-[2.5]" />}
                </button>

                {/* Subtype Badge */}
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0",
                    subtype.badgeClass
                  )}
                  title={t(subtype.i18nKey)}
                >
                  <SubtypeIcon className="w-3 h-3" />
                  <span className="hidden sm:inline">{t(subtype.i18nKey)}</span>
                </span>

                {/* Ref ID Badge */}
                <span className="text-[10px] font-mono text-muted-foreground shrink-0 bg-muted/50 px-1 py-0.5 rounded border border-border/40">
                  {issue.obsidianRef || `#${idx + 1}`}
                </span>

                {/* Issue Title (Links directly to canonical /workspace/issues/:id) */}
                <Link
                  href={`/workspace/issues/${issue.id}`}
                  className={cn(
                    "text-xs font-medium hover:text-primary transition-colors truncate max-w-[420px]",
                    isDone ? "line-through text-muted-foreground/60" : "text-foreground font-semibold"
                  )}
                >
                  {issue.title}
                </Link>
              </div>

              {/* Right Group: Priority + Due Date + Assignee + Quick Actions */}
              <div className="flex items-center gap-2.5 shrink-0 text-xs">
                {/* Priority Badge */}
                {issue.priority && (
                  <span
                    className={cn(
                      "text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold",
                      PRIORITY_CONFIG[issue.priority]?.className ?? ""
                    )}
                  >
                    {issue.priority}
                  </span>
                )}

                {/* Due Date */}
                {issue.dueDate && (
                  <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded border border-border/30">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {new Date(issue.dueDate).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </span>
                )}

                {/* Assignee Avatar & Handle */}
                <div
                  className="flex items-center gap-1.5 text-muted-foreground max-w-[110px] truncate"
                  title={issue.assigneeId ?? t("workspace.label_unassigned")}
                >
                  <div className="w-5 h-5 rounded-full bg-muted/60 text-muted-foreground flex items-center justify-center text-[10px] font-mono font-bold shrink-0 border border-border/50">
                    {assigneeHandle ? assigneeHandle.substring(0, 1).toUpperCase() : <User className="w-3 h-3" />}
                  </div>
                  {assigneeHandle && (
                    <span className="text-[11px] font-medium text-foreground/80 truncate hidden lg:inline">
                      {assigneeHandle}
                    </span>
                  )}
                </div>

                {/* Quick Action Dropdown Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                      title="More actions"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 z-[100] p-1">
                    <DropdownMenuItem
                      onClick={() => onToggleIssueStatus(issue)}
                      className="text-xs cursor-pointer flex items-center gap-2"
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{isDone ? t("workspace.action_mark_todo") : t("workspace.action_mark_done")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onToggleSelect(issue.id)}
                      className="text-xs cursor-pointer flex items-center gap-2"
                    >
                      <span>
                        {isSelected
                          ? t("workspace.action_deselect_batch")
                          : t("workspace.action_select_batch")}
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        onUpdateIssue(issue.id, {
                          priority: issue.priority === "URGENT" ? "NORMAL" : "URGENT",
                        })
                      }
                      className="text-xs cursor-pointer flex items-center gap-2"
                    >
                      <span>{t("workspace.action_change_priority")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDeleteIssue(issue.id)}
                      className="text-xs cursor-pointer text-destructive focus:text-destructive flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t("workspace.action_delete_issue")}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </TaskContextMenu>
        );
      })}
    </div>
  );
}

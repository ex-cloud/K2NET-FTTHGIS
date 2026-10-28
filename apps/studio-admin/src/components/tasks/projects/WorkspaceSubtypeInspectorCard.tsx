import React from "react";
import {
  Layers,
  Calendar,
  ExternalLink,
  Plus,
  Clock,
  ListTodo,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
} from "lucide-react";
import { Card, Button } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import type { Task } from "@/hooks/useTasksQuery";
import { type TeamUser } from "@/hooks/useTeamUsers";
import { cn } from "@/lib/utils";

type ScheduleStatus = "ON_TIME" | "EXPIRING_SOON" | "OVERDUE" | "UNSET";

function computeScheduleStatus(dueDate?: string, progressPercent = 0): ScheduleStatus {
  if (!dueDate) return "UNSET";
  const dueDateObj = new Date(dueDate);
  const diffDays = Math.ceil((dueDateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0 && progressPercent < 100) return "OVERDUE";
  if (diffDays <= 7 && progressPercent < 100) return "EXPIRING_SOON";
  return "ON_TIME";
}

function computeReadingEstimate(description?: string): { wordCount: number; readTimeMin: number } {
  const textContent = description ? description.replace(/<[^>]+>/g, " ") : "";
  const wordCount = textContent.trim() ? textContent.trim().split(/\s+/).length : 0;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));
  return { wordCount, readTimeMin };
}

function resolveCreatorName(reporterId?: string, teamUsers: TeamUser[] = []): string {
  if (!reporterId) return "Super Admin";
  const creator = teamUsers.find((u) => u.id === reporterId || u.email === reporterId);
  return creator?.name || creator?.email || reporterId.split("@")[0] || "Super Admin";
}

function getScheduleBadgeConfig(status: ScheduleStatus, t: (key: string) => string) {
  switch (status) {
    case "OVERDUE":
      return { className: "text-destructive bg-destructive/10 font-bold", label: t("workspace.status_overdue") };
    case "EXPIRING_SOON":
      return { className: "text-amber-500 bg-amber-500/10 font-bold", label: t("workspace.status_expiring_soon") };
    case "ON_TIME":
      return { className: "text-primary bg-primary/10", label: t("workspace.status_on_time") };
    default:
      return { className: "text-muted-foreground bg-muted/50", label: t("workspace.status_unset") };
  }
}

interface WorkspaceSubtypeInspectorCardProps {
  type: "PLAN" | "IDEA" | "DOC" | "PROJECT";
  projectTask: Task;
  projectIssues?: Task[];
  resolvedIssuesCount: number;
  totalIssuesCount: number;
  progressPercent: number;
  teamUsers?: TeamUser[];
  onOpenNewIssue?: () => void;
  onNavigateToIssues?: () => void;
}

export const WorkspaceSubtypeInspectorCard: React.FC<WorkspaceSubtypeInspectorCardProps> = ({
  type,
  projectTask,
  projectIssues = [],
  resolvedIssuesCount,
  totalIssuesCount,
  progressPercent,
  teamUsers = [],
  onOpenNewIssue,
  onNavigateToIssues,
}) => {
  const { t } = useTranslation();

  // Subtype-based conditional display: only show milestones card for PROJECT or if issues exist
  const shouldShowMilestonesCard = type === "PROJECT" || totalIssuesCount > 0;

  // Real breakdown from subtasks
  const inProgressCount = projectIssues.filter((t) => t.status === "IN_PROGRESS").length;
  const backlogCount = projectIssues.filter((t) =>
    ["TODO", "BACKLOG"].includes(t.status)
  ).length;
  const urgentCount = projectIssues.filter((t) =>
    ["URGENT", "HIGH"].includes(t.priority)
  ).length;

  const scheduleStatus = computeScheduleStatus(projectTask.dueDate, progressPercent);
  const { wordCount, readTimeMin } = computeReadingEstimate(projectTask.description);
  const creatorName = resolveCreatorName(projectTask.reporterId, teamUsers);
  const scheduleBadge = getScheduleBadgeConfig(scheduleStatus, t);

  return (
    <div className="space-y-4">
      {/* ── 1. Linked Issues Telemetry (Conditional: PROJECT or totalIssuesCount > 0) ── */}
      {shouldShowMilestonesCard && (
        <Card className="border border-border/60 bg-card/60 rounded-xl p-4 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span>{t("workspace.inspector_milestones")}</span>
            </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {resolvedIssuesCount}/{totalIssuesCount} {t("workspace.completed_label")}
          </span>
        </div>

        {/* Real subtask breakdown meters */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded-lg bg-background/50 border border-border/40">
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
              {t("workspace.completed_label")}
            </span>
            <span className="font-mono font-bold text-primary text-sm mt-0.5 block">
              {resolvedIssuesCount}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-background/50 border border-border/40">
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
              {t("workspace.in_progress_label")}
            </span>
            <span className="font-mono font-bold text-amber-500 text-sm mt-0.5 block">
              {inProgressCount}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-background/50 border border-border/40">
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
              {t("workspace.backlog_label")}
            </span>
            <span className="font-mono font-bold text-muted-foreground text-sm mt-0.5 block">
              {backlogCount}
            </span>
          </div>
        </div>

        {urgentCount > 0 && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs">
            <span className="text-destructive flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{t("workspace.urgent_priority_label")}</span>
            </span>
            <span className="font-mono font-bold text-destructive">{urgentCount}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-1 border-t border-border/40">
          {onOpenNewIssue && (
            <Button
              type="button"
              size="sm"
              onClick={onOpenNewIssue}
              className="flex-1 h-7 text-xs font-medium rounded-md shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("workspace.btn_add_issue")}</span>
            </Button>
          )}
          {onNavigateToIssues && (
            <button
              type="button"
              onClick={onNavigateToIssues}
              className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground font-medium rounded-md border border-border/60 hover:bg-muted/40 transition-colors cursor-pointer flex items-center gap-1"
            >
              <ListTodo className="w-3 h-3" />
              <span>{t("workspace.btn_list_issues")}</span>
            </button>
          )}
        </div>
      </Card>
      )}

      {/* ── 2. Real Document Metadata & Vault Audit ─────────────────────── */}
      <Card className="border border-border/60 bg-card/60 rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-primary" />
            <span>{t("workspace.inspector_doc_info")}</span>
          </span>
          <span className="inline-flex items-center text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {projectTask.scope}
          </span>
        </div>

        <div className="space-y-2 text-xs">
          {/* Obsidian Ref */}
          {projectTask.obsidianRef && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/40">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-primary" />
                <span>Obsidian Ref</span>
              </span>
              <a
                href={`obsidian://open?vault=K2NET_Engineering_Vault&file=${projectTask.obsidianRef}`}
                className="font-mono text-[11px] text-primary hover:underline"
              >
                {projectTask.obsidianRef}
              </a>
            </div>
          )}

          {/* Schedule status (only for PROJECT or if due date is set) */}
          {(type === "PROJECT" || Boolean(projectTask.dueDate)) && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/40">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{t("workspace.schedule_status")}</span>
              </span>
              <span
                className={cn(
                  "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                  scheduleBadge.className
                )}
              >
                {scheduleBadge.label}
              </span>
            </div>
          )}

          {/* Real Word Count and Reading Time */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/40">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{t("workspace.doc_length")}</span>
            </span>
            <span className="font-mono text-[11px] text-foreground">
              {t("workspace.words_estimate", { words: wordCount, min: readTimeMin })}
            </span>
          </div>

          {/* Created by */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/40">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{t("workspace.created_by")}</span>
            </span>
            <span className="font-medium text-[11px] text-foreground truncate max-w-[150px]">
              {creatorName}
            </span>
          </div>

          {/* Created At */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/40">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{t("workspace.created_date")}</span>
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {new Date(projectTask.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

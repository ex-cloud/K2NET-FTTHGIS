import React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@k2net/ui";
import {
  CheckCircle2,
  AlertCircle,
  User,
  CalendarDays,
  Flag,
  Tag,
  Clock,
  FolderOpen,
  ChevronDown,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@k2net/i18n";
import { Link } from "@/lib/navigation-compat";
import { cn } from "@/lib/utils";
import {
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  ISSUE_SUBTYPES,
  getIssueSubtypeConfig,
  type IssueSubtype,
} from "./configs";
import { type Task } from "@/hooks/useTasksQuery";
import { ScopeBadge } from "./ScopeBadge";
import { TaskSpatialMiniMap } from "./TaskSpatialMiniMap";

interface TaskPropertiesPanelProps {
  task: Task;
  status: string;
  priority: string;
  assigneeId: string | null;
  dueDate?: string;
  assigneesList?: string[];
  onPropertyChange: (field: Partial<Task>) => void;
  className?: string;
}

function PropRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0">
      <div className="flex items-center gap-2 w-20 shrink-0">
        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

export function TaskPropertiesPanel({
  task,
  status,
  priority,
  assigneeId,
  dueDate,
  assigneesList = [],
  onPropertyChange,
  className,
}: TaskPropertiesPanelProps) {
  const { t } = useTranslation();
  const currentStatus = STATUS_CONFIG[status] ?? STATUS_CONFIG.TODO;
  const StatusIcon = currentStatus.icon;
  const statusClass = currentStatus.className;
  const currentPriority = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.NORMAL;
  const currentSubtypeConfig = getIssueSubtypeConfig(task.referenceType);
  const SubtypeIcon = currentSubtypeConfig.icon;

  const formattedDue = dueDate
    ? new Date(dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })
    : undefined;

  return (
    <div className={cn("space-y-3", className)}>
      {/* ── Main Properties Card ─────────────────────────────────────── */}
      <div className="bg-card/40 border border-border/50 rounded-xl p-4">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
          {t("workspace.label_properties")}
        </p>

        {/* 1. Status Dropdown */}
        <PropRow icon={CheckCircle2} label={t("workspace.label_status")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md cursor-pointer hover:opacity-80 transition-opacity w-full",
                  statusClass
                )}
              >
                <StatusIcon className="h-3 w-3 shrink-0" />
                <span className="truncate">{currentStatus.label}</span>
                <ChevronDown className="h-3 w-3 ml-auto opacity-60 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-40 z-[100] p-1">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => onPropertyChange({ status: key })}
                    className={cn(
                      "flex items-center gap-2 text-xs py-1.5 px-2.5 rounded-md cursor-pointer",
                      status === key ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted/50 text-foreground"
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {cfg.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </PropRow>

        {/* 2. Priority Dropdown */}
        <PropRow icon={AlertCircle} label={t("workspace.label_priority")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md cursor-pointer hover:opacity-80 transition-opacity w-full",
                  currentPriority.className
                )}
              >
                <span className="truncate">{currentPriority.label}</span>
                <ChevronDown className="h-3 w-3 ml-auto opacity-60 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-36 z-[100] p-1">
              {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => onPropertyChange({ priority: key })}
                  className={cn(
                    "text-xs py-1.5 px-2.5 rounded-md cursor-pointer",
                    priority === key ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted/50 text-foreground"
                  )}
                >
                  <span className={cn("text-xs font-bold", cfg.className.split(" ")[0])}>{cfg.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </PropRow>

        {/* 3. Assignee Dropdown */}
        <PropRow icon={User} label={t("workspace.label_assignee")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-xs text-foreground font-medium px-2 py-1 rounded-md hover:bg-muted/50 transition-colors w-full text-left truncate"
              >
                <span className="truncate flex-1">
                  {assigneeId ? assigneeId.split("@")[0] : (
                    <span className="text-muted-foreground">{t("workspace.label_unassigned")}</span>
                  )}
                </span>
                <ChevronDown className="h-3 w-3 opacity-60 ml-auto shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-44 z-[100] p-1">
              <DropdownMenuItem
                onClick={() => onPropertyChange({ assigneeId: undefined })}
                className={cn(
                  "text-xs py-1.5 px-2.5 rounded-md cursor-pointer",
                  !assigneeId ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground"
                )}
              >
                {t("workspace.label_unassigned")}
              </DropdownMenuItem>
              {assigneesList.map((uid) => (
                <DropdownMenuItem
                  key={uid}
                  onClick={() => onPropertyChange({ assigneeId: uid })}
                  className={cn(
                    "text-xs py-1.5 px-2.5 rounded-md cursor-pointer font-mono",
                    assigneeId === uid ? "bg-primary/10 text-primary font-semibold" : "text-foreground"
                  )}
                >
                  {uid.split("@")[0]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </PropRow>

        {/* 4. Due Date Picker */}
        <PropRow icon={CalendarDays} label={t("workspace.label_due_date")}>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dueDate ? dueDate.substring(0, 10) : ""}
              onChange={(e) => onPropertyChange({ dueDate: e.target.value || undefined })}
              className="text-xs bg-transparent border-none outline-none text-foreground cursor-pointer"
            />
            {!formattedDue && (
              <span className="text-xs text-muted-foreground">{t("workspace.status_unset")}</span>
            )}
          </div>
        </PropRow>

        {/* 5. Type (Interactive Subtype Dropdown for Issues) */}
        <PropRow icon={Flag} label={t("workspace.label_type")}>
          {task.type === "PROJECT" ? (
            <span className="text-xs font-semibold text-primary">Project / Plan</span>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md cursor-pointer hover:opacity-80 transition-opacity w-full border",
                    currentSubtypeConfig.badgeClass
                  )}
                >
                  <SubtypeIcon className="h-3 w-3 shrink-0" />
                  <span className="truncate">{t(currentSubtypeConfig.i18nKey)}</span>
                  <ChevronDown className="h-3 w-3 ml-auto opacity-60 shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-36 z-[100] p-1">
                {(Object.entries(ISSUE_SUBTYPES) as [IssueSubtype, typeof ISSUE_SUBTYPES[IssueSubtype]][]).map(
                  ([key, cfg]) => {
                    const Icon = cfg.icon;
                    const isSelected = (task.referenceType?.toUpperCase() || "TASK") === key;
                    return (
                      <DropdownMenuItem
                        key={key}
                        onClick={() => onPropertyChange({ referenceType: key })}
                        className={cn(
                          "flex items-center gap-2 text-xs py-1.5 px-2.5 rounded-md cursor-pointer",
                          isSelected
                            ? "bg-primary/10 text-primary font-semibold"
                            : "hover:bg-muted/50 text-foreground"
                        )}
                      >
                        <Icon className={cn("h-3 w-3", cfg.className)} />
                        <span>{t(cfg.i18nKey)}</span>
                      </DropdownMenuItem>
                    );
                  }
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </PropRow>

        {/* 6. Scope (Readonly) */}
        <PropRow icon={Tag} label={t("workspace.label_scope")}>
          <ScopeBadge scope={task.scope} />
        </PropRow>

        {/* 7. Created Date (Readonly) */}
        <PropRow icon={Clock} label={t("workspace.label_created")}>
          <span className="text-xs text-muted-foreground">
            {new Date(task.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
          </span>
        </PropRow>
      </div>

      {/* ── Labels Section ───────────────────────────────────────────── */}
      <div className="bg-card/40 border border-border/50 rounded-xl p-4">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
          {t("workspace.label_labels")}
        </p>
        <button
          type="button"
          onClick={() => toast.info(t("workspace.label_add_label"))}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("workspace.label_add_label")}
        </button>
      </div>

      {/* ── Project Section (Clickable navigation to parent plan) ───── */}
      <div className="bg-card/40 border border-border/50 rounded-xl p-4">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
          {t("workspace.label_project")}
        </p>
        {task.parentTaskId ? (
          <Link
            href={`/workspace/plans/${task.parentTaskId}`}
            className="flex items-center gap-2 text-xs text-foreground hover:text-primary transition-colors group cursor-pointer"
            title={task.obsidianRef ?? t("workspace.label_parent_plan")}
          >
            <FolderOpen className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-medium truncate underline-offset-2 group-hover:underline">
              {task.obsidianRef ?? t("workspace.label_parent_plan")}
            </span>
          </Link>
        ) : task.type === "PROJECT" ? (
          <div className="flex items-center gap-2 text-xs text-foreground">
            <FolderOpen className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-medium truncate">{task.obsidianRef ?? task.title}</span>
          </div>
        ) : task.obsidianRef ? (
          <div className="flex items-center gap-2 text-xs text-foreground">
            <FolderOpen className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-medium truncate">{task.obsidianRef}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">{t("workspace.label_no_project")}</span>
        )}
      </div>

      {/* ── Spatial GIS Location Preview (Dynamic Auto-detect) ─────── */}
      <TaskSpatialMiniMap
        latitude={task.latitude}
        longitude={task.longitude}
        assetCode={task.assetCode}
        textContext={`${task.title} ${task.description ?? ""}`}
        title={task.title}
      />
    </div>
  );
}

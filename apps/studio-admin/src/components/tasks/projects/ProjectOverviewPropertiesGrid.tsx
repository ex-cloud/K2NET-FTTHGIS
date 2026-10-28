import { Flame, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { type Task } from "@/hooks/useTasksQuery";
import { type TeamUser } from "@/hooks/useTeamUsers";
import { LinearDatePicker } from "@/components/tasks/LinearDatePicker";
import { cn } from "@/lib/utils";

interface ProjectOverviewPropertiesGridProps {
  status: string;
  setStatus: (status: string) => void;
  priority: string;
  setPriority: (priority: string) => void;
  assigneeId: string | null;
  setAssigneeId: (assigneeId: string | null) => void;
  dueDate?: string;
  setDueDate?: (dueDate: string | undefined) => void;
  teamUsers: TeamUser[];
  progressPercent?: number;
  resolvedIssuesCount?: number;
  totalIssuesCount?: number;
  onSaveField: (fields: Partial<Task>) => Promise<void>;
  referenceType?: string;
  className?: string;
}

const TASK_PRIORITY_OPTIONS = [
  { id: "URGENT", label: "Urgent", color: "text-destructive" },
  { id: "HIGH", label: "High", color: "text-amber-500" },
  { id: "NORMAL", label: "Normal", color: "text-foreground" },
  { id: "LOW", label: "Low", color: "text-muted-foreground" },
];

function getPlanLifecycleOptions(t: (k: string) => string) {
  return [
    { id: "TODO", label: t("workspace.lifecycle_draft"), dotColor: "bg-muted-foreground" },
    { id: "WAITING_ON_CLIENT", label: t("workspace.lifecycle_in_review"), dotColor: "bg-purple-500" },
    { id: "RESOLVED", label: t("workspace.lifecycle_approved"), dotColor: "bg-primary" },
    { id: "CLOSED", label: t("workspace.lifecycle_superseded"), dotColor: "bg-amber-500" },
  ];
}

function getIdeaLifecycleOptions(t: (k: string) => string) {
  return [
    { id: "TODO", label: t("workspace.lifecycle_proposed"), dotColor: "bg-purple-500" },
    { id: "IN_PROGRESS", label: t("workspace.lifecycle_discussion"), dotColor: "bg-blue-500" },
    { id: "RESOLVED", label: t("workspace.lifecycle_accepted"), dotColor: "bg-primary" },
    { id: "CLOSED", label: t("workspace.lifecycle_declined"), dotColor: "bg-destructive" },
  ];
}

function getManualProjectOptions(t: (k: string) => string) {
  return [
    { id: "BACKLOG", label: t("workspace.status_planned"), dotColor: "bg-cyan-500" },
    { id: "IN_PROGRESS", label: t("workspace.status_in_progress"), dotColor: "bg-amber-500" },
    { id: "RESOLVED", label: t("workspace.status_completed"), dotColor: "bg-primary" },
  ];
}

function computeProjectStatus(
  status: string,
  progressPercent: number,
  totalIssuesCount: number,
  t: (k: string) => string
) {
  if (totalIssuesCount > 0) {
    if (progressPercent === 100) {
      return {
        label: t("workspace.status_completed"),
        dotColor: "bg-primary",
        textColor: "text-primary",
        isComputed: true,
      };
    }
    if (progressPercent > 0) {
      return {
        label: t("workspace.status_in_progress"),
        dotColor: "bg-amber-500",
        textColor: "text-amber-500",
        isComputed: true,
      };
    }
    return {
      label: t("workspace.status_planned"),
      dotColor: "bg-cyan-500",
      textColor: "text-cyan-500",
      isComputed: true,
    };
  }

  if (status === "RESOLVED" || status === "CLOSED") {
    return {
      label: t("workspace.status_completed"),
      dotColor: "bg-primary",
      textColor: "text-primary",
      isComputed: false,
    };
  }
  if (status === "IN_PROGRESS") {
    return {
      label: t("workspace.status_in_progress"),
      dotColor: "bg-amber-500",
      textColor: "text-amber-500",
      isComputed: false,
    };
  }
  return {
    label: t("workspace.status_planned"),
    dotColor: "bg-cyan-500",
    textColor: "text-cyan-500",
    isComputed: false,
  };
}

interface StatusControlProps {
  docType: string;
  status: string;
  setStatus: (status: string) => void;
  totalIssuesCount: number;
  projectStatus: {
    label: string;
    dotColor: string;
    textColor: string;
    isComputed: boolean;
  };
  onSaveField: (fields: Partial<Task>) => Promise<void>;
  t: (k: string) => string;
}

function StatusControl({
  docType,
  status,
  setStatus,
  totalIssuesCount,
  projectStatus,
  onSaveField,
  t,
}: StatusControlProps) {
  if (docType === "DOC") {
    return (
      <div className="p-2 rounded-lg bg-background/40 border border-border/30">
        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
          {t("workspace.label_type")}
        </span>
        <div className="mt-1 font-semibold flex items-center gap-1.5 text-foreground">
          <div className="w-2 h-2 rounded-full shrink-0 bg-blue-500" />
          <span className="truncate text-blue-400 font-bold">
            {t("workspace.doc_metadata_wiki")}
          </span>
        </div>
      </div>
    );
  }

  if (docType === "PROJECT" && totalIssuesCount > 0) {
    return (
      <div
        className="p-2 rounded-lg bg-background/50 border border-border/40"
        title={t("workspace.status_computed_hint")}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
            {t("tasks.status")}
          </span>
          <Sparkles className="w-2.5 h-2.5 text-primary" />
        </div>
        <div className="mt-1 font-semibold flex items-center gap-1.5">
          <div className={cn("w-2 h-2 rounded-full shrink-0", projectStatus.dotColor)} />
          <span className={cn("truncate font-bold", projectStatus.textColor)}>
            {projectStatus.label}
          </span>
        </div>
      </div>
    );
  }

  const isPlan = docType === "PLAN";
  const isIdea = docType === "IDEA";
  const options = isPlan
    ? getPlanLifecycleOptions(t)
    : isIdea
    ? getIdeaLifecycleOptions(t)
    : getManualProjectOptions(t);

  const activeOption = options.find((o) => o.id === status);
  const activeLabel = activeOption?.label || (isPlan ? t("workspace.lifecycle_draft") : isIdea ? t("workspace.lifecycle_proposed") : projectStatus.label);
  const activeDot = activeOption?.dotColor || (isPlan ? "bg-muted-foreground" : isIdea ? "bg-purple-500" : projectStatus.dotColor);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="cursor-pointer hover:bg-muted/40 p-2 rounded-lg transition-colors border border-transparent hover:border-border/40">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
            {t("tasks.status")}
          </span>
          <div className="mt-1 font-semibold flex items-center gap-1.5 text-foreground">
            <div className={cn("w-2 h-2 rounded-full shrink-0", activeDot)} />
            <span className="truncate">{activeLabel}</span>
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 z-[100]">
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.id}
            onClick={() => {
              setStatus(opt.id);
              onSaveField({ status: opt.id });
            }}
            className={cn(
              "text-xs cursor-pointer flex items-center gap-2",
              status === opt.id ? "bg-primary/10 text-primary font-bold" : ""
            )}
          >
            <div className={cn("w-2 h-2 rounded-full", opt.dotColor)} />
            <span>{opt.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface AssigneeControlProps {
  assigneeId: string | null;
  setAssigneeId: (id: string | null) => void;
  teamUsers: TeamUser[];
  onSaveField: (fields: Partial<Task>) => Promise<void>;
  t: (k: string) => string;
}

function AssigneeControl({
  assigneeId,
  setAssigneeId,
  teamUsers,
  onSaveField,
  t,
}: AssigneeControlProps) {
  const currentLead = assigneeId
    ? teamUsers.find((u) => u.id === assigneeId || u.email === assigneeId)?.name || assigneeId.split("@")[0]
    : t("tasks.unassigned");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="cursor-pointer hover:bg-muted/40 p-2 rounded-lg transition-colors border border-transparent hover:border-border/40">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
            {t("projects.lead")}
          </span>
          <div className="mt-1 flex items-center gap-1.5 text-foreground truncate">
            <div className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[9px] font-bold flex items-center justify-center shrink-0">
              {assigneeId ? assigneeId.substring(0, 1).toUpperCase() : "?"}
            </div>
            <span className="truncate">{currentLead}</span>
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 max-h-56 overflow-y-auto z-[100]">
        <DropdownMenuItem
          onClick={() => {
            setAssigneeId(null);
            onSaveField({ assigneeId: undefined });
          }}
          className="text-xs text-muted-foreground cursor-pointer"
        >
          {t("tasks.unassigned")}
        </DropdownMenuItem>
        {teamUsers.map((u) => (
          <DropdownMenuItem
            key={u.id}
            onClick={() => {
              setAssigneeId(u.email);
              onSaveField({ assigneeId: u.email });
            }}
            className={cn(
              "text-xs cursor-pointer",
              assigneeId === u.email ? "bg-primary/10 text-primary font-bold" : ""
            )}
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[9px]">
                {(u.name || u.email).substring(0, 1).toUpperCase()}
              </div>
              <span className="truncate">{u.name || u.email}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ProjectOverviewPropertiesGrid({
  status,
  setStatus,
  priority,
  setPriority,
  assigneeId,
  setAssigneeId,
  dueDate,
  setDueDate,
  teamUsers,
  progressPercent = 0,
  resolvedIssuesCount = 0,
  totalIssuesCount = 0,
  onSaveField,
  referenceType = "PLAN",
  className,
}: ProjectOverviewPropertiesGridProps) {
  const { t } = useTranslation();
  const docType = referenceType.toUpperCase();
  const isProject = docType === "PROJECT";
  const projectStatus = computeProjectStatus(status, progressPercent, totalIssuesCount, t);

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-2.5 bg-card/60 border border-border/60 rounded-xl p-3 text-xs shadow-xs",
        className
      )}
    >
      {/* ── 1. Subtype-Aware Status / Lifecycle ───────────────────────── */}
      <StatusControl
        docType={docType}
        status={status}
        setStatus={setStatus}
        totalIssuesCount={totalIssuesCount}
        projectStatus={projectStatus}
        onSaveField={onSaveField}
        t={t}
      />

      {/* ── 2. Priority ──────────────────────────────────────────────── */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="cursor-pointer hover:bg-muted/40 p-2 rounded-lg transition-colors border border-transparent hover:border-border/40">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              {t("tasks.priority")}
            </span>
            <div className="mt-1 font-semibold flex items-center gap-1.5 text-foreground">
              <Flame
                className={cn(
                  "w-3.5 h-3.5 shrink-0",
                  priority === "URGENT"
                    ? "text-destructive"
                    : priority === "HIGH"
                    ? "text-amber-500"
                    : "text-muted-foreground"
                )}
              />
              <span className="truncate">{priority}</span>
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40 z-[100]">
          {TASK_PRIORITY_OPTIONS.map((pr) => (
            <DropdownMenuItem
              key={pr.id}
              onClick={() => {
                setPriority(pr.id);
                onSaveField({ priority: pr.id });
              }}
              className={cn(
                "text-xs cursor-pointer",
                priority === pr.id ? "bg-primary/10 text-primary font-bold" : ""
              )}
            >
              <span className={pr.color}>{pr.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ── 3. Lead / Author ─────────────────────────────────────────── */}
      <AssigneeControl
        assigneeId={assigneeId}
        setAssigneeId={setAssigneeId}
        teamUsers={teamUsers}
        onSaveField={onSaveField}
        t={t}
      />

      {/* ── 4. Target Date (Only for PROJECT) ─────────────────────────── */}
      {isProject && (
        <div className="p-2 rounded-lg hover:bg-muted/40 transition-colors border border-transparent hover:border-border/40 flex flex-col justify-center">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">
            {t("projects.target_date")}
          </span>
          <LinearDatePicker
            type="target"
            value={dueDate || undefined}
            onChange={(val) => {
              setDueDate?.(val);
              onSaveField({
                dueDate: val ? new Date(val).toISOString().slice(0, 19) : undefined,
              });
            }}
            buttonClassName="border-0 bg-transparent p-0 hover:bg-transparent text-xs font-mono font-semibold"
          />
        </div>
      )}

      {/* ── 5. Delivery Progress (PROJECT or if issues exist) ────────── */}
      {(isProject || totalIssuesCount > 0) && (
        <div className="p-2.5 rounded-lg bg-muted/20 border border-transparent flex flex-col justify-center col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              {t("projects.progress")}
            </span>
            <span className="text-[10px] font-mono font-bold text-foreground">{progressPercent}%</span>
          </div>
          <div className="mt-1.5 w-full h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
          <span className="text-[9px] text-muted-foreground font-mono mt-1">
            {t("projects.issues_resolved", {
              resolved: resolvedIssuesCount,
              total: totalIssuesCount,
            })}
          </span>
        </div>
      )}
    </div>
  );
}

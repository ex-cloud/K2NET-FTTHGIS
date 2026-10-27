import { Flame } from "lucide-react";
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

// Canonical Spring Boot backend TaskStatus enum alignment
const TASK_STATUS_OPTIONS = [
  { id: "BACKLOG", label: "Backlog", dotColor: "bg-cyan-500" },
  { id: "TODO", label: "To Do", dotColor: "bg-blue-500" },
  { id: "IN_PROGRESS", label: "In Progress", dotColor: "bg-amber-500" },
  { id: "WAITING_ON_CLIENT", label: "In Review / Waiting", dotColor: "bg-purple-500" },
  { id: "RESOLVED", label: "Resolved", dotColor: "bg-primary" },
  { id: "CLOSED", label: "Closed", dotColor: "bg-muted-foreground" },
];

const TASK_PRIORITY_OPTIONS = [
  { id: "URGENT", label: "Urgent", color: "text-destructive" },
  { id: "HIGH", label: "High", color: "text-amber-500" },
  { id: "NORMAL", label: "Normal", color: "text-foreground" },
  { id: "LOW", label: "Low", color: "text-muted-foreground" },
];

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
  referenceType: _referenceType,
  className,
}: ProjectOverviewPropertiesGridProps) {
  const { t } = useTranslation();

  const currentStatusObj = TASK_STATUS_OPTIONS.find(
    (o) => o.id === status || o.id === status?.toUpperCase()
  );

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-2.5 bg-card/60 border border-border/60 rounded-xl p-3 text-xs shadow-xs",
        className
      )}
    >
      {/* 1. Real Status (Canonical TaskStatus Enum) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="cursor-pointer hover:bg-muted/40 p-2 rounded-lg transition-colors border border-transparent hover:border-border/40">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              {t("tasks.status")}
            </span>
            <div className="mt-1 font-semibold flex items-center gap-1.5 text-foreground">
              <div
                className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  currentStatusObj?.dotColor ||
                    (status === "RESOLVED" || status === "CLOSED"
                      ? "bg-primary"
                      : status === "IN_PROGRESS"
                      ? "bg-amber-500"
                      : "bg-cyan-500")
                )}
              />
              <span className="truncate">{currentStatusObj?.label || status}</span>
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48 z-[100]">
          {TASK_STATUS_OPTIONS.map((opt) => (
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

      {/* 2. Priority (Canonical TaskPriority Enum) */}
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

      {/* 3. Lead / Assignee (Real Keycloak Team Users) */}
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
              <span className="truncate">
                {assigneeId
                  ? teamUsers.find((u) => u.id === assigneeId || u.email === assigneeId)?.name ||
                    assigneeId.split("@")[0]
                  : t("tasks.unassigned")}
              </span>
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

      {/* 4. Target Date (Real ISO Due Date) */}
      <div className="p-2 rounded-lg hover:bg-muted/40 transition-colors border border-transparent hover:border-border/40 flex flex-col justify-center">
        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">
          {t("projects.target_date")}
        </span>
        <LinearDatePicker
          type="target"
          value={dueDate || undefined}
          onChange={(val) => {
            setDueDate?.(val);
            onSaveField({ dueDate: val ? new Date(val).toISOString() : undefined });
          }}
          buttonClassName="border-0 bg-transparent p-0 hover:bg-transparent text-xs font-mono font-semibold"
        />
      </div>

      {/* 5. Delivery Progress (Real Calculations from Linked Issues) */}
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
    </div>
  );
}

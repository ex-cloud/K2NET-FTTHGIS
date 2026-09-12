import { Flame } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@k2net/ui";
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
}: ProjectOverviewPropertiesGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-card/50 border border-border/60 rounded-xl p-3 text-xs shadow-xs">
      {/* Status */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="cursor-pointer hover:bg-muted/40 p-2 rounded-lg transition-colors border border-transparent hover:border-border/40">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Status</span>
            <div className="mt-1 font-semibold flex items-center gap-1.5 text-foreground">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  status === "RESOLVED" || status === "CLOSED"
                    ? "bg-primary"
                    : status === "IN_PROGRESS"
                    ? "bg-amber-500"
                    : "bg-cyan-500"
                )}
              />
              <span>{status}</span>
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40 z-[100]">
          {["TODO", "PLANNED", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((st) => (
            <DropdownMenuItem
              key={st}
              onClick={() => {
                setStatus(st);
                onSaveField({ status: st });
              }}
              className={cn("text-xs cursor-pointer", status === st ? "bg-primary/10 text-primary font-bold" : "")}
            >
              {st}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Priority */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="cursor-pointer hover:bg-muted/40 p-2 rounded-lg transition-colors border border-transparent hover:border-border/40">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Priority</span>
            <div className="mt-1 font-semibold flex items-center gap-1.5 text-foreground">
              <Flame
                className={cn(
                  "w-3.5 h-3.5",
                  priority === "URGENT"
                    ? "text-destructive"
                    : priority === "HIGH"
                    ? "text-amber-500"
                    : "text-muted-foreground"
                )}
              />
              <span>{priority}</span>
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40 z-[100]">
          {["URGENT", "HIGH", "NORMAL", "LOW"].map((pr) => (
            <DropdownMenuItem
              key={pr}
              onClick={() => {
                setPriority(pr);
                onSaveField({ priority: pr });
              }}
              className={cn("text-xs cursor-pointer", priority === pr ? "bg-primary/10 text-primary font-bold" : "")}
            >
              {pr}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Lead */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="cursor-pointer hover:bg-muted/40 p-2 rounded-lg transition-colors border border-transparent hover:border-border/40">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Lead</span>
            <div className="mt-1 flex items-center gap-1.5 text-foreground truncate">
              <div className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[9px] font-bold flex items-center justify-center shrink-0">
                {assigneeId ? assigneeId.substring(0, 1).toUpperCase() : "?"}
              </div>
              <span className="truncate">{assigneeId ? assigneeId.split("@")[0] : "Unassigned"}</span>
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
            Unassigned
          </DropdownMenuItem>
          {teamUsers.map((u) => (
            <DropdownMenuItem
              key={u.id}
              onClick={() => {
                setAssigneeId(u.email);
                onSaveField({ assigneeId: u.email });
              }}
              className={cn("text-xs cursor-pointer", assigneeId === u.email ? "bg-primary/10 text-primary font-bold" : "")}
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[9px]">
                  {(u.name || u.email).substring(0, 1).toUpperCase()}
                </div>
                <span>{u.name || u.email}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Target Date */}
      <div className="p-2 rounded-lg hover:bg-muted/40 transition-colors border border-transparent hover:border-border/40 flex flex-col justify-center">
        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Target date</span>
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

      {/* Delivery Progress */}
      <div className="p-2 rounded-lg bg-muted/20 border border-transparent flex flex-col justify-center col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Progress</span>
          <span className="text-[10px] font-mono font-bold text-foreground">{progressPercent}%</span>
        </div>
        <div className="mt-1.5 w-full h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
        <span className="text-[9px] text-muted-foreground font-mono mt-1">
          {resolvedIssuesCount}/{totalIssuesCount} issues resolved
        </span>
      </div>
    </div>
  );
}

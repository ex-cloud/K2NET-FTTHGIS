import React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@k2net/ui";
import { User, AlertCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "./configs";
import { TaskLabelPicker } from "./TaskLabelPicker";
import { TaskProjectPicker } from "./TaskProjectPicker";
import { LinearDatePicker } from "./LinearDatePicker";

interface NewTaskPropertyPillsProps {
  status: string;
  setStatus: (status: string) => void;
  priority: "URGENT" | "HIGH" | "NORMAL" | "LOW";
  setPriority: (priority: "URGENT" | "HIGH" | "NORMAL" | "LOW") => void;
  assigneeId: string;
  setAssigneeId: (assigneeId: string) => void;
  assigneesList: string[];
  selectedProject: string | null;
  setSelectedProject: (project: string | null) => void;
  projectsList: string[];
  dueDate: string;
  setDueDate: (date: string) => void;
  selectedLabels: string[];
  setSelectedLabels: (labels: string[]) => void;
}

export const NewTaskPropertyPills: React.FC<NewTaskPropertyPillsProps> = ({
  status,
  setStatus,
  priority,
  setPriority,
  assigneeId,
  setAssigneeId,
  assigneesList,
  selectedProject,
  setSelectedProject,
  projectsList,
  dueDate,
  setDueDate,
  selectedLabels,
  setSelectedLabels,
}) => {
  const currentStatus = STATUS_CONFIG[status] ?? STATUS_CONFIG.TODO;
  const StatusIcon = currentStatus.icon;

  return (
    <div className="px-5 py-3 border-t border-border/50 bg-background/30 flex flex-wrap items-center gap-2">
      {/* 1. Status Pill */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border border-border/60 bg-card hover:bg-muted/50 transition-colors",
              currentStatus.className
            )}
          >
            <StatusIcon className="h-3 w-3 shrink-0" />
            <span>{currentStatus.label}</span>
            <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-36 z-[100] p-1">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <DropdownMenuItem
                key={key}
                onClick={() => setStatus(key)}
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

      {/* 2. Priority Pill */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border border-border/60 bg-card hover:bg-muted/50 transition-colors",
              PRIORITY_CONFIG[priority]?.className ?? "text-muted-foreground"
            )}
          >
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>{PRIORITY_CONFIG[priority]?.label ?? priority}</span>
            <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-32 z-[100] p-1">
          {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
            <DropdownMenuItem
              key={key}
              onClick={() => setPriority(key as "URGENT" | "HIGH" | "NORMAL" | "LOW")}
              className={cn(
                "flex items-center gap-2 text-xs py-1.5 px-2.5 rounded-md cursor-pointer",
                priority === key ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted/50 text-foreground"
              )}
            >
              <span className={cn("text-xs font-bold", cfg.className.split(" ")[0])}>{cfg.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 3. Assignee Pill */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-xs text-foreground font-medium px-2.5 py-1 rounded-lg border border-border/60 bg-card hover:bg-muted/50 transition-colors"
          >
            <User className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="truncate max-w-[100px]">
              {assigneeId ? assigneeId.split("@")[0] : "Assignee"}
            </span>
            <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-44 z-[100] p-1">
          <DropdownMenuItem
            onClick={() => setAssigneeId("")}
            className={cn(
              "text-xs py-1.5 px-2.5 rounded-md cursor-pointer",
              !assigneeId ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground"
            )}
          >
            Unassigned
          </DropdownMenuItem>
          {assigneesList.map((uid) => (
            <DropdownMenuItem
              key={uid}
              onClick={() => setAssigneeId(uid)}
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

      {/* 4. Project Pill */}
      <TaskProjectPicker
        selectedProject={selectedProject}
        projectsList={projectsList}
        onChange={setSelectedProject}
      />

      {/* 5. Due Date Pill */}
      <LinearDatePicker
        type="due"
        value={dueDate}
        onChange={(d) => setDueDate(d || "")}
      />

      {/* 6. Labels Pill */}
      <TaskLabelPicker
        selectedLabelIds={selectedLabels}
        onChange={setSelectedLabels}
      />
    </div>
  );
};

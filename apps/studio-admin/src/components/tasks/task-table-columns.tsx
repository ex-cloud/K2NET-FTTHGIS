import React from "react";
import { createColumnHelper } from "@tanstack/react-table";
import {
  Calendar as CalendarIcon,
  User,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Calendar,
} from "@k2net/ui";
import { type Task } from "@/hooks/useTasksQuery";
import { cn } from "@/lib/utils";
import { ScopeBadge } from "./ScopeBadge";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "./configs";

const columnHelper = createColumnHelper<Task>();

interface PriorityCellProps {
  task: Task;
  onUpdateTask: (id: string, fields: Partial<Task>) => void;
}

export const PriorityCell: React.FC<PriorityCellProps> = ({ task, onUpdateTask }) => {
  const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.NORMAL;
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "text-xs px-2 py-1 rounded-md font-semibold flex items-center gap-1 border border-transparent hover:border-border transition-all",
              priority.className
            )}
          >
            <span>{priority.label}</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[120px]">
          {Object.keys(PRIORITY_CONFIG).map((pKey) => (
            <DropdownMenuItem
              key={pKey}
              onClick={() => onUpdateTask(task.id, { priority: pKey })}
              className="text-xs font-semibold cursor-pointer"
            >
              {PRIORITY_CONFIG[pKey].label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

interface StatusCellProps {
  task: Task;
  onUpdateTask: (id: string, fields: Partial<Task>) => void;
}

export const StatusCell: React.FC<StatusCellProps> = ({ task, onUpdateTask }) => {
  const status = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.TODO;
  const StatusIcon = status.icon;
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-transparent hover:border-border transition-all",
              status.className
            )}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            <span>{status.label}</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[150px]">
          {Object.keys(STATUS_CONFIG).map((sKey) => {
            const val = STATUS_CONFIG[sKey];
            const Icon = val.icon;
            return (
              <DropdownMenuItem
                key={sKey}
                onClick={() => onUpdateTask(task.id, { status: sKey })}
                className="text-xs flex items-center gap-2 cursor-pointer"
              >
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{val.label}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

interface AssigneeCellProps {
  task: Task;
  assigneesList: string[];
  onUpdateTask: (id: string, fields: Partial<Task>) => void;
}

export const AssigneeCell: React.FC<AssigneeCellProps> = ({
  task,
  assigneesList,
  onUpdateTask,
}) => (
  <div onClick={(e) => e.stopPropagation()}>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-border/80 bg-card hover:bg-muted text-foreground transition-all font-mono">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{task.assigneeId ? `…${task.assigneeId.slice(-8)}` : "Assignee"}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[160px] max-h-[220px] overflow-y-auto">
        <DropdownMenuItem
          onClick={() => onUpdateTask(task.id, { assigneeId: undefined })}
          className="text-xs text-muted-foreground italic cursor-pointer"
        >
          Unassigned
        </DropdownMenuItem>
        {assigneesList.map((id) => (
          <DropdownMenuItem
            key={id}
            onClick={() => onUpdateTask(task.id, { assigneeId: id })}
            className="text-xs font-mono cursor-pointer"
          >
            {`…${id.slice(-8)}`}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
);

interface DueDateCellProps {
  task: Task;
  onUpdateTask: (id: string, fields: Partial<Task>) => void;
}

export const DueDateCell: React.FC<DueDateCellProps> = ({ task, onUpdateTask }) => {
  const formattedDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "2-digit",
      })
    : "Set Date";

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition-all whitespace-nowrap",
              task.dueDate
                ? "border-border bg-card text-foreground"
                : "border-dashed border-border text-muted-foreground hover:bg-muted"
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{formattedDate}</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="p-0 border border-border shadow-xl">
          <Calendar
            mode="single"
            selected={task.dueDate ? new Date(task.dueDate) : undefined}
            onSelect={(date) => {
              onUpdateTask(task.id, {
                dueDate: date ? date.toISOString() : undefined,
              });
            }}
            className="bg-card rounded-xl"
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

interface GetTaskTableColumnsParams {
  tasks: Task[];
  selectedTaskIds?: Set<string>;
  onSelectAllTasks?: () => void;
  onToggleSelectTask?: (id: string, shiftKey?: boolean) => void;
  onUpdateTask: (id: string, fields: Partial<Task>) => void;
  assigneesList: string[];
  onNavigate: (path: string) => void;
}

export function getTaskTableColumns({
  tasks,
  selectedTaskIds,
  onSelectAllTasks,
  onToggleSelectTask,
  onUpdateTask,
  assigneesList,
  onNavigate,
}: GetTaskTableColumnsParams) {
  return [
    columnHelper.display({
      id: "select",
      header: () => (
        <div className="flex items-center justify-center w-full">
          <input
            type="checkbox"
            checked={tasks.length > 0 && selectedTaskIds?.size === tasks.length}
            onChange={() => onSelectAllTasks?.()}
            className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary/40 cursor-pointer accent-primary"
          />
        </div>
      ),
      cell: (info) => {
        const taskId = info.row.original.id;
        const isSelected = selectedTaskIds?.has(taskId);
        return (
          <div
            className="flex items-center justify-center w-full h-full cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelectTask?.(taskId, e.shiftKey);
            }}
          >
            <input
              type="checkbox"
              checked={Boolean(isSelected)}
              onChange={(e) => {
                e.stopPropagation();
                const shift = "shiftKey" in e.nativeEvent ? Boolean((e.nativeEvent as MouseEvent).shiftKey) : false;
                onToggleSelectTask?.(taskId, shift);
              }}
              className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary/40 cursor-pointer accent-primary pointer-events-auto"
            />
          </div>
        );
      },
    }),
    columnHelper.accessor("title", {
      header: "Title",
      cell: (info) => {
        const task = info.row.original;
        const isProjectRef = task.obsidianRef?.startsWith("PRJ-") || Boolean(task.parentTaskId);
        return (
          <div className="min-w-0 flex items-center gap-2">
            <span className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">
              {task.title}
            </span>
            {task.obsidianRef && (
              <span
                onClick={(e) => {
                  if (isProjectRef) {
                    e.stopPropagation();
                    const target = task.parentTaskId ? `/tasks/projects/${task.parentTaskId}` : `/tasks/projects`;
                    onNavigate(target);
                  }
                }}
                className={cn(
                  "text-[10px] font-mono px-1.5 py-0.5 rounded-md shrink-0 transition-colors",
                  isProjectRef
                    ? "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/30 cursor-pointer"
                    : "text-muted-foreground bg-muted/50 border border-border/40"
                )}
                title={isProjectRef ? "Buka detail project terkait" : undefined}
              >
                {task.obsidianRef}
              </span>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor("scope", {
      header: "Scope",
      cell: (info) => <ScopeBadge scope={info.getValue()} />,
    }),
    columnHelper.accessor("type", {
      header: "Type",
      cell: (info) => {
        const rawType = info.getValue();
        const label = rawType === "TICKET" ? "ISSUE" : rawType;
        return (
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold uppercase tracking-wider whitespace-nowrap">
            {label}
          </span>
        );
      },
    }),
    columnHelper.accessor("priority", {
      header: "Priority",
      cell: (info) => <PriorityCell task={info.row.original} onUpdateTask={onUpdateTask} />,
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => <StatusCell task={info.row.original} onUpdateTask={onUpdateTask} />,
    }),
    columnHelper.accessor("assigneeId", {
      header: "Assignee",
      cell: (info) => (
        <AssigneeCell
          task={info.row.original}
          assigneesList={assigneesList}
          onUpdateTask={onUpdateTask}
        />
      ),
    }),
    columnHelper.accessor("dueDate", {
      header: "Due Date",
      cell: (info) => <DueDateCell task={info.row.original} onUpdateTask={onUpdateTask} />,
    }),
    columnHelper.accessor("createdAt", {
      header: "Created",
      cell: (info) => {
        const val = info.getValue();
        if (!val) return <span className="text-muted-foreground/50 text-xs">-</span>;
        return (
          <span className="text-xs text-muted-foreground whitespace-nowrap font-mono">
            {new Date(val).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
            })}
          </span>
        );
      },
    }),
  ];
}

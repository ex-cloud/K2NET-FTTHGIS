import React from "react";
import { Link } from "@/lib/navigation-compat";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Loader2,
  Trash2,
  User,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@k2net/ui";
import { type Task } from "@/hooks/useTasksQuery";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "./configs";
import { cn } from "@/lib/utils";
import { useTaskSubIssues } from "./use-task-sub-issues";

function LinearProgressCircle({ completed, total }: { completed: number; total: number }) {
  if (total === 0) return null;
  const percentage = Math.min(100, Math.round((completed / total) * 100));
  const radius = 4.5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const isComplete = completed === total && total > 0;

  return (
    <svg className="w-3.5 h-3.5 -rotate-90 shrink-0" viewBox="0 0 12 12">
      <circle
        cx="6"
        cy="6"
        r={radius}
        className="stroke-muted-foreground/30 fill-none"
        strokeWidth="1.5"
      />
      <circle
        cx="6"
        cy="6"
        r={radius}
        className={cn(
          "fill-none transition-all duration-300",
          isComplete
            ? "stroke-green-500"
            : percentage > 0
            ? "stroke-primary"
            : "stroke-transparent"
        )}
        strokeWidth="1.5"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
      />
    </svg>
  );
}

interface SubIssueRowProps {
  sub: Task;
  onToggleStatus: (sub: Task) => void;
  onDelete: (id: string) => void;
}

const SubIssueRow: React.FC<SubIssueRowProps> = ({ sub, onToggleStatus, onDelete }) => {
  const isDone = sub.status === "RESOLVED" || sub.status === "CLOSED";
  const StatusIcon = STATUS_CONFIG[sub.status]?.icon ?? STATUS_CONFIG.TODO.icon;

  return (
    <div className="group flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/30 transition-colors border border-transparent hover:border-border/40">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onToggleStatus(sub)}
          className={cn(
            "shrink-0 p-0.5 rounded hover:bg-muted transition-colors",
            isDone ? "text-green-500" : "text-muted-foreground"
          )}
          title={`Status: ${sub.status} (Click to toggle)`}
        >
          <StatusIcon className="h-3.5 w-3.5" />
        </button>

        <Link
          href={`/tasks/${sub.id}`}
          className={cn(
            "text-xs truncate transition-colors hover:text-primary",
            isDone ? "line-through text-muted-foreground/60" : "text-foreground"
          )}
        >
          {sub.title}
        </Link>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {sub.priority && sub.priority !== "NORMAL" && (
          <span
            className={cn(
              "text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold",
              PRIORITY_CONFIG[sub.priority]?.className ?? ""
            )}
          >
            {sub.priority}
          </span>
        )}

        <div className="w-4 h-4 rounded-full bg-muted/60 text-muted-foreground flex items-center justify-center text-[9px] font-mono">
          {sub.assigneeId ? (
            sub.assigneeId.substring(0, 1).toUpperCase()
          ) : (
            <User className="h-2.5 w-2.5" />
          )}
        </div>

        <button
          type="button"
          onClick={() => onDelete(sub.id)}
          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground/50 hover:text-destructive transition-all rounded"
          title="Delete sub-issue"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

interface CreationFormProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  newTitle: string;
  setNewTitle: (t: string) => void;
  newStatus: string;
  setNewStatus: (s: string) => void;
  newPriority: string;
  setNewPriority: (p: string) => void;
  creating: boolean;
  onCreate: () => void;
  onCancel: () => void;
}

const CreationForm: React.FC<CreationFormProps> = ({
  inputRef,
  newTitle,
  setNewTitle,
  newStatus,
  setNewStatus,
  newPriority,
  setNewPriority,
  creating,
  onCreate,
  onCancel,
}) => (
  <div className="mt-2 p-2.5 rounded-xl border border-border/80 bg-card/60 space-y-2.5 shadow-sm animate-in fade-in-50 slide-in-from-top-1 duration-150">
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="text"
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onCreate();
          } else if (e.key === "Escape") {
            onCancel();
          }
        }}
        placeholder="Issue title..."
        className="flex-1 text-xs bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/40 focus:ring-0"
      />
    </div>

    <div className="flex items-center justify-between pt-1 border-t border-border/40">
      <div className="flex items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              {STATUS_CONFIG[newStatus]?.label ?? newStatus}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-36">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const Icon = cfg.icon;
              return (
                <DropdownMenuItem
                  key={key}
                  onClick={() => setNewStatus(key)}
                  className="flex items-center justify-between text-xs cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5" />
                    <span>{cfg.label}</span>
                  </div>
                  {newStatus === key && <Check className="h-3 w-3 text-primary" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              {newPriority}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-32">
            {Object.keys(PRIORITY_CONFIG).map((p) => (
              <DropdownMenuItem
                key={p}
                onClick={() => setNewPriority(p)}
                className="flex items-center justify-between text-xs cursor-pointer"
              >
                <span>{p}</span>
                {newPriority === p && <Check className="h-3 w-3 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onCancel}
          className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onCreate}
          disabled={!newTitle.trim() || creating}
          className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
        >
          {creating && <Loader2 className="h-3 w-3 animate-spin" />}
          <span>Create</span>
        </button>
      </div>
    </div>
  </div>
);

interface TaskSubIssuesSectionProps {
  parentTask: Task;
  onCountChange?: (count: number) => void;
}

export function TaskSubIssuesSection({
  parentTask,
  onCountChange,
}: TaskSubIssuesSectionProps) {
  const subState = useTaskSubIssues({ parentTask, onCountChange });

  if (subState.totalCount === 0 && !subState.isAdding) {
    return (
      <div className="pt-2">
        <button
          type="button"
          onClick={() => {
            subState.setIsExpanded(true);
            subState.setIsAdding(true);
          }}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 group"
        >
          <Plus className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span>Add sub-issues</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 pt-2">
      <div className="flex items-center justify-between py-1 group/hdr">
        <button
          type="button"
          onClick={() => subState.setIsExpanded(!subState.isExpanded)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {subState.isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
          <span>Sub-issues</span>

          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-full ml-1 transition-colors",
              subState.isAllComplete
                ? "bg-green-500/10 text-green-500 font-semibold"
                : "bg-muted/50 text-muted-foreground"
            )}
          >
            <LinearProgressCircle completed={subState.resolvedCount} total={subState.totalCount} />
            <span>
              {subState.resolvedCount}/{subState.totalCount}
            </span>
          </span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              subState.setIsExpanded(true);
              subState.setIsAdding(true);
            }}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Add sub-issue"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {subState.isExpanded && (
        <div className="space-y-1 pl-1">
          {subState.subIssues.map((sub) => (
            <SubIssueRow
              key={sub.id}
              sub={sub}
              onToggleStatus={subState.handleToggleStatus}
              onDelete={subState.handleDeleteSubIssue}
            />
          ))}

          {subState.isAdding && (
            <CreationForm
              inputRef={subState.inputRef}
              newTitle={subState.newTitle}
              setNewTitle={subState.setNewTitle}
              newStatus={subState.newStatus}
              setNewStatus={subState.setNewStatus}
              newPriority={subState.newPriority}
              setNewPriority={subState.setNewPriority}
              creating={subState.creating}
              onCreate={subState.handleCreateSubIssue}
              onCancel={() => {
                subState.setIsAdding(false);
                subState.setNewTitle("");
              }}
            />
          )}

          {!subState.isAdding && (
            <button
              type="button"
              onClick={() => subState.setIsAdding(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 pl-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add sub-issue</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

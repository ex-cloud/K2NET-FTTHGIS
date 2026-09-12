import { Box } from "lucide-react";
import { type Task } from "@/hooks/useTasksQuery";
import { type TeamUser } from "@/hooks/useTeamUsers";
import { ProjectOverviewPropertiesGrid } from "./ProjectOverviewPropertiesGrid";
import { ProjectOverviewSummaryCard } from "./ProjectOverviewSummaryCard";
import { ProjectOverviewPlanEditor } from "./ProjectOverviewPlanEditor";

interface ProjectOverviewTabProps {
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (desc: string) => void;
  status: string;
  setStatus: (status: string) => void;
  priority: string;
  setPriority: (priority: string) => void;
  assigneeId: string | null;
  setAssigneeId: (assigneeId: string | null) => void;
  dueDate?: string;
  setDueDate?: (dueDate: string | undefined) => void;
  healthStatus: "On track" | "At risk" | "Off track";
  projectTask: Task;
  teamUsers: TeamUser[];
  progressPercent?: number;
  resolvedIssuesCount?: number;
  totalIssuesCount?: number;
  onSaveField: (fields: Partial<Task>) => Promise<void>;
}

export function ProjectOverviewTab({
  title,
  setTitle,
  description,
  setDescription,
  status,
  setStatus,
  priority,
  setPriority,
  assigneeId,
  setAssigneeId,
  dueDate,
  setDueDate,
  healthStatus,
  projectTask,
  teamUsers,
  progressPercent = 0,
  resolvedIssuesCount = 0,
  totalIssuesCount = 0,
  onSaveField,
}: ProjectOverviewTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-150">
      {/* ── 1. Project Title & Identifier Header ─────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 shadow-sm">
            <Box className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                if (title.trim() && title.trim() !== projectTask.title) {
                  onSaveField({ title: title.trim() });
                }
              }}
              placeholder="Project plan title..."
              className="text-2xl font-bold text-foreground bg-transparent border-0 outline-none w-full tracking-tight hover:bg-muted/20 px-2 py-1 rounded-lg transition-colors"
            />
          </div>
          {projectTask.obsidianRef && (
            <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-secondary/80 text-foreground border border-border/50 shrink-0">
              {projectTask.obsidianRef}
            </span>
          )}
        </div>
      </div>

      {/* ── 2. Interactive Properties Bar ────────────────────────────── */}
      <ProjectOverviewPropertiesGrid
        status={status}
        setStatus={setStatus}
        priority={priority}
        setPriority={setPriority}
        assigneeId={assigneeId}
        setAssigneeId={setAssigneeId}
        dueDate={dueDate}
        setDueDate={setDueDate}
        teamUsers={teamUsers}
        progressPercent={progressPercent}
        resolvedIssuesCount={resolvedIssuesCount}
        totalIssuesCount={totalIssuesCount}
        onSaveField={onSaveField}
      />

      {/* ── 3. Executive Summary / Latest Update Card ────────────────── */}
      <ProjectOverviewSummaryCard
        healthStatus={healthStatus}
        assigneeId={assigneeId}
        projectTask={projectTask}
      />

      {/* ── 4. TipTap Rich Headless Markdown Document ─────────────────── */}
      <ProjectOverviewPlanEditor
        description={description}
        setDescription={setDescription}
        onSaveField={onSaveField}
      />
    </div>
  );
}

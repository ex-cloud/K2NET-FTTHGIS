import { Box, FileText, Lightbulb, BookOpen, FolderKanban } from "lucide-react";
import { type Task, type TaskComment } from "@/hooks/useTasksQuery";
import { type TeamUser } from "@/hooks/useTeamUsers";
import { useTranslation } from "@k2net/i18n";
import { cn } from "@/lib/utils";
import { ProjectOverviewPropertiesGrid } from "./ProjectOverviewPropertiesGrid";
import { ProjectOverviewSummaryCard } from "./ProjectOverviewSummaryCard";
import { ProjectOverviewPlanEditor } from "./ProjectOverviewPlanEditor";
import { WorkspaceSubtypeInspectorCard } from "./WorkspaceSubtypeInspectorCard";

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
  projectIssues?: Task[];
  comments?: TaskComment[];
  onSaveField: (fields: Partial<Task>) => Promise<void>;
  onOpenNewIssue?: () => void;
  onNavigateTab?: (tab: "overview" | "activity" | "issues") => void;
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
  projectIssues = [],
  comments = [],
  onSaveField,
  onOpenNewIssue,
  onNavigateTab,
}: ProjectOverviewTabProps) {
  const { t } = useTranslation();

  // Deduce workspace document subtype
  let docType: "PLAN" | "IDEA" | "DOC" | "PROJECT" = "PLAN";
  const ref = projectTask.obsidianRef?.toUpperCase() || "";
  const rType = projectTask.referenceType?.toUpperCase() || "";

  if (rType === "IDEA" || ref.startsWith("IDEA-") || ref.startsWith("RFC-")) {
    docType = "IDEA";
  } else if (rType === "DOC" || ref.startsWith("DOC-") || ref.startsWith("WIKI-")) {
    docType = "DOC";
  } else if (rType === "PROJECT" || ref.startsWith("PRJ-")) {
    docType = "PROJECT";
  } else {
    docType = "PLAN";
  }

  // Dynamic icon and theme for document title
  let TypeIcon = Box;
  let iconContainerClass = "bg-primary/10 border-primary/20 text-primary";
  let specTitle = t("workspace.plan_spec_title");
  let specDesc = t("workspace.plan_spec_desc");

  if (docType === "IDEA") {
    TypeIcon = Lightbulb;
    iconContainerClass = "bg-purple-500/10 border-purple-500/20 text-purple-400";
    specTitle = t("workspace.idea_spec_title");
    specDesc = t("workspace.idea_spec_desc");
  } else if (docType === "DOC") {
    TypeIcon = BookOpen;
    iconContainerClass = "bg-blue-500/10 border-blue-500/20 text-blue-400";
    specTitle = t("workspace.doc_spec_title");
    specDesc = t("workspace.doc_spec_desc");
  } else if (docType === "PROJECT") {
    TypeIcon = FolderKanban;
    iconContainerClass = "bg-amber-500/10 border-amber-500/20 text-amber-400";
    specTitle = t("workspace.project_spec_title");
    specDesc = t("workspace.project_spec_desc");
  } else {
    TypeIcon = FileText;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full animate-in fade-in-50 duration-150">
      {/* ── Left Column: Title & Full-Width Markdown Document ──────── */}
      <div className="flex-1 min-w-0 space-y-4 w-full flex flex-col">
        {/* 1. Document Title Header (First item, no duplicate obsidianRef) */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs border transition-colors",
              iconContainerClass
            )}
          >
            <TypeIcon className="w-5 h-5" />
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
              placeholder={t("workspace.title_placeholder")}
              className="text-2xl font-bold text-foreground bg-transparent border-0 outline-none w-full tracking-tight hover:bg-muted/20 px-2 py-1 rounded-lg transition-colors"
            />
          </div>
        </div>

        {/* 2. Dynamic Specification Editor */}
        <ProjectOverviewPlanEditor
          description={description}
          setDescription={setDescription}
          onSaveField={onSaveField}
          title={specTitle}
          subtitle={specDesc}
        />
      </div>

      {/* ── Right Column: Properties, Summary & Inspector Cards ──────── */}
      <div className="w-full lg:w-80 xl:w-96 shrink-0 space-y-4">
        {/* 1. Interactive Properties Panel (100% Real TaskStatus & TaskPriority) */}
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
          referenceType={docType}
        />

        {/* 2. Executive Status Summary Card (100% Real Latest Update from DB) */}
        <ProjectOverviewSummaryCard
          healthStatus={healthStatus}
          assigneeId={assigneeId}
          projectTask={projectTask}
          comments={comments}
          teamUsers={teamUsers}
          onNavigateToActivity={() => onNavigateTab?.("activity")}
        />

        {/* 3. Subtype-Specific Inspector Card (100% Real Subtasks & Telemetry) */}
        <WorkspaceSubtypeInspectorCard
          type={docType}
          projectTask={projectTask}
          projectIssues={projectIssues}
          resolvedIssuesCount={resolvedIssuesCount}
          totalIssuesCount={totalIssuesCount}
          progressPercent={progressPercent}
          teamUsers={teamUsers}
          onOpenNewIssue={onOpenNewIssue}
          onNavigateToIssues={() => onNavigateTab?.("issues")}
        />
      </div>
    </div>
  );
}

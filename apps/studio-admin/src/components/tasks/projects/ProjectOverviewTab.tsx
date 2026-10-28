import { Layers, MessageSquare, Plus } from "lucide-react";
import { type Task, type TaskComment } from "@/hooks/useTasksQuery";
import { type TeamUser } from "@/hooks/useTeamUsers";
import { useTranslation } from "@k2net/i18n";
import { ProjectOverviewPropertiesGrid } from "./ProjectOverviewPropertiesGrid";
import { ProjectOverviewPlanEditor } from "./ProjectOverviewPlanEditor";
import { WorkspaceSubtypeInspectorCard } from "./WorkspaceSubtypeInspectorCard";
import { ProjectIssuesTab } from "./ProjectIssuesTab";
import { ProjectActivityTab } from "./ProjectActivityTab";

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
  projectTask: Task;
  teamUsers: TeamUser[];
  progressPercent?: number;
  resolvedIssuesCount?: number;
  totalIssuesCount?: number;
  projectIssues?: Task[];
  comments?: TaskComment[];
  onSaveField: (fields: Partial<Task>) => Promise<void>;
  onOpenNewIssue?: () => void;
  onQuickCreateIssue?: (title: string) => Promise<void>;
  onToggleIssueStatus?: (issue: Task) => Promise<void>;
  onUpdateIssue?: (issueId: string, fields: Partial<Task>) => Promise<void>;
  onDeleteIssue?: (issueId: string) => Promise<void>;
  updateText?: string;
  setUpdateText?: (text: string) => void;
  postingUpdate?: boolean;
  onPostUpdate?: (customContent?: string) => Promise<void>;
}

type WorkspaceDocType = "PLAN" | "IDEA" | "DOC" | "PROJECT";

function deduceDocType(projectTask: Task): WorkspaceDocType {
  const ref = projectTask.obsidianRef?.toUpperCase() || "";
  const rType = projectTask.referenceType?.toUpperCase() || "";

  if (rType === "IDEA" || ref.startsWith("IDEA-") || ref.startsWith("RFC-")) {
    return "IDEA";
  }
  if (rType === "DOC" || ref.startsWith("DOC-") || ref.startsWith("WIKI-")) {
    return "DOC";
  }
  if (rType === "PROJECT" || ref.startsWith("PRJ-")) {
    return "PROJECT";
  }
  return "PLAN";
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
  projectTask,
  teamUsers,
  progressPercent = 0,
  resolvedIssuesCount = 0,
  totalIssuesCount = 0,
  projectIssues = [],
  comments = [],
  onSaveField,
  onOpenNewIssue,
  onQuickCreateIssue,
  onToggleIssueStatus,
  onUpdateIssue,
  onDeleteIssue,
  updateText = "",
  setUpdateText,
  postingUpdate = false,
  onPostUpdate,
}: ProjectOverviewTabProps) {
  const { t } = useTranslation();
  const docType = deduceDocType(projectTask);

  const shouldShowIssues = docType === "PROJECT" || totalIssuesCount > 0;

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full animate-in fade-in-50 duration-150">
      {/* ── Left Column: Full Document Canvas, Issues & Activity ──────── */}
      <div className="flex-1 min-w-0 space-y-6 w-full flex flex-col">
        {/* 1. Full Document Canvas (Subtype Header + Inline Editable H1 Title + TipTap WYSIWYG) */}
        <ProjectOverviewPlanEditor
          title={title}
          setTitle={setTitle}
          originalTitle={projectTask.title}
          description={description}
          setDescription={setDescription}
          onSaveField={onSaveField}
          docType={docType}
        />

        {/* 3. Section Issues & Deliverables (Conditional: PROJECT or totalIssuesCount > 0) */}
        {shouldShowIssues && (
          <div id="workspace-issues-section" className="pt-6 border-t border-border/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground tracking-tight flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  <span>{t("workspace.section_issues_title")}</span>
                </span>
                <span className="text-xs font-mono font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full border border-border/40">
                  {resolvedIssuesCount}/{totalIssuesCount}
                </span>
              </div>
              {onOpenNewIssue && (
                <button
                  type="button"
                  onClick={onOpenNewIssue}
                  className="flex items-center gap-1 text-xs text-primary hover:underline font-medium cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t("workspace.action_new_issue")}</span>
                </button>
              )}
            </div>

            <ProjectIssuesTab
              projectIssues={projectIssues}
              resolvedIssuesCount={resolvedIssuesCount}
              totalIssuesCount={totalIssuesCount}
              onNewIssueClick={onOpenNewIssue ?? (() => {})}
              onQuickCreateIssue={onQuickCreateIssue}
              onToggleIssueStatus={onToggleIssueStatus ?? (async () => {})}
              onUpdateIssue={onUpdateIssue ?? (async () => {})}
              onDeleteIssue={onDeleteIssue ?? (async () => {})}
            />
          </div>
        )}

        {/* 4. Section Activity & Timeline */}
        <div id="workspace-activity-section" className="pt-6 border-t border-border/50 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground tracking-tight flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span>{t("workspace.section_activity_title")}</span>
            </span>
            <span className="text-xs font-mono font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full border border-border/40">
              {comments.length}
            </span>
          </div>

          <ProjectActivityTab
            updateText={updateText}
            setUpdateText={setUpdateText ?? (() => {})}
            postingUpdate={postingUpdate}
            comments={comments}
            teamUsers={teamUsers}
            onPostUpdate={onPostUpdate ?? (async () => {})}
          />
        </div>
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

        {/* 2. Subtype-Specific Inspector Card (100% Real Subtasks & Telemetry) */}
        <WorkspaceSubtypeInspectorCard
          type={docType}
          projectTask={projectTask}
          projectIssues={projectIssues}
          resolvedIssuesCount={resolvedIssuesCount}
          totalIssuesCount={totalIssuesCount}
          progressPercent={progressPercent}
          teamUsers={teamUsers}
          onOpenNewIssue={onOpenNewIssue}
          onNavigateToIssues={() => scrollToSection("workspace-issues-section")}
        />
      </div>
    </div>
  );
}

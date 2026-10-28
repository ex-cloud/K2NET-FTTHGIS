import {
  FileText,
  Lightbulb,
  BookOpen,
  FolderKanban,
  Layers,
  MessageSquare,
  Plus,
} from "lucide-react";
import { type Task, type TaskComment } from "@/hooks/useTasksQuery";
import { type TeamUser } from "@/hooks/useTeamUsers";
import { useTranslation } from "@k2net/i18n";
import { cn } from "@/lib/utils";
import { ProjectOverviewPropertiesGrid } from "./ProjectOverviewPropertiesGrid";
import { ProjectOverviewSummaryCard } from "./ProjectOverviewSummaryCard";
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
  onQuickCreateIssue?: (title: string) => Promise<void>;
  onToggleIssueStatus?: (issue: Task) => Promise<void>;
  onUpdateIssue?: (issueId: string, fields: Partial<Task>) => Promise<void>;
  onDeleteIssue?: (issueId: string) => Promise<void>;
  updateMode?: "update" | "comment";
  setUpdateMode?: (mode: "update" | "comment") => void;
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

function getDocTypeVisuals(
  docType: WorkspaceDocType,
  t: (key: string) => string
) {
  switch (docType) {
    case "IDEA":
      return {
        TypeIcon: Lightbulb,
        iconContainerClass: "bg-purple-500/10 border-purple-500/20 text-purple-400",
        specTitle: t("workspace.idea_spec_title"),
        specDesc: t("workspace.idea_spec_desc"),
      };
    case "DOC":
      return {
        TypeIcon: BookOpen,
        iconContainerClass: "bg-blue-500/10 border-blue-500/20 text-blue-400",
        specTitle: t("workspace.doc_spec_title"),
        specDesc: t("workspace.doc_spec_desc"),
      };
    case "PROJECT":
      return {
        TypeIcon: FolderKanban,
        iconContainerClass: "bg-amber-500/10 border-amber-500/20 text-amber-400",
        specTitle: t("workspace.project_spec_title"),
        specDesc: t("workspace.project_spec_desc"),
      };
    default:
      return {
        TypeIcon: FileText,
        iconContainerClass: "bg-primary/10 border-primary/20 text-primary",
        specTitle: t("workspace.plan_spec_title"),
        specDesc: t("workspace.plan_spec_desc"),
      };
  }
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
  onQuickCreateIssue,
  onToggleIssueStatus,
  onUpdateIssue,
  onDeleteIssue,
  updateMode = "update",
  setUpdateMode,
  updateText = "",
  setUpdateText,
  postingUpdate = false,
  onPostUpdate,
}: ProjectOverviewTabProps) {
  const { t } = useTranslation();
  const docType = deduceDocType(projectTask);
  const { TypeIcon, iconContainerClass, specTitle, specDesc } = getDocTypeVisuals(docType, t);

  const shouldShowIssues = docType === "PROJECT" || totalIssuesCount > 0;

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full animate-in fade-in-50 duration-150">
      {/* ── Left Column: Title, Full-Width Markdown Document, Issues & Activity ──────── */}
      <div className="flex-1 min-w-0 space-y-6 w-full flex flex-col">
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
            updateMode={updateMode}
            setUpdateMode={setUpdateMode ?? (() => {})}
            updateText={updateText}
            setUpdateText={setUpdateText ?? (() => {})}
            postingUpdate={postingUpdate}
            progressPercent={progressPercent}
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

        {/* 2. Executive Status Summary Card (100% Real Latest Update from DB) */}
        <ProjectOverviewSummaryCard
          healthStatus={healthStatus}
          assigneeId={assigneeId}
          projectTask={projectTask}
          comments={comments}
          teamUsers={teamUsers}
          onNavigateToActivity={() => scrollToSection("workspace-activity-section")}
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
          onNavigateToIssues={() => scrollToSection("workspace-issues-section")}
        />
      </div>
    </div>
  );
}

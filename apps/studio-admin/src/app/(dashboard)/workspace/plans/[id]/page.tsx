import { useState } from "react";
import { useParams, useRouter } from "@/lib/navigation-compat";
import { useSession } from "@/lib/auth-compat";
import { Loader2 } from "lucide-react";
import { useTasksQuery } from "@/hooks/useTasksQuery";
import { useTeamUsers } from "@/hooks/useTeamUsers";
import { NewTaskDialog } from "@/components/tasks/NewTaskDialog";
import { ProjectOverviewTab } from "@/components/tasks/projects/ProjectOverviewTab";
import { ProjectDetailHeader } from "@/components/tasks/projects/ProjectDetailHeader";
import { useProjectDetail } from "@/components/tasks/projects/use-project-detail";
import { useTranslation } from "@k2net/i18n";

export default function WorkspacePlanDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const { users: teamUsers } = useTeamUsers();

  const [newIssueOpen, setNewIssueOpen] = useState(false);

  const { task: projectTask, loading, refresh } = useTasksQuery(id);

  const proj = useProjectDetail({
    id,
    sessionToken: session?.accessToken ?? undefined,
    projectTask,
    refresh,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!projectTask) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>{t("tasks.project_not_found")}</p>
        <button
          onClick={() => router.push("/workspace/plans")}
          className="mt-3 text-xs text-primary underline cursor-pointer"
        >
          {t("tasks.back_to_all_projects")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* ── 1. Top Header with Linear Breadcrumbs ──────────────────────── */}
      <ProjectDetailHeader
        title={proj.title}
        projectTask={projectTask}
        onExportMarkdown={proj.handleExportMarkdown}
        onOpenNewIssue={() => setNewIssueOpen(true)}
        onSavePlan={proj.handleSavePlan}
        isSavingPlan={proj.isSavingPlan}
        lastSaved={proj.lastSaved}
      />

      {/* ── 2. Unified Document Canvas (Single-Page Flow) ─────────────── */}
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar-thin p-4 md:p-6 w-full">
        <ProjectOverviewTab
          title={proj.title}
          setTitle={proj.setTitle}
          description={proj.description}
          setDescription={proj.setDescription}
          status={proj.status}
          setStatus={proj.setStatus}
          priority={proj.priority}
          setPriority={proj.setPriority}
          assigneeId={proj.assigneeId}
          setAssigneeId={proj.setAssigneeId}
          dueDate={proj.dueDate}
          setDueDate={proj.setDueDate}
          healthStatus={proj.healthStatus}
          projectTask={projectTask}
          teamUsers={teamUsers}
          progressPercent={proj.progressPercent}
          resolvedIssuesCount={proj.resolvedIssuesCount}
          totalIssuesCount={proj.totalIssuesCount}
          projectIssues={proj.projectIssues}
          comments={proj.comments}
          onSaveField={proj.handleSaveField}
          onOpenNewIssue={() => setNewIssueOpen(true)}
          onQuickCreateIssue={proj.handleQuickCreateIssue}
          onToggleIssueStatus={proj.handleToggleIssueStatus}
          onUpdateIssue={proj.handleUpdateIssue}
          onDeleteIssue={proj.handleDeleteIssue}
          updateMode={proj.updateMode}
          setUpdateMode={proj.setUpdateMode}
          updateText={proj.updateText}
          setUpdateText={proj.setUpdateText}
          postingUpdate={proj.postingUpdate}
          onPostUpdate={proj.handlePostUpdate}
        />
      </div>

      {/* New Issue in this plan */}
      <NewTaskDialog
        open={newIssueOpen}
        onOpenChange={setNewIssueOpen}
        onSuccess={() => {
          proj.fetchSubtasks();
          refresh();
        }}
        defaultValues={{
          parentTaskId: id,
          project: projectTask?.obsidianRef || projectTask?.title,
          scope: projectTask?.scope,
        }}
      />
    </div>
  );
}

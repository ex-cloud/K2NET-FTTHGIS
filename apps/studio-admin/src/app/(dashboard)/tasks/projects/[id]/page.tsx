import { useState } from "react";
import { useParams, useRouter } from "@/lib/navigation-compat";
import { useSession } from "@/lib/auth-compat";
import { Loader2 } from "lucide-react";
import { useTasksQuery } from "@/hooks/useTasksQuery";
import { useTeamUsers } from "@/hooks/useTeamUsers";
import { NewTaskDialog } from "@/components/tasks/NewTaskDialog";
import { ProjectOverviewTab } from "@/components/tasks/projects/ProjectOverviewTab";
import { ProjectActivityTab } from "@/components/tasks/projects/ProjectActivityTab";
import { ProjectIssuesTab } from "@/components/tasks/projects/ProjectIssuesTab";
import { ProjectDetailHeader } from "@/components/tasks/projects/ProjectDetailHeader";
import {
  ProjectDetailTabsBar,
  type ProjectTab,
} from "@/components/tasks/projects/ProjectDetailTabsBar";
import { useProjectDetail } from "@/components/tasks/projects/use-project-detail";

export default function ProjectHubDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const { users: teamUsers } = useTeamUsers();

  const [activeTab, setActiveTab] = useState<ProjectTab>("overview");
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
        <p>Project tidak ditemukan.</p>
        <button
          onClick={() => router.push("/tasks/projects")}
          className="mt-3 text-xs text-primary underline cursor-pointer"
        >
          Kembali ke All Projects
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
      />

      {/* ── 2. Linear Tabs Bar ─────────────────────────────────────────── */}
      <ProjectDetailTabsBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        commentsCount={proj.comments.length}
        resolvedIssuesCount={proj.resolvedIssuesCount}
        totalIssuesCount={proj.totalIssuesCount}
      />

      {/* ── 3. Tab Contents ────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar-thin p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          {activeTab === "overview" && (
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
              onSaveField={proj.handleSaveField}
            />
          )}

          {activeTab === "activity" && (
            <ProjectActivityTab
              updateMode={proj.updateMode}
              setUpdateMode={proj.setUpdateMode}
              updateText={proj.updateText}
              setUpdateText={proj.setUpdateText}
              postingUpdate={proj.postingUpdate}
              progressPercent={proj.progressPercent}
              comments={proj.comments}
              onPostUpdate={proj.handlePostUpdate}
            />
          )}

          {activeTab === "issues" && (
            <ProjectIssuesTab
              projectIssues={proj.projectIssues}
              resolvedIssuesCount={proj.resolvedIssuesCount}
              totalIssuesCount={proj.totalIssuesCount}
              onNewIssueClick={() => setNewIssueOpen(true)}
              onQuickCreateIssue={proj.handleQuickCreateIssue}
              onToggleIssueStatus={proj.handleToggleIssueStatus}
              onUpdateIssue={proj.handleUpdateIssue}
              onDeleteIssue={proj.handleDeleteIssue}
            />
          )}
        </div>
      </div>

      {/* New Issue in this project */}
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

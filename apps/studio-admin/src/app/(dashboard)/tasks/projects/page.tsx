import { useRouter } from "@/lib/navigation-compat";
import { NewProjectDialog } from "@/components/tasks/NewProjectDialog";
import { ProjectTimelineView } from "@/components/tasks/projects/ProjectTimelineView";
import { useProjectsHub } from "@/components/tasks/projects/use-projects-hub";
import { ProjectsHubHeader } from "@/components/tasks/projects/ProjectsHubHeader";
import { ProjectsHubToolbar } from "@/components/tasks/projects/ProjectsHubToolbar";
import { ProjectsHubTable } from "@/components/tasks/projects/ProjectsHubTable";

export default function ProjectsHubPage() {
  const router = useRouter();
  const hub = useProjectsHub();

  return (
    <div className="relative flex flex-col w-full h-full bg-background pt-6 pb-0 gap-5 overflow-hidden">
      {/* ── Page Header & KPI Cards ──────────────────────────────────── */}
      <ProjectsHubHeader
        onNewProject={() => hub.setNewProjectOpen(true)}
        activeCount={hub.activeCount}
        atRiskCount={hub.atRiskCount}
        completedCount={hub.completedCount}
        totalProjects={hub.projects.length}
      />

      {/* ── Main Content Area ────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex gap-4 px-4 md:px-6 pb-6 overflow-hidden">
        <div className="flex-1 min-h-0 border border-border bg-card/10 rounded-xl overflow-hidden flex flex-col">
          {/* ── Sticky Toolbar ────────────────────────────────────────── */}
          <ProjectsHubToolbar
            searchQuery={hub.searchQuery}
            setSearchQuery={hub.setSearchQuery}
            statusFilter={hub.statusFilter}
            setStatusFilter={hub.setStatusFilter}
            priorityFilter={hub.priorityFilter}
            setPriorityFilter={hub.setPriorityFilter}
            viewMode={hub.viewMode}
            setViewMode={hub.setViewMode}
            grouping={hub.grouping}
            setGrouping={hub.setGrouping}
            ordering={hub.ordering}
            setOrdering={hub.setOrdering}
            showClosed={hub.showClosed}
            setShowClosed={hub.setShowClosed}
            displayProperties={hub.displayProperties}
            onToggleDisplayProperty={hub.handleToggleDisplayProperty}
            loading={hub.loading}
            refresh={hub.refresh}
          />

          {/* ── Scrollable Table or Timeline ─────────────────────────── */}
          {hub.viewMode === "timeline" ? (
            <ProjectTimelineView
              projects={hub.filteredProjects}
              onProjectClick={(id) => router.push(`/tasks/projects/${id}`)}
            />
          ) : (
            <ProjectsHubTable
              projects={hub.projects}
              filteredProjects={hub.filteredProjects}
              loading={hub.loading}
              loadingMore={hub.loadingMore}
              searchQuery={hub.searchQuery}
              displayProperties={hub.displayProperties}
              sortField={hub.sortField}
              sortDir={hub.sortDir}
              setSortField={hub.setSortField}
              setSortDir={hub.setSortDir}
              sentinelRef={hub.sentinelRef}
              onNewProject={() => hub.setNewProjectOpen(true)}
              onUpdateStatus={hub.handleUpdateStatus}
              onUpdatePriority={hub.handleUpdatePriority}
              onUpdateHealth={hub.handleUpdateHealth}
              onUpdateLead={hub.handleUpdateLead}
              onUpdateDueDate={hub.handleUpdateDueDate}
              onDeleteProject={hub.handleDeleteProject}
            />
          )}
        </div>
      </div>

      {/* ── New Project Dialog ───────────────────────────────────────── */}
      <NewProjectDialog
        open={hub.newProjectOpen}
        onOpenChange={hub.setNewProjectOpen}
        onSuccess={hub.refresh}
        defaultValues={{
          scope: "PLATFORM_INTERNAL",
        }}
      />
    </div>
  );
}

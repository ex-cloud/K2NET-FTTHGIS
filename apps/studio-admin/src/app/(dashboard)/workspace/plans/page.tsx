import { useRouter } from "@/lib/navigation-compat";
import { useTranslation } from "@k2net/i18n";
import { QuickFilterTabs, type QuickFilterTabOption } from "@/components/common/QuickFilterTabs";
import { ProjectTimelineView } from "@/components/tasks/projects/ProjectTimelineView";
import { useProjectsHub } from "@/components/tasks/projects/use-projects-hub";
import { ProjectsHubHeader } from "@/components/tasks/projects/ProjectsHubHeader";
import { ProjectsHubToolbar } from "@/components/tasks/projects/ProjectsHubToolbar";
import { ProjectsHubTable } from "@/components/tasks/projects/ProjectsHubTable";
import { FileText, Lightbulb, FolderKanban, BookOpen, Layers } from "lucide-react";

export default function WorkspacePlansPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const hub = useProjectsHub();

  const filterTabs: QuickFilterTabOption[] = [
    { id: "all", label: t("workspace.tab_all"), icon: Layers },
    { id: "plans", label: t("workspace.tab_plans"), icon: FileText },
    { id: "ideas", label: t("workspace.tab_ideas"), icon: Lightbulb },
    { id: "docs", label: t("workspace.tab_docs"), icon: BookOpen },
    { id: "projects", label: t("workspace.tab_projects"), icon: FolderKanban },
  ];

  return (
    <div className="relative flex flex-col w-full h-full bg-background pt-6 pb-0 gap-4 overflow-hidden">
      {/* ── Page Header & KPI Cards ──────────────────────────────────── */}
      <ProjectsHubHeader
        onNewProject={() => router.push("/workspace/plans/new")}
        activeCount={hub.activeCount}
        atRiskCount={hub.atRiskCount}
        completedCount={hub.completedCount}
        totalProjects={hub.projects.length}
      />

      {/* ── Quick Filter Tabs (Notion-style Container Subtypes) ─────── */}
      <div className="px-4 md:px-6 shrink-0">
        <QuickFilterTabs
          paramName="type"
          defaultTab="all"
          tabs={filterTabs}
        />
      </div>

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
              onProjectClick={(id) => router.push(`/workspace/plans/${id}`)}
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
              onNewProject={() => router.push("/workspace/plans/new")}
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
    </div>
  );
}

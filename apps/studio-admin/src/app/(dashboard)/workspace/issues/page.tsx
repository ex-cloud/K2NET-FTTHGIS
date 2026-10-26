import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "@/lib/navigation-compat";
import { useTranslation } from "@k2net/i18n";
import { toast } from "sonner";
import { Layers, CircleDot, AlertCircle, CheckCircle2 } from "lucide-react";

// Hooks & Types
import { type QuickView } from "@/components/tasks/taskViewFilters";

// Sub-components & helpers
import { TaskDensityHeader } from "@/components/tasks/TaskDensityHeader";
import { TaskToolbar } from "@/components/tasks/TaskToolbar";
import { useFilteredTasks } from "@/components/tasks/use-task-filters";
import { useTaskToolbarState } from "@/components/tasks/use-task-toolbar-state";
import { useTasksPageOperations } from "@/components/tasks/use-tasks-page-operations";
import { useTaskDialogsState } from "@/components/tasks/use-task-dialogs-state";
import { useTaskPageData } from "@/components/tasks/use-task-page-data";
import { TaskActiveFilterChips } from "@/components/tasks/TaskActiveFilterChips";
import { TaskViewContainer } from "@/components/tasks/TaskViewContainer";
import { TaskRightSidebar } from "@/components/tasks/TaskRightSidebar";
import { TaskPageDialogs } from "@/components/tasks/TaskPageDialogs";
import { QuickFilterTabs, type QuickFilterTabOption } from "@/components/common/QuickFilterTabs";

export default function WorkspaceIssuesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const viewMode = (searchParams.get("view") ?? "list") as "list" | "kanban" | "timeline";
  const quickParam = (searchParams.get("quick") ?? "all") as QuickView;
  const projectParam = searchParams.get("project");
  const typeParam = searchParams.get("type");

  // Strictly lock scope to PLATFORM_INTERNAL for Engineering Issues
  const scopeParam = "PLATFORM_INTERNAL";

  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  // Density view mode
  const [showKpiCards, setShowKpiCards] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("k2net_issues_show_kpi_cards");
      return saved !== null ? saved === "true" : true;
    } catch {
      return true;
    }
  });

  const handleToggleKpiCards = useCallback(() => {
    setShowKpiCards((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("k2net_issues_show_kpi_cards", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const dialogs = useTaskDialogsState();
  const toolbar = useTaskToolbarState(projectParam);
  const data = useTaskPageData(scopeParam);

  // Filter tasks (useFilteredTasks internally excludes type PROJECT when typeParam is not set)
  const filteredTasks = useFilteredTasks({
    tasks: data.tasks,
    quickParam,
    userIdentifiers: data.userIdentifiers,
    searchQuery: toolbar.searchQuery,
    filters: toolbar.filters,
    selectedProject: toolbar.selectedProject,
    projectParam,
    typeParam,
    showClosed: toolbar.showClosed,
    ordering: toolbar.ordering,
  });

  const operations = useTasksPageOperations({
    filteredTasks,
    sessionToken: data.session?.accessToken ?? undefined,
    refresh: data.refresh,
    dialogOpen: dialogs.dialogOpen,
    sheetOpen: dialogs.sheetOpen,
    onOpenSheet: dialogs.handleOpenSheet,
    setDialogOpen: dialogs.setDialogOpen,
    setShortcutsHelpOpen: dialogs.setShortcutsHelpOpen,
  });

  const handleViewModeChange = (mode: "list" | "kanban" | "timeline") => {
    const params = new URLSearchParams(searchParams.toString());
    if (mode === "list") params.delete("view");
    else params.set("view", mode);
    router.push(`/workspace/issues?${params.toString()}`);
  };

  const issueTabs: QuickFilterTabOption[] = [
    { id: "all", label: t("nav.tab_all_issues"), icon: Layers },
    { id: "active", label: t("nav.tab_active"), icon: CircleDot },
    { id: "urgent", label: t("nav.tab_urgent_high"), icon: AlertCircle },
    { id: "resolved", label: t("nav.resolved_issues"), icon: CheckCircle2 },
  ];

  return (
    <>
      <div className="relative flex flex-col w-full h-full bg-background pt-6 pb-0 gap-4 overflow-hidden">
        <TaskDensityHeader
          pageTitle={t("workspace.issues_title")}
          scopeDescription={t("workspace.issues_subtitle")}
          rightPanelOpen={rightPanelOpen}
          onToggleRightPanel={() => setRightPanelOpen((v) => !v)}
          onOpenShortcutsHelp={() => dialogs.setShortcutsHelpOpen(true)}
          onOpenNewTask={() => dialogs.setDialogOpen(true)}
          showKpiCards={showKpiCards}
          onToggleKpiCards={handleToggleKpiCards}
          summary={data.summary}
          totalElements={filteredTasks.length}
        />

        {/* ── Quick Filter Tabs for Issues ────────────────────────── */}
        <div className="px-4 md:px-6 shrink-0">
          <QuickFilterTabs
            paramName="quick"
            defaultTab="all"
            tabs={issueTabs}
          />
        </div>

        <div className="flex-1 min-h-0 flex gap-4 px-4 md:px-6 pb-6 overflow-hidden">
          <div className="flex-1 min-h-0 border border-border bg-card/10 rounded-xl overflow-hidden flex flex-col">
            <TaskToolbar
              searchQuery={toolbar.searchQuery}
              setSearchQuery={toolbar.setSearchQuery}
              filters={toolbar.filters}
              onToggleFilter={toolbar.handleToggleFilter}
              onClearFilters={toolbar.handleClearFilters}
              projectsList={data.dynamicProjectsList}
              selectedProject={toolbar.selectedProject}
              onSelectProject={toolbar.setSelectedProject}
              loading={data.loading}
              onRefresh={() => {
                data.refresh();
                toast.info(t("workspace.toast_refreshing"));
              }}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              displayProperties={toolbar.displayProperties}
              onToggleDisplayProperty={toolbar.handleToggleDisplayProperty}
              grouping={toolbar.grouping}
              onGroupingChange={toolbar.setGrouping}
              ordering={toolbar.ordering}
              onOrderingChange={toolbar.setOrdering}
              showClosed={toolbar.showClosed}
              onShowClosedChange={toolbar.setShowClosed}
            />

            <TaskActiveFilterChips
              quickParam={quickParam}
              projectParam={projectParam}
              typeParam={typeParam}
              scopeParam={scopeParam}
              onReset={() => router.push("/workspace/issues")}
            />

            <TaskViewContainer
              viewMode={viewMode}
              tasks={filteredTasks}
              localTasks={operations.localTasks}
              loading={data.loading}
              loadingMore={data.loadingMore}
              hasMore={data.hasMore}
              onRowClick={dialogs.handleOpenSheet}
              onUpdateTask={operations.handleUpdateTask}
              onDeleteTask={operations.handleDeleteTask}
              onFetchMore={data.fetchMore}
              assigneesList={data.assigneesList}
              selectedTaskIds={operations.selectedTaskIds}
              onToggleSelectTask={operations.handleToggleSelectTask}
              onSelectAllTasks={operations.handleSelectAllTasks}
              focusedIndex={operations.focusedIndex}
              displayProperties={toolbar.displayProperties}
              onCardDrop={operations.handleCardDrop}
            />
          </div>

          <TaskRightSidebar
            open={rightPanelOpen}
            onClose={() => setRightPanelOpen(false)}
            tasks={data.tasks}
          />
        </div>
      </div>

      <TaskPageDialogs
        dialogs={dialogs}
        operations={operations}
        assigneesList={data.assigneesList}
        dynamicProjectsList={data.dynamicProjectsList}
        refresh={data.refresh}
      />
    </>
  );
}

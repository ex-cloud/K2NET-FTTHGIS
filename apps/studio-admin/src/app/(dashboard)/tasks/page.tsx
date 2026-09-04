

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "@/lib/navigation-compat";
import { useSession } from "@/lib/auth-compat";
import { KanbanBoard } from "@k2net/ui";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { toast } from "sonner";
import { X } from "lucide-react";

// Hooks & Stores
import { useTasksQuery, type Task, type TaskScope } from "@/hooks/useTasksQuery";
import { useTaskSummary } from "@/hooks/useTaskSummary";
import { useTeamUsers } from "@/hooks/useTeamUsers";
import { useLinearShortcuts } from "@/hooks/useLinearShortcuts";
import { useTaskLiveStream } from "@/hooks/useTaskLiveStream";
import { useTaskBatchActions } from "@/hooks/useTaskBatchActions";
import { useTaskStore } from "@/store/task-store";

// Sub-components & configurations
import { TaskKpiStrip } from "@/components/tasks/TaskKpiStrip";
import { TaskTable } from "@/components/tasks/TaskTable";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskSecondarySidebar } from "@/components/tasks/TaskSecondarySidebar";
import { KANBAN_COLUMNS } from "@/components/tasks/configs";
import { TaskToolbar } from "@/components/tasks/TaskToolbar";
import { type TaskFilterState } from "@/components/tasks/TaskFilterMenu";
import { TaskTimelineView } from "@/components/tasks/TaskTimelineView";
import { NewTaskDialog } from "@/components/tasks/NewTaskDialog";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { TaskBulkActionBar } from "@/components/tasks/TaskBulkActionBar";
import { TaskHeaderStatsBar } from "@/components/tasks/TaskHeaderStatsBar";
import { TaskShortcutsHelpDialog } from "@/components/tasks/TaskShortcutsHelpDialog";
import { TaskBatchDeleteDialog } from "@/components/tasks/TaskBatchDeleteDialog";
import { applyViewFilter, VIEW_LABELS, type QuickView } from "@/components/tasks/taskViewFilters";
import {
  type DisplayPropertiesState,
  type ViewGrouping,
  type ViewOrdering,
  type ShowClosedFilter,
} from "@/components/tasks/LinearDisplayOptionsPopover";

export default function TasksPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  const viewMode = (searchParams.get("view") ?? "list") as "list" | "kanban" | "timeline";
  const quickParam = (searchParams.get("quick") ?? "all") as QuickView;
  const scopeParam = searchParams.get("scope") as TaskScope | null;
  const projectParam = searchParams.get("project");
  const typeParam = searchParams.get("type");

  // Dialog / panel / focus state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  // Linear-style detail sheet state
  const [sheetTask, setSheetTask] = useState<Task | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Density view mode (Standard vs Compact KPI cards)
  const [showKpiCards, setShowKpiCards] = useState<boolean>(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("k2net_tasks_show_kpi_cards");
      if (saved !== null) setShowKpiCards(saved === "true");
    } catch {
      // ignore
    }
  }, []);

  const handleToggleKpiCards = useCallback(() => {
    setShowKpiCards((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("k2net_tasks_show_kpi_cards", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Toolbar state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<string | null>(projectParam ?? null);
  const [filters, setFilters] = useState<TaskFilterState>({
    status: [],
    priority: [],
    scope: [],
    assigneeId: null,
  });

  useEffect(() => {
    if (projectParam) setSelectedProject(projectParam);
  }, [projectParam]);

  const [displayProperties, setDisplayProperties] = useState<DisplayPropertiesState>({
    priority: true,
    status: true,
    assignee: true,
    dueDate: true,
    scope: true,
    type: true,
    obsidianRef: true,
    created: true,
  });

  const [ordering, setOrdering] = useState<ViewOrdering>("manual");
  const [grouping, setGrouping] = useState<ViewGrouping>("none");
  const [showClosed, setShowClosed] = useState<ShowClosedFilter>("all");

  const handleToggleDisplayProperty = (prop: keyof DisplayPropertiesState) => {
    setDisplayProperties((prev) => ({ ...prev, [prop]: !prev[prop] }));
  };

  // ── Data fetching ───────────────────────────────────────────────────────────
  const {
    tasks,
    loading,
    loadingMore,
    hasMore,
    totalElements,
    error,
    refresh,
    fetchMore,
  } = useTasksQuery(undefined, scopeParam ?? undefined);

  const { summary } = useTaskSummary();

  // B2B badge sync
  const { tasks: b2bTasks } = useTasksQuery(undefined, "TENANT_TO_PLATFORM");
  const b2bCount = b2bTasks.filter((t) => t.status !== "RESOLVED" && t.status !== "CLOSED").length;
  const setUnreadCount = useTaskStore((state) => state.setUnreadCount);
  useEffect(() => { setUnreadCount(b2bCount); }, [b2bCount, setUnreadCount]);

  if (error) toast.error("Failed to load tasks: " + error);

  const { users: teamUsers } = useTeamUsers();

  // ── Real-time live stream hook ──────────────────────────────────────────────
  useTaskLiveStream({
    onTaskUpdated: () => refresh(),
    onTaskCreated: () => refresh(),
    onTaskDeleted: () => refresh(),
  });

  // ── Derived unique assignees & projects ─────────────────────────────────────
  const assigneesList = useMemo(() => {
    const ids = new Set<string>();
    teamUsers.forEach((u) => { if (u.email) ids.add(u.email); });
    tasks.forEach((t) => { if (t.assigneeId) ids.add(t.assigneeId); });
    return Array.from(ids);
  }, [teamUsers, tasks]);

  const dynamicProjectsList = useMemo(() => {
    const names = new Set<string>();
    tasks.forEach((t) => {
      if (t.obsidianRef && t.obsidianRef.length > 2) names.add(t.obsidianRef);
      else if (t.type === "PROJECT" && t.title) names.add(t.title);
    });
    return Array.from(names);
  }, [tasks]);

  // ── Filtered tasks ──────────────────────────────────────────────────────────
  const userIdentifiers = useMemo(() => {
    return [
      session?.user?.id,
      session?.user?.email,
      session?.user?.username,
      session?.user?.name,
    ].filter(Boolean) as string[];
  }, [session?.user]);

  const filteredTasks = useMemo(() => {
    // Exclude master PROJECT containers from /tasks (All Issues / Active Tasks) unless typeParam specifically requests PROJECT
    const baseTasks = typeParam ? tasks.filter((t) => t.type === typeParam) : tasks.filter((t) => t.type !== "PROJECT");
    let result = applyViewFilter(baseTasks, quickParam, userIdentifiers);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q));
    }
    if (filters.status.length > 0) result = result.filter((t) => filters.status.includes(t.status));
    if (filters.priority.length > 0) result = result.filter((t) => filters.priority.includes(t.priority));
    if (filters.scope.length > 0) result = result.filter((t) => filters.scope.includes(t.scope));
    if (filters.assigneeId) result = result.filter((t) => t.assigneeId === filters.assigneeId);
    if (typeParam) result = result.filter((t) => t.type === typeParam);

    const activeProject = selectedProject || projectParam;
    if (activeProject) {
      result = result.filter(
        (t) =>
          t.obsidianRef === activeProject ||
          (t.parentTaskId && t.parentTaskId === activeProject) ||
          t.title.toLowerCase().includes(activeProject.toLowerCase()) ||
          t.title === activeProject
      );
    }

    if (showClosed === "open") {
      result = result.filter((t) => t.status !== "RESOLVED" && t.status !== "CLOSED");
    } else if (showClosed === "closed") {
      result = result.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED");
    }

    if (ordering === "created") {
      result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (ordering === "dueDate") {
      result = [...result].sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    } else if (ordering === "priority") {
      const pWeights: Record<string, number> = { URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 };
      result = [...result].sort((a, b) => (pWeights[b.priority] ?? 0) - (pWeights[a.priority] ?? 0));
    } else if (ordering === "title") {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [tasks, quickParam, filters, searchQuery, userIdentifiers, projectParam, selectedProject, typeParam, ordering, showClosed]);

  // Local optimistic state for Kanban
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  useEffect(() => { setLocalTasks(filteredTasks); }, [filteredTasks]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleOpenSheet = useCallback((task: Task) => {
    setSheetTask(task);
    setSheetOpen(true);
  }, []);

  const handleSaveTask = useCallback(
    async (itemId: string, fields: Partial<Task>) => {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/${itemId}`, {
        method: "PUT",
        token: session?.accessToken ?? "",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (!res.ok) {
        const msg = `HTTP ${res.status}`;
        toast.error("Failed to update: " + msg);
        throw new Error(msg);
      }
      refresh();
    },
    [session?.accessToken, refresh]
  );

  const handleUpdateTask = useCallback(
    async (itemId: string, fields: Partial<Task>) => {
      setLocalTasks((prev) => prev.map((t) => (t.id === itemId ? { ...t, ...fields } : t)));
      try {
        await handleSaveTask(itemId, fields);
        toast.success("Task updated");
      } catch {
        setLocalTasks(filteredTasks);
      }
    },
    [handleSaveTask, filteredTasks]
  );

  const handleDeleteTask = useCallback(
    async (itemId: string) => {
      setLocalTasks((prev) => prev.filter((t) => t.id !== itemId));
      try {
        const baseUrl = getBackendBaseUrl();
        const res = await httpClient(`${baseUrl}/tasks/${itemId}`, {
          method: "DELETE",
          token: session?.accessToken ?? "",
        });
        if (!res.ok) {
          if (res.status === 403) throw new Error("Forbidden — Super Admin only.");
          throw new Error(`HTTP ${res.status}`);
        }
        toast.success("Task deleted");
        refresh();
      } catch (err: any) {
        toast.error("Failed to delete: " + err.message);
        setLocalTasks(filteredTasks);
      }
    },
    [session?.accessToken, filteredTasks, refresh]
  );

  // ── Batch Actions Hook ──────────────────────────────────────────────────────
  const {
    selectedTaskIds,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    deleteLoading,
    handleToggleSelectTask,
    handleSelectAllTasks,
    handleClearSelection,
    handleBatchUpdateStatus,
    handleBatchUpdatePriority,
    handleBatchUpdateAssignee,
    handleBatchUpdateScope,
    handleRequestBatchDelete,
    handleConfirmBatchDelete,
  } = useTaskBatchActions({
    filteredTasks,
    sessionToken: session?.accessToken ?? undefined,
    onSaveTask: handleSaveTask,
    refresh,
    setLocalTasks,
  });

  // ── Keyboard Shortcuts (Linear Power-User Keybindings) ─────────────────────
  useLinearShortcuts({
    onNewTask: () => setDialogOpen(true),
    onNewProject: () => router.push("/tasks/projects"),
    onNextRow: () => setFocusedIndex((prev) => Math.min(filteredTasks.length - 1, prev + 1)),
    onPrevRow: () => setFocusedIndex((prev) => Math.max(0, prev - 1)),
    onOpenSelected: () => {
      if (focusedIndex >= 0 && filteredTasks[focusedIndex]) {
        handleOpenSheet(filteredTasks[focusedIndex]);
      }
    },
    onToggleSelectRow: () => {
      if (focusedIndex >= 0 && filteredTasks[focusedIndex]) {
        handleToggleSelectTask(filteredTasks[focusedIndex].id);
      }
    },
    onClearSelection: handleClearSelection,
    onToggleHelp: () => setShortcutsHelpOpen((prev) => !prev),
    enabled: !dialogOpen && !sheetOpen,
  });

  const handleCardDrop = useCallback(
    (itemId: string, targetStatus: string) => {
      handleUpdateTask(itemId, { status: targetStatus });
    },
    [handleUpdateTask]
  );

  const handleViewModeChange = (mode: "list" | "kanban" | "timeline") => {
    const params = new URLSearchParams(searchParams.toString());
    if (mode === "list") params.delete("view");
    else params.set("view", mode);
    router.push(`/tasks?${params.toString()}`);
  };

  const handleToggleFilter = (type: keyof TaskFilterState, value: string) => {
    setFilters((prev) => {
      if (type === "assigneeId") return { ...prev, assigneeId: prev.assigneeId === value ? null : value };
      const list = prev[type] as string[];
      const newList = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      return { ...prev, [type]: newList };
    });
  };

  const handleClearFilters = () => {
    setFilters({ status: [], priority: [], scope: [], assigneeId: null });
    setSelectedProject(null);
    setSearchQuery("");
  };

  // ── Page Titles ─────────────────────────────────────────────────────────────
  const pageTitle =
    scopeParam === "PLATFORM_INTERNAL" && quickParam === "all"
      ? "Internal Platform Issues"
      : scopeParam === "TENANT_TO_PLATFORM" && quickParam === "all"
      ? "B2B Mitra Escalations"
      : VIEW_LABELS[quickParam] ?? "All Issues";
  const scopeDescription =
    scopeParam === "PLATFORM_INTERNAL"
      ? "Platform & DevOps internal engineering issues & incidents"
      : scopeParam === "TENANT_TO_PLATFORM"
      ? "Incoming L3 escalation tickets from tenant ISPs"
      : "Internal Platform + B2B Escalation Inbox";

  return (
    <>
      {/* ── Root container ────────────────────────────────────────── */}
      <div className="relative flex flex-col w-full h-full bg-background pt-6 pb-0 gap-5 overflow-hidden">
        
        {/* ── Page Header & Stats Bar ───────────────────────────────── */}
        <TaskHeaderStatsBar
          pageTitle={pageTitle}
          scopeDescription={scopeDescription}
          rightPanelOpen={rightPanelOpen}
          onToggleRightPanel={() => setRightPanelOpen((v) => !v)}
          onOpenShortcutsHelp={() => setShortcutsHelpOpen(true)}
          onOpenNewTask={() => setDialogOpen(true)}
          showKpiCards={showKpiCards}
          onToggleKpiCards={handleToggleKpiCards}
          summary={summary}
          totalElements={totalElements}
        />

        {/* ── KPI Cards (Collapsible for Compact / Productivity View) ── */}
        {showKpiCards && (
          <div className="px-4 md:px-6 shrink-0 animate-in fade-in-50 duration-150">
            <TaskKpiStrip />
          </div>
        )}

        {/* ── Main content area + optional right sidebar ─────────────── */}
        <div className="flex-1 min-h-0 flex gap-4 px-4 md:px-6 pb-6 overflow-hidden">
          
          {/* Table / Kanban / Timeline card */}
          <div className="flex-1 min-h-0 border border-border bg-card/10 rounded-xl overflow-hidden flex flex-col">
            <TaskToolbar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filters={filters}
              onToggleFilter={handleToggleFilter}
              onClearFilters={handleClearFilters}
              projectsList={dynamicProjectsList}
              selectedProject={selectedProject}
              onSelectProject={setSelectedProject}
              loading={loading}
              onRefresh={() => { refresh(); toast.info("Refreshing issues..."); }}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              displayProperties={displayProperties}
              onToggleDisplayProperty={handleToggleDisplayProperty}
              grouping={grouping}
              onGroupingChange={setGrouping}
              ordering={ordering}
              onOrderingChange={setOrdering}
              showClosed={showClosed}
              onShowClosedChange={setShowClosed}
            />

            {/* Active quick-filter or project chip */}
            {(quickParam !== "all" || projectParam || typeParam || (scopeParam && scopeParam !== "PLATFORM_INTERNAL")) && (
              <div className="px-4 py-2 flex items-center gap-2 border-b border-border/40 bg-background/30 shrink-0">
                <span className="text-xs text-muted-foreground">Showing:</span>
                {quickParam !== "all" && (
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {VIEW_LABELS[quickParam]}
                  </span>
                )}
                {typeParam === "PROJECT" && (
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    Projects & Plans
                  </span>
                )}
                {scopeParam === "TENANT_TO_PLATFORM" && (
                  <span className="text-xs font-medium text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                    B2B Mitra Escalations
                  </span>
                )}
                {projectParam && (
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span>Project:</span> {projectParam}
                  </span>
                )}
                <button
                  onClick={() => router.push("/tasks")}
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors underline ml-1 cursor-pointer"
                >
                  Reset filter
                </button>
              </div>
            )}

            {/* Scrollable Table / Kanban / Timeline Container */}
            <div className="flex-1 min-h-0 overflow-auto custom-scrollbar-thin">
              {viewMode === "list" && (
                <TaskTable
                  tasks={filteredTasks}
                  loading={loading}
                  loadingMore={loadingMore}
                  hasMore={hasMore}
                  onRowClick={handleOpenSheet}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onFetchMore={fetchMore}
                  assigneesList={assigneesList}
                  selectedTaskIds={selectedTaskIds}
                  onToggleSelectTask={handleToggleSelectTask}
                  onSelectAllTasks={handleSelectAllTasks}
                  focusedIndex={focusedIndex}
                  displayProperties={displayProperties}
                />
              )}

              {viewMode === "kanban" && (
                <div className="w-full p-4 overflow-x-auto">
                  {loading && localTasks.length === 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-pulse">
                      {KANBAN_COLUMNS.map((col) => (
                        <div
                          key={col.id}
                          className="bg-card/40 border border-border/50 rounded-xl p-4 min-h-[450px]"
                        />
                      ))}
                    </div>
                  ) : (
                    <KanbanBoard<Task>
                      items={localTasks}
                      columns={KANBAN_COLUMNS}
                      getColumnId={(t) => t.status}
                      onCardDrop={handleCardDrop}
                      renderCard={(task) => (
                        <TaskCard
                          task={task}
                          onClick={() => handleOpenSheet(task)}
                        />
                      )}
                    />
                  )}
                </div>
              )}

              {viewMode === "timeline" && (
                <TaskTimelineView
                  tasks={filteredTasks}
                  onRowClick={(task) => handleOpenSheet(task)}
                  displayProperties={displayProperties}
                />
              )}
            </div>
          </div>

          {/* Optional Right Sidebar */}
          {rightPanelOpen && (
            <div className="w-72 shrink-0 flex flex-col min-h-0 border border-border bg-card/10 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 shrink-0">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overview</span>
                <button
                  onClick={() => setRightPanelOpen(false)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <TaskSecondarySidebar tasks={tasks} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Multi-Select Batch Actions Toolbar */}
      <TaskBulkActionBar
        selectedCount={selectedTaskIds.size}
        onClearSelection={handleClearSelection}
        onBatchUpdateStatus={handleBatchUpdateStatus}
        onBatchUpdatePriority={handleBatchUpdatePriority}
        onBatchUpdateAssignee={handleBatchUpdateAssignee}
        onBatchUpdateScope={handleBatchUpdateScope}
        onBatchDelete={handleRequestBatchDelete}
      />

      {/* Custom Batch Delete Confirmation Dialog */}
      <TaskBatchDeleteDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        selectedCount={selectedTaskIds.size}
        onConfirmDelete={handleConfirmBatchDelete}
        loading={deleteLoading}
      />

      {/* Keyboard Shortcuts Help Dialog */}
      <TaskShortcutsHelpDialog
        open={shortcutsHelpOpen}
        onOpenChange={setShortcutsHelpOpen}
      />

      {/* Linear-style Task Detail Sheet */}
      <TaskDetailSheet
        task={sheetTask}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setSheetTask(null);
        }}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        assigneesList={assigneesList}
      />

      {/* New Task Modal Dialog */}
      <NewTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={refresh}
        assigneesList={assigneesList}
        projectsList={dynamicProjectsList}
      />
    </>
  );
}

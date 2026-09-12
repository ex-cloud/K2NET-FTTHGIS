import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useSession } from "@/lib/auth-compat";
import { useTasksQuery } from "@/hooks/useTasksQuery";
import {
  type DisplayPropertiesState,
  type ViewGrouping,
  type ViewOrdering,
  type ShowClosedFilter,
} from "@/components/tasks/LinearDisplayOptionsPopover";
import {
  type ProjectPlanItem,
  type SortField,
  type SortDir,
  aggregateProjectsFromTasks,
  filterAndSortProjects,
} from "./projects-hub-helpers";
import { useProjectActions } from "./use-project-actions";

export type { ProjectPlanItem, SortField, SortDir };

export function useProjectsHub() {
  const { data: session } = useSession();
  const {
    tasks,
    loading,
    loadingMore,
    hasMore,
    fetchMore,
    refresh,
  } = useTasksQuery(undefined, "PLATFORM_INTERNAL");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "timeline">("table");

  const [displayProperties, setDisplayProperties] = useState<DisplayPropertiesState>({
    health: true,
    priority: true,
    lead: true,
    targetDate: true,
    issues: true,
    status: true,
    created: true,
    obsidianRef: true,
    assignee: true,
    dueDate: true,
    scope: true,
    type: true,
  });

  const [ordering, setOrdering] = useState<ViewOrdering>("manual");
  const [grouping, setGrouping] = useState<ViewGrouping>("none");
  const [showClosed, setShowClosed] = useState<ShowClosedFilter>("all");

  const handleToggleDisplayProperty = useCallback((prop: keyof DisplayPropertiesState) => {
    setDisplayProperties((prev) => ({ ...prev, [prop]: !prev[prop] }));
  }, []);

  const [sortField, setSortField] = useState<SortField | null>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // ── Context Menu Handlers ──────────────────────────────────────────────────
  const {
    handleUpdateStatus,
    handleUpdatePriority,
    handleUpdateLead,
    handleUpdateDueDate,
    handleUpdateHealth,
    handleDeleteProject,
  } = useProjectActions({
    accessToken: session?.accessToken ?? undefined,
    refresh,
  });

  // ── Infinite scroll observer ───────────────────────────────────────────────
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchMore();
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [fetchMore, hasMore, loadingMore, loading]);

  const projects = useMemo<ProjectPlanItem[]>(() => {
    return aggregateProjectsFromTasks(tasks ?? []);
  }, [tasks]);

  const filteredProjects = useMemo(() => {
    return filterAndSortProjects({
      projects,
      searchQuery,
      statusFilter,
      priorityFilter,
      showClosed,
      ordering,
      sortField,
      sortDir,
    });
  }, [projects, searchQuery, statusFilter, priorityFilter, showClosed, ordering, sortField, sortDir]);

  const activeCount = useMemo(
    () => projects.filter((p) => !["RESOLVED", "CLOSED"].includes(p.status)).length,
    [projects]
  );
  const atRiskCount = useMemo(
    () => projects.filter((p) => p.health === "At risk" || p.health === "Off track").length,
    [projects]
  );
  const completedCount = useMemo(
    () => projects.filter((p) => ["RESOLVED", "CLOSED"].includes(p.status) || p.percentage === 100).length,
    [projects]
  );

  return {
    projects,
    filteredProjects,
    loading,
    loadingMore,
    refresh,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    newProjectOpen,
    setNewProjectOpen,
    viewMode,
    setViewMode,
    displayProperties,
    handleToggleDisplayProperty,
    ordering,
    setOrdering,
    grouping,
    setGrouping,
    showClosed,
    setShowClosed,
    sortField,
    setSortField,
    sortDir,
    setSortDir,
    activeCount,
    atRiskCount,
    completedCount,
    sentinelRef,
    handleUpdateStatus,
    handleUpdatePriority,
    handleUpdateLead,
    handleUpdateDueDate,
    handleUpdateHealth,
    handleDeleteProject,
  };
}

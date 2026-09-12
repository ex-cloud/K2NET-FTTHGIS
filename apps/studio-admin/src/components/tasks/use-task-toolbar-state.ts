import { useState, useEffect } from "react";
import type { TaskFilterState } from "@/components/tasks/TaskFilterMenu";
import type {
  DisplayPropertiesState,
  ViewGrouping,
  ViewOrdering,
  ShowClosedFilter,
} from "@/components/tasks/LinearDisplayOptionsPopover";
import { VIEW_LABELS, type QuickView } from "@/components/tasks/taskViewFilters";
import type { TaskScope } from "@/hooks/useTasksQuery";

export function useTaskToolbarState(projectParam: string | null) {
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

  return {
    searchQuery,
    setSearchQuery,
    selectedProject,
    setSelectedProject,
    filters,
    handleToggleFilter,
    handleClearFilters,
    displayProperties,
    handleToggleDisplayProperty,
    ordering,
    setOrdering,
    grouping,
    setGrouping,
    showClosed,
    setShowClosed,
  };
}

export function getTaskPageMetadata(scopeParam: TaskScope | null, quickParam: QuickView) {
  if (scopeParam === "PLATFORM_INTERNAL" && quickParam === "all") {
    return {
      pageTitle: "Internal Platform Issues",
      scopeDescription: "Platform & DevOps internal engineering issues & incidents",
    };
  }
  if (scopeParam === "TENANT_TO_PLATFORM" && quickParam === "all") {
    return {
      pageTitle: "B2B Mitra Escalations",
      scopeDescription: "Incoming L3 escalation tickets from tenant ISPs",
    };
  }
  return {
    pageTitle: VIEW_LABELS[quickParam] ?? "All Issues",
    scopeDescription: "Internal Platform + B2B Escalation Inbox",
  };
}

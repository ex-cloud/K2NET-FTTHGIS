import { useState, useMemo, type FormEvent } from "react";
import { toast } from "sonner";
import { type Task, type TaskScope } from "@/hooks/useTasksQuery";

interface UseProjectIssuesTabParams {
  projectIssues: Task[];
  onQuickCreateIssue?: (title: string) => Promise<void>;
  onUpdateIssue: (issueId: string, fields: Partial<Task>) => Promise<void>;
  onDeleteIssue: (issueId: string) => Promise<void>;
}

export function useProjectIssuesTab({
  projectIssues,
  onQuickCreateIssue,
  onUpdateIssue,
  onDeleteIssue,
}: UseProjectIssuesTabParams) {
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [quickTitle, setQuickTitle] = useState("");
  const [isCreatingQuick, setIsCreatingQuick] = useState(false);

  // Filtered Issues by Search Query
  const filteredIssues = useMemo(() => {
    if (!searchQuery.trim()) return projectIssues;
    const q = searchQuery.toLowerCase();
    return projectIssues.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        (i.obsidianRef && i.obsidianRef.toLowerCase().includes(q)) ||
        (i.assigneeId && i.assigneeId.toLowerCase().includes(q))
    );
  }, [projectIssues, searchQuery]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredIssues.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredIssues.map((t) => t.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleQuickSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || isCreatingQuick || !onQuickCreateIssue) return;
    setIsCreatingQuick(true);
    try {
      await onQuickCreateIssue(quickTitle.trim());
      setQuickTitle("");
    } finally {
      setIsCreatingQuick(false);
    }
  };

  const handleBatchUpdateStatus = async (status: string) => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    toast.info(`Updating ${ids.length} issues to ${status}...`);
    try {
      await Promise.all(ids.map((id) => onUpdateIssue(id, { status })));
      toast.success(`${ids.length} issues status updated`);
      handleClearSelection();
    } catch {
      toast.error("Failed to update some issues");
    }
  };

  const handleBatchUpdatePriority = async (priority: string) => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    toast.info(`Updating priority to ${priority}...`);
    try {
      await Promise.all(ids.map((id) => onUpdateIssue(id, { priority })));
      toast.success(`${ids.length} issues priority updated`);
      handleClearSelection();
    } catch {
      toast.error("Failed to update some issues");
    }
  };

  const handleBatchUpdateAssignee = async (assigneeId: string | null) => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    toast.info(`Updating assignee...`);
    try {
      await Promise.all(ids.map((id) => onUpdateIssue(id, { assigneeId: assigneeId || undefined })));
      toast.success(`${ids.length} issues assignee updated`);
      handleClearSelection();
    } catch {
      toast.error("Failed to update some issues");
    }
  };

  const handleBatchUpdateScope = async (scope: string) => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    try {
      await Promise.all(ids.map((id) => onUpdateIssue(id, { scope: scope as TaskScope })));
      toast.success(`${ids.length} issues scope updated`);
      handleClearSelection();
    } catch {
      toast.error("Failed to update some issues");
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    if (!confirm(`Are you sure you want to delete ${ids.length} selected issues?`)) return;
    toast.info(`Deleting ${ids.length} issues...`);
    try {
      await Promise.all(ids.map((id) => onDeleteIssue(id)));
      toast.success(`${ids.length} issues deleted`);
      handleClearSelection();
    } catch {
      toast.error("Failed to delete some issues");
    }
  };

  return {
    viewMode,
    setViewMode,
    selectedIds,
    searchQuery,
    setSearchQuery,
    quickTitle,
    setQuickTitle,
    isCreatingQuick,
    filteredIssues,
    handleToggleSelect,
    handleSelectAll,
    handleClearSelection,
    handleQuickSubmit,
    handleBatchUpdateStatus,
    handleBatchUpdatePriority,
    handleBatchUpdateAssignee,
    handleBatchUpdateScope,
    handleBatchDelete,
  };
}

import { Card } from "@k2net/ui";
import { type Task } from "@/hooks/useTasksQuery";
import { TaskBulkActionBar } from "@/components/tasks/TaskBulkActionBar";
import { useProjectIssuesTab } from "./use-project-issues-tab";
import { ProjectIssuesListView } from "./ProjectIssuesListView";
import { ProjectIssuesKanbanView } from "./ProjectIssuesKanbanView";
import { ProjectIssuesHeaderBar } from "./ProjectIssuesHeaderBar";

interface ProjectIssuesTabProps {
  projectIssues: Task[];
  resolvedIssuesCount: number;
  totalIssuesCount: number;
  onNewIssueClick: () => void;
  onQuickCreateIssue?: (title: string) => Promise<void>;
  onToggleIssueStatus: (issue: Task) => Promise<void>;
  onUpdateIssue: (issueId: string, fields: Partial<Task>) => Promise<void>;
  onDeleteIssue: (issueId: string) => Promise<void>;
}

export function ProjectIssuesTab({
  projectIssues,
  resolvedIssuesCount,
  totalIssuesCount,
  onNewIssueClick,
  onQuickCreateIssue,
  onToggleIssueStatus,
  onUpdateIssue,
  onDeleteIssue,
}: ProjectIssuesTabProps) {
  const {
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
  } = useProjectIssuesTab({
    projectIssues,
    onQuickCreateIssue,
    onUpdateIssue,
    onDeleteIssue,
  });

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-150 relative pb-16">
      {/* ── Top Header with Controls, Search & Quick Add ────────────────────── */}
      <ProjectIssuesHeaderBar
        projectIssues={projectIssues}
        filteredIssues={filteredIssues}
        selectedIds={selectedIds}
        resolvedIssuesCount={resolvedIssuesCount}
        totalIssuesCount={totalIssuesCount}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onSelectAll={handleSelectAll}
        onNewIssueClick={onNewIssueClick}
        quickTitle={quickTitle}
        setQuickTitle={setQuickTitle}
        isCreatingQuick={isCreatingQuick}
        onQuickSubmit={handleQuickSubmit}
        showQuickAdd={Boolean(onQuickCreateIssue)}
      />

      {/* ── Empty State ────────────────────────────────────────────────────── */}
      {projectIssues.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground border-dashed border-border/60 bg-card/20 rounded-xl space-y-2">
          <p className="text-xs">Belum ada issue atau tugas yang terhubung ke projek ini.</p>
          <button
            type="button"
            onClick={onNewIssueClick}
            className="text-xs text-primary font-semibold hover:underline cursor-pointer"
          >
            + Tambahkan Issue Pertama
          </button>
        </Card>
      ) : filteredIssues.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground border border-dashed border-border/40 rounded-xl text-xs">
          Tidak ditemukan issue yang sesuai dengan pencarian &quot;{searchQuery}&quot;.
        </div>
      ) : viewMode === "list" ? (
        /* ── LIST VIEW ──────────────────────────────────────────────────────── */
        <ProjectIssuesListView
          issues={filteredIssues}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleIssueStatus={onToggleIssueStatus}
          onUpdateIssue={onUpdateIssue}
          onDeleteIssue={onDeleteIssue}
        />
      ) : (
        /* ── KANBAN BOARD VIEW ──────────────────────────────────────────────── */
        <ProjectIssuesKanbanView
          issues={filteredIssues}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onUpdateIssue={onUpdateIssue}
          onDeleteIssue={onDeleteIssue}
        />
      )}

      {/* ── Multi-Select Batch Actions Toolbar ──────────────────────────────── */}
      <TaskBulkActionBar
        selectedCount={selectedIds.size}
        onClearSelection={handleClearSelection}
        onBatchUpdateStatus={handleBatchUpdateStatus}
        onBatchUpdatePriority={handleBatchUpdatePriority}
        onBatchUpdateAssignee={handleBatchUpdateAssignee}
        onBatchUpdateScope={handleBatchUpdateScope}
        onBatchDelete={handleBatchDelete}
      />
    </div>
  );
}



import React, { useState, useMemo } from "react";
import { Link } from "@/lib/navigation-compat";
import {
  Plus,
  Circle,
  User,
  LayoutList,
  Columns3,
  CheckCircle2,
  Clock,
  Minus,
  Check,
  Flame,
  MoreHorizontal,
  Search,
  CornerDownLeft,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  Card,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@k2net/ui";
import { type Task, type TaskScope } from "@/hooks/useTasksQuery";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "@/components/tasks/configs";
import { TaskContextMenu } from "@/components/tasks/TaskContextMenu";
import { TaskBulkActionBar } from "@/components/tasks/TaskBulkActionBar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

const KANBAN_COLS = [
  { id: "TODO", label: "To Do", icon: Circle, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { id: "IN_PROGRESS", label: "In Progress", icon: Clock, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  { id: "RESOLVED", label: "Resolved", icon: CheckCircle2, color: "text-primary bg-primary/10 border-primary/20" },
  { id: "CLOSED", label: "Closed", icon: Check, color: "text-muted-foreground bg-muted border-border/40" },
];

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
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [quickTitle, setQuickTitle] = useState("");
  const [isCreatingQuick, setIsCreatingQuick] = useState(false);

  // ── Filtered Issues by Search Query ─────────────────────────────────────────
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

  // ── Selection helpers ───────────────────────────────────────────────────────
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

  // ── Quick Add Handler ───────────────────────────────────────────────────────
  const handleQuickSubmit = async (e: React.FormEvent) => {
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

  // ── Batch Action Handlers ───────────────────────────────────────────────────
  const handleBatchUpdateStatus = async (status: string) => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    toast.info(`Updating ${ids.length} issues to ${status}...`);
    try {
      await Promise.all(ids.map((id) => onUpdateIssue(id, { status: status as any })));
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
      await Promise.all(ids.map((id) => onUpdateIssue(id, { priority: priority as any })));
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

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-150 relative pb-16">
      {/* ── Top Header with Controls & Search ────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/30 p-3 rounded-xl border border-border/50">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={filteredIssues.length > 0 && selectedIds.size === filteredIssues.length}
            ref={(el) => {
              if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < filteredIssues.length;
            }}
            onChange={handleSelectAll}
            className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary/40 cursor-pointer accent-primary ml-1 shrink-0"
            title="Select all"
          />
          <span className="text-xs font-bold text-foreground shrink-0">Project Issues</span>
          <span className="text-xs font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full shrink-0">
            {resolvedIssuesCount}/{totalIssuesCount} resolved
          </span>
          {selectedIds.size > 0 && (
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md shrink-0">
              {selectedIds.size} selected
            </span>
          )}

          {/* Mini Search Input */}
          {projectIssues.length > 3 && (
            <div className="relative ml-2 w-full max-w-[180px]">
              <Search className="absolute left-2.5 top-2 h-3 w-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filter issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-3 py-1 text-[11px] rounded-lg border border-border/60 bg-background/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary h-7"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* View Switcher: List vs Kanban */}
          <div className="flex items-center p-0.5 bg-muted/60 rounded-lg border border-border/40">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1",
                viewMode === "list"
                  ? "bg-card text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="List View"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={cn(
                "p-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1",
                viewMode === "kanban"
                  ? "bg-card text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Kanban Board"
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Kanban</span>
            </button>
          </div>

          {/* New Issue Button */}
          <button
            type="button"
            onClick={onNewIssueClick}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New issue</span>
          </button>
        </div>
      </div>

      {/* ── Inline Quick Add Issue Input ────────────────────────────────────── */}
      {onQuickCreateIssue && (
        <form onSubmit={handleQuickSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Plus className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Quick add new issue to this project (type title and press Enter)..."
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              disabled={isCreatingQuick}
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-border/60 bg-card/60 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all h-9"
            />
            {isCreatingQuick ? (
              <Loader2 className="absolute right-3 top-2.5 h-3.5 w-3.5 animate-spin text-primary" />
            ) : quickTitle.trim() ? (
              <button
                type="submit"
                className="absolute right-2.5 top-2 p-0.5 rounded bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                title="Press Enter to create"
              >
                <CornerDownLeft className="h-3 w-3" />
              </button>
            ) : null}
          </div>
        </form>
      )}

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
        <div className="space-y-1.5">
          {filteredIssues.map((issue) => {
            const isDone = issue.status === "RESOLVED" || issue.status === "CLOSED";
            const isSelected = selectedIds.has(issue.id);
            const StatusIcon = STATUS_CONFIG[issue.status]?.icon ?? Circle;

            return (
              <TaskContextMenu
                key={issue.id}
                task={issue}
                onUpdateStatus={(st) => onUpdateIssue(issue.id, { status: st })}
                onUpdatePriority={(pr) => onUpdateIssue(issue.id, { priority: pr })}
                onUpdateScope={(sc) => onUpdateIssue(issue.id, { scope: sc as TaskScope })}
                onDelete={() => onDeleteIssue(issue.id)}
              >
                <div
                  className={cn(
                    "flex items-center justify-between p-2.5 rounded-xl border transition-colors group",
                    isSelected
                      ? "bg-primary/5 border-primary/40 shadow-xs"
                      : "bg-card/40 border-border/40 hover:border-border hover:bg-card/70"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Select Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(issue.id)}
                      className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary/40 cursor-pointer accent-primary ml-1 shrink-0"
                    />

                    {/* Status Toggle Button */}
                    <button
                      type="button"
                      onClick={() => onToggleIssueStatus(issue)}
                      className={cn(
                        "shrink-0 p-0.5 rounded hover:bg-muted transition-colors cursor-pointer",
                        isDone ? "text-green-500" : "text-muted-foreground"
                      )}
                      title="Click to toggle status"
                    >
                      <StatusIcon className="w-4 h-4" />
                    </button>

                    {/* Issue Title */}
                    <Link
                      href={`/tasks/${issue.id}`}
                      className={cn(
                        "text-xs font-medium hover:text-primary transition-colors truncate max-w-[400px]",
                        isDone ? "line-through text-muted-foreground/60" : "text-foreground"
                      )}
                    >
                      {issue.title}
                    </Link>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-xs">
                    {issue.priority && issue.priority !== "NORMAL" && (
                      <span
                        className={cn(
                          "text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold",
                          PRIORITY_CONFIG[issue.priority]?.className ?? ""
                        )}
                      >
                        {issue.priority}
                      </span>
                    )}

                    <div className="w-5 h-5 rounded-full bg-muted/60 text-muted-foreground flex items-center justify-center text-[10px] font-mono">
                      {issue.assigneeId ? issue.assigneeId.substring(0, 1).toUpperCase() : <User className="w-3 h-3" />}
                    </div>

                    <span className="text-[11px] font-mono text-muted-foreground">
                      {new Date(issue.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>
              </TaskContextMenu>
            );
          })}
        </div>
      ) : (
        /* ── KANBAN BOARD VIEW ──────────────────────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {KANBAN_COLS.map((col) => {
            const colIssues = filteredIssues.filter((t) => {
              if (col.id === "TODO") return t.status === "TODO" || t.status === "BACKLOG" || t.status === "PLANNED";
              return t.status === col.id;
            });
            const ColIcon = col.icon;

            return (
              <div
                key={col.id}
                className="flex flex-col bg-card/30 border border-border/50 rounded-xl p-3 min-h-[350px] space-y-3"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <div className="flex items-center gap-1.5">
                    <ColIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-bold text-foreground">{col.label}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-muted-foreground bg-muted px-1.5 py-0.2 rounded-full">
                    {colIssues.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {colIssues.length === 0 ? (
                    <div className="h-24 flex items-center justify-center border border-dashed border-border/30 rounded-lg text-muted-foreground/50 text-[11px]">
                      No issues
                    </div>
                  ) : (
                    colIssues.map((issue) => {
                      const isSelected = selectedIds.has(issue.id);
                      return (
                        <TaskContextMenu
                          key={issue.id}
                          task={issue}
                          onUpdateStatus={(st) => onUpdateIssue(issue.id, { status: st })}
                          onUpdatePriority={(pr) => onUpdateIssue(issue.id, { priority: pr })}
                          onUpdateScope={(sc) => onUpdateIssue(issue.id, { scope: sc as TaskScope })}
                          onDelete={() => onDeleteIssue(issue.id)}
                        >
                          <div
                            className={cn(
                              "p-3 rounded-lg border bg-card/80 text-foreground transition-all hover:border-primary/50 shadow-2xs space-y-2 group",
                              isSelected ? "border-primary bg-primary/5" : "border-border/60"
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelect(issue.id)}
                                  className="w-3 h-3 rounded border-border text-primary focus:ring-primary/40 cursor-pointer accent-primary shrink-0"
                                />
                                <Link
                                  href={`/tasks/${issue.id}`}
                                  className="text-xs font-semibold text-foreground hover:text-primary transition-colors line-clamp-2"
                                >
                                  {issue.title}
                                </Link>
                              </div>

                              {/* Status changer dropdown */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    type="button"
                                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                                    title="Change status"
                                  >
                                    <MoreHorizontal className="w-3 h-3" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-36 z-[1000]">
                                  {KANBAN_COLS.map((st) => (
                                    <DropdownMenuItem
                                      key={st.id}
                                      onClick={() => onUpdateIssue(issue.id, { status: st.id as any })}
                                      className="text-xs cursor-pointer"
                                    >
                                      <span>{st.label}</span>
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* Card Footer */}
                            <div className="flex items-center justify-between pt-1 border-t border-border/30 text-[10px]">
                              <div className="flex items-center gap-1.5">
                                {issue.priority && issue.priority !== "NORMAL" && (
                                  <span
                                    className={cn(
                                      "px-1 py-0.2 rounded font-mono font-semibold",
                                      PRIORITY_CONFIG[issue.priority]?.className ?? ""
                                    )}
                                  >
                                    {issue.priority}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 text-muted-foreground font-mono">
                                <div className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[8px] font-bold flex items-center justify-center">
                                  {issue.assigneeId ? issue.assigneeId.substring(0, 1).toUpperCase() : "?"}
                                </div>
                                <span>
                                  {new Date(issue.createdAt).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </TaskContextMenu>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
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

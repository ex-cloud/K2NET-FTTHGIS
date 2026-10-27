import { type FormEvent } from "react";
import { Plus, LayoutList, Columns3, Search, CornerDownLeft, Loader2 } from "lucide-react";
import { useTranslation } from "@k2net/i18n";
import { cn } from "@/lib/utils";
import { type Task } from "@/hooks/useTasksQuery";

interface ProjectIssuesHeaderBarProps {
  projectIssues: Task[];
  filteredIssues: Task[];
  selectedIds: Set<string>;
  resolvedIssuesCount: number;
  totalIssuesCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  viewMode: "list" | "kanban";
  setViewMode: (vm: "list" | "kanban") => void;
  onSelectAll: () => void;
  onNewIssueClick?: () => void;
  quickTitle: string;
  setQuickTitle: (t: string) => void;
  isCreatingQuick: boolean;
  onQuickSubmit: (e: FormEvent) => void;
  showQuickAdd: boolean;
}

export function ProjectIssuesHeaderBar({
  projectIssues,
  filteredIssues,
  selectedIds,
  resolvedIssuesCount,
  totalIssuesCount,
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  onSelectAll,
  onNewIssueClick: _onNewIssueClick,
  quickTitle,
  setQuickTitle,
  isCreatingQuick,
  onQuickSubmit,
  showQuickAdd,
}: ProjectIssuesHeaderBarProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* ── Top Header with Controls & Search ────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/30 p-3 rounded-xl border border-border/50">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={filteredIssues.length > 0 && selectedIds.size === filteredIssues.length}
            ref={(el) => {
              if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < filteredIssues.length;
            }}
            onChange={onSelectAll}
            className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary/40 cursor-pointer accent-primary ml-1 shrink-0"
            title="Select all"
          />
          <span className="text-xs font-bold text-foreground shrink-0">
            {t("workspace.issues_header_title")}
          </span>
          <span className="text-xs font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full shrink-0">
            {t("workspace.issues_resolved_count", {
              resolved: resolvedIssuesCount,
              total: totalIssuesCount,
            })}
          </span>
          {selectedIds.size > 0 && (
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md shrink-0">
              {t("workspace.issues_selected_count", { count: selectedIds.size })}
            </span>
          )}

          {/* Mini Search Input */}
          {projectIssues.length > 3 && (
            <div className="relative ml-2 w-full max-w-[180px]">
              <Search className="absolute left-2.5 top-2 h-3 w-3 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("workspace.issues_filter_placeholder")}
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
              title={t("workspace.issues_view_list")}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">{t("workspace.issues_view_list")}</span>
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
              title={t("workspace.issues_view_kanban")}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">{t("workspace.issues_view_kanban")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Inline Quick Add Issue Input ────────────────────────────────────── */}
      {showQuickAdd && (
        <form onSubmit={onQuickSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Plus className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("workspace.issues_quick_add_placeholder")}
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              disabled={isCreatingQuick}
              className="w-full pl-8 pr-8 py-1.5 text-xs rounded-md border border-border/60 bg-card/60 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all h-8"
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
    </>
  );
}

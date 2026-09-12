import React from "react";
import {
  FolderKanban,
  Plus,
  Loader2,
  ChevronDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@k2net/ui";
import { type DisplayPropertiesState } from "@/components/tasks/LinearDisplayOptionsPopover";
import {
  type ProjectPlanItem,
  type SortField,
  type SortDir,
} from "./projects-hub-helpers";
import { ProjectTableRow } from "./ProjectTableRow";

interface ProjectsHubTableProps {
  projects: ProjectPlanItem[];
  filteredProjects: ProjectPlanItem[];
  loading: boolean;
  loadingMore: boolean;
  searchQuery: string;
  displayProperties: DisplayPropertiesState;
  sortField: SortField | null;
  sortDir: SortDir;
  setSortField: (field: SortField) => void;
  setSortDir: (dir: SortDir) => void;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  onNewProject: () => void;
  onUpdateStatus: (projectId: string, status: string) => void;
  onUpdatePriority: (projectId: string, priority: string) => void;
  onUpdateHealth: (projectId: string, health: string) => void;
  onUpdateLead: (projectId: string, lead: string) => void;
  onUpdateDueDate: (projectId: string, dueDate?: string) => void;
  onDeleteProject: (projectId: string) => void;
}

interface ColumnHeaderProps {
  title: string;
  field: SortField;
  currentSortField: SortField | null;
  currentSortDir: SortDir;
  onSort: (field: SortField, dir: SortDir) => void;
  align?: "start" | "center" | "end";
}

const ColumnHeader: React.FC<ColumnHeaderProps> = ({
  title,
  field,
  currentSortField,
  currentSortDir,
  onSort,
  align = "start",
}) => {
  const isSorted = currentSortField === field;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1 hover:text-foreground transition-colors outline-hidden select-none py-1 px-1.5 -mx-1.5 rounded hover:bg-muted/40 font-semibold cursor-pointer">
          <span>{title}</span>
          <span className="flex items-center">
            {isSorted ? (
              currentSortDir === "asc" ? (
                <ArrowUp className="h-3 w-3 text-primary shrink-0" />
              ) : (
                <ArrowDown className="h-3 w-3 text-primary shrink-0" />
              )
            ) : (
              <ChevronDown className="h-3 w-3 opacity-40 shrink-0 hover:opacity-100" />
            )}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className="bg-popover border border-border shadow-xl rounded-lg p-1 min-w-32 z-50"
      >
        <DropdownMenuItem
          onClick={() => onSort(field, "asc")}
          className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-sm cursor-pointer hover:bg-muted/50 text-foreground"
        >
          <ArrowUp className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Sort Ascending</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onSort(field, "desc")}
          className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-sm cursor-pointer hover:bg-muted/50 text-foreground"
        >
          <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Sort Descending</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const ProjectsHubTable: React.FC<ProjectsHubTableProps> = ({
  projects,
  filteredProjects,
  loading,
  loadingMore,
  searchQuery,
  displayProperties,
  sortField,
  sortDir,
  setSortField,
  setSortDir,
  sentinelRef,
  onNewProject,
  onUpdateStatus,
  onUpdatePriority,
  onUpdateHealth,
  onUpdateLead,
  onUpdateDueDate,
  onDeleteProject,
}) => {
  const handleSort = (field: SortField, dir: SortDir) => {
    setSortField(field);
    setSortDir(dir);
  };

  return (
    <div className="flex-1 min-h-0 overflow-auto custom-scrollbar-thin">
      <div className="min-w-[1000px] flex flex-col">
        {/* ── Sticky Column Headers ── */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md flex border-b border-border items-stretch divide-x divide-border/45 text-[11px] font-semibold tracking-wider text-muted-foreground/80 shadow-xs">
          <div className="px-4 py-2.5 flex items-center min-w-[200px] flex-1">
            <ColumnHeader
              title="Name"
              field="name"
              currentSortField={sortField}
              currentSortDir={sortDir}
              onSort={handleSort}
            />
          </div>

          {displayProperties.health !== false && (
            <div className="px-4 py-2.5 flex items-center w-28 shrink-0">
              <ColumnHeader
                title="Health"
                field="health"
                currentSortField={sortField}
                currentSortDir={sortDir}
                onSort={handleSort}
              />
            </div>
          )}

          {displayProperties.priority !== false && (
            <div className="px-4 py-2.5 flex items-center w-24 shrink-0">
              <ColumnHeader
                title="Priority"
                field="priority"
                currentSortField={sortField}
                currentSortDir={sortDir}
                onSort={handleSort}
              />
            </div>
          )}

          {displayProperties.lead !== false && (
            <div className="px-4 py-2.5 flex items-center w-32 shrink-0 min-w-0">
              <ColumnHeader
                title="Lead"
                field="lead"
                currentSortField={sortField}
                currentSortDir={sortDir}
                onSort={handleSort}
              />
            </div>
          )}

          {displayProperties.targetDate !== false && (
            <div className="px-4 py-2.5 flex items-center w-28 shrink-0">
              <ColumnHeader
                title="Target Date"
                field="dueDate"
                currentSortField={sortField}
                currentSortDir={sortDir}
                onSort={handleSort}
              />
            </div>
          )}

          {displayProperties.created !== false && (
            <div className="px-4 py-2.5 flex items-center w-28 shrink-0">
              <ColumnHeader
                title="Created"
                field="createdAt"
                currentSortField={sortField}
                currentSortDir={sortDir}
                onSort={handleSort}
              />
            </div>
          )}

          {displayProperties.issues !== false && (
            <div className="px-4 py-2.5 flex items-center justify-center w-20 shrink-0">
              <ColumnHeader
                title="Issues"
                field="issuesCount"
                currentSortField={sortField}
                currentSortDir={sortDir}
                onSort={handleSort}
                align="center"
              />
            </div>
          )}

          {displayProperties.status !== false && (
            <div className="px-4 py-2.5 flex items-center justify-end w-24 shrink-0">
              <ColumnHeader
                title="Status"
                field="percentage"
                currentSortField={sortField}
                currentSortDir={sortDir}
                onSort={handleSort}
                align="end"
              />
            </div>
          )}
        </div>

        {/* ── Rows ── */}
        {loading && projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground font-mono">Loading project plans...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <FolderKanban className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">No project plans found</p>
            <p className="text-xs text-muted-foreground max-w-sm text-center">
              {searchQuery
                ? "Try adjusting your search or filters."
                : "Create your first high-level engineering project or milestone."}
            </p>
            <button
              onClick={onNewProject}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Project</span>
            </button>
          </div>
        ) : (
          filteredProjects.map((proj) => (
            <ProjectTableRow
              key={proj.id}
              proj={proj}
              displayProperties={displayProperties}
              onUpdateStatus={onUpdateStatus}
              onUpdatePriority={onUpdatePriority}
              onUpdateHealth={onUpdateHealth}
              onUpdateLead={onUpdateLead}
              onUpdateDueDate={onUpdateDueDate}
              onDeleteProject={onDeleteProject}
            />
          ))
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="py-2 flex items-center justify-center">
          {loadingMore && (
            <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground font-mono">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Loading more projects...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

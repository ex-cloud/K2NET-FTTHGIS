import React, { useRef, useEffect } from "react";
import { useRouter } from "@/lib/navigation-compat";
import {
  ClipboardList,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Loader2,
} from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { type Task } from "@/hooks/useTasksQuery";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@k2net/ui";
import { TaskContextMenu } from "./TaskContextMenu";
import { type DisplayPropertiesState } from "./LinearDisplayOptionsPopover";
import { getTaskTableColumns } from "./task-table-columns";

interface TaskTableProps {
  tasks: Task[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onRowClick: (task: Task) => void;
  onUpdateTask: (id: string, fields: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onFetchMore: () => void;
  assigneesList: string[];
  selectedTaskIds?: Set<string>;
  onToggleSelectTask?: (id: string, shiftKey?: boolean) => void;
  onSelectAllTasks?: () => void;
  focusedIndex?: number;
  displayProperties?: DisplayPropertiesState;
}

const COLUMN_CLASSES: Record<string, string> = {
  select: "w-9 shrink-0 justify-center",
  title: "flex-1 min-w-[200px] justify-start",
  scope: "w-28 shrink-0 justify-start",
  type: "w-20 shrink-0 justify-start",
  priority: "w-28 shrink-0 justify-start",
  status: "w-32 shrink-0 justify-start",
  assigneeId: "w-36 shrink-0 justify-start",
  dueDate: "w-28 shrink-0 justify-start",
  createdAt: "w-28 shrink-0 justify-start",
};

const TaskTableSkeletons: React.FC<{ displayProperties?: DisplayPropertiesState }> = ({
  displayProperties,
}) => (
  <>
    {Array.from({ length: 8 }).map((_, i) => (
      <div
        key={`skeleton-${i}`}
        className="flex items-stretch divide-x divide-border/30 animate-pulse bg-background/30"
      >
        <div className="w-9 shrink-0 px-2 py-4 flex items-center justify-center"><div className="h-3.5 w-3.5 bg-muted/60 rounded" /></div>
        <div className="flex-1 min-w-[200px] px-4 py-4 flex items-center"><div className="h-3.5 bg-muted/60 rounded w-[60%]" /></div>
        {displayProperties?.scope !== false && <div className="w-28 shrink-0 px-4 py-4 flex items-center"><div className="h-3.5 bg-muted/60 rounded w-16" /></div>}
        {displayProperties?.type !== false && <div className="w-20 shrink-0 px-4 py-4 flex items-center"><div className="h-3.5 bg-muted/60 rounded w-12" /></div>}
        {displayProperties?.priority !== false && <div className="w-28 shrink-0 px-4 py-4 flex items-center"><div className="h-3.5 bg-muted/60 rounded w-16" /></div>}
        {displayProperties?.status !== false && <div className="w-32 shrink-0 px-4 py-4 flex items-center"><div className="h-3.5 bg-muted/60 rounded w-20" /></div>}
        {displayProperties?.assignee !== false && <div className="w-36 shrink-0 px-4 py-4 flex items-center"><div className="h-3.5 bg-muted/60 rounded w-20" /></div>}
        {displayProperties?.dueDate !== false && <div className="w-28 shrink-0 px-4 py-4 flex items-center"><div className="h-3.5 bg-muted/60 rounded w-20" /></div>}
        {displayProperties?.created !== false && <div className="w-28 shrink-0 px-4 py-4 flex items-center"><div className="h-3.5 bg-muted/60 rounded w-20" /></div>}
      </div>
    ))}
  </>
);

export function TaskTable({
  tasks,
  loading,
  loadingMore,
  hasMore,
  onRowClick,
  onUpdateTask,
  onDeleteTask,
  onFetchMore,
  assigneesList,
  selectedTaskIds,
  onToggleSelectTask,
  onSelectAllTasks,
  focusedIndex = -1,
  displayProperties,
}: TaskTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          onFetchMore();
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
  }, [onFetchMore, hasMore, loadingMore, loading]);

  const columns = React.useMemo(
    () =>
      getTaskTableColumns({
        tasks,
        selectedTaskIds,
        onSelectAllTasks,
        onToggleSelectTask,
        onUpdateTask,
        assigneesList,
        onNavigate: (path) => router.push(path),
      }),
    [assigneesList, onUpdateTask, selectedTaskIds, onToggleSelectTask, onSelectAllTasks, tasks, router]
  );

  const columnVisibility = React.useMemo<VisibilityState>(() => {
    const visibility: VisibilityState = {};
    if (displayProperties) {
      visibility.scope = displayProperties.scope !== false;
      visibility.type = displayProperties.type !== false;
      visibility.priority = displayProperties.priority !== false;
      visibility.status = displayProperties.status !== false;
      visibility.assigneeId = displayProperties.assignee !== false;
      visibility.dueDate = displayProperties.dueDate !== false;
      visibility.createdAt = displayProperties.created !== false;
    }
    return visibility;
  }, [displayProperties]);

  const table = useReactTable({
    data: tasks,
    columns,
    state: { sorting, columnVisibility },
    meta: { selectedTaskIds },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="min-w-[1000px] flex flex-col">
      {/* ── Sticky Column Headers ──────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md flex border-b border-border items-stretch divide-x divide-border/45 text-[11px] font-semibold tracking-wider text-muted-foreground/80 shadow-xs">
        {table.getFlatHeaders().map((header) => {
          if (header.isPlaceholder) return null;
          const canSort = header.column.getCanSort();
          const isSorted = header.column.getIsSorted();
          const colClass = COLUMN_CLASSES[header.column.id] ?? "w-28 shrink-0 justify-start";

          return (
            <div
              key={header.id}
              className={cn(
                "min-w-0 py-2.5 flex items-center",
                colClass,
                header.column.id === "select" ? "px-1 justify-center" : "px-4 justify-start text-left"
              )}
            >
              {canSort && header.column.id !== "select" ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 hover:text-foreground transition-colors outline-hidden select-none py-1 px-1.5 -mx-1.5 rounded hover:bg-muted/40 font-semibold cursor-pointer">
                      <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                      <span className="flex items-center">
                        {isSorted === "asc" ? (
                          <ArrowUp className="h-3 w-3 text-primary shrink-0" />
                        ) : isSorted === "desc" ? (
                          <ArrowDown className="h-3 w-3 text-primary shrink-0" />
                        ) : (
                          <ChevronDown className="h-3 w-3 opacity-40 shrink-0 hover:opacity-100" />
                        )}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-popover border border-border shadow-xl rounded-lg p-1 min-w-32 z-50">
                    <DropdownMenuItem
                      onClick={() => header.column.toggleSorting(false)}
                      className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-sm cursor-pointer hover:bg-muted/50 text-foreground"
                    >
                      <ArrowUp className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Sort Ascending</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => header.column.toggleSorting(true)}
                      className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-sm cursor-pointer hover:bg-muted/50 text-foreground"
                    >
                      <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Sort Descending</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="w-full flex items-center justify-center">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Table Body ─────────────────────────────────────────────────── */}
      <div className="divide-y divide-border/40">
        {loading && tasks.length === 0 ? (
          <TaskTableSkeletons displayProperties={displayProperties} />
        ) : tasks.length === 0 ? (
          <div className="px-4 py-16 text-center flex flex-col items-center gap-3 text-muted-foreground">
            <ClipboardList className="h-10 w-10 opacity-30" />
            <p className="text-sm">No tasks found for this view.</p>
          </div>
        ) : (
          table.getRowModel().rows.map((row, index) => (
            <TaskContextMenu
              key={row.id}
              task={row.original}
              onUpdateStatus={(st) => onUpdateTask(row.original.id, { status: st })}
              onUpdatePriority={(pr) => onUpdateTask(row.original.id, { priority: pr })}
              onUpdateAssignee={(assigneeId) => onUpdateTask(row.original.id, { assigneeId })}
              onUpdateDueDate={(dueDate) => onUpdateTask(row.original.id, { dueDate })}
              onUpdateScope={(sc) => onUpdateTask(row.original.id, { scope: sc })}
              onDelete={() => onDeleteTask(row.original.id)}
            >
              <div
                onClick={() => onRowClick(row.original)}
                className={cn(
                  "flex items-stretch hover:bg-muted/10 cursor-pointer transition-all border-b border-border/30 divide-x divide-border/25 group bg-card/5",
                  focusedIndex === index && "ring-1 ring-primary/80 bg-primary/5 shadow-xs",
                  selectedTaskIds?.has(row.original.id) && "bg-primary/10"
                )}
              >
                {row.getVisibleCells().map((cell) => {
                  const colClass = COLUMN_CLASSES[cell.column.id] ?? "w-28 shrink-0 justify-start";
                  return (
                    <div
                      key={cell.id}
                      className={cn(
                        "min-w-0 py-3.5 flex items-center",
                        colClass,
                        cell.column.id === "select" ? "px-1 justify-center" : "px-4 justify-start"
                      )}
                    >
                      <div className="w-full min-w-0">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TaskContextMenu>
          ))
        )}
      </div>

      <div ref={sentinelRef} className="h-1" />

      {loadingMore && (
        <div className="flex items-center justify-center py-4 gap-2 text-xs text-muted-foreground border-t border-border/30">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          <span>Loading more tasks...</span>
        </div>
      )}

      {!hasMore && tasks.length > 0 && !loading && (
        <div className="flex items-center justify-center py-3 text-[11px] text-muted-foreground/60 border-t border-border/30">
          <span>All {tasks.length} tasks loaded</span>
        </div>
      )}
    </div>
  );
}

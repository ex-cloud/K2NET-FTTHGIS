"use client";

import React, { useRef, useEffect } from "react";
import {
  ClipboardList,
  Calendar as CalendarIcon,
  User,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
  SortingState,
} from "@tanstack/react-table";
import { type Task } from "@/hooks/useTasksQuery";
import { cn } from "@/lib/utils";
import { ScopeBadge } from "./ScopeBadge";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "./configs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Calendar,
} from "@k2net/ui";
import { TaskContextMenu } from "./TaskContextMenu";

interface TaskTableProps {
  tasks: Task[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onRowClick: (task: Task) => void;     // now passes full Task object
  onUpdateTask: (id: string, fields: any) => void;
  onDeleteTask: (id: string) => void;
  onFetchMore: () => void;
  assigneesList: string[];
  selectedTaskIds?: Set<string>;
  onToggleSelectTask?: (id: string, shiftKey?: boolean) => void;
  onSelectAllTasks?: () => void;
  focusedIndex?: number;
}

const columnHelper = createColumnHelper<Task>();

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
}: TaskTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // ── IntersectionObserver for infinite scroll ────────────────────────────────
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

  // ── Columns ────────────────────────────────────────────────────────────────

  const columns = React.useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: () => {
          const isAllSelected = tasks.length > 0 && selectedTaskIds && selectedTaskIds.size === tasks.length;
          const isSomeSelected = selectedTaskIds && selectedTaskIds.size > 0 && selectedTaskIds.size < tasks.length;
          return (
            <div className="flex items-center justify-center w-full" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={Boolean(isAllSelected)}
                ref={(el) => {
                  if (el) el.indeterminate = Boolean(isSomeSelected);
                }}
                onChange={() => onSelectAllTasks?.()}
                className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary/40 cursor-pointer accent-primary"
              />
            </div>
          );
        },
        cell: (info) => {
          const isSelected = selectedTaskIds?.has(info.row.original.id);
          return (
            <div
              className="flex items-center justify-center w-full"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelectTask?.(info.row.original.id, (e as any).shiftKey);
              }}
            >
              <input
                type="checkbox"
                checked={Boolean(isSelected)}
                onChange={() => {}}
                className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary/40 cursor-pointer accent-primary"
              />
            </div>
          );
        },
      }),
      columnHelper.accessor("title", {
        header: "Title",
        cell: (info) => {
          const task = info.row.original;
          return (
            <div className="min-w-0 flex items-center gap-2">
              <span className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                {task.title}
              </span>
              {task.obsidianRef && (
                <span className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded shrink-0">
                  {task.obsidianRef}
                </span>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor("scope", {
        header: "Scope",
        cell: (info) => <ScopeBadge scope={info.getValue()} />,
      }),
      columnHelper.accessor("type", {
        header: "Type",
        cell: (info) => (
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold uppercase tracking-wider whitespace-nowrap">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("priority", {
        header: "Priority",
        cell: (info) => {
          const task = info.row.original;
          const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.NORMAL;
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "text-xs px-2 py-1 rounded-md font-semibold flex items-center gap-1 border border-transparent hover:border-border transition-all",
                      priority.className
                    )}
                  >
                    <span>{priority.label}</span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[120px]">
                  {Object.keys(PRIORITY_CONFIG).map((pKey) => (
                    <DropdownMenuItem
                      key={pKey}
                      onClick={() => onUpdateTask(task.id, { priority: pKey })}
                      className="text-xs font-semibold cursor-pointer"
                    >
                      {PRIORITY_CONFIG[pKey].label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => {
          const task = info.row.original;
          const status = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.TODO;
          const StatusIcon = status.icon;
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-transparent hover:border-border transition-all",
                      status.className
                    )}
                  >
                    <StatusIcon className="h-3.5 w-3.5" />
                    <span>{status.label}</span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[150px]">
                  {Object.keys(STATUS_CONFIG).map((sKey) => {
                    const val = STATUS_CONFIG[sKey];
                    const Icon = val.icon;
                    return (
                      <DropdownMenuItem
                        key={sKey}
                        onClick={() => onUpdateTask(task.id, { status: sKey })}
                        className="text-xs flex items-center gap-2 cursor-pointer"
                      >
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{val.label}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      }),
      columnHelper.accessor("assigneeId", {
        header: "Assignee",
        cell: (info) => {
          const task = info.row.original;
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-border/80 bg-card hover:bg-muted text-foreground transition-all font-mono">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>
                      {task.assigneeId ? `…${task.assigneeId.slice(-8)}` : "Assignee"}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[160px] max-h-[220px] overflow-y-auto">
                  <DropdownMenuItem
                    onClick={() => onUpdateTask(task.id, { assigneeId: null })}
                    className="text-xs text-muted-foreground italic cursor-pointer"
                  >
                    Unassigned
                  </DropdownMenuItem>
                  {assigneesList.map((id) => (
                    <DropdownMenuItem
                      key={id}
                      onClick={() => onUpdateTask(task.id, { assigneeId: id })}
                      className="text-xs font-mono cursor-pointer"
                    >
                      {`…${id.slice(-8)}`}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      }),
      columnHelper.accessor("dueDate", {
        header: "Due Date",
        cell: (info) => {
          const task = info.row.original;
          const formattedDate = task.dueDate
            ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })
            : "Set Date";
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition-all whitespace-nowrap",
                      task.dueDate
                        ? "border-border bg-card text-foreground"
                        : "border-dashed border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{formattedDate}</span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="p-0 border border-border shadow-xl">
                  <Calendar
                    mode="single"
                    selected={task.dueDate ? new Date(task.dueDate) : undefined}
                    onSelect={(date) => {
                      onUpdateTask(task.id, {
                        dueDate: date ? date.toISOString() : null,
                      });
                    }}
                    className="bg-card rounded-xl"
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      }),
      columnHelper.accessor("createdAt", {
        header: "Created",
        cell: (info) => {
          const val = info.getValue();
          if (!val) return <span className="text-muted-foreground text-xs">—</span>;
          return (
            <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
              {new Date(val).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          );
        },
      }),
    ],
    [assigneesList, onUpdateTask]
  );

  const table = useReactTable({
    data: tasks,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-w-[1000px] flex flex-col">
      {/* ── Sticky Column Headers (Pinned to top on scroll) ────────────── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md grid grid-cols-[36px_1fr_100px_70px_100px_130px_140px_110px_110px] border-b border-border items-stretch divide-x divide-border/45 text-[11px] font-semibold tracking-wider text-muted-foreground/80 shadow-xs">
        {table.getFlatHeaders().map((header) => {
          if (header.isPlaceholder) return <div key={header.id} />;
          const canSort = header.column.getCanSort();
          const isSorted = header.column.getIsSorted();

          return (
            <div
              key={header.id}
              className={cn(
                "min-w-0 py-2.5 flex items-center",
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
          // Skeleton rows
          Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="grid grid-cols-[36px_1fr_100px_70px_100px_130px_140px_110px_110px] items-stretch divide-x divide-border/30 animate-pulse bg-background/30"
            >
              <div className="min-w-0 px-2 py-4 flex items-center justify-center"><div className="h-3.5 w-3.5 bg-muted/60 rounded" /></div>
              <div className="min-w-0 px-4 py-4 flex items-center"><div className="h-3.5 bg-muted/60 rounded w-[60%]" /></div>
              <div className="min-w-0 px-4 py-4 flex items-center"><div className="h-3.5 bg-muted/60 rounded w-16" /></div>
              <div className="min-w-0 px-4 py-4 flex items-center"><div className="h-3.5 bg-muted/60 rounded w-12" /></div>
              <div className="min-w-0 px-4 py-4 flex items-center"><div className="h-3.5 bg-muted/60 rounded w-16" /></div>
              <div className="min-w-0 px-4 py-4 flex items-center"><div className="h-3.5 bg-muted/60 rounded w-20" /></div>
              <div className="min-w-0 px-4 py-4 flex items-center"><div className="h-3.5 bg-muted/60 rounded w-20" /></div>
              <div className="min-w-0 px-4 py-4 flex items-center"><div className="h-3.5 bg-muted/60 rounded w-20" /></div>
              <div className="min-w-0 px-4 py-4 flex items-center"><div className="h-3.5 bg-muted/60 rounded w-20" /></div>
            </div>
          ))
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
                  "grid grid-cols-[36px_1fr_100px_70px_100px_130px_140px_110px_110px] items-stretch hover:bg-muted/10 cursor-pointer transition-all border-b border-border/30 divide-x divide-border/25 group bg-card/5",
                  focusedIndex === index && "ring-1 ring-primary/80 bg-primary/5 shadow-xs",
                  selectedTaskIds?.has(row.original.id) && "bg-primary/10"
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <div
                    key={cell.id}
                    className={cn(
                      "min-w-0 py-3.5 flex items-center",
                      cell.column.id === "select" ? "px-1 justify-center" : "px-4 justify-start"
                    )}
                  >
                    <div className="w-full min-w-0">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  </div>
                ))}
              </div>
            </TaskContextMenu>
          ))
        )}
      </div>

      {/* ── Infinite Scroll Sentinel ────────────────────────────────────── */}
      <div ref={sentinelRef} className="h-1" />

      {/* ── Loading more indicator ─────────────────────────────────────── */}
      {loadingMore && (
        <div className="flex items-center justify-center py-4 gap-2 text-xs text-muted-foreground border-t border-border/30">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          <span>Loading more tasks...</span>
        </div>
      )}

      {/* ── End of list indicator ──────────────────────────────────────── */}
      {!hasMore && tasks.length > 0 && !loading && (
        <div className="flex items-center justify-center py-3 text-[11px] text-muted-foreground/60 border-t border-border/30">
          <span>All {tasks.length} tasks loaded</span>
        </div>
      )}
    </div>
  );
}

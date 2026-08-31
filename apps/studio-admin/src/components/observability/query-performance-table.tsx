

import React from "react";
import { Copy, Check, User, ArrowUp, ArrowDown, ChevronDown } from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
  SortingState,
} from "@tanstack/react-table";
import { SlowQuery } from "@/hooks/useDbPerformance";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@k2net/ui";

interface QueryPerformanceTableProps {
  data: SlowQuery[];
  loading?: boolean;
  onSelectQuery: (query: SlowQuery) => void;
  onCopy: (text: string, idx: number) => void;
  copiedIdx: number | null;
}

const columnHelper = createColumnHelper<SlowQuery>();

export function QueryPerformanceTable({
  data,
  loading = false,
  onSelectQuery,
  onCopy,
  copiedIdx,
}: QueryPerformanceTableProps) {
  const columns = React.useMemo(
    () => [
      columnHelper.accessor("query", {
        header: "Query",
        cell: (info) => {
          const queryText = info.getValue();
          const rowIdx = info.row.index;
          return (
            <div className="min-w-0 flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy(queryText, rowIdx);
                }}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                title="Copy SQL Query"
              >
                {copiedIdx === rowIdx ? (
                  <Check className="h-3 w-3 text-primary" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
              <p
                onClick={() => onSelectQuery(info.row.original)}
                className="text-xs font-mono text-sky-400 hover:text-sky-300 font-medium truncate cursor-pointer hover:underline select-all flex-1"
                title="Click to view full SQL query"
              >
                {queryText}
              </p>
            </div>
          );
        },
      }),
      columnHelper.accessor("totalTimePercent", {
        header: "Time consumed",
        cell: (info) => {
          const percent = info.getValue() ?? 0;
          const totalMs = info.row.original.totalTimeMs;
          return (
            <div className="flex flex-col gap-1 items-end w-full">
              <div className="flex items-center justify-end gap-1.5 text-xs font-mono text-foreground font-medium">
                <span className="font-semibold text-foreground">{percent.toFixed(1)}%</span>
                <span className="text-[10px] text-muted-foreground">/</span>
                <span className="text-[10px] text-muted-foreground">{(totalMs / 1000).toFixed(2)}s</span>
              </div>
              <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-muted-foreground/60 rounded-full transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("calls", {
        header: "Calls",
        cell: (info) => (
          <span className="block text-xs font-mono text-muted-foreground text-right select-all">
            {info.getValue().toLocaleString()}
          </span>
        ),
      }),
      columnHelper.accessor("maxTimeMs", {
        header: "Max time",
        cell: (info) => (
          <span className="block text-xs font-mono text-muted-foreground text-right select-all">
            {info.getValue() >= 1000 ? `${(info.getValue() / 1000).toFixed(1)}s` : `${info.getValue().toFixed(0)}ms`}
          </span>
        ),
      }),
      columnHelper.accessor("meanTimeMs", {
        header: "Mean time",
        cell: (info) => {
          const val = info.getValue();
          return (
            <span
              className={`block text-xs font-mono font-bold text-right ${
                val > 500 ? "text-rose-500" : val > 200 ? "text-amber-500" : "text-foreground"
              }`}
            >
              {val >= 1000 ? `${(val / 1000).toFixed(1)}s` : `${val.toFixed(0)}ms`}
            </span>
          );
        },
      }),
      columnHelper.accessor("minTimeMs", {
        header: "Min time",
        cell: (info) => (
          <span className="block text-xs font-mono text-muted-foreground text-right select-all">
            {info.getValue() >= 1000 ? `${(info.getValue() / 1000).toFixed(1)}s` : `${info.getValue().toFixed(0)}ms`}
          </span>
        ),
      }),
      columnHelper.accessor("rows", {
        header: "Rows processed",
        cell: (info) => (
          <span className="block text-xs font-mono text-muted-foreground text-right select-all">
            {info.getValue().toLocaleString()}
          </span>
        ),
      }),
      columnHelper.accessor("cacheHitRate", {
        header: "Cache hit rate",
        cell: (info) => (
          <span className="block text-xs font-mono text-muted-foreground text-right select-all font-medium text-primary/80">
            {info.getValue().toFixed(3)}%
          </span>
        ),
      }),
      columnHelper.accessor("role", {
        header: "Role",
        cell: (info) => (
          <span className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground text-right select-all justify-end w-full">
            {info.getValue()}
            <User className="h-3 w-3 text-muted-foreground/40" />
          </span>
        ),
      }),
      columnHelper.display({
        id: "application",
        header: "Application",
        cell: () => (
          <span className="block text-xs font-mono text-muted-foreground text-right select-all">
            -
          </span>
        ),
      }),
    ],
    [copiedIdx, onCopy, onSelectQuery]
  );

  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="min-w-[1340px] flex flex-col">
      {/* Table Head (Sticky pinned to top on vertical scroll) */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md grid grid-cols-[380px_180px_80px_90px_90px_90px_110px_110px_100px_110px] border-b border-border items-stretch divide-x divide-border/40 text-[11px] font-semibold text-muted-foreground/80 shadow-xs">
        {table.getFlatHeaders().map((header) => {
          if (header.isPlaceholder) return <div key={header.id} />;

          const canSort = header.column.getCanSort();
          const isSorted = header.column.getIsSorted();

          const isRightAligned = [
            "totalTimePercent", "calls", "maxTimeMs", "meanTimeMs", "minTimeMs", 
            "rows", "cacheHitRate", "role", "application"
          ].includes(header.column.id);

          return (
            <div key={header.id} className={`min-w-0 px-4 py-2.5 flex items-center ${isRightAligned ? "justify-end text-right" : "justify-start text-left"}`}>
              {canSort && header.column.id !== "application" ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 hover:text-foreground transition-colors outline-hidden select-none py-1 px-1.5 -mx-1.5 rounded hover:bg-muted/40 font-medium cursor-pointer">
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
                  <DropdownMenuContent align={isRightAligned ? "end" : "start"} className="bg-popover border border-border shadow-xl rounded-lg p-1 min-w-32 z-50">
                    <DropdownMenuItem 
                      onClick={() => header.column.toggleSorting(false)}
                      className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-sm cursor-pointer hover:bg-muted/50 text-foreground focus:bg-accent focus:text-accent-foreground"
                    >
                      <ArrowUp className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Sort Ascending</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => header.column.toggleSorting(true)}
                      className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-sm cursor-pointer hover:bg-muted/50 text-foreground focus:bg-accent focus:text-accent-foreground"
                    >
                      <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Sort Descending</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Table Body */}
      <div className="divide-y divide-border/40">
        {loading && data.length === 0 ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="grid grid-cols-[380px_180px_80px_90px_90px_90px_110px_110px_100px_110px] items-stretch border-b border-border/40 divide-x divide-border/30 animate-pulse bg-background/30"
            >
              <div className="min-w-0 px-4 py-4 flex items-center">
                <div className={`h-3.5 bg-muted/60 rounded ${
                  i === 0 ? "w-[75%]" : i === 1 ? "w-[50%]" : i === 2 ? "w-[65%]" : i === 3 ? "w-[40%]" : i === 4 ? "w-[80%]" : "w-[55%]"
                }`} />
              </div>
              <div className="min-w-0 px-4 py-4 flex items-center"><div className="h-3.5 bg-muted/60 rounded w-28" /></div>
              <div className="min-w-0 px-4 py-4 flex items-center justify-end"><div className="h-3.5 bg-muted/60 rounded w-10" /></div>
              <div className="min-w-0 px-4 py-4 flex items-center justify-end"><div className="h-3.5 bg-muted/60 rounded w-12" /></div>
              <div className="min-w-0 px-4 py-4 flex items-center justify-end"><div className="h-3.5 bg-muted/60 rounded w-12" /></div>
              <div className="min-w-0 px-4 py-4 flex items-center justify-end"><div className="h-3.5 bg-muted/60 rounded w-12" /></div>
              <div className="min-w-0 px-4 py-4 flex items-center justify-end"><div className="h-3.5 bg-muted/60 rounded w-16" /></div>
              <div className="min-w-0 px-4 py-4 flex items-center justify-end"><div className="h-3.5 bg-muted/60 rounded w-12" /></div>
              <div className="min-w-0 px-4 py-4 flex items-center justify-end"><div className="h-3.5 bg-muted/60 rounded w-14" /></div>
              <div className="min-w-0 px-4 py-4 flex items-center justify-end"><div className="h-3.5 bg-muted/60 rounded w-6" /></div>
            </div>
          ))
        ) : (
          table.getRowModel().rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[380px_180px_80px_90px_90px_90px_110px_110px_100px_110px] items-stretch hover:bg-muted/10 transition-colors border-b border-border/40 divide-x divide-border/30 group/row bg-background/20"
            >
              {row.getVisibleCells().map((cell) => {
                const isRightAligned = [
                  "totalTimePercent", "calls", "maxTimeMs", "meanTimeMs", "minTimeMs", 
                  "rows", "cacheHitRate", "role", "application"
                ].includes(cell.column.id);
                return (
                  <div key={cell.id} className={`min-w-0 px-4 py-3.5 flex items-center ${isRightAligned ? "justify-end" : "justify-start"}`}>
                    <div className="w-full min-w-0">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

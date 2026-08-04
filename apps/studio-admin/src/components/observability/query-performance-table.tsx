"use client";

import React from "react";
import { Copy, Check, User } from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
} from "@tanstack/react-table";
import { SlowQuery } from "@/hooks/useDbPerformance";

interface QueryPerformanceTableProps {
  data: SlowQuery[];
  onSelectQuery: (query: SlowQuery) => void;
  onCopy: (text: string, idx: number) => void;
  copiedIdx: number | null;
}

const columnHelper = createColumnHelper<SlowQuery>();

export function QueryPerformanceTable({
  data,
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
                  <Check className="h-3 w-3 text-emerald-500" />
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
            <div className="flex flex-col gap-1 pr-4 min-w-[130px]">
              <div className="flex items-center gap-1.5 text-xs font-mono text-foreground font-medium">
                <span>{percent.toFixed(1)}%</span>
                <span className="text-[10px] text-muted-foreground">/</span>
                <span className="text-[10px] text-muted-foreground">{(totalMs / 1000).toFixed(2)}s</span>
              </div>
              <div className="h-1 w-full bg-muted/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("calls", {
        header: () => <span className="block text-right">Calls</span>,
        cell: (info) => (
          <span className="block text-xs font-mono text-muted-foreground text-right select-all">
            {info.getValue().toLocaleString()}
          </span>
        ),
      }),
      columnHelper.accessor("maxTimeMs", {
        header: () => <span className="block text-right">Max time</span>,
        cell: (info) => (
          <span className="block text-xs font-mono text-muted-foreground text-right select-all">
            {info.getValue() >= 1000 ? `${(info.getValue() / 1000).toFixed(1)}s` : `${info.getValue().toFixed(0)}ms`}
          </span>
        ),
      }),
      columnHelper.accessor("meanTimeMs", {
        header: () => <span className="block text-right">Mean time</span>,
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
        header: () => <span className="block text-right">Min time</span>,
        cell: (info) => (
          <span className="block text-xs font-mono text-muted-foreground text-right select-all">
            {info.getValue() >= 1000 ? `${(info.getValue() / 1000).toFixed(1)}s` : `${info.getValue().toFixed(0)}ms`}
          </span>
        ),
      }),
      columnHelper.accessor("rows", {
        header: () => <span className="block text-right">Rows processed</span>,
        cell: (info) => (
          <span className="block text-xs font-mono text-muted-foreground text-right select-all">
            {info.getValue().toLocaleString()}
          </span>
        ),
      }),
      columnHelper.accessor("cacheHitRate", {
        header: () => <span className="block text-right">Cache hit rate</span>,
        cell: (info) => (
          <span className="block text-xs font-mono text-muted-foreground text-right select-all font-medium text-emerald-500/90">
            {info.getValue().toFixed(3)}%
          </span>
        ),
      }),
      columnHelper.accessor("role", {
        header: () => <span className="block text-right">Role</span>,
        cell: (info) => (
          <span className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground text-right select-all justify-end w-full">
            {info.getValue()}
            <User className="h-3 w-3 text-muted-foreground/40" />
          </span>
        ),
      }),
      columnHelper.display({
        id: "application",
        header: () => <span className="block text-right">Application</span>,
        cell: () => (
          <span className="block text-xs font-mono text-muted-foreground text-right select-all">
            -
          </span>
        ),
      }),
    ],
    [copiedIdx, onCopy, onSelectQuery]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[1340px]">
        {/* Table Head */}
        <div className="sticky top-[56px] z-20 bg-background/95 backdrop-blur-sm grid grid-cols-[380px_180px_80px_90px_90px_90px_110px_110px_100px_110px] px-5 py-2.5 border-b border-border gap-3 text-[11px] font-medium text-muted-foreground/80">
          {table.getFlatHeaders().map((header) => (
            <div key={header.id}>
              {header.isPlaceholder
                ? null
                : flexRender(header.column.columnDef.header, header.getContext())}
            </div>
          ))}
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border/40">
          {table.getRowModel().rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[380px_180px_80px_90px_90px_90px_110px_110px_100px_110px] px-5 py-3 hover:bg-muted/10 transition-colors items-center gap-3 group/row"
            >
              {row.getVisibleCells().map((cell) => (
                <div key={cell.id} className="min-w-0">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

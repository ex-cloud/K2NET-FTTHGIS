import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { Skeleton } from "../skeleton";
import { DataTablePagination } from "./data-table-pagination";
import { cn } from "../../utils";

export interface DataTableEmptyState {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  skeletonRowCount?: number;
  density?: "comfortable" | "compact";
  emptyState?: DataTableEmptyState;
  stickyHeader?: boolean;
  showPagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  initialSorting?: SortingState;
  onRowClick?: (row: TData) => void;
  className?: string;
  containerClassName?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  skeletonRowCount = 6,
  density = "compact",
  emptyState,
  stickyHeader = true,
  showPagination = false,
  pageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  initialSorting = [],
  onRowClick,
  className,
  containerClassName,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: showPagination ? getPaginationRowModel() : undefined,
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  const cellPadding = density === "compact" ? "py-2 px-3" : "py-3 px-4";
  const headerPadding = density === "compact" ? "py-2.5 px-3" : "py-3 px-4";

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-xl border border-border/80 bg-card/40 shadow-xs",
        containerClassName
      )}
    >
      <div className="w-full overflow-x-auto">
        <table className={cn("w-full text-left text-xs border-collapse", className)}>
          <thead
            className={cn(
              "bg-muted/40 border-b border-border/80 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider",
              stickyHeader && "sticky top-0 z-10 backdrop-blur-xs"
            )}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(headerPadding, "align-middle whitespace-nowrap")}
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-border/60">
            {isLoading ? (
              Array.from({ length: skeletonRowCount }).map((_, rowIndex) => (
                <tr key={rowIndex} className="animate-pulse">
                  {columns.map((_, colIndex) => (
                    <td key={colIndex} className={cellPadding}>
                      <Skeleton className="h-4 w-full min-w-[40px] max-w-[200px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 px-4 text-center text-muted-foreground space-y-1.5"
                >
                  {emptyState?.icon && (
                    <div className="mx-auto flex justify-center mb-2">
                      {emptyState.icon}
                    </div>
                  )}
                  <span className="font-semibold block text-foreground text-xs">
                    {emptyState?.title || "No records found"}
                  </span>
                  {emptyState?.description && (
                    <p className="text-[11px] text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      {emptyState.description}
                    </p>
                  )}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className={cn(
                    "transition-colors group hover:bg-muted/30",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={cn(cellPadding, "align-middle")}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showPagination && !isLoading && table.getRowModel().rows.length > 0 && (
        <DataTablePagination table={table} pageSizeOptions={pageSizeOptions} />
      )}
    </div>
  );
}

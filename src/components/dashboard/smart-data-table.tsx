"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Search, RefreshCcw } from "lucide-react";

interface SmartDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  onSearchChange?: (value: string) => void;
  onRefresh?: () => void;
  pagination?: {
    pageIndex: number;
    pageSize: number;
    pageCount: number;
    onPageChange: (index: number) => void;
  };
}

export function SmartDataTable<TData, TValue>({
  columns,
  data,
  loading,
  onSearchChange,
  onRefresh,
  pagination,
}: SmartDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    manualPagination: !!pagination,
    pageCount: pagination?.pageCount,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            onChange={(event) => onSearchChange?.(event.target.value)}
            className="pl-9 h-9 bg-muted/40 border-border focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              disabled={loading}
              className="h-9 w-9 border-border text-muted-foreground hover:text-emerald-500 hover:border-emerald-500/30 transition-all"
            >
              <RefreshCcw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          )}
        </div>
      </div>

      <div className="border border-border bg-card rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="hover:bg-transparent border-border"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-10 text-[10px] uppercase tracking-wider font-bold text-muted-foreground py-0"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="h-64 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCcw className="w-6 h-6 animate-spin opacity-20" />
                    <span className="text-sm font-medium opacity-50">
                      Fetching data...
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-border hover:bg-muted/30 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2.5 font-medium">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="h-64 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2 opacity-40">
                    <Search className="w-8 h-8 mb-2" />
                    <p className="text-sm font-medium">No records found</p>
                    <p className="text-xs">
                      Try adjusting your search or filters
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between px-2 pt-2 pb-6">
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Showing <span className="text-foreground">{data.length}</span>{" "}
            results
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.pageIndex - 1)}
              disabled={loading || pagination.pageIndex === 0}
              className="h-8 text-xs px-3 border-border bg-card"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1.5" />
              Previous
            </Button>
            <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
              <span className="text-emerald-500 font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                {pagination.pageIndex + 1}
              </span>
              <span>OF</span>
              <span>{pagination.pageCount}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.pageIndex + 1)}
              disabled={loading || pagination.pageIndex >= pagination.pageCount - 1}
              className="h-8 text-xs px-3 border-border bg-card"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

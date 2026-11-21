import * as React from "react";
import type { Table } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "../button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  pageSizeOptions?: number[];
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 20, 50, 100],
}: DataTablePaginationProps<TData>) {
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();
  const totalRows = table.getFilteredRowModel().rows.length;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 border-t border-border/80 bg-muted/20 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <span className="text-[11px]">
          Total <strong className="font-mono text-foreground">{totalRows}</strong> rows
        </span>
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <span className="text-[11px] text-muted-foreground/80">
            (<strong className="font-mono text-primary">{table.getFilteredSelectedRowModel().rows.length}</strong> selected)
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] whitespace-nowrap">Rows per page</span>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-6 w-[68px] text-[11px] px-1.5 bg-background border-border">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top" className="bg-popover border-border text-foreground text-xs min-w-[68px]">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={`${size}`} className="text-xs">
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-mono">
          <span>Page</span>
          <strong className="text-foreground">{pageIndex + 1}</strong>
          <span>of</span>
          <strong className="text-foreground">{Math.max(pageCount, 1)}</strong>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="xs"
            className="h-6 w-6 p-0"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            title="First page"
          >
            <ChevronsLeft className="size-3" />
          </Button>
          <Button
            variant="outline"
            size="xs"
            className="h-6 w-6 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            title="Previous page"
          >
            <ChevronLeft className="size-3" />
          </Button>
          <Button
            variant="outline"
            size="xs"
            className="h-6 w-6 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            title="Next page"
          >
            <ChevronRight className="size-3" />
          </Button>
          <Button
            variant="outline"
            size="xs"
            className="h-6 w-6 p-0"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
            title="Last page"
          >
            <ChevronsRight className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

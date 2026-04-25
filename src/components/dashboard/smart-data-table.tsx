"use client";
"use no memo";

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
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  RefreshCcw, 
  Download,
  Columns
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface SmartDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  onSearchChange?: (value: string) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  onRowClick?: (data: TData) => void;
  onSortingChange?: (sorting: SortingState) => void;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  pagination?: {
    pageIndex: number;
    pageSize: number;
    totalCount: number;
    pageCount: number;
    onPageChange: (index: number) => void;
  };
  bulkActions?: {
    label: string;
    icon?: React.ReactNode;
    onClick: (selectedData: TData[]) => void;
    variant?: "default" | "outline" | "ghost" | "emerald" | "blue" | "orange" | "destructive";
  }[];
}

export function SmartDataTable<TData, TValue>({
  columns,
  data,
  loading,
  onSearchChange,
  onRefresh,
  onExport,
  onRowClick,
  onSortingChange,
  onColumnFiltersChange,
  pagination,
  bulkActions,
}: SmartDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  
  // Track sorting and filtering changes and notify parent if provided
  React.useEffect(() => {
    onSortingChange?.(sorting);
  }, [sorting, onSortingChange]);

  React.useEffect(() => {
    onColumnFiltersChange?.(columnFilters);
  }, [columnFilters, onColumnFiltersChange]);
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [rowSelection, setRowSelection] = React.useState({});

  const tableColumns = React.useMemo(() => {
    const selectColumn: ColumnDef<TData> = {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value: boolean | "indeterminate") => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px] border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value: boolean | "indeterminate") => row.toggleSelected(!!value)}
          aria-label="Select row"
          onClick={(e: React.MouseEvent) => e.stopPropagation()} // Prevent opening detail panel on checkbox click
          className="translate-y-[2px] border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    };
    return [selectColumn, ...columns];
  }, [columns]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: React.useMemo(() => getCoreRowModel(), []),
    getPaginationRowModel: React.useMemo(() => getPaginationRowModel(), []),
    onSortingChange: setSorting,
    getSortedRowModel: React.useMemo(() => getSortedRowModel(), []),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: React.useMemo(() => getFilteredRowModel(), []),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    manualPagination: !!pagination,
    manualSorting: !!onSortingChange,
    manualFiltering: !!onColumnFiltersChange,
    pageCount: pagination?.pageCount,
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Header Toolbar */}
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/40 p-4 rounded-2xl border border-border/50 backdrop-blur-sm shadow-sm overflow-hidden">
        {/* Bulk Actions Overlay */}
        {table.getSelectedRowModel().rows.length > 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-between bg-zinc-900/90 backdrop-blur-xl px-6 animate-in slide-in-from-top-4 duration-300 border-b border-emerald-500/20">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                <span className="text-[10px] font-black text-emerald-500">
                  {table.getSelectedRowModel().rows.length}
                </span>
              </div>
              <span className="text-xs font-black text-white uppercase tracking-[0.2em] drop-shadow-sm">
                Assets Targeted
              </span>
              <div className="h-4 w-px bg-white/10" />
              <Button 
                variant="ghost" 
                size="sm"
                className="text-[10px] uppercase font-black tracking-widest text-zinc-400 hover:text-white hover:bg-white/5"
                onClick={() => table.toggleAllPageRowsSelected(false)}
              >
                Clear GRID
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {bulkActions?.map((action, idx) => {
                const isEmerald = action.variant === "emerald";
                const isBlue = action.variant === "blue";
                const isOrange = action.variant === "orange";
                const isDestructive = action.variant === "destructive";

                // Map my custom variants to standard Button variants to satisfy TypeScript
                const buttonVariant = (isDestructive ? "destructive" : (isEmerald || isBlue || isOrange ? "default" : (action.variant === "ghost" || action.variant === "outline" ? action.variant : "default"))) as "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";

                return (
                  <Button 
                    key={idx}
                    size="sm" 
                    variant={buttonVariant}
                    className={cn(
                      "h-8 font-black text-[9px] tracking-widest rounded-lg px-4 transition-all uppercase",
                      isEmerald && "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20",
                      isBlue && "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20",
                      isOrange && "bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-500/20",
                      !isEmerald && !isBlue && !isOrange && !isDestructive && "border-white/10 text-zinc-300 hover:text-white hover:bg-white/5"
                    )}
                    onClick={() => action.onClick(table.getSelectedRowModel().rows.map(r => r.original))}
                  >
                    {action.icon && <span className="mr-2">{action.icon}</span>}
                    {action.label}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        <div className="relative w-full sm:max-w-xs group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
          <Input
            placeholder="Quick search indexed records..."
            onChange={(event) => onSearchChange?.(event.target.value)}
            className="pl-9 h-10 bg-background/50 border-border group-focus-within:border-emerald-500/50 group-focus-within:ring-4 group-focus-within:ring-emerald-500/10 transition-all rounded-xl text-sm italic"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              disabled={loading || data.length === 0}
              className="h-10 px-3.5 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/5 hover:text-emerald-400 font-bold rounded-xl transition-all shadow-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline font-black tracking-widest text-[10px] uppercase">Export</span>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-3.5 border-border text-muted-foreground hover:text-foreground font-bold rounded-xl shadow-sm"
              >
                <Columns className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Columns</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px] bg-card border-border rounded-xl shadow-xl">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-widest opacity-50">Toggle Visibility</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/50" />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize text-xs cursor-pointer focus:bg-emerald-500/10 focus:text-emerald-500"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>

          {onRefresh && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                onRefresh();
                toast.info("Syncing with registry...", {
                  description: "Fetching latest asset states from backend",
                  duration: 2000,
                });
              }}
              disabled={loading}
              className="h-10 w-10 border-border text-muted-foreground hover:text-emerald-500 hover:border-emerald-500/30 rounded-xl transition-all shadow-sm relative z-20"
            >
              <RefreshCcw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          )}
        </div>
      </div>

      {/* Main Table Area */}
      <div className="relative group bg-card/30 rounded-2xl border border-border/50 shadow-lg overflow-hidden transition-all hover:border-emerald-500/20">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40 backdrop-blur-md">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="hover:bg-transparent border-border/50"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="h-14 text-[10px] uppercase tracking-widest font-black text-muted-foreground/70 py-2 px-6 select-none border-b border-border/50"
                    >
                      <div className="flex flex-col gap-2">
                        {header.isPlaceholder ? null : (
                          <div 
                            className={`flex items-center gap-2 ${header.column.getCanSort() ? "cursor-pointer hover:text-emerald-500 transition-colors" : ""}`}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {header.column.getCanSort() && (
                              <div className="w-3">
                                {header.column.getIsSorted() === "asc" ? (
                                  <ChevronLeft className="w-3 h-3 rotate-90 text-emerald-500" />
                                ) : header.column.getIsSorted() === "desc" ? (
                                  <ChevronLeft className="w-3 h-3 -rotate-90 text-emerald-500" />
                                ) : (
                                  <div className="w-3 h-3 opacity-20 group-hover:opacity-100">
                                    <RefreshCcw className="w-3 h-3" />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {header.column.getCanFilter() && (
                          <div onClick={(e) => e.stopPropagation()}>
                            <Input
                              placeholder={`Filter...`}
                              value={(header.column.getFilterValue() as string) ?? ""}
                              onChange={(event) =>
                                header.column.setFilterValue(event.target.value)
                              }
                              className="h-7 text-[9px] bg-background/30 border-border/20 focus:border-emerald-500/30 rounded-lg placeholder:opacity-50 font-medium"
                            />
                          </div>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="relative min-h-[400px]">
              {loading ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={columns.length}
                    className="h-80 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-4 py-12">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full border-2 border-emerald-500/10 border-t-emerald-500 animate-spin" />
                        <div className="absolute inset-0 bg-emerald-500/5 blur-xl animate-pulse rounded-full" />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-bold text-foreground">
                          Syncing Data...
                        </span>
                        <span className="text-xs text-muted-foreground font-medium italic">
                          Optimization in progress
                        </span>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    onClick={(e) => {
                      // Prevent row click if clicking on a button, link, input, checkbox or menu item
                      const target = e.target as HTMLElement;
                      if (target.closest('button, a, input, [role="menuitem"], [role="checkbox"]')) {
                        return;
                      }
                      onRowClick?.(row.original);
                    }}
                    className={`border-border/50 group/row hover:bg-emerald-500/2 transition-colors ${onRowClick ? "cursor-pointer" : "cursor-default"}`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-4 px-6 font-medium text-sm">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent border-none">
                  <TableCell
                    colSpan={columns.length}
                    className="h-80 text-center"
                  >
                    <div className="flex flex-col items-center gap-4 py-12 opacity-40 group-hover:opacity-60 transition-opacity">
                      <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center border-border shadow-inner">
                        <Search className="w-7 h-7" />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <p className="text-sm font-black uppercase tracking-widest text-foreground">No records found</p>
                        <p className="text-xs font-medium">Try adjusting your search criteria</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Footer */}
      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 bg-muted/20 rounded-2xl border border-border/30 mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-r border-border/50 pr-4">
              Inventory State
            </div>
            <div className="text-xs font-bold bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full border border-emerald-500/20">
              <span className="opacity-70 mr-1">{pagination.pageSize}</span> 
              Per Page
            </div>
            {pagination.totalCount !== undefined && (
              <div className="text-[10px] font-bold text-muted-foreground">
                TOTAL: <span className="text-foreground">{pagination.totalCount}</span> NODES
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground bg-background/50 px-3 py-1.5 rounded-xl border border-border/50">
              <span className="text-emerald-500 font-black">
                {String(pagination.pageIndex + 1).padStart(2, '0')}
              </span>
              <span className="opacity-30">/</span>
              <span className="font-bold">
                {String(pagination.pageCount).padStart(2, '0')}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => pagination.onPageChange(pagination.pageIndex - 1)}
                disabled={loading || pagination.pageIndex === 0}
                className="h-10 w-10 border border-border/50 hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-500 transition-all rounded-xl disabled:opacity-20"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => pagination.onPageChange(pagination.pageIndex + 1)}
                disabled={loading || pagination.pageIndex >= pagination.pageCount - 1}
                className="h-10 w-10 border border-border/50 hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-500 transition-all rounded-xl disabled:opacity-20"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

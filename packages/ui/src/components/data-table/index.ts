export * from "./data-table";
export * from "./data-table-column-header";
export * from "./data-table-pagination";

// Convenient re-exports from @tanstack/react-table for zero-boilerplate consumers
export {
  createColumnHelper,
  flexRender,
  type ColumnDef,
  type Column,
  type Row,
  type Table as TanStackTable,
  type SortingState,
  type VisibilityState,
  type PaginationState,
} from "@tanstack/react-table";

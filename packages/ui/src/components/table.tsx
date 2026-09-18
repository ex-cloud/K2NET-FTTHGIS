"use client"

// Table density modes: add data-density="compact" to TableWrapper
// to tighten row padding for data-dense views (RBAC matrix, audit logs, OLT telemetry).
// Default is "comfortable" (standard row padding).
// For wide tables that overflow mobile screens, sticky-col class on the first
// TableHead / TableCell will freeze that column during horizontal scroll.

import * as React from "react"

import { cn } from "../utils"

interface TableWrapperProps extends React.ComponentProps<"div"> {
  density?: "comfortable" | "compact";
}

/**
 * TableWrapper — optional density-aware outer container.
 * Usage:
 *   <TableWrapper density="compact">   ← tight rows for data-dense views
 *     <Table> ... </Table>
 *   </TableWrapper>
 *
 * For wide tables on mobile: the first TableHead / TableCell that receives
 * the `sticky-col` class will be frozen during horizontal scroll.
 */
function TableWrapper({
  className,
  density = "comfortable",
  ...props
}: TableWrapperProps) {
  return (
    <div
      data-slot="table-wrapper"
      data-density={density}
      className={cn("relative w-full overflow-x-auto rounded-lg", className)}
      {...props}
    />
  );
}

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("bg-muted/60 backdrop-blur-md sticky top-0 border-b border-border z-10 [&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/40 data-[state=selected]:bg-muted border-b border-border transition-colors",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        // Base styles — px/py driven by density CSS vars via TableWrapper data-density
        "text-muted-foreground h-9 px-3 text-left align-middle text-[10px] font-bold uppercase tracking-wider whitespace-nowrap",
        // sticky-col: freeze this column during horizontal scroll on mobile.
        // Use on the first column: <TableHead className="sticky-col">
        "[&.sticky-col]:sticky [&.sticky-col]:left-0 [&.sticky-col]:z-20 [&.sticky-col]:bg-muted/60 [&.sticky-col]:backdrop-blur-md",
        "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        // Base padding — compact mode tightens via data-density on TableWrapper
        "p-3 align-middle text-xs whitespace-nowrap",
        // sticky-col: freeze this column during horizontal scroll on mobile.
        // Use on the first column: <TableCell className="sticky-col">
        "[&.sticky-col]:sticky [&.sticky-col]:left-0 [&.sticky-col]:z-10 [&.sticky-col]:bg-card",
        "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableWrapper,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}

import * as React from "react";
import type { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Button } from "../button";
import { cn } from "../../utils";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn("text-[11px] font-semibold text-muted-foreground uppercase tracking-wider", className)}>{title}</div>;
  }

  const isSorted = column.getIsSorted();

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant="ghost"
        size="xs"
        className="-ml-2 h-6 px-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground hover:bg-muted/50 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>{title}</span>
        {isSorted === "desc" ? (
          <ArrowDown className="ml-1 size-3 text-foreground" />
        ) : isSorted === "asc" ? (
          <ArrowUp className="ml-1 size-3 text-foreground" />
        ) : (
          <ArrowUpDown className="ml-1 size-3 opacity-40 hover:opacity-100" />
        )}
      </Button>
    </div>
  );
}

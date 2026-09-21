import React from "react";
import { ArrowUp, ArrowDown, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@k2net/ui";
import { cn } from "@/lib/utils";

interface OverviewSortableHeaderProps {
  title: string;
  field: string;
  currentSortField: string | null;
  currentSortDir: "asc" | "desc";
  onSort: (field: string, dir: "asc" | "desc") => void;
  align?: "start" | "center" | "end";
  className?: string;
}

export const OverviewSortableHeader: React.FC<OverviewSortableHeaderProps> = ({
  title,
  field,
  currentSortField,
  currentSortDir,
  onSort,
  align = "start",
  className,
}) => {
  const isSorted = currentSortField === field;

  return (
    <div
      className={cn(
        "flex items-center select-none",
        align === "end" ? "justify-end" : align === "center" ? "justify-center" : "justify-start",
        className
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex items-center gap-1.5 py-1 px-1.5 -mx-1.5 rounded-md hover:bg-muted/40 font-semibold text-[11px] tracking-wider transition-colors outline-hidden cursor-pointer",
              isSorted ? "text-foreground font-bold" : "text-muted-foreground/80 hover:text-foreground"
            )}
          >
            <span>{title}</span>
            <span className="flex items-center">
              {isSorted ? (
                currentSortDir === "asc" ? (
                  <ArrowUp className="size-3 text-primary shrink-0" />
                ) : (
                  <ArrowDown className="size-3 text-primary shrink-0" />
                )
              ) : (
                <ChevronDown className="size-3 opacity-40 shrink-0 hover:opacity-100" />
              )}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={align}
          className="bg-popover border border-border shadow-xl rounded-xl p-1 min-w-36 z-50 text-xs"
        >
          <DropdownMenuItem
            onClick={() => onSort(field, "asc")}
            className="flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer hover:bg-muted/50 text-foreground font-medium"
          >
            <ArrowUp className="size-3.5 text-muted-foreground" />
            <span>Urutkan A → Z (Asc)</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onSort(field, "desc")}
            className="flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer hover:bg-muted/50 text-foreground font-medium"
          >
            <ArrowDown className="size-3.5 text-muted-foreground" />
            <span>Urutkan Z → A (Desc)</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

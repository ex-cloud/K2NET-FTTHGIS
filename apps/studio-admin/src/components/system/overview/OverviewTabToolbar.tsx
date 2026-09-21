import React from "react";
import { Search, X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FilterPillOption } from "./use-overview-table-controls";

interface OverviewTabToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  filterOptions: FilterPillOption[];
  activeFilter: string;
  onFilterChange: (filterId: string) => void;
  totalFilteredCount: number;
  totalCount: number;
  onResetFilters: () => void;
  className?: string;
}

function getBadgeVariantClass(variant?: FilterPillOption["badgeVariant"], isSelected?: boolean) {
  if (isSelected) {
    if (variant === "critical") return "bg-rose-500/20 text-rose-400 border-rose-500/40";
    if (variant === "warning") return "bg-amber-500/20 text-amber-400 border-amber-500/40";
    if (variant === "info") return "bg-sky-500/20 text-sky-400 border-sky-500/40";
    if (variant === "success") return "bg-primary/20 text-primary border-primary/40";
    return "bg-primary/20 text-primary border-primary/40";
  }
  if (variant === "critical") return "bg-rose-500/10 text-rose-400/80 border-rose-500/20";
  if (variant === "warning") return "bg-amber-500/10 text-amber-400/80 border-amber-500/20";
  if (variant === "info") return "bg-sky-500/10 text-sky-400/80 border-sky-500/20";
  if (variant === "success") return "bg-primary/10 text-primary/80 border-primary/20";
  return "bg-muted/40 text-muted-foreground border-border/50";
}

export const OverviewTabToolbar: React.FC<OverviewTabToolbarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Cari data...",
  filterOptions,
  activeFilter,
  onFilterChange,
  totalFilteredCount,
  totalCount,
  onResetFilters,
  className,
}) => {
  const isFiltered = activeFilter !== "ALL" || searchQuery.trim().length > 0;

  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between py-2.5 px-3 bg-card/40 border border-border rounded-xl backdrop-blur-xs",
        className
      )}
    >
      {/* ── Left: Search input & Filter pills ── */}
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
        {/* Instant Search Bar */}
        <div className="relative w-full sm:w-64 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-8 pl-8 pr-7 text-xs bg-background/80 border border-border rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Clear search"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {filterOptions.map((opt) => {
            const isSelected = activeFilter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onFilterChange(opt.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer select-none",
                  isSelected
                    ? "bg-card border-primary/50 text-foreground shadow-xs font-semibold"
                    : "bg-background/40 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                {opt.dotColor && (
                  <span className={cn("size-1.5 rounded-full shrink-0", opt.dotColor)} />
                )}
                <span>{opt.label}</span>
                {typeof opt.count === "number" && (
                  <span
                    className={cn(
                      "px-1.5 py-0.2 text-[10px] font-mono rounded-md border font-semibold",
                      getBadgeVariantClass(opt.badgeVariant, isSelected)
                    )}
                  >
                    {opt.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Right: Match count & Reset button ── */}
      <div className="flex items-center justify-between sm:justify-end gap-2 text-[11px] text-muted-foreground shrink-0">
        <span className="font-mono text-muted-foreground/80">
          {totalFilteredCount} <span className="text-[10px] text-muted-foreground/50">/ {totalCount}</span>
        </span>
        {isFiltered && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 font-medium px-2 py-0.5 rounded hover:bg-primary/10 transition-colors cursor-pointer"
            title="Reset semua filter dan pencarian"
          >
            <RotateCcw className="size-3" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};

import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@k2net/ui";
import { Filter, Check, Search, X } from "lucide-react";
import { useTranslation } from "@k2net/i18n";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "./configs";

export interface TaskFilterState {
  status: string[];
  priority: string[];
  scope: string[];
  assigneeId: string | null;
}

interface TaskFilterMenuProps {
  filters: TaskFilterState;
  onChange: (filters: TaskFilterState) => void;
  assigneesList: string[];
}

const SCOPE_ITEMS = ["PLATFORM_INTERNAL", "TENANT_TO_PLATFORM"];

interface FilterSectionsProps {
  filteredStatuses: string[];
  filteredPriorities: string[];
  filters: TaskFilterState;
  assigneesList: string[];
  onToggleFilter: (type: keyof TaskFilterState, value: string) => void;
}

const FilterSections: React.FC<FilterSectionsProps> = ({
  filteredStatuses,
  filteredPriorities,
  filters,
  assigneesList,
  onToggleFilter,
}) => {
  const { t } = useTranslation();
  return (
    <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
      {/* Status Section */}
      {filteredStatuses.length > 0 && (
        <div className="space-y-1">
          <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest pl-1.5">
            {t("tasks.status")}
          </span>
          {filteredStatuses.map((key) => {
            const active = filters.status.includes(key);
            const cfg = STATUS_CONFIG[key];
            return (
              <DropdownMenuItem
                key={key}
                onClick={() => onToggleFilter("status", key)}
                className={cn(
                  "flex items-center justify-between text-xs px-2 py-1.5 rounded-md cursor-pointer",
                  active ? "bg-primary/5 text-primary font-medium" : ""
                )}
              >
                <div className="flex items-center gap-2">
                  {cfg && <cfg.icon className="h-3.5 w-3.5 text-muted-foreground" />}
                  <span>{cfg?.label ?? key}</span>
                </div>
                {active && <Check className="h-3.5 w-3.5 text-primary" />}
              </DropdownMenuItem>
            );
          })}
        </div>
      )}

      {/* Priority Section */}
      {filteredPriorities.length > 0 && (
        <div className="space-y-1">
          <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest pl-1.5">
            {t("tasks.priority")}
          </span>
          {filteredPriorities.map((key) => {
            const active = filters.priority.includes(key);
            const cfg = PRIORITY_CONFIG[key];
            return (
              <DropdownMenuItem
                key={key}
                onClick={() => onToggleFilter("priority", key)}
                className={cn(
                  "flex items-center justify-between text-xs px-2 py-1.5 rounded-md cursor-pointer",
                  active ? "bg-primary/5 text-primary font-medium" : ""
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      key === "URGENT"
                        ? "bg-destructive"
                        : key === "HIGH"
                        ? "bg-orange-500"
                        : key === "NORMAL"
                        ? "bg-primary"
                        : "bg-muted-foreground"
                    )}
                  />
                  <span>{cfg?.label ?? key}</span>
                </div>
                {active && <Check className="h-3.5 w-3.5 text-primary" />}
              </DropdownMenuItem>
            );
          })}
        </div>
      )}

      {/* Scope Section */}
      <div className="space-y-1">
        <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest pl-1.5">
          {t("tasks.col_scope")}
        </span>
        {SCOPE_ITEMS.map((key) => {
          const active = filters.scope.includes(key);
          const label = key === "TENANT_TO_PLATFORM" ? t("tasks.b2b_inbox") : t("tasks.platform_internal");
          return (
            <DropdownMenuItem
              key={key}
              onClick={() => onToggleFilter("scope", key)}
              className={cn(
                "flex items-center justify-between text-xs px-2 py-1.5 rounded-md cursor-pointer",
                active ? "bg-primary/5 text-primary font-medium" : ""
              )}
            >
              <span>{label}</span>
              {active && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </div>

      {/* Assignee Section */}
      {assigneesList.length > 0 && (
        <div className="space-y-1">
          <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest pl-1.5">
            {t("tasks.assignee")}
          </span>
          {assigneesList.map((id) => {
            const active = filters.assigneeId === id;
            return (
              <DropdownMenuItem
                key={id}
                onClick={() => onToggleFilter("assigneeId", id)}
                className={cn(
                  "flex items-center justify-between text-xs px-2 py-1.5 rounded-md cursor-pointer font-mono",
                  active ? "bg-primary/5 text-primary font-medium" : ""
                )}
              >
                <span>{`…${id.slice(-8)}`}</span>
                {active && <Check className="h-3.5 w-3.5 text-primary" />}
              </DropdownMenuItem>
            );
          })}
        </div>
      )}
    </div>
  );
};

export function TaskFilterMenu({
  filters,
  onChange,
  assigneesList,
}: TaskFilterMenuProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");

  const toggleFilter = (type: keyof TaskFilterState, value: string) => {
    if (type === "assigneeId") {
      onChange({
        ...filters,
        assigneeId: filters.assigneeId === value ? null : value,
      });
      return;
    }

    const currentList = filters[type] as string[];
    const newList = currentList.includes(value)
      ? currentList.filter((item) => item !== value)
      : [...currentList, value];

    onChange({
      ...filters,
      [type]: newList,
    });
  };

  const clearAllFilters = () => {
    onChange({
      status: [],
      priority: [],
      scope: [],
      assigneeId: null,
    });
    setSearchTerm("");
  };

  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.priority.length > 0 ||
    filters.scope.length > 0 ||
    filters.assigneeId !== null;

  const statusItems = Object.keys(STATUS_CONFIG);
  const priorityItems = Object.keys(PRIORITY_CONFIG);

  const filteredStatuses = statusItems.filter((key) =>
    STATUS_CONFIG[key]?.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPriorities = priorityItems.filter((key) =>
    PRIORITY_CONFIG[key]?.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "p-2 rounded-lg border transition-all duration-200 relative",
            hasActiveFilters
              ? "border-primary/30 bg-primary/5 text-primary"
              : "border-border bg-card text-muted-foreground hover:text-foreground"
          )}
          title={t("tasks.filter_issues")}
        >
          <Filter className="h-4 w-4" />
          {hasActiveFilters && (
            <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[8px] font-bold h-3.5 min-w-[14px] rounded-full flex items-center justify-center px-0.5 animate-pulse">
              {[
                filters.status.length,
                filters.priority.length,
                filters.scope.length,
                filters.assigneeId ? 1 : 0,
              ].reduce((a, b) => a + b, 0)}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {t("tasks.filter_issues")}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-[10px] text-destructive hover:underline font-medium flex items-center gap-0.5 cursor-pointer"
            >
              <X className="h-3 w-3" />
              <span>{t("tasks.clear")}</span>
            </button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("tasks.search_filters")}
            className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-lg text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-200"
          />
        </div>

        <FilterSections
          filteredStatuses={filteredStatuses}
          filteredPriorities={filteredPriorities}
          filters={filters}
          assigneesList={assigneesList}
          onToggleFilter={toggleFilter}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  Switch,
} from "@k2net/ui";
import { SlidersHorizontal, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ViewOptionsState {
  groupBy: "status" | "priority";
  sortBy: "manual" | "dueDate";
  showEmptyColumns: boolean;
  displayProperties: {
    priority: boolean;
    status: boolean;
    assignee: boolean;
    dueDate: boolean;
    obsidianRef: boolean;
  };
}

interface TaskViewOptionsProps {
  options: ViewOptionsState;
  onChange: (options: ViewOptionsState) => void;
  viewMode: "list" | "kanban" | "timeline";
  onViewModeChange: (mode: "list" | "kanban" | "timeline") => void;
}

export function TaskViewOptions({
  options,
  onChange,
  viewMode,
  onViewModeChange,
}: TaskViewOptionsProps) {
  const toggleProperty = (key: keyof ViewOptionsState["displayProperties"]) => {
    onChange({
      ...options,
      displayProperties: {
        ...options.displayProperties,
        [key]: !options.displayProperties[key],
      },
    });
  };

  const handleGroupByChange = (groupBy: ViewOptionsState["groupBy"]) => {
    onChange({ ...options, groupBy });
  };

  const handleSortByChange = (sortBy: ViewOptionsState["sortBy"]) => {
    onChange({ ...options, sortBy });
  };

  const handleSwitchChange = (checked: boolean) => {
    onChange({ ...options, showEmptyColumns: checked });
  };

  const propertiesList = [
    { key: "priority", label: "Priority" },
    { key: "status", label: "Status" },
    { key: "assignee", label: "Assignee" },
    { key: "dueDate", label: "Target Date" },
    { key: "obsidianRef", label: "Obsidian Ref" },
  ] as const;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-all duration-200"
          title="View Options"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-3 space-y-4">
        {/* ── View Selection ── */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            View Layout
          </p>
          <div className="grid grid-cols-3 gap-1 bg-muted/50 p-0.5 rounded-lg">
            {(["list", "kanban", "timeline"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onViewModeChange(mode)}
                className={cn(
                  "py-1 rounded text-xs font-semibold uppercase tracking-wider transition-all",
                  viewMode === mode
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <DropdownMenuSeparator className="bg-border/60" />

        {/* ── Column / Row settings ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground/80 font-medium">Columns</span>
            <select
              value={options.groupBy}
              onChange={(e) => handleGroupByChange(e.target.value as any)}
              className="bg-background border border-border rounded px-2 py-1 text-xs text-foreground font-medium focus:ring-1 focus:ring-primary focus:outline-none"
            >
              <option value="status">Status</option>
              <option value="priority">Priority</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground/80 font-medium">Ordering</span>
            <select
              value={options.sortBy}
              onChange={(e) => handleSortByChange(e.target.value as any)}
              className="bg-background border border-border rounded px-2 py-1 text-xs text-foreground font-medium focus:ring-1 focus:ring-primary focus:outline-none"
            >
              <option value="manual">Manual</option>
              <option value="dueDate">Due Date</option>
            </select>
          </div>
        </div>

        <DropdownMenuSeparator className="bg-border/60" />

        {/* ── Options switches ── */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground/80 font-medium">Show empty columns</span>
          <Switch
            checked={options.showEmptyColumns}
            onCheckedChange={handleSwitchChange}
          />
        </div>

        <DropdownMenuSeparator className="bg-border/60" />

        {/* ── Display Properties ── */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Display Properties
          </p>
          <div className="flex flex-wrap gap-1.5">
            {propertiesList.map(({ key, label }) => {
              const active = options.displayProperties[key];
              return (
                <button
                  key={key}
                  onClick={() => toggleProperty(key)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-200",
                    active
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-muted/40 text-muted-foreground border-border/80 hover:bg-muted"
                  )}
                >
                  {active && <Check className="h-3 w-3" />}
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

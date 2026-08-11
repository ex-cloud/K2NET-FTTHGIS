"use client";

import React from "react";
import { ClipboardList, Calendar as CalendarIcon, User, ChevronDown } from "lucide-react";
import { type Task } from "@/hooks/useTasksQuery";
import { cn } from "@/lib/utils";
import { ScopeBadge } from "./ScopeBadge";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "./configs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Calendar,
} from "@k2net/ui";

interface TaskTableProps {
  tasks: Task[];
  loading: boolean;
  onRowClick: (id: string) => void;
  onUpdateTask: (id: string, fields: any) => void;
  assigneesList: string[];
}

export function TaskTable({
  tasks,
  loading,
  onRowClick,
  onUpdateTask,
  assigneesList,
}: TaskTableProps) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              {["Judul", "Scope", "Tipe", "Prioritas", "Status", "Assignee", "Tenggat"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-foreground/75 dark:text-muted-foreground uppercase tracking-wide select-none"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3.5">
                      <div className="h-4 bg-muted rounded animate-pulse w-24" />
                    </td>
                  ))}
                </tr>
              ))
            ) : tasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <ClipboardList className="h-10 w-10 opacity-35" />
                    <p className="text-sm">Belum ada task di tampilan ini.</p>
                  </div>
                </td>
              </tr>
            ) : (
              tasks.map((task) => {
                const status = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.TODO;
                const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.NORMAL;
                const StatusIcon = status.icon;
                const formattedDate = task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString("id-ID")
                  : "Set Date";

                return (
                  <tr
                    key={task.id}
                    className="hover:bg-muted/30 cursor-pointer transition-colors group"
                    onClick={() => onRowClick(task.id)}
                  >
                    {/* 1. Judul + obsidianRef */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 max-w-xs md:max-w-md">
                        <span className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                          {task.title}
                        </span>
                        {task.obsidianRef && (
                          <span className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded shrink-0">
                            {task.obsidianRef}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 2. Scope badge */}
                    <td className="px-4 py-3.5">
                      <ScopeBadge scope={task.scope} />
                    </td>

                    {/* 3. Tipe */}
                    <td className="px-4 py-3.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold uppercase tracking-wider">
                        {task.type}
                      </span>
                    </td>

                    {/* 4. Prioritas (Interactive Dropdown) */}
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className={cn(
                              "text-xs px-2 py-1 rounded-md font-semibold flex items-center gap-1 border border-transparent hover:border-border transition-all",
                              priority.className
                            )}
                          >
                            <span>{priority.label}</span>
                            <ChevronDown className="h-3 w-3 opacity-60" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="min-w-[120px]">
                          {Object.keys(PRIORITY_CONFIG).map((pKey) => (
                            <DropdownMenuItem
                              key={pKey}
                              onClick={() => onUpdateTask(task.id, { priority: pKey })}
                              className="text-xs font-semibold cursor-pointer"
                            >
                              {PRIORITY_CONFIG[pKey].label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>

                    {/* 5. Status (Interactive Dropdown) */}
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className={cn(
                              "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-transparent hover:border-border transition-all",
                              status.className
                            )}
                          >
                            <StatusIcon className="h-3.5 w-3.5" />
                            <span>{status.label}</span>
                            <ChevronDown className="h-3 w-3 opacity-60" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="min-w-[150px]">
                          {Object.keys(STATUS_CONFIG).map((sKey) => {
                            const val = STATUS_CONFIG[sKey];
                            const Icon = val.icon;
                            return (
                              <DropdownMenuItem
                                key={sKey}
                                onClick={() => onUpdateTask(task.id, { status: sKey })}
                                className="text-xs flex items-center gap-2 cursor-pointer"
                              >
                                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{val.label}</span>
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>

                    {/* 6. Assignee (Interactive Dropdown) */}
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-border/80 bg-card hover:bg-muted text-foreground transition-all font-mono">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>
                              {task.assigneeId ? `…${task.assigneeId.slice(-8)}` : "Assignee"}
                            </span>
                            <ChevronDown className="h-3 w-3 opacity-60" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="min-w-[160px] max-h-[220px] overflow-y-auto custom-scrollbar">
                          <DropdownMenuItem
                            onClick={() => onUpdateTask(task.id, { assigneeId: null })}
                            className="text-xs text-muted-foreground italic cursor-pointer"
                          >
                            Unassigned
                          </DropdownMenuItem>
                          {assigneesList.map((id) => (
                            <DropdownMenuItem
                              key={id}
                              onClick={() => onUpdateTask(task.id, { assigneeId: id })}
                              className="text-xs font-mono cursor-pointer"
                            >
                              {`…${id.slice(-8)}`}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>

                    {/* 7. Tenggat / Due Date (Interactive Calendar Dropdown) */}
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className={cn(
                              "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-all",
                              task.dueDate
                                ? "border-border bg-card text-foreground"
                                : "border-dashed border-border text-muted-foreground hover:bg-muted"
                            )}
                          >
                            <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{formattedDate}</span>
                            <ChevronDown className="h-3 w-3 opacity-60" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="p-0 border border-border shadow-xl">
                          <Calendar
                            mode="single"
                            selected={task.dueDate ? new Date(task.dueDate) : undefined}
                            onSelect={(date) => {
                              onUpdateTask(task.id, {
                                dueDate: date ? date.toISOString() : null,
                              });
                            }}
                            className="bg-card rounded-xl"
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

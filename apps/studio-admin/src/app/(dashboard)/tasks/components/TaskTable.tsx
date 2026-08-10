import React from "react";
import { ClipboardList } from "lucide-react";
import { type Task } from "@/hooks/useTasksQuery";
import { cn } from "@/lib/utils";
import { ScopeBadge } from "./ScopeBadge";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "./configs";

interface TaskTableProps {
  tasks: Task[];
  loading: boolean;
  onRowClick: (id: string) => void;
}

export function TaskTable({ tasks, loading, onRowClick }: TaskTableProps) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["Judul", "Scope", "Tipe", "Prioritas", "Status", "Assignee", "Tenggat"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-foreground/75 dark:text-muted-foreground uppercase tracking-wide"
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
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : tasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <ClipboardList className="h-10 w-10 opacity-30" />
                    <p className="text-sm">Belum ada task di tampilan ini.</p>
                  </div>
                </td>
              </tr>
            ) : (
              tasks.map((task) => {
                const status = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.TODO;
                const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.NORMAL;
                const StatusIcon = status.icon;

                return (
                  <tr
                    key={task.id}
                    className="hover:bg-muted/40 cursor-pointer transition-colors group"
                    onClick={() => onRowClick(task.id)}
                  >
                    {/* Title + obsidianRef */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground text-sm line-clamp-1">
                          {task.title}
                        </span>
                        {task.obsidianRef && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {task.obsidianRef}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Scope badge */}
                    <td className="px-4 py-3">
                      <ScopeBadge scope={task.scope} />
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                        {task.type}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3">
                      <span className={cn("text-xs px-2 py-0.5 rounded-md font-semibold", priority.className)}>
                        {priority.label}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md", status.className)}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                    </td>

                    {/* Assignee */}
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {task.assigneeId ?? "—"}
                    </td>

                    {/* Due Date */}
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString("id-ID")
                        : "—"}
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

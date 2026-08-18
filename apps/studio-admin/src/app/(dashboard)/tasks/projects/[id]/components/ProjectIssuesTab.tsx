"use client";

import React from "react";
import Link from "next/link";
import { Plus, Circle, User } from "lucide-react";
import { Card } from "@k2net/ui";
import { type Task, type TaskScope } from "@/hooks/useTasksQuery";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "../../../components/configs";
import { TaskContextMenu } from "../../../components/TaskContextMenu";
import { cn } from "@/lib/utils";

interface ProjectIssuesTabProps {
  projectIssues: Task[];
  resolvedIssuesCount: number;
  totalIssuesCount: number;
  onNewIssueClick: () => void;
  onToggleIssueStatus: (issue: Task) => Promise<void>;
  onUpdateIssue: (issueId: string, fields: Partial<Task>) => Promise<void>;
  onDeleteIssue: (issueId: string) => Promise<void>;
}

export function ProjectIssuesTab({
  projectIssues,
  resolvedIssuesCount,
  totalIssuesCount,
  onNewIssueClick,
  onToggleIssueStatus,
  onUpdateIssue,
  onDeleteIssue,
}: ProjectIssuesTabProps) {
  return (
    <div className="space-y-4 animate-in fade-in-50 duration-150">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-foreground">Project Issues</span>
          <span className="text-xs font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
            {resolvedIssuesCount}/{totalIssuesCount} resolved
          </span>
        </div>

        <button
          type="button"
          onClick={onNewIssueClick}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New issue</span>
        </button>
      </div>

      {projectIssues.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground border-dashed border-border/60 bg-card/20 rounded-xl space-y-2">
          <p className="text-xs">Belum ada issue atau tugas yang terhubung ke projek ini.</p>
          <button
            type="button"
            onClick={onNewIssueClick}
            className="text-xs text-primary font-semibold hover:underline cursor-pointer"
          >
            + Tambahkan Issue Pertama
          </button>
        </Card>
      ) : (
        <div className="space-y-2">
          {projectIssues.map((issue) => {
            const isDone = issue.status === "RESOLVED" || issue.status === "CLOSED";
            const StatusIcon = STATUS_CONFIG[issue.status]?.icon ?? Circle;

            return (
              <TaskContextMenu
                key={issue.id}
                task={issue}
                onUpdateStatus={(st) => onUpdateIssue(issue.id, { status: st })}
                onUpdatePriority={(pr) => onUpdateIssue(issue.id, { priority: pr })}
                onUpdateScope={(sc) => onUpdateIssue(issue.id, { scope: sc as TaskScope })}
                onDelete={() => onDeleteIssue(issue.id)}
              >
                <div className="flex items-center justify-between p-3 rounded-xl bg-card/40 border border-border/40 hover:border-border transition-colors group">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onToggleIssueStatus(issue)}
                      className={cn(
                        "shrink-0 p-0.5 rounded hover:bg-muted transition-colors cursor-pointer",
                        isDone ? "text-green-500" : "text-muted-foreground"
                      )}
                      title="Click to toggle status"
                    >
                      <StatusIcon className="w-4 h-4" />
                    </button>

                    <Link
                      href={`/tasks/${issue.id}`}
                      className={cn(
                        "text-xs font-medium hover:text-primary transition-colors truncate max-w-[400px]",
                        isDone ? "line-through text-muted-foreground/60" : "text-foreground"
                      )}
                    >
                      {issue.title}
                    </Link>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-xs">
                    {issue.priority && issue.priority !== "NORMAL" && (
                      <span
                        className={cn(
                          "text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold",
                          PRIORITY_CONFIG[issue.priority]?.className ?? ""
                        )}
                      >
                        {issue.priority}
                      </span>
                    )}

                    <div className="w-5 h-5 rounded-full bg-muted/60 text-muted-foreground flex items-center justify-center text-[10px] font-mono">
                      {issue.assigneeId ? issue.assigneeId.substring(0, 1).toUpperCase() : <User className="w-3 h-3" />}
                    </div>

                    <span className="text-[11px] font-mono text-muted-foreground">
                      {new Date(issue.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>
              </TaskContextMenu>
            );
          })}
        </div>
      )}
    </div>
  );
}
